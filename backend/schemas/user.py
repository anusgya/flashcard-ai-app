from pydantic import BaseModel, UUID4, EmailStr, Field, Json
from typing import Optional, Dict
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    avatar: Optional[str] = 'avatars/Ellipse1.png'  # Added avatar field with default

class UserCreate(UserBase):
    password: str = Field(..., min_length=3)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=3)
    settings: Optional[Dict] = None
    avatar: Optional[str] = None  # Added avatar field

class UserResponse(UserBase):
    id: UUID4
    created_at: datetime
    last_login: Optional[datetime]
    total_points: int = Field(default=0, ge=0)
    settings: Optional[Dict] = None
    # avatar is already included from UserBase

    class Config:
        from_attributes = True  # Updated from orm_mode = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserStats(BaseModel):
    total_decks: int = Field(default=0, ge=0)
    total_cards: int = Field(default=0, ge=0)
    study_sessions: int = Field(default=0, ge=0)
    quiz_sessions: int = Field(default=0, ge=0)
    average_accuracy: float = Field(default=0.0, ge=0.0, le=1.0)
    total_points: int = Field(default=0, ge=0)
    rank: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None