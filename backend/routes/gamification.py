from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, select, union_all
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta, UTC

from database import get_db
import schemas
from models import DailyStreak, Achievement, LeaderboardEntry, User, StudySession, QuizSession, StudyRecord
from auth import get_current_active_user

router = APIRouter(
    prefix="/api/gamification",
    tags=["gamification"],
    responses={404: {"description": "Not found"}}
)

def get_time_range_start(time_frame: schemas.TimeFrame):
    """Returns the start datetime for a given TimeFrame."""
    now = datetime.now(UTC)
    if time_frame == schemas.TimeFrame.DAILY:
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if time_frame == schemas.TimeFrame.WEEKLY:
        return now - timedelta(days=7)
    if time_frame == schemas.TimeFrame.MONTHLY:
        return now - timedelta(days=30)
    # ALLTIME
    return datetime.min.replace(tzinfo=UTC)

# Get user's streak information
@router.get("/streaks", response_model=schemas.DailyStreakResponse)
async def get_user_streak(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    streak = db.query(DailyStreak).filter(DailyStreak.user_id == current_user.id).first()
    
    if not streak:
        # Create streak record if it doesn't exist
        streak = DailyStreak(user_id=current_user.id)
        db.add(streak)
        db.commit()
        db.refresh(streak)
    
    return streak

# Get user's achievements
@router.get("/achievements", response_model=List[schemas.AchievementResponse])
async def get_user_achievements(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    achievements = db.query(Achievement).filter(
        Achievement.user_id == current_user.id
    ).order_by(Achievement.achieved_at.desc()).all()
    
    return achievements

# Get leaderboard for a specific timeframe
@router.get("/leaderboard/{timeframe}", response_model=schemas.LeaderboardResponse)
async def get_leaderboard(
    timeframe: schemas.TimeFrame,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    start_date = get_time_range_start(timeframe)

    # Subquery for study points per user within the timeframe
    study_points_sq = select(
        StudySession.user_id,
        func.sum(StudySession.points_earned).label("points")
    ).where(
        StudySession.start_time >= start_date,
        StudySession.points_earned.isnot(None)
    ).group_by(StudySession.user_id).subquery()

    # Subquery for quiz points per user within the timeframe
    quiz_points_sq = select(
        QuizSession.user_id,
        func.sum(QuizSession.points_earned).label("points")
    ).where(
        QuizSession.start_time >= start_date,
        QuizSession.points_earned.isnot(None)
    ).group_by(QuizSession.user_id).subquery()

    # Union the points from both sources
    all_points_sq = union_all(
        select(study_points_sq.c.user_id, study_points_sq.c.points),
        select(quiz_points_sq.c.user_id, quiz_points_sq.c.points)
    ).alias("all_points")

    # Group by user to get total points for active users
    total_points_sq = select(
        all_points_sq.c.user_id,
        func.sum(all_points_sq.c.points).label("total_points")
    ).group_by(all_points_sq.c.user_id).subquery()

    # Subquery to ensure all users are included, with 0 points if inactive
    all_users_points_sq = select(
        User.id.label("user_id"),
        User.username,
        func.coalesce(total_points_sq.c.total_points, 0).label("total_points"),
        func.coalesce(DailyStreak.current_streak, 0).label("streak")
    ).select_from(User).outerjoin(
        total_points_sq, User.id == total_points_sq.c.user_id
    ).outerjoin(
        DailyStreak, User.id == DailyStreak.user_id
    ).subquery()

    # Use row_number to give a unique rank, with streak and username as tie-breakers
    ranked_users_sq = select(
        all_users_points_sq.c.user_id,
        all_users_points_sq.c.total_points,
        func.row_number().over(
            order_by=[
                desc(all_users_points_sq.c.total_points),
                desc(all_users_points_sq.c.streak),
                all_users_points_sq.c.username.asc()
            ]
        ).label("rank")
    ).subquery()

    # Query for the top N users
    leaderboard_results = db.query(
        ranked_users_sq.c.user_id,
        ranked_users_sq.c.rank,
        ranked_users_sq.c.total_points,
        User.username,
        User.avatar,
        DailyStreak.current_streak
    ).join(
        User, ranked_users_sq.c.user_id == User.id
    ).outerjoin(
        DailyStreak, User.id == DailyStreak.user_id
    ).order_by(
        ranked_users_sq.c.rank
    ).limit(limit).all()

    # Format the main leaderboard entries
    entries = []
    for user_id, rank, total_points, username, avatar, streak in leaderboard_results:
        entries.append(schemas.LeaderboardEntryResponse(
            user_id=user_id,
            rank=rank,
            total_points=total_points,
            username=username,
            avatar=f"/media/avatars/{avatar}" if avatar else None,
            streak=streak or 0,
            # Placeholder values for fields not calculated in this query
            id=user_id, # Using user_id as a placeholder for id
            calculated_at=datetime.now(UTC),
            timeframe=timeframe,
            quiz_points=0,
            study_points=0,
            achievement_points=0,
            streak_points=0,
            rank_change="same"
        ))

    # Get current user's detailed rank information
    user_rank_details = None
    user_rank_query = db.query(
        ranked_users_sq.c.rank,
        ranked_users_sq.c.total_points
    ).filter(ranked_users_sq.c.user_id == current_user.id).first()

    if user_rank_query:
        user_rank, user_points = user_rank_query
        points_to_next = None
        if user_rank > 1:
            next_rank_points = db.query(ranked_users_sq.c.total_points).filter(
                ranked_users_sq.c.rank == user_rank - 1
            ).scalar()
            if next_rank_points is not None:
                points_to_next = next_rank_points - user_points
        
        user_rank_details = schemas.UserRankDetail(
            rank=user_rank,
            points_to_next_rank=points_to_next,
            rank_change="same"
        )

    return schemas.LeaderboardResponse(
        timeframe=timeframe,
        entries=entries,
        user_rank_details=user_rank_details
    )

# Get user's gamification summary
@router.get("/summary", response_model=schemas.UserGamificationSummary)
async def get_user_gamification_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Get streak info
    streak = db.query(DailyStreak).filter(
        DailyStreak.user_id == current_user.id
    ).first()
    
    if not streak:
        streak = DailyStreak(user_id=current_user.id)
        db.add(streak)
        db.commit()
        db.refresh(streak)
    
    # Get achievement count
    achievement_count = db.query(func.count(Achievement.id)).filter(
        Achievement.user_id == current_user.id
    ).scalar()
    
    # Get total points
    alltime_entry = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.user_id == current_user.id,
        LeaderboardEntry.timeframe == "alltime"
    ).first()
    
    total_points = alltime_entry.total_points if alltime_entry else 0
    
    # Get rank
    if alltime_entry and alltime_entry.rank:
        rank = alltime_entry.rank
    else:
        rank = None
    
    return {
        "total_points": total_points,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "achievement_count": achievement_count,
        "rank": rank
    }

# Update user's streak (typically called after study sessions)
@router.post("/streaks/update", response_model=schemas.DailyStreakResponse)
async def update_user_streak(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Get user's streak
    streak = db.query(DailyStreak).filter(
        DailyStreak.user_id == current_user.id
    ).first()
    
    if not streak:
        streak = DailyStreak(user_id=current_user.id)
        db.add(streak)
        db.commit()
        db.refresh(streak)
    
    today = datetime.utcnow().date()
    
    # Check if user already studied today
    if streak.last_study_date and streak.last_study_date.date() == today:
        # Already updated today
        return streak
    
    # Check if this is a consecutive day
    if streak.last_study_date and (today - streak.last_study_date.date()).days == 1:
        # Consecutive day
        streak.current_streak += 1
        streak.points_earned += 10 * streak.current_streak  # Points increase with streak
    elif not streak.last_study_date or (today - streak.last_study_date.date()).days > 1:
        # Streak broken or first time
        streak.current_streak = 1
        streak.points_earned += 10
    
    # Update other fields
    streak.last_study_date = datetime.utcnow()
    streak.total_study_days += 1
    
    # Update longest streak if current streak is longer
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak
    
    db.commit()
    db.refresh(streak)
    
    # Check for streak achievements
    await check_streak_achievements(db, current_user.id, streak)
    
    return streak

# Check and award streak achievements
async def check_streak_achievements(db: Session, user_id: UUID, streak: DailyStreak):
    # Define streak achievement thresholds
    streak_achievements = [
        {"threshold": 3, "name": "3-Day Streak", "points": 50},
        {"threshold": 7, "name": "7-Day Streak", "points": 100},
        {"threshold": 14, "name": "2-Week Streak", "points": 200},
        {"threshold": 30, "name": "Monthly Dedication", "points": 500},
        {"threshold": 100, "name": "Flashcard Master", "points": 1000}
    ]
    
    # Check each threshold
    for achievement_def in streak_achievements:
        if streak.current_streak >= achievement_def["threshold"]:
            # Check if already achieved
            existing = db.query(Achievement).filter(
                Achievement.user_id == user_id,
                Achievement.name == achievement_def["name"]
            ).first()
            
            if not existing:
                # Award new achievement
                new_achievement = Achievement(
                    user_id=user_id,
                    name=achievement_def["name"],
                    description=f"Studied flashcards for {achievement_def['threshold']} consecutive days!",
                    achievement_type="streak",
                    criteria_met={"streak_days": achievement_def["threshold"]},
                    points_awarded=achievement_def["points"]
                )
                db.add(new_achievement)
                
                # Update streak points
                streak.points_earned += achievement_def["points"]
                
                db.commit()
                
                # Update leaderboard (would typically be done by a background job)
                update_leaderboard_entry(db, user_id)

# Calculate and update leaderboard entry (simplified version)
def update_leaderboard_entry(db: Session, user_id: UUID):
    # In a real application, this would be more sophisticated and run as a background job
    
    # Get user's point sources
    streak = db.query(DailyStreak).filter(DailyStreak.user_id == user_id).first()
    streak_points = streak.points_earned if streak else 0
    
    achievement_points = db.query(func.sum(Achievement.points_awarded)).filter(
        Achievement.user_id == user_id
    ).scalar() or 0
    
    study_points = db.query(func.count(StudyRecord.id) * 5).filter(
        StudyRecord.user_id == user_id
    ).scalar() or 0
    
    # Calculate total
    total_points = streak_points + achievement_points + study_points
    
    # Update or create leaderboard entries for each timeframe
    for timeframe in ["daily", "weekly", "monthly", "alltime"]:
        entry = db.query(LeaderboardEntry).filter(
            LeaderboardEntry.user_id == user_id,
            LeaderboardEntry.timeframe == timeframe
        ).first()
        
        if not entry:
            entry = LeaderboardEntry(
                user_id=user_id,
                timeframe=timeframe
            )
            db.add(entry)
        
        # Update point values
        entry.streak_points = streak_points
        entry.achievement_points = achievement_points
        entry.study_points = study_points
        entry.total_points = total_points
        entry.calculated_at = datetime.utcnow()
        
        db.commit()
    
    # Re-rank all users (simplified - would be more efficient in production)
    for timeframe in ["daily", "weekly", "monthly", "alltime"]:
        rank_entries = db.query(LeaderboardEntry).filter(
            LeaderboardEntry.timeframe == timeframe
        ).order_by(desc(LeaderboardEntry.total_points)).all()
        
        for i, entry in enumerate(rank_entries):
            entry.rank = i + 1
        
        db.commit()

# Get user's study sessions
@router.get("/api/study/sessions")
async def get_user_study_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Implementation for getting user's study sessions
    pass

# Get user's study stats for a specific deck
@router.get("/api/study/stats/{deck_id}")
async def get_user_study_stats(
    deck_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Implementation for getting user's study stats for a specific deck
    pass

# Get user's quiz sessions
@router.get("/api/quiz/sessions")
async def get_user_quiz_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Implementation for getting user's quiz sessions
    pass

# Get user's quiz stats for a specific deck
@router.get("/api/quiz/stats/{deck_id}")
async def get_user_quiz_stats(
    deck_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Implementation for getting user's quiz stats for a specific deck
    pass