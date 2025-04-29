from pydantic import BaseModel, UUID4, Field, confloat, conint
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class ResponseQuality(str, Enum):
    AGAIN = "again"
    HARD = "hard"
    GOOD = "good"
    PERFECT = "perfect"

class ConfidenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TimeRange(str, Enum):
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    ALL = "all"

# Study Session Schemas
class StudySessionBase(BaseModel):
    deck_id: UUID4

class StudySessionCreate(StudySessionBase):
    pass

class StudySessionUpdate(BaseModel):
    end_time: datetime
    cards_studied: conint(ge=0)
    accuracy: confloat(ge=0.0, le=1.0)
    points_earned: conint(ge=0)

class StudySessionResponse(StudySessionBase):
    id: UUID4
    user_id: UUID4
    start_time: datetime
    end_time: Optional[datetime]
    cards_studied: int = Field(default=0, ge=0)
    accuracy: float = Field(default=0.0, ge=0.0, le=1.0)
    points_earned: int = Field(default=0, ge=0)
    created_at: datetime

    class Config:
        orm_mode = True

# Study Record Schemas
class StudyRecordBase(BaseModel):
    response_quality: ResponseQuality
    time_taken: conint(ge=0)
    confidence_level: Optional[ConfidenceLevel]

class StudyRecordCreate(StudyRecordBase):
    session_id: UUID4
    card_id: UUID4

class StudyRecordResponse(StudyRecordBase):
    id: UUID4
    session_id: UUID4
    card_id: UUID4
    studied_at: datetime
    next_review: Optional[datetime]
    points_earned: int = Field(default=0, ge=0)
    ease_factor: float = Field(default=2.5, ge=1.3)
    interval: int = Field(default=0, ge=0)
    repetition_number: int = Field(default=0, ge=0)

    class Config:
        orm_mode = True

# Additional Response Models
class NextCardResponse(BaseModel):
    card_id: UUID4
    due_date: Optional[datetime]
    current_streak: int = Field(default=0, ge=0)
    total_reviews: int = Field(default=0, ge=0)

class StudySessionStats(BaseModel):
    total_sessions: int
    total_cards_studied: int
    average_accuracy: float
    total_points: int
    average_time_per_card: float
    mastery_rate: float

class DueCardsResponse(BaseModel):
    due_now: int
    new_cards: int
    due_later_today: int

class SpacedRepetitionProgress(BaseModel):
    total_cards: int
    interval_distribution: Dict[str, int]
    average_ease_factor: float