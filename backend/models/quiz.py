from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Boolean, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from database import Base


class QuizSession(Base):
    __tablename__ = "quiz_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    deck_id = Column(UUID(as_uuid=True), ForeignKey("decks.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    time_taken = Column(Integer, default=0)  # in seconds
    points_earned = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="quiz_sessions")
    deck = relationship("Deck")
    answers = relationship("QuizAnswer", back_populates="session", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=False)
    question_text = Column(String, nullable=False)
    correct_answer = Column(String, nullable=False)
    options = Column(ARRAY(String), nullable=False)
    difficulty = Column(String, nullable=False)  # easy|medium|hard
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    card = relationship("Card", back_populates="quiz_questions")
    answers = relationship("QuizAnswer", back_populates="question")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("quiz_sessions.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("quiz_questions.id"), nullable=False)
    user_answer = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    time_taken = Column(Integer, default=0)  # in seconds
    points_earned = Column(Integer, default=0)
    
    # Relationships
    session = relationship("QuizSession", back_populates="answers")
    question = relationship("QuizQuestion", back_populates="answers")