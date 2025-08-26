from datetime import datetime, timedelta
from typing import Dict, List, Optional
import math
from models.delivery import RiderEfficiency
from models.payment import PaymentCalculation, CustomerCharge, PayoutReport

class PaymentService:
    def __init__(self):
        # Base rates and multipliers
        self.base_delivery_rate = 3.50  # Base rate per delivery
        self.distance_rate_per_km = 0.75  # Rate per kilometer
        self.time_rate_per_minute = 0.15  # Rate per minute of delivery time
        self.efficiency_bonus_threshold = 70.0  # Efficiency percentage for bonus
        self.efficiency_bonus_multiplier = 1.25  # 25% bonus for high efficiency riders
        
        # Customer charge rates
        self.customer_base_fee = 2.99  # Base delivery fee for customers
        self.customer_distance_rate = 0.50  # Per km rate for customers
        self.customer_time_rate = 0.10  # Per minute rate for customers
        self.profit_margin_multiplier = 1.35  # 35% profit margin
        
        # Payout settings
        self.weekly_payout_day = 6  # Saturday (0=Monday, 6=Sunday)
        self.minimum_payout_amount = 25.00  # Minimum amount for payout
        self.payout_processing_fee = 1.50  # Fixed fee per payout

    def calculate_rider_payment(
        self,
        distance_km: float,
        delivery_time_minutes: int,
        efficiency_percentage: float,
        order_value: float,
        is_peak_hour: bool = False,
        weather_conditions: str = "normal"
    ) -> PaymentCalculation:
        """
        Calculate dynamic rider payment based on multiple factors
        """
        # Base calculation
        base_payment = self.base_delivery_rate
        
        # Distance-based payment
        distance_payment = distance_km * self.distance_rate_per_km
        
        # Time-based payment
        time_payment = delivery_time_minutes * self.time_rate_per_minute
        
        # Efficiency bonus
        efficiency_bonus = 0.0
        if efficiency_percentage >= self.efficiency_bonus_threshold:
            efficiency_bonus = (base_payment + distance_payment + time_payment) * 0.25
        
        # Peak hour bonus (20% extra during busy times)
        peak_hour_bonus = 0.0
        if is_peak_hour:
            peak_hour_bonus = (base_payment + distance_payment + time_payment) * 0.20
        
        # Weather conditions bonus (15% extra for adverse weather)
        weather_bonus = 0.0
        if weather_conditions in ["rain", "snow", "storm"]:
            weather_bonus = (base_payment + distance_payment + time_payment) * 0.15
        
        # Long distance bonus (extra 10% for deliveries over 5km)
        long_distance_bonus = 0.0
        if distance_km > 5.0:
            long_distance_bonus = distance_payment * 0.10
        
        # Calculate total payment
        total_payment = (
            base_payment +
            distance_payment +
            time_payment +
            efficiency_bonus +
            peak_hour_bonus +
            weather_bonus +
            long_distance_bonus
        )
        
        # Round to 2 decimal places
        total_payment = round(total_payment, 2)
        
        return PaymentCalculation(
            base_payment=round(base_payment, 2),
            distance_payment=round(distance_payment, 2),
            time_payment=round(time_payment, 2),
            efficiency_bonus=round(efficiency_bonus, 2),
            peak_hour_bonus=round(peak_hour_bonus, 2),
            weather_bonus=round(weather_bonus, 2),
            long_distance_bonus=round(long_distance_bonus, 2),
            total_payment=total_payment,
            breakdown={
                "base_rate": self.base_delivery_rate,
                "distance_rate_per_km": self.distance_rate_per_km,
                "time_rate_per_minute": self.time_rate_per_minute,
                "efficiency_threshold": self.efficiency_bonus_threshold,
                "efficiency_bonus_multiplier": self.efficiency_bonus_multiplier
            }
        )

    def calculate_customer_charge(
        self,
        distance_km: float,
        estimated_delivery_time_minutes: int,
        order_value: float,
        is_peak_hour: bool = False,
        weather_conditions: str = "normal"
    ) -> CustomerCharge:
        """
        Calculate dynamic customer delivery charge
        """
        # Base delivery fee
        base_fee = self.customer_base_fee
        
        # Distance-based charge
        distance_charge = distance_km * self.customer_distance_rate
        
        # Time-based charge
        time_charge = estimated_delivery_time_minutes * self.customer_time_rate
        
        # Peak hour surcharge (15% extra during busy times)
        peak_hour_surcharge = 0.0
        if is_peak_hour:
            peak_hour_surcharge = (base_fee + distance_charge + time_charge) * 0.15
        
        # Weather surcharge (10% extra for adverse weather)
        weather_surcharge = 0.0
        if weather_conditions in ["rain", "snow", "storm"]:
            weather_surcharge = (base_fee + distance_charge + time_charge) * 0.10
        
        # Long distance surcharge (extra 5% for deliveries over 5km)
        long_distance_surcharge = 0.0
        if distance_km > 5.0:
            long_distance_surcharge = distance_charge * 0.05
        
        # Calculate subtotal
        subtotal = (
            base_fee +
            distance_charge +
            time_charge +
            peak_hour_surcharge +
            weather_surcharge +
            long_distance_surcharge
        )
        
        # Apply profit margin
        total_charge = subtotal * self.profit_margin_multiplier
        
        # Round to 2 decimal places
        total_charge = round(total_charge, 2)
        
        return CustomerCharge(
            base_fee=round(base_fee, 2),
            distance_charge=round(distance_charge, 2),
            time_charge=round(time_charge, 2),
            peak_hour_surcharge=round(peak_hour_surcharge, 2),
            weather_surcharge=round(weather_surcharge, 2),
            long_distance_surcharge=round(long_distance_surcharge, 2),
            subtotal=round(subtotal, 2),
            total_charge=total_charge,
            profit_margin=round(total_charge - subtotal, 2),
            breakdown={
                "base_fee": self.customer_base_fee,
                "distance_rate_per_km": self.customer_distance_rate,
                "time_rate_per_minute": self.customer_time_rate,
                "profit_margin_multiplier": self.profit_margin_multiplier
            }
        )

    def calculate_distance_km(
        self,
        pickup_lat: float,
        pickup_lng: float,
        delivery_lat: float,
        delivery_lng: float
    ) -> float:
        """
        Calculate distance between two points using Haversine formula
        """
        # Convert to radians
        lat1, lng1 = math.radians(pickup_lat), math.radians(pickup_lng)
        lat2, lng2 = math.radians(delivery_lat), math.radians(delivery_lng)
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = (
            math.sin(dlat / 2) ** 2 +
            math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth's radius in kilometers
        radius = 6371
        
        return round(radius * c, 2)

    def estimate_delivery_time(
        self,
        distance_km: float,
        is_peak_hour: bool = False,
        weather_conditions: str = "normal"
    ) -> int:
        """
        Estimate delivery time based on distance and conditions
        """
        # Base time: 5 minutes pickup + 2 minutes per km + 3 minutes delivery
        base_time = 5 + (distance_km * 2) + 3
        
        # Peak hour adjustment (20% longer during busy times)
        if is_peak_hour:
            base_time *= 1.2
        
        # Weather adjustment
        weather_multipliers = {
            "normal": 1.0,
            "rain": 1.15,
            "snow": 1.3,
            "storm": 1.4
        }
        
        weather_multiplier = weather_multipliers.get(weather_conditions, 1.0)
        estimated_time = base_time * weather_multiplier
        
        return round(estimated_time)

    def is_peak_hour(self, current_time: datetime) -> bool:
        """
        Determine if current time is peak hour
        """
        hour = current_time.hour
        # Peak hours: 11:00-14:00 (lunch) and 17:00-20:00 (dinner)
        return (11 <= hour <= 14) or (17 <= hour <= 20)

    def generate_weekly_payout_report(
        self,
        riders_data: List[Dict],
        start_date: datetime,
        end_date: datetime
    ) -> PayoutReport:
        """
        Generate weekly payout report for admin
        """
        total_payouts = 0
        total_riders = len(riders_data)
        eligible_riders = 0
        payout_details = []
        
        for rider in riders_data:
            rider_id = rider.get("_id")
            rider_name = f"{rider.get('first_name', '')} {rider.get('last_name', '')}"
            bank_account = rider.get("bank_account", {})
            
            # Calculate weekly earnings
            weekly_earnings = rider.get("weekly_earnings", 0)
            efficiency_bonus = rider.get("efficiency_bonus", 0)
            total_earnings = weekly_earnings + efficiency_bonus
            
            # Check if eligible for payout
            is_eligible = total_earnings >= self.minimum_payout_amount
            
            if is_eligible:
                eligible_riders += 1
                payout_amount = total_earnings - self.payout_processing_fee
                total_payouts += payout_amount
                
                payout_details.append({
                    "rider_id": rider_id,
                    "rider_name": rider_name,
                    "bank_account": {
                        "account_holder": bank_account.get("account_holder_name", ""),
                        "account_number": bank_account.get("account_number", ""),
                        "sort_code": bank_account.get("sort_code", ""),
                        "bank_name": bank_account.get("bank_name", "")
                    },
                    "weekly_earnings": round(weekly_earnings, 2),
                    "efficiency_bonus": round(efficiency_bonus, 2),
                    "total_earnings": round(total_earnings, 2),
                    "processing_fee": self.payout_processing_fee,
                    "payout_amount": round(payout_amount, 2),
                    "is_eligible": True
                })
            else:
                payout_details.append({
                    "rider_id": rider_id,
                    "rider_name": rider_name,
                    "bank_account": bank_account,
                    "weekly_earnings": round(weekly_earnings, 2),
                    "efficiency_bonus": round(efficiency_bonus, 2),
                    "total_earnings": round(total_earnings, 2),
                    "processing_fee": 0,
                    "payout_amount": 0,
                    "is_eligible": False,
                    "reason": f"Below minimum payout threshold (£{self.minimum_payout_amount})"
                })
        
        return PayoutReport(
            report_period=f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            total_riders=total_riders,
            eligible_riders=eligible_riders,
            total_payouts=round(total_payouts, 2),
            processing_fees=eligible_riders * self.payout_processing_fee,
            minimum_payout_threshold=self.minimum_payout_amount,
            payout_details=payout_details,
            generated_at=datetime.utcnow()
        )

    def get_next_payout_date(self, current_date: datetime = None) -> datetime:
        """
        Get the next payout date
        """
        if current_date is None:
            current_date = datetime.utcnow()
        
        # Find next Saturday
        days_until_payout = (self.weekly_payout_day - current_date.weekday()) % 7
        if days_until_payout == 0:
            days_until_payout = 7  # Next week
        
        next_payout = current_date + timedelta(days=days_until_payout)
        return next_payout.replace(hour=9, minute=0, second=0, microsecond=0)

    def calculate_efficiency_bonus(
        self,
        efficiency_percentage: float,
        base_payment: float
    ) -> float:
        """
        Calculate efficiency bonus for riders
        """
        if efficiency_percentage >= self.efficiency_bonus_threshold:
            bonus = base_payment * (self.efficiency_bonus_multiplier - 1)
            return round(bonus, 2)
        return 0.0

    def update_payment_rates(
        self,
        base_delivery_rate: float = None,
        distance_rate_per_km: float = None,
        time_rate_per_minute: float = None,
        efficiency_bonus_multiplier: float = None
    ):
        """
        Update payment rates dynamically
        """
        if base_delivery_rate is not None:
            self.base_delivery_rate = base_delivery_rate
        if distance_rate_per_km is not None:
            self.distance_rate_per_km = distance_rate_per_km
        if time_rate_per_minute is not None:
            self.time_rate_per_minute = time_rate_per_minute
        if efficiency_bonus_multiplier is not None:
            self.efficiency_bonus_multiplier = efficiency_bonus_multiplier

    def get_payment_summary(
        self,
        rider_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict:
        """
        Get payment summary for a specific rider and time period
        """
        # This would typically fetch data from the database
        # For now, return a mock summary
        return {
            "rider_id": rider_id,
            "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "total_deliveries": 0,
            "total_distance_km": 0.0,
            "total_delivery_time_minutes": 0,
            "base_payments": 0.0,
            "distance_payments": 0.0,
            "time_payments": 0.0,
            "efficiency_bonuses": 0.0,
            "peak_hour_bonuses": 0.0,
            "weather_bonuses": 0.0,
            "long_distance_bonuses": 0.0,
            "total_earnings": 0.0,
            "average_per_delivery": 0.0
        }
