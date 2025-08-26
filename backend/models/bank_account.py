from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BankAccount(BaseModel):
    id: str
    rider_id: str
    account_holder_name: str
    account_number: str = Field(..., min_length=8, max_length=8)
    sort_code: str = Field(..., min_length=6, max_length=6)
    bank_name: str
    is_verified: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

class BankAccountCreate(BaseModel):
    account_holder_name: str
    account_number: str = Field(..., min_length=8, max_length=8)
    sort_code: str = Field(..., min_length=6, max_length=6)
    bank_name: str

class BankAccountUpdate(BaseModel):
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = Field(None, min_length=8, max_length=8)
    sort_code: Optional[str] = Field(None, min_length=6, max_length=6)
    bank_name: Optional[str] = None

class BankAccountResponse(BaseModel):
    id: str
    rider_id: str
    account_holder_name: str
    account_number: str
    sort_code: str
    bank_name: str
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
