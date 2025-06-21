from datetime import date, timedelta
from sqlalchemy.orm import Session
from models import DailyStreak, User
from models.gamification import DailyStreak

def update_daily_streak(db: Session, user: User):
    """
    Updates a user's daily streak based on their activity.

    Args:
        db (Session): The database session.
        user (User): The current user.
    """
    today = date.today()
    
    streak = db.query(DailyStreak).filter(DailyStreak.user_id == user.id).first()
    
    if not streak:
        # Create a new streak record if one doesn't exist
        streak = DailyStreak(
            user_id=user.id,
            current_streak=1,
            longest_streak=1,
            last_study_date=today
        )
        db.add(streak)
    else:
        last_activity = streak.last_study_date.date() if streak.last_study_date else None
        
        # If last activity was today, do nothing
        if last_activity == today:
            return
        
        # If last activity was yesterday, increment the streak
        if last_activity == today - timedelta(days=1):
            streak.current_streak += 1
            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak
        else:
            # If the streak was broken, reset it to 1
            streak.current_streak = 1
        
        streak.last_study_date = today
    
    # The commit will be handled by the calling function's transaction 