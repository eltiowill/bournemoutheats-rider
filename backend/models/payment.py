from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum

class PaymentType(str, Enum):
    BASE = "base"
    DISTANCE = "distance"
    TIME = "time"
    EFFICIENCY_BONUS = "efficiency_bonus"
    PEAK_HOUR_BONUS = "peak_hour_bonus"
    WEATHER_BONUS = "weather_bonus"
    LONG_DISTANCE_BONUS = "long_distance_bonus"
    CUSTOMER_CHARGE = "customer_charge"
    PROCESSING_FEE = "processing_fee"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class PaymentCalculation(BaseModel):
    """Model for rider payment calculation breakdown"""
    base_payment: float = Field(..., description="Base delivery payment")
    distance_payment: float = Field(..., description="Payment based on distance")
    time_payment: float = Field(..., description="Payment based on delivery time")
    efficiency_bonus: float = Field(..., description="Efficiency bonus payment")
    peak_hour_bonus: float = Field(..., description="Peak hour bonus payment")
    weather_bonus: float = Field(..., description="Weather conditions bonus")
    long_distance_bonus: float = Field(..., description="Long distance bonus")
    total_payment: float = Field(..., description="Total payment amount")
    breakdown: Dict = Field(..., description="Detailed breakdown of rates and calculations")

class CustomerCharge(BaseModel):
    """Model for customer delivery charge calculation"""
    base_fee: float = Field(..., description="Base delivery fee")
    distance_charge: float = Field(..., description="Charge based on distance")
    time_charge: float = Field(..., description="Charge based on estimated time")
    peak_hour_surcharge: float = Field(..., description="Peak hour surcharge")
    weather_surcharge: float = Field(..., description="Weather conditions surcharge")
    long_distance_surcharge: float = Field(..., description="Long distance surcharge")
    subtotal: float = Field(..., description="Subtotal before profit margin")
    total_charge: float = Field(..., description="Final charge to customer")
    profit_margin: float = Field(..., description="Profit margin amount")
    breakdown: Dict = Field(..., description="Detailed breakdown of rates and calculations")

class BankAccountInfo(BaseModel):
    """Model for bank account information"""
    account_holder: str = Field(..., description="Account holder name")
    account_number: str = Field(..., description="Bank account number")
    sort_code: str = Field(..., description="Bank sort code")
    bank_name: str = Field(..., description="Bank name")

class PayoutDetail(BaseModel):
    """Model for individual rider payout details"""
    rider_id: str = Field(..., description="Rider ID")
    rider_name: str = Field(..., description="Rider full name")
    bank_account: BankAccountInfo = Field(..., description="Bank account information")
    weekly_earnings: float = Field(..., description="Weekly base earnings")
    efficiency_bonus: float = Field(..., description="Efficiency bonus amount")
    total_earnings: float = Field(..., description="Total earnings for the week")
    processing_fee: float = Field(..., description="Processing fee deducted")
    payout_amount: float = Field(..., description="Final payout amount")
    is_eligible: bool = Field(..., description="Whether rider is eligible for payout")
    reason: Optional[str] = Field(None, description="Reason if not eligible")

class PayoutReport(BaseModel):
    """Model for weekly payout report"""
    report_period: str = Field(..., description="Report period string")
    total_riders: int = Field(..., description="Total number of riders")
    eligible_riders: int = Field(..., description="Number of riders eligible for payout")
    total_payouts: float = Field(..., description="Total payout amount")
    processing_fees: float = Field(..., description="Total processing fees")
    minimum_payout_threshold: float = Field(..., description="Minimum amount for payout")
    payout_details: List[PayoutDetail] = Field(..., description="Detailed payout information")
    generated_at: datetime = Field(..., description="When the report was generated")

class PaymentRecord(BaseModel):
    """Model for individual payment records"""
    _id: Optional[str] = Field(None, description="Payment record ID")
    rider_id: str = Field(..., description="Rider ID")
    order_id: str = Field(..., description="Order ID")
    payment_type: PaymentType = Field(..., description="Type of payment")
    amount: float = Field(..., description="Payment amount")
    distance_km: Optional[float] = Field(None, description="Delivery distance")
    delivery_time_minutes: Optional[int] = Field(None, description="Delivery time")
    efficiency_percentage: Optional[float] = Field(None, description="Rider efficiency at time of payment")
    is_peak_hour: bool = Field(False, description="Whether delivery was during peak hours")
    weather_conditions: str = Field("normal", description="Weather conditions during delivery")
    calculation_breakdown: PaymentCalculation = Field(..., description="Payment calculation details")
    status: PaymentStatus = Field(PaymentStatus.PENDING, description="Payment status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Payment creation timestamp")
    processed_at: Optional[datetime] = Field(None, description="When payment was processed")
    notes: Optional[str] = Field(None, description="Additional notes")

class WeeklyEarnings(BaseModel):
    """Model for weekly earnings summary"""
    rider_id: str = Field(..., description="Rider ID")
    week_start: datetime = Field(..., description="Week start date")
    week_end: datetime = Field(..., description="Week end date")
    total_deliveries: int = Field(..., description="Total deliveries completed")
    total_distance_km: float = Field(..., description="Total distance traveled")
    total_delivery_time_minutes: int = Field(..., description="Total delivery time")
    base_payments: float = Field(..., description="Total base payments")
    distance_payments: float = Field(..., description="Total distance payments")
    time_payments: float = Field(..., description="Total time payments")
    efficiency_bonuses: float = Field(..., description="Total efficiency bonuses")
    peak_hour_bonuses: float = Field(..., description="Total peak hour bonuses")
    weather_bonuses: float = Field(..., description="Total weather bonuses")
    long_distance_bonuses: float = Field(..., description="Total long distance bonuses")
    total_earnings: float = Field(..., description="Total weekly earnings")
    average_per_delivery: float = Field(..., description="Average earnings per delivery")
    efficiency_percentage: float = Field(..., description="Weekly efficiency percentage")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Record creation timestamp")

class PaymentSettings(BaseModel):
    """Model for payment system settings"""
    base_delivery_rate: float = Field(3.50, description="Base delivery rate")
    distance_rate_per_km: float = Field(0.75, description="Rate per kilometer")
    time_rate_per_minute: float = Field(0.15, description="Rate per minute")
    efficiency_bonus_threshold: float = Field(70.0, description="Efficiency threshold for bonus")
    efficiency_bonus_multiplier: float = Field(1.25, description="Efficiency bonus multiplier")
    customer_base_fee: float = Field(2.99, description="Customer base delivery fee")
    customer_distance_rate: float = Field(0.50, description="Customer rate per kilometer")
    customer_time_rate: float = Field(0.10, description="Customer rate per minute")
    profit_margin_multiplier: float = Field(1.35, description="Profit margin multiplier")
    minimum_payout_amount: float = Field(25.00, description="Minimum payout amount")
    payout_processing_fee: float = Field(1.50, description="Payout processing fee")
    weekly_payout_day: int = Field(6, description="Day of week for payouts (0=Monday, 6=Sunday)")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    updated_by: str = Field(..., description="User who last updated settings")

class PaymentRequest(BaseModel):
    """Model for payment calculation request"""
    pickup_lat: float = Field(..., description="Pickup location latitude")
    pickup_lng: float = Field(..., description="Pickup location longitude")
    delivery_lat: float = Field(..., description="Delivery location latitude")
    delivery_lng: float = Field(..., description="Delivery location longitude")
    efficiency_percentage: float = Field(..., description="Rider efficiency percentage")
    order_value: float = Field(..., description="Order value")
    is_peak_hour: bool = Field(False, description="Whether current time is peak hour")
    weather_conditions: str = Field("normal", description="Current weather conditions")

class PaymentResponse(BaseModel):
    """Model for payment calculation response"""
    rider_payment: PaymentCalculation = Field(..., description="Rider payment calculation")
    customer_charge: CustomerCharge = Field(..., description="Customer charge calculation")
    distance_km: float = Field(..., description="Calculated distance")
    estimated_delivery_time: int = Field(..., description="Estimated delivery time")
    is_peak_hour: bool = Field(..., description="Whether time is peak hour")
    weather_conditions: str = Field(..., description="Weather conditions")
    calculation_timestamp: datetime = Field(default_factory=datetime.utcnow, description="Calculation timestamp")
