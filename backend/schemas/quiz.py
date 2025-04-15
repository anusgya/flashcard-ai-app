from pydantic import BaseModel, UUID4, Field, confloat, conint
from typing import List, Optional
from datetime import datetime
from enums import Enum

class QuizDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

# Quiz Session Schemas
class QuizSessionBase(BaseModel):
    deck_id: UUID4

class QuizSessionCreate(QuizSessionBase):
    pass

class QuizSessionUpdate(BaseModel):
    end_time: datetime
    total_questions: int
    correct_answers: int
    accuracy: confloat(ge=0.0, le=1.0)
    time_taken: conint(ge=0)
    points_earned: conint(ge=0)

class QuizSessionResponse(QuizSessionBase):
    id: UUID4
    user_id: UUID4
    start_time: datetime
    end_time: Optional[datetime]
    total_questions: int = Field(default=0, ge=0)
    correct_answers: int = Field(default=0, ge=0)
    accuracy: float = Field(default=0.0, ge=0.0, le=1.0)
    time_taken: int = Field(default=0, ge=0)
    points_earned: int = Field(default=0, ge=0)

    class Config:
        orm_mode = True

# Quiz Question Schemas
class QuizQuestionBase(BaseModel):
    question_text: str
    correct_answer: str
    options: List[str] = Field(..., min_items=2)
    difficulty: QuizDifficulty

class QuizQuestionCreate(QuizQuestionBase):
    card_id: UUID4

class QuizQuestionResponse(QuizQuestionBase):
    id: UUID4
    card_id: UUID4
    generated_at: datetime

    class Config:
        orm_mode = True

class QuizQuestionWithAnswer(QuizQuestionResponse):
    correct_answer: str

# Quiz Answer Schemas
class QuizAnswerBase(BaseModel):
    user_answer: str
    time_taken: conint(ge=0)

class QuizAnswerCreate(QuizAnswerBase):
    question_id: UUID4
    session_id: UUID4

class QuizAnswerResponse(QuizAnswerBase):
    id: UUID4
    session_id: UUID4
    question_id: UUID4
    is_correct: bool
    points_earned: int = Field(default=0, ge=0)

    class Config:
        orm_mode = True

# Additional Statistics Schema
class QuizSessionStats(BaseModel):
    total_sessions: int
    average_accuracy: float
    total_points: int
    best_score: int
    average_time: float
    completion_rate: float