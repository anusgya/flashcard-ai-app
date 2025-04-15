from enum import Enum

# Add this after your existing imports
class TimeRange(str, Enum):
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    ALL = "all"