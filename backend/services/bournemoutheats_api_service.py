import os
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import aiohttp
from dotenv import load_dotenv

load_dotenv()

class BournemouthEatsAPIService:
    def __init__(self):
        # API configuration
        self.api_base_url = os.getenv("BOURNEMOUTHEATS_API_URL", "https://api.bournemoutheats.com")
        self.api_key = os.getenv("BOURNEMOUTHEATS_API_KEY")
        self.api_secret = os.getenv("BOURNEMOUTHEATS_API_SECRET")
        
        # Integration settings
        self.auto_import_enabled = os.getenv("BOURNEMOUTHEATS_AUTO_IMPORT", "false").lower() == "true"
        self.import_interval_minutes = int(os.getenv("BOURNEMOUTHEATS_IMPORT_INTERVAL", "5"))
        self.max_orders_per_import = int(os.getenv("BOURNEMOUTHEATS_MAX_ORDERS", "50"))
        
        # Session for HTTP requests
        self.session = None
        self.last_import_time = None
        self.import_stats = {
            "total_imported": 0,
            "total_failed": 0,
            "last_successful_import": None,
            "last_error": None
        }
        
        # Order mapping configuration
        self.status_mapping = {
            "pending": "pending",
            "confirmed": "pending",
            "preparing": "pending",
            "ready": "pending",
            "out_for_delivery": "in_progress",
            "delivered": "completed",
            "cancelled": "cancelled"
        }
    
    async def initialize(self):
        """Initialize the service and create HTTP session"""
        if self.session is None:
            self.session = aiohttp.ClientSession(
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "BournemouthEats-Rider/1.0"
                }
            )
    
    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def test_connection(self) -> Dict[str, any]:
        """
        Test connection to BournemouthEats API
        
        Returns:
            Dictionary with connection status
        """
        try:
            await self.initialize()
            
            async with self.session.get(f"{self.api_base_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "success": True,
                        "status": "connected",
                        "api_version": data.get("version", "unknown"),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                else:
                    return {
                        "success": False,
                        "status": "error",
                        "error": f"HTTP {response.status}",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def import_orders(
        self,
        since: Optional[datetime] = None,
        limit: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Import orders from BournemouthEats API
        
        Args:
            since: Import orders since this time
            limit: Maximum number of orders to import
        
        Returns:
            Dictionary with import results
        """
        if not self.auto_import_enabled:
            return {
                "success": False,
                "error": "Auto-import is disabled",
                "imported_count": 0
            }
        
        try:
            await self.initialize()
            
            # Set default parameters
            if since is None:
                since = self.last_import_time or (datetime.utcnow() - timedelta(hours=1))
            
            if limit is None:
                limit = self.max_orders_per_import
            
            # Prepare request parameters
            params = {
                "since": since.isoformat(),
                "limit": limit,
                "status": "pending,confirmed,preparing,ready"
            }
            
            # Fetch orders from API
            async with self.session.get(
                f"{self.api_base_url}/orders",
                params=params
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"API request failed: {response.status} - {error_text}")
                
                orders_data = await response.json()
                orders = orders_data.get("orders", [])
                
                # Process and transform orders
                imported_orders = []
                failed_orders = []
                
                for order_data in orders:
                    try:
                        transformed_order = self._transform_order(order_data)
                        imported_orders.append(transformed_order)
                    except Exception as e:
                        failed_orders.append({
                            "original_data": order_data,
                            "error": str(e)
                        })
                
                # Update import statistics
                self.import_stats["total_imported"] += len(imported_orders)
                self.import_stats["total_failed"] += len(failed_orders)
                self.import_stats["last_successful_import"] = datetime.utcnow()
                self.last_import_time = datetime.utcnow()
                
                return {
                    "success": True,
                    "imported_count": len(imported_orders),
                    "failed_count": len(failed_orders),
                    "orders": imported_orders,
                    "failed_orders": failed_orders,
                    "import_timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            self.import_stats["last_error"] = str(e)
            return {
                "success": False,
                "error": str(e),
                "imported_count": 0,
                "failed_count": 0
            }
    
    def _transform_order(self, api_order: Dict[str, any]) -> Dict[str, any]:
        """
        Transform BournemouthEats API order to internal format
        
        Args:
            api_order: Order data from API
        
        Returns:
            Transformed order data
        """
        # Extract basic order information
        order_id = api_order.get("id")
        restaurant_name = api_order.get("restaurant", {}).get("name", "Unknown Restaurant")
        customer_name = api_order.get("customer", {}).get("name", "Unknown Customer")
        
        # Extract addresses
        pickup_address = api_order.get("restaurant", {}).get("address", {})
        delivery_address = api_order.get("delivery_address", {})
        
        # Extract coordinates
        pickup_lat = pickup_address.get("latitude")
        pickup_lng = pickup_address.get("longitude")
        delivery_lat = delivery_address.get("latitude")
        delivery_lng = delivery_address.get("longitude")
        
        # Transform to internal format
        transformed_order = {
            "_id": f"be_{order_id}",  # Prefix to avoid conflicts
            "order_id": order_id,
            "restaurant_name": restaurant_name,
            "restaurant_address": {
                "street": pickup_address.get("street", ""),
                "city": pickup_address.get("city", ""),
                "postcode": pickup_address.get("postcode", ""),
                "latitude": pickup_lat,
                "longitude": pickup_lng
            },
            "customer_name": customer_name,
            "customer_phone": api_order.get("customer", {}).get("phone", ""),
            "delivery_address": {
                "street": delivery_address.get("street", ""),
                "city": delivery_address.get("city", ""),
                "postcode": delivery_address.get("postcode", ""),
                "latitude": delivery_lat,
                "longitude": delivery_lng
            },
            "order_items": [
                {
                    "name": item.get("name", ""),
                    "quantity": item.get("quantity", 1),
                    "price": item.get("price", 0.0),
                    "special_instructions": item.get("special_instructions", "")
                }
                for item in api_order.get("items", [])
            ],
            "order_total": api_order.get("total_amount", 0.0),
            "delivery_fee": api_order.get("delivery_fee", 0.0),
            "status": self.status_mapping.get(
                api_order.get("status", "pending"),
                "pending"
            ),
            "estimated_preparation_time": api_order.get("estimated_preparation_time", 20),
            "created_at": datetime.fromisoformat(api_order.get("created_at", datetime.utcnow().isoformat())),
            "updated_at": datetime.fromisoformat(api_order.get("updated_at", datetime.utcnow().isoformat())),
            "source": "bournemoutheats_api",
            "external_order_id": order_id,
            "priority": self._calculate_priority(api_order),
            "special_instructions": api_order.get("special_instructions", ""),
            "payment_method": api_order.get("payment_method", "unknown"),
            "is_paid": api_order.get("is_paid", False)
        }
        
        return transformed_order
    
    def _calculate_priority(self, api_order: Dict[str, any]) -> str:
        """Calculate order priority based on various factors"""
        priority_score = 0
        
        # Order value priority
        order_total = api_order.get("total_amount", 0)
        if order_total > 50:
            priority_score += 3
        elif order_total > 25:
            priority_score += 2
        else:
            priority_score += 1
        
        # Time sensitivity
        created_at = datetime.fromisoformat(api_order.get("created_at", datetime.utcnow().isoformat()))
        time_since_creation = datetime.utcnow() - created_at
        
        if time_since_creation > timedelta(minutes=30):
            priority_score += 3
        elif time_since_creation > timedelta(minutes=15):
            priority_score += 2
        else:
            priority_score += 1
        
        # Customer type priority (VIP, regular, etc.)
        customer_type = api_order.get("customer", {}).get("type", "regular")
        if customer_type == "vip":
            priority_score += 2
        elif customer_type == "premium":
            priority_score += 1
        
        # Determine priority level
        if priority_score >= 7:
            return "high"
        elif priority_score >= 4:
            return "medium"
        else:
            return "low"
    
    async def update_order_status(
        self,
        external_order_id: str,
        new_status: str,
        rider_id: Optional[str] = None,
        additional_info: Optional[Dict] = None
    ) -> Dict[str, any]:
        """
        Update order status in BournemouthEats API
        
        Args:
            external_order_id: External order ID
            new_status: New status to set
            rider_id: ID of assigned rider (optional)
            additional_info: Additional information (optional)
        
        Returns:
            Dictionary with update result
        """
        try:
            await self.initialize()
            
            # Prepare update data
            update_data = {
                "status": new_status,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if rider_id:
                update_data["rider_id"] = rider_id
            
            if additional_info:
                update_data.update(additional_info)
            
            # Send update to API
            async with self.session.put(
                f"{self.api_base_url}/orders/{external_order_id}/status",
                json=update_data
            ) as response:
                if response.status == 200:
                    return {
                        "success": True,
                        "message": "Order status updated successfully",
                        "external_order_id": external_order_id,
                        "new_status": new_status
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"Failed to update order status: {response.status} - {error_text}",
                        "external_order_id": external_order_id
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "external_order_id": external_order_id
            }
    
    async def get_restaurant_info(self, restaurant_id: str) -> Dict[str, any]:
        """
        Get restaurant information from API
        
        Args:
            restaurant_id: Restaurant ID
        
        Returns:
            Restaurant information
        """
        try:
            await self.initialize()
            
            async with self.session.get(
                f"{self.api_base_url}/restaurants/{restaurant_id}"
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"error": f"Failed to fetch restaurant info: {response.status}"}
                    
        except Exception as e:
            return {"error": str(e)}
    
    async def get_delivery_zones(self) -> List[Dict[str, any]]:
        """
        Get delivery zones from API
        
        Returns:
            List of delivery zones
        """
        try:
            await self.initialize()
            
            async with self.session.get(
                f"{self.api_base_url}/delivery-zones"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("zones", [])
                else:
                    return []
                    
        except Exception as e:
            print(f"Error fetching delivery zones: {e}")
            return []
    
    def get_import_stats(self) -> Dict[str, any]:
        """Get import statistics"""
        return {
            **self.import_stats,
            "auto_import_enabled": self.auto_import_enabled,
            "import_interval_minutes": self.import_interval_minutes,
            "max_orders_per_import": self.max_orders_per_import,
            "last_import_time": self.last_import_time.isoformat() if self.last_import_time else None
        }
    
    def update_import_settings(
        self,
        auto_import_enabled: Optional[bool] = None,
        import_interval_minutes: Optional[int] = None,
        max_orders_per_import: Optional[int] = None
    ):
        """Update import settings"""
        if auto_import_enabled is not None:
            self.auto_import_enabled = auto_import_enabled
        
        if import_interval_minutes is not None:
            self.import_interval_minutes = import_interval_minutes
        
        if max_orders_per_import is not None:
            self.max_orders_per_import = max_orders_per_import
    
    async def start_auto_import(self):
        """Start automatic order import (for future implementation)"""
        if not self.auto_import_enabled:
            return
        
        # This would be implemented as a background task
        # For now, just log that it's enabled
        print(f"Auto-import enabled with {self.import_interval_minutes} minute interval")
    
    async def stop_auto_import(self):
        """Stop automatic order import"""
        print("Auto-import stopped")

# Create global instance
bournemoutheats_api_service = BournemouthEatsAPIService()
