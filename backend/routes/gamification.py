from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from database import get_db
import schemas
from models import DailyStreak, Achievement, LeaderboardEntry, User, StudyRecord
from auth import get_current_active_user

router = APIRouter(
    prefix="/api/gamification",
    tags=["gamification"],
    responses={404: {"description": "Not found"}}
)

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
    current_user = Depends(get_current_active_user)
):
    # Get top users for the specified timeframe
    leaderboard_entries = db.query(
        LeaderboardEntry, User.username
    ).join(
        User
    ).filter(
        LeaderboardEntry.timeframe == timeframe
    ).order_by(
        LeaderboardEntry.rank
    ).limit(limit).all()
    
    # Get current user's rank
    user_entry = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.user_id == current_user.id,
        LeaderboardEntry.timeframe == timeframe
    ).first()
    
    user_rank = user_entry.rank if user_entry else None
    
    # Format response
    entries = []
    for entry, username in leaderboard_entries:
        entry_dict = schemas.LeaderboardEntryResponse.from_orm(entry).dict()
        entry_dict["username"] = username
        entries.append(schemas.LeaderboardEntryResponse(**entry_dict))
    
    return {
        "timeframe": timeframe,
        "entries": entries,
        "user_rank": user_rank
    }

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

