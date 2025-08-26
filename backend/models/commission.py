from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Commission(BaseModel):
    id: str
    rider_id: str
    delivery_id: str
    delivery_amount: float
    commission_percentage: float
    commission_amount: float
    created_at: datetime
    paid_at: Optional[datetime] = None

class CommissionSettings(BaseModel):
    id: str
    default_percentage: float = 0.07  # 7% default
    updated_at: datetime
    updated_by: str
