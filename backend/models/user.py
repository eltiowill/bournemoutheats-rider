from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    RIDER = "Rider"
    ADMIN = "Admin"

class Language(str, Enum):
    ENGLISH = "en"
    SPANISH = "es"

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    role: UserRole = UserRole.RIDER
    language: Language = Language.ENGLISH

class UserCreate(UserBase):
    password: str
    bank_account_number: Optional[str] = None
    bank_sort_code: Optional[str] = None
    bank_name: Optional[str] = None
    terms_accepted: bool = False
    terms_accepted_at: Optional[datetime] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: Optional[str] = None
    _id: Optional[str] = None
    is_verified: bool = False
    is_active: bool = False
    documents_verified: bool = False
    bank_account_number: Optional[str] = None
    bank_sort_code: Optional[str] = None
    bank_name: Optional[str] = None
    terms_accepted: bool = False
    terms_accepted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class User(UserResponse):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[Language] = None
    bank_account_number: Optional[str] = None
    bank_sort_code: Optional[str] = None
    bank_name: Optional[str] = None
