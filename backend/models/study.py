from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timedelta

from database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # Add ondelete="CASCADE" to the ForeignKey definition
    deck_id = Column(UUID(as_uuid=True), ForeignKey("decks.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    cards_studied = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)  # For filtering by time range

    # Relationships
    user = relationship("User", back_populates="study_sessions")
    # The relationship definition itself doesn't need cascade here,
    # as the cascade is handled at the database level by ondelete="CASCADE"
    deck = relationship("Deck")
    records = relationship("StudyRecord", back_populates="session", cascade="all, delete-orphan")


class StudyRecord(Base):
    __tablename__ = "study_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("study_sessions.id"), nullable=False)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=False)
    response_quality = Column(String, nullable=False)  # again|hard|good|perfect
    time_taken = Column(Integer, nullable=False)  # in seconds
    studied_at = Column(DateTime, default=datetime.utcnow)
    next_review = Column(DateTime, nullable=True)
    confidence_level = Column(String, nullable=True)
    points_earned = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)  # SM-2 algorithm ease factor
    interval = Column(Integer, default=0)  # Current interval in days
    repetition_number = Column(Integer, default=0)  # Number of times card has been reviewed
    
    # Relationships
    session = relationship("StudySession", back_populates="records")
    card = relationship("Card", back_populates="study_records", cascade="all, delete")
    
    @classmethod
    def calculate_next_review(cls, response_quality, current_ease_factor=2.5, current_interval=0, repetition_number=0):
        """
        Implements the SM-2 spaced repetition algorithm
        
        Args:
            response_quality: String representing quality of response (again|hard|good|perfect)
            current_ease_factor: Current ease factor (default 2.5)
            current_interval: Current interval in days (default 0)
            repetition_number: Number of times card has been reviewed (default 0)
            
        Returns:
            tuple: (next_review_date, new_ease_factor, new_interval, new_repetition_number)
        """
        # Convert string response quality to numeric (0-5 scale for SM-2)
        quality_map = {
            "again": 0,
            "hard": 2,
            "good": 4,
            "perfect": 5
        }
        quality = quality_map.get(response_quality, 0)
        
        # Calculate new ease factor
        new_ease_factor = current_ease_factor
        if quality >= 3:  # Only adjust ease if response was at least "good"
            new_ease_factor = current_ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        
        # Ensure ease factor doesn't go below 1.3
        new_ease_factor = max(1.3, new_ease_factor)
        
        # Calculate new interval
        if quality < 3:  # If response was "again" or "hard"
            new_interval = 1  # Reset to 1 day
            new_repetition_number = 0
        else:
            new_repetition_number = repetition_number + 1
            
            if new_repetition_number == 1:
                new_interval = 1
            elif new_repetition_number == 2:
                new_interval = 6
            else:
                new_interval = round(current_interval * new_ease_factor)
        
        # Calculate next review date
        next_review_date = datetime.utcnow() + timedelta(days=new_interval)
        
        return (next_review_date, new_ease_factor, new_interval, new_repetition_number)