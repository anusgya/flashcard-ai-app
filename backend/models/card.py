from enums import Enum
from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, UUID, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from database import Base

class DifficultyLevel(str, Enum):
    NEW = "new"
    AGAIN = "again"
    HARD = "hard"
    GOOD = "good"
    PERFECT = "perfect"

class CardState(str, Enum):
    NEW = "new"
    LEARNING = "learning" 
    DUE = "due"

class Card(Base):
    __tablename__ = "cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deck_id = Column(UUID(as_uuid=True), ForeignKey("decks.id"), nullable=False)
    front_content = Column(String, nullable=False)
    back_content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    difficulty_level = Column(SQLAlchemyEnum(DifficultyLevel))
    times_reviewed = Column(Integer, default=0) # Note: This seems redundant now with total_reviews
    last_reviewed = Column(DateTime, nullable=True)
    next_review = Column(DateTime, nullable=True)
    success_rate = Column(Float, default=0.0)
    source = Column(String, nullable=True)
    card_state = Column(SQLAlchemyEnum(CardState), default=CardState.NEW)
    current_streak = Column(Integer, default=0) # Added this line
    total_reviews = Column(Integer, default=0) # Added this line

    # Relationships
    deck = relationship("Deck", back_populates="cards")
    tags = relationship("CardTag", back_populates="card", cascade="all, delete-orphan")
    media = relationship("CardMedia", back_populates="card", cascade="all, delete-orphan")
    study_records = relationship("StudyRecord", back_populates="card", cascade="all, delete-orphan")
    interactions = relationship("CardInteraction", back_populates="card", cascade="all, delete-orphan")
    llm_responses = relationship("LLMResponse", back_populates="card", cascade="all, delete-orphan")
    quiz_questions = relationship("QuizQuestion", back_populates="card", cascade="all, delete-orphan")


class CardMedia(Base):
    __tablename__ = "card_media"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=False)
    media_type = Column(String, nullable=False)  # image|audio
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    side = Column(String, nullable=False)  # front|back
    
    # Relationships
    card = relationship("Card", back_populates="media")