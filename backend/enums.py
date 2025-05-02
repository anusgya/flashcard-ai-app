from enum import Enum

class QuizDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

# Add this after your existing imports
class TimeRange(str, Enum):
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    ALL = "all"

class CardState(str, Enum):
    NEW = "new"
    LEARNING = "learning"
    REVIEW = "review"
