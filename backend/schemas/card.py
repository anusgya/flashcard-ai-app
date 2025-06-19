from pydantic import BaseModel, UUID4, Field, HttpUrl
from typing import List, Optional, Union
from enum import Enum # Corrected import from 'enums' to 'enum'
from datetime import datetime

from sqlalchemy.engine.row import ROMappingItemsView

# Enums for validation
class DifficultyLevel(str, Enum):
    NEW = "new"
    AGAIN = "again"
    HARD = "hard"
    GOOD = "good"
    PERFECT = "perfect"

class CardState(str, Enum):
    NEW = "new"
    LEARNING = "learning"
    REVIEW = "review"

class MediaType(str, Enum):
    IMAGE = "image"
    AUDIO = "audio"

class MediaSide(str, Enum):
    FRONT = "front"
    BACK = "back"

# Base schemas for shared properties
class CardMediaBase(BaseModel):
    media_type: MediaType
    file_path: str
    original_filename: str
    mime_type: str
    file_size: int
    side: MediaSide

class CardBase(BaseModel):
    front_content: str
    back_content: str
    source: Optional[str] = None

# Schemas for creating objects
class CardMediaCreate(CardMediaBase):
    card_id: UUID4

class CardCreate(CardBase):
    deck_id: UUID4
    tags: Optional[List[UUID4]] = []

# <<--- NEW SCHEMA START --->>
class CardGenerationRequest(BaseModel):
    deck_id: UUID4 = Field(..., description="The ID of the deck to add generated cards to.")
    num_flashcards: int = Field(..., gt=0, le=50, description="Number of cards to generate (max 50).")
    source_type: str = Field(..., description="The type of source to generate flashcards from (e.g. 'pdf', 'youtube')")
    source_text: str = Field(..., description="URL or path to the pdf file")
    topic: Optional[str] = Field(None, description="The topic of the flashcards")
    # Add other generation parameters as needed, e.g., difficulty hint


# Schemas for reading objects
class CardMediaResponse(CardMediaBase):
    id: UUID4
    card_id: UUID4
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class CardResponse(CardBase):
    id: UUID4
    deck_id: UUID4
    created_at: datetime
    updated_at: datetime
    difficulty_level: DifficultyLevel
    times_reviewed: int
    last_reviewed: Optional[datetime] = None
    success_rate: float
    card_state: CardState
    media: List[CardMediaResponse] = []
    
    class Config:
        from_attributes = True

# Schemas for updating objects
class CardMediaUpdate(BaseModel):
    media_type: Optional[MediaType] = None
    file_path: Optional[str] = None
    side: Optional[MediaSide] = None

class CardUpdate(BaseModel):
    front_content: Optional[str] = None
    back_content: Optional[str] = None
    difficulty_level: Optional[DifficultyLevel] = None
    card_state: Optional[CardState] = None
    source: Optional[str] = None
    deck_id: Optional[UUID4] = None

class CardWithDetails(CardResponse):
    tags: List[UUID4] = []