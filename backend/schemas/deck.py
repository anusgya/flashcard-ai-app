from pydantic import BaseModel, UUID4, Field
from typing import List, Optional, Union, Annotated
from enum import Enum
from datetime import datetime

# Import CardResponse directly since we've fixed circular dependencies
from schemas.card import CardResponse

# Enum for source type validation
class SourceType(str, Enum):
    MANUAL = "manual"
    CSV = "csv"
    ANKI = "anki"
    PDF = "pdf"

# Base schema for shared properties
class DeckBase(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: SourceType = SourceType.MANUAL
    is_public: Optional[bool] = False

# Schema for creating a deck
class DeckCreate(DeckBase):
    pass  # user_id will be derived from the current authenticated user

# Schema for reading a deck
class DeckResponse(DeckBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime
    card_count: Optional[int] = 0
    
    class Config:
        from_attributes = True  # Updated from orm_mode

# Detailed deck response with cards
class DeckDetailResponse(DeckResponse):
    cards: List[CardResponse] = []
    
    class Config:
        from_attributes = True

# Remove model_rebuild() since we're not using ForwardRef anymore
# Update the forward reference after all classes are defined
DeckDetailResponse.model_rebuild()

# Remove the direct import of CardResponse from schemas.card
# Schema for updating a deck
class DeckUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    source_type: Optional[SourceType] = None

class DeckWithStats(DeckResponse):
    total_cards: int = Field(default=0, ge=0)
    due_cards: int = Field(default=0, ge=0)
    new_cards: int = Field(default=0, ge=0)
    mastered_cards: int = Field(default=0, ge=0)