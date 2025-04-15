from pydantic import BaseModel, UUID4, Field
from typing import Optional, List
from enums import Enum
from datetime import datetime

class InteractionType(str, Enum):
    CHAT = "chat"
    SEARCH = "search"

class ResponseType(str, Enum):
    MNEMONIC = "mnemonic"
    EXPLANATION = "explanation"
    EXAMPLE = "example"

class CardInteractionBase(BaseModel):
    interaction_type: InteractionType
    content: str = Field(..., min_length=1)

class CardInteractionCreate(CardInteractionBase):
    card_id: UUID4

class CardInteractionResponse(CardInteractionBase):
    id: UUID4
    card_id: UUID4
    user_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True  # Updated from orm_mode

class LLMResponseBase(BaseModel):
    response_type: ResponseType
    content: str = Field(..., min_length=1)

class LLMResponseCreate(LLMResponseBase):
    card_id: UUID4

class LLMResponseUpdate(BaseModel):
    is_pinned: bool

class LLMResponseResponse(LLMResponseBase):
    id: UUID4
    card_id: UUID4
    is_pinned: bool
    generated_at: datetime

    class Config:
        from_attributes = True  # Updated from orm_mode

# Request schemas for specific LLM operations
class MnemonicRequest(BaseModel):
    card_id: UUID4
    technique: Optional[str] = "default"

class ExplanationRequest(BaseModel):
    card_id: UUID4
    detail_level: str = Field("medium", pattern="^(basic|medium|detailed)$")  # Updated from regex to pattern
    language: Optional[str] = Field(None, pattern="^[a-zA-Z-]+$")  # If you have this field, update it too

class ExampleRequest(BaseModel):
    card_id: UUID4
    count: int = Field(3, ge=1, le=5)