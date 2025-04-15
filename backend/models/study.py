from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    deck_id = Column(UUID(as_uuid=True), ForeignKey("decks.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    cards_studied = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    points_earned = Column(Integer, default=0)
    
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
    
    # Relationships
    session = relationship("StudySession", back_populates="records")
    card = relationship("Card", back_populates="study_records")