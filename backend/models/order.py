from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrderItem(BaseModel):
    name: str
    quantity: int
    price: float

class OrderCreate(BaseModel):
    customer_id: str
    restaurant_id: str
    items: List[OrderItem]
    pickup_address: str
    delivery_address: str

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    restaurant_id: str
    items: List[OrderItem]
    total_amount: float
    pickup_address: str
    delivery_address: str
    status: str
    created_at: datetime
    assigned_rider_id: Optional[str] = None

class Order(OrderResponse):
    pass
