from database import Base
from models.user import User
from models.deck import Deck
from models.card import Card, CardMedia
from models.tag import Tag, CardTag
from models.study import StudySession, StudyRecord
from models.quiz import QuizSession, QuizQuestion, QuizAnswer
from models.gamification import DailyStreak, Achievement, LeaderboardEntry
from models.interaction import CardInteraction, LLMResponse, Comment
from sqlalchemy.orm import relationship

# Add relationships that couldn't be defined earlier due to circular imports
User.decks = relationship("Deck", back_populates="user", cascade="all, delete-orphan")
User.study_sessions = relationship("StudySession", back_populates="user")
User.quiz_sessions = relationship("QuizSession", back_populates="user")
User.streaks = relationship("DailyStreak", back_populates="user", uselist=False)
User.achievements = relationship("Achievement", back_populates="user")
User.leaderboard_entries = relationship("LeaderboardEntry", back_populates="user")
User.card_interactions = relationship("CardInteraction", back_populates="user")

__all__ = [
    "Base",
    "User",
    "Deck",
    "Card",
    "CardMedia",
    "Tag",
    "CardTag",
    "StudySession",
    "StudyRecord",
    "QuizSession",
    "QuizQuestion",
    "QuizAnswer",
    "DailyStreak",
    "Achievement",
    "LeaderboardEntry",
    "CardInteraction",
    "LLMResponse",
    "Comment"
]