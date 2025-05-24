from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import UTC, datetime, timedelta

from database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    deck_id = Column(UUID(as_uuid=True), ForeignKey("decks.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    cards_studied = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)  # For filtering by time range

    # Relationships
    user = relationship("User", back_populates="study_sessions")
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
    def calculate_next_review(cls, response_quality, current_ease, current_interval, repetition_number):
        now = datetime.utcnow()
        
        if current_ease is None:
            current_ease = 2.5

        ease_percentage = current_ease * 100
        
        if repetition_number == 0:
            if response_quality == "again":
                next_review = now + timedelta(minutes=10)
                new_interval = 0
                new_ease = current_ease  
                new_repetition = 0
            elif response_quality == "hard":
                next_review = now + timedelta(hours=1)
                new_interval = 0
                new_ease = current_ease  
                new_repetition = 0
            elif response_quality == "good":
                next_review = now + timedelta(days=1)
                new_interval = 1
                new_ease = current_ease  
                new_repetition = 1
            else:  
                next_review = now + timedelta(days=4) 
                new_interval = 4
                new_ease = current_ease
                new_repetition = 2 
        
        # Handle review phase
        else:
            interval_modifier = 1.0  
            
            if response_quality == "again":
                # Decrease ease by 20 percentage points
                ease_percentage = max(130, ease_percentage - 20)
                
                # Card goes to relearning state
                next_review = now + timedelta(minutes=10)
                
                # New interval when it exits relearning (typically 20% of old interval)
                new_interval = max(1, int(current_interval * 0.2))
                new_repetition = 0  # Reset repetition count
            
            elif response_quality == "hard":
                # Decrease ease by 15 percentage points
                ease_percentage = max(130, ease_percentage - 15)
                
                # Hard interval is 1.2x current by default
                hard_interval_factor = 1.2
                new_interval = max(current_interval + 1, 
                                int(current_interval * hard_interval_factor * interval_modifier))
                next_review = now + timedelta(days=new_interval)
                new_repetition = repetition_number + 1
            
            elif response_quality == "good":
                # Ease unchanged
                # Next interval is current interval * ease
                new_interval = max(current_interval + 1, 
                                int(current_interval * (ease_percentage/100) * interval_modifier))
                next_review = now + timedelta(days=new_interval)
                new_repetition = repetition_number + 1
            
            else:  # "easy"
                # Increase ease by 15 percentage points
                ease_percentage += 15
                
                # Easy bonus (typically 1.3)
                easy_bonus = 1.3
                new_interval = max(current_interval + 1,
                                int(current_interval * (ease_percentage/100) * easy_bonus * interval_modifier))
                next_review = now + timedelta(days=new_interval)
                new_repetition = repetition_number + 1
        
        # Convert ease percentage back to decimal
        new_ease = ease_percentage / 100
        
        # Optional: implement maximum interval cap
        max_interval = 36500  # 100 years default, could be configurable
        new_interval = min(new_interval, max_interval)
        
        return next_review, new_ease, new_interval, new_repetition

