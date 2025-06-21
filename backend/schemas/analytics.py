from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from schemas.base import BaseResponse
from enums import TimeRange

class SessionFrequency(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    count: int
    percentage: float

class SessionFrequencyData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    daily: SessionFrequency
    weekly: SessionFrequency
    monthly: SessionFrequency

class StudyTrendPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    interval: str  # Date string in YYYY-MM-DD format (frontend expects this)
    accuracy: float
    cardsStudied: int
    timeSpent: int  # in minutes

class ResponseQualityPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    value: int
    color: str

class StreakData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: str  # Frontend expects string, not datetime
    value: int

class QuizVsStudyPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: str  # Date string in YYYY-MM-DD format (frontend expects this)
    quizAccuracy: float
    studyAccuracy: float

class PointsDataPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    value: int
    color: str

class RankingData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    daily: int
    weekly: int
    monthly: int
    allTime: int
    totalUsers: int

class DifficultCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    front_content: str
    success_rate: float  # Frontend expects percentage (0-100), not ratio (0-1)
    total_reviews: int

class AnalyticsDashboardResponse(BaseResponse):
    learningEffectivenessScore: float
    currentStreak: int
    longestStreak: int
    totalStudyTime: float  # in hours
    averageSessionDuration: float  # in minutes
    studyTrendData: List[StudyTrendPoint]
    responseQualityData: List[ResponseQualityPoint]
    streakData: List[StreakData]
    quizVsStudyData: List[QuizVsStudyPoint]
    difficultCardsData: List[DifficultCard]
    pointsData: List[PointsDataPoint]
    rankingData: RankingData
    sessionFrequency: SessionFrequencyData