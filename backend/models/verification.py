from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DocumentType(str, Enum):
    ID_CARD = "id_card"
    DRIVING_LICENSE = "driving_license"
    INSURANCE = "insurance"
    RIGHT_TO_WORK = "right_to_work"

class DocumentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Document(BaseModel):
    id: str
    rider_id: str
    document_type: DocumentType
    file_url: str
    file_name: str
    file_size: int
    mime_type: str
    status: DocumentStatus = DocumentStatus.PENDING
    uploaded_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    rejection_reason: Optional[str] = None

class VerificationRequest(BaseModel):
    id: str
    rider_id: str
    documents: List[Document]
    status: DocumentStatus = DocumentStatus.PENDING
    submitted_at: datetime
    completed_at: Optional[datetime] = None
    admin_notes: Optional[str] = None

class DocumentUpload(BaseModel):
    document_type: DocumentType
    file_name: str
    file_size: int
    mime_type: str

class DocumentReview(BaseModel):
    document_id: str
    status: DocumentStatus
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None
