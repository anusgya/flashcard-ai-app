from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from database import Base


class DailyStreak(Base):
    __tablename__ = "daily_streaks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_study_date = Column(DateTime, nullable=True)
    total_study_days = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="streaks")


class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    achieved_at = Column(DateTime, default=datetime.utcnow)
    achievement_type = Column(String, nullable=False)  # streak|mastery|quiz|study
    criteria_met = Column(JSONB, nullable=False)
    points_awarded = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="achievements")


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    total_points = Column(Integer, default=0)
    quiz_points = Column(Integer, default=0)
    study_points = Column(Integer, default=0)
    achievement_points = Column(Integer, default=0)
    streak_points = Column(Integer, default=0)
    rank = Column(Integer, nullable=True)
    timeframe = Column(String, nullable=False)  # daily|weekly|monthly|alltime
    calculated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="leaderboard_entries")