import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import googlemaps
from dotenv import load_dotenv

load_dotenv()

class GoogleMapsService:
    def __init__(self):
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY environment variable is required")
        
        self.gmaps = googlemaps.Client(key=api_key)
        self.bournemouth_center = (50.7192, -1.8808)  # Bournemouth city center
        
        # High-demand zones around Bournemouth
        self.high_demand_zones = [
            {
                "name": "Bournemouth Town Centre",
                "center": (50.7192, -1.8808),
                "radius_km": 1.0,
                "demand_level": "high",
                "peak_hours": ["11:00-14:00", "17:00-20:00"]
            },
            {
                "name": "Poole Road Area",
                "center": (50.7180, -1.8850),
                "radius_km": 0.8,
                "demand_level": "medium",
                "peak_hours": ["12:00-14:00", "18:00-20:00"]
            },
            {
                "name": "Winton Area",
                "center": (50.7300, -1.8700),
                "radius_km": 1.2,
                "demand_level": "medium",
                "peak_hours": ["11:30-13:30", "17:30-19:30"]
            },
            {
                "name": "Charminster Area",
                "center": (50.7400, -1.8600),
                "radius_km": 1.0,
                "demand_level": "low",
                "peak_hours": ["12:00-14:00", "18:00-20:00"]
            }
        ]
    
    def calculate_distance_and_time(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        mode: str = "driving"
    ) -> Dict[str, any]:
        """
        Calculate distance and travel time between two points
        
        Args:
            origin: (lat, lng) tuple for starting point
            destination: (lat, lng) tuple for destination
            mode: Travel mode (driving, walking, bicycling, transit)
        
        Returns:
            Dictionary with distance, duration, and route information
        """
        try:
            # Get directions
            directions = self.gmaps.directions(
                origin,
                destination,
                mode=mode,
                departure_time="now"
            )
            
            if not directions:
                return {
                    "error": "No route found",
                    "distance_km": 0,
                    "duration_minutes": 0,
                    "route": []
                }
            
            route = directions[0]
            leg = route['legs'][0]
            
            # Extract distance and duration
            distance_km = leg['distance']['value'] / 1000
            duration_minutes = leg['duration']['value'] / 60
            
            # Extract route steps
            steps = []
            for step in leg['steps']:
                steps.append({
                    "instruction": step['html_instructions'],
                    "distance": step['distance']['text'],
                    "duration": step['duration']['text'],
                    "start_location": step['start_location'],
                    "end_location": step['end_location']
                })
            
            return {
                "distance_km": round(distance_km, 2),
                "duration_minutes": round(duration_minutes, 1),
                "distance_text": leg['distance']['text'],
                "duration_text": leg['duration']['text'],
                "route": steps,
                "start_address": leg['start_address'],
                "end_address": leg['end_address']
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "distance_km": 0,
                "duration_minutes": 0,
                "route": []
            }
    
    def get_high_demand_zones(self, current_time: Optional[datetime] = None) -> List[Dict]:
        """
        Get high-demand zones with current demand status
        
        Args:
            current_time: Current time (defaults to now)
        
        Returns:
            List of high-demand zones with current status
        """
        if current_time is None:
            current_time = datetime.now()
        
        current_hour = current_time.strftime("%H:%M")
        
        zones_with_status = []
        for zone in self.high_demand_zones:
            # Check if current time is in peak hours
            is_peak_hour = False
            for peak_range in zone["peak_hours"]:
                start_time, end_time = peak_range.split("-")
                if start_time <= current_hour <= end_time:
                    is_peak_hour = True
                    break
            
            # Calculate demand multiplier based on time
            demand_multiplier = 1.0
            if is_peak_hour:
                demand_multiplier = 2.5 if zone["demand_level"] == "high" else 2.0
            else:
                demand_multiplier = 1.5 if zone["demand_level"] == "high" else 1.0
            
            zones_with_status.append({
                **zone,
                "is_peak_hour": is_peak_hour,
                "current_demand_multiplier": demand_multiplier,
                "estimated_wait_time": self._estimate_wait_time(zone, is_peak_hour)
            })
        
        return zones_with_status
    
    def _estimate_wait_time(self, zone: Dict, is_peak_hour: bool) -> int:
        """Estimate wait time for orders in a zone"""
        base_wait_time = 15  # minutes
        
        if zone["demand_level"] == "high":
            base_wait_time = 25
        elif zone["demand_level"] == "medium":
            base_wait_time = 20
        
        if is_peak_hour:
            base_wait_time += 10
        
        return base_wait_time
    
    def get_nearby_restaurants(
        self,
        location: Tuple[float, float],
        radius_meters: int = 2000
    ) -> List[Dict]:
        """
        Get nearby restaurants from Google Places API
        
        Args:
            location: (lat, lng) tuple for search center
            radius_meters: Search radius in meters
        
        Returns:
            List of nearby restaurants
        """
        try:
            places_result = self.gmaps.places_nearby(
                location=location,
                radius=radius_meters,
                type='restaurant'
            )
            
            restaurants = []
            for place in places_result.get('results', []):
                restaurants.append({
                    "place_id": place.get('place_id'),
                    "name": place.get('name'),
                    "location": place.get('geometry', {}).get('location'),
                    "rating": place.get('rating'),
                    "price_level": place.get('price_level'),
                    "types": place.get('types', []),
                    "vicinity": place.get('vicinity')
                })
            
            return restaurants
            
        except Exception as e:
            print(f"Error fetching nearby restaurants: {e}")
            return []
    
    def get_route_optimization(
        self,
        waypoints: List[Tuple[float, float]],
        optimize: bool = True
    ) -> Dict[str, any]:
        """
        Get optimized route for multiple waypoints
        
        Args:
            waypoints: List of (lat, lng) tuples
            optimize: Whether to optimize the route order
        
        Returns:
            Optimized route information
        """
        try:
            if len(waypoints) < 2:
                return {"error": "Need at least 2 waypoints"}
            
            origin = waypoints[0]
            destination = waypoints[-1]
            waypoints_middle = waypoints[1:-1] if len(waypoints) > 2 else []
            
            directions = self.gmaps.directions(
                origin,
                destination,
                waypoints=waypoints_middle,
                optimize_waypoints=optimize,
                mode="driving"
            )
            
            if not directions:
                return {"error": "No route found"}
            
            route = directions[0]
            total_distance = 0
            total_duration = 0
            
            for leg in route['legs']:
                total_distance += leg['distance']['value']
                total_duration += leg['duration']['value']
            
            return {
                "total_distance_km": round(total_distance / 1000, 2),
                "total_duration_minutes": round(total_duration / 60, 1),
                "waypoints_order": [leg['start_address'] for leg in route['legs']],
                "route": route
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def get_traffic_conditions(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float]
    ) -> Dict[str, any]:
        """
        Get current traffic conditions for a route
        
        Args:
            origin: (lat, lng) tuple for starting point
            destination: (lat, lng) tuple for destination
        
        Returns:
            Traffic information
        """
        try:
            # Get directions with traffic info
            directions = self.gmaps.directions(
                origin,
                destination,
                mode="driving",
                departure_time="now",
                traffic_model="best_guess"
            )
            
            if not directions:
                return {"error": "No route found"}
            
            route = directions[0]
            leg = route['legs'][0]
            
            # Check if there are traffic conditions
            has_traffic = 'duration_in_traffic' in leg
            
            if has_traffic:
                normal_duration = leg['duration']['value']
                traffic_duration = leg['duration_in_traffic']['value']
                traffic_delay = traffic_duration - normal_duration
                
                return {
                    "has_traffic": True,
                    "normal_duration_minutes": round(normal_duration / 60, 1),
                    "traffic_duration_minutes": round(traffic_duration / 60, 1),
                    "traffic_delay_minutes": round(traffic_delay / 60, 1),
                    "traffic_level": self._get_traffic_level(traffic_delay)
                }
            else:
                return {
                    "has_traffic": False,
                    "normal_duration_minutes": round(leg['duration']['value'] / 60, 1),
                    "traffic_delay_minutes": 0,
                    "traffic_level": "low"
                }
                
        except Exception as e:
            return {"error": str(e)}
    
    def _get_traffic_level(self, delay_seconds: int) -> str:
        """Determine traffic level based on delay"""
        delay_minutes = delay_seconds / 60
        
        if delay_minutes < 5:
            return "low"
        elif delay_minutes < 15:
            return "medium"
        elif delay_minutes < 30:
            return "high"
        else:
            return "severe"
    
    def get_geocoding(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Get coordinates for an address
        
        Args:
            address: Address string
        
        Returns:
            (lat, lng) tuple or None if not found
        """
        try:
            result = self.gmaps.geocode(address)
            if result:
                location = result[0]['geometry']['location']
                return (location['lat'], location['lng'])
            return None
        except Exception as e:
            print(f"Error geocoding address: {e}")
            return None
    
    def get_reverse_geocoding(self, lat: float, lng: float) -> Optional[str]:
        """
        Get address for coordinates
        
        Args:
            lat: Latitude
            lng: Longitude
        
        Returns:
            Address string or None if not found
        """
        try:
            result = self.gmaps.reverse_geocode((lat, lng))
            if result:
                return result[0]['formatted_address']
            return None
        except Exception as e:
            print(f"Error reverse geocoding: {e}")
            return None

# Create global instance
google_maps_service = GoogleMapsService()
