from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DeliveryCreate(BaseModel):
    order_id: str
    rider_id: str
    pickup_address: str
    delivery_address: str

class DeliveryResponse(BaseModel):
    id: str
    order_id: str
    rider_id: str
    pickup_address: str
    delivery_address: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

class Delivery(DeliveryResponse):
    pass

# New models for the priority system
class RiderAction(BaseModel):
    rider_id: str
    action: str  # "accept" or "reject"
    timestamp: datetime
    order_id: str
    penalty_applied: bool = False
    preparation_start_time: Optional[datetime] = None

class RiderEfficiency(BaseModel):
    rider_id: str
    total_points: int = 0
    accepted_orders: int = 0
    rejected_orders: int = 0
    penalized_rejections: int = 0
    efficiency_percentage: float = 0.0
    bonus_eligible: bool = False
    last_updated: datetime
    bonus_amount_per_order: float = 0.0

class PrioritySettings(BaseModel):
    points_per_acceptance: int = 2
    points_per_penalized_rejection: int = -5
    efficiency_threshold_for_bonus: float = 70.0
    bonus_amount_per_order: float = 1.0
    preparation_grace_period_minutes: int = 10
