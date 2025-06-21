from sqlalchemy.orm import Session
from sqlalchemy import func
from models import User, StudySession, QuizSession

def recalculate_user_points(db: Session, user: User):
    """
    Recalculates a user's total points from all their sessions and updates the user record.

    Args:
        db (Session): The database session.
        user (User): The user whose points need to be recalculated.
    """
    # Sum points from all study sessions
    total_study_points = db.query(func.sum(StudySession.points_earned)).filter(
        StudySession.user_id == user.id
    ).scalar() or 0

    # Sum points from all quiz sessions
    total_quiz_points = db.query(func.sum(QuizSession.points_earned)).filter(
        QuizSession.user_id == user.id
    ).scalar() or 0

    # Update the user's total points
    user.total_points = total_study_points + total_quiz_points
    
    # The calling function will be responsible for committing the session
    db.add(user) 