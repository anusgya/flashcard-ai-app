from pydantic import BaseModel, UUID4, Field, Json
from uuid import UUID
from typing import List, Optional, Dict, Any, Union
from enums import Enum
from datetime import datetime

# Enums for validation
class AchievementType(str, Enum):
    STREAK = "streak"
    MASTERY = "mastery"
    QUIZ = "quiz"
    STUDY = "study"

class TimeFrame(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ALLTIME = "alltime"

# DailyStreak schemas
class DailyStreakBase(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    last_study_date: Optional[datetime] = None
    total_study_days: int = 0
    points_earned: int = 0

class DailyStreakResponse(DailyStreakBase):
    id: UUID4
    user_id: UUID4
    
    class Config:
        orm_mode = True

# Achievement schemas
class AchievementBase(BaseModel):
    name: str
    description: str
    achievement_type: AchievementType
    criteria_met: Dict[str, Any]
    points_awarded: int = 0

class AchievementCreate(AchievementBase):
    user_id: UUID4

class AchievementResponse(AchievementBase):
    id: UUID4
    user_id: UUID4
    achieved_at: datetime
    
    class Config:
        orm_mode = True

# LeaderboardEntry schemas
class LeaderboardEntryBase(BaseModel):
    total_points: int = 0
    quiz_points: int = 0
    study_points: int = 0
    achievement_points: int = 0
    streak_points: int = 0
    timeframe: TimeFrame
    rank: Optional[int] = None

class LeaderboardEntryCreate(LeaderboardEntryBase):
    user_id: UUID4

class LeaderboardEntryResponse(LeaderboardEntryBase):
    id: UUID
    user_id: UUID
    calculated_at: datetime
    username: Optional[str] = None  # This can be populated when joining with User data
    avatar: Optional[str] = None
    streak: Optional[int] = None
    rank_change: Optional[str] = "same"
    
    class Config:
        orm_mode = True

# Details for the current user's rank
class UserRankDetail(BaseModel):
    rank: Optional[int] = None
    points_to_next_rank: Optional[int] = None
    rank_change: Optional[str] = "same"

# User gamification summary
class UserGamificationSummary(BaseModel):
    total_points: int
    current_streak: int
    longest_streak: int
    achievement_count: int
    rank: Optional[int] = None
    
    class Config:
        orm_mode = True

# Leaderboard response
class LeaderboardResponse(BaseModel):
    timeframe: TimeFrame
    entries: List[LeaderboardEntryResponse]
    user_rank_details: Optional[UserRankDetail] = None  # The current user's rank details