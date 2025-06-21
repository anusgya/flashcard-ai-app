from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, select, union_all
from typing import List, Optional
from datetime import datetime, timedelta, UTC
import random

from database import get_db
from schemas.analytics import (
    AnalyticsDashboardResponse, 
    SessionFrequency, 
    SessionFrequencyData,
    StudyTrendPoint,
    ResponseQualityPoint,
    StreakData,
    QuizVsStudyPoint,
    PointsDataPoint,
    RankingData,
    DifficultCard
)
from models import StudySession, QuizSession, StudyRecord, QuizAnswer, Card, DailyStreak, User, Deck
from auth import get_current_active_user
from enums import TimeRange

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
    dependencies=[Depends(get_current_active_user)]
)

def get_time_range_filter(time_range: TimeRange, now: datetime = None):
    if now is None:
        now = datetime.now(tz=UTC)
    
    if time_range == TimeRange.TODAY:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == TimeRange.WEEK:
        start_date = now - timedelta(days=7)
    elif time_range == TimeRange.MONTH:
        start_date = now - timedelta(days=30)
    else:  # ALL
        start_date = datetime.min.replace(tzinfo=UTC)
    
    return start_date

@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
def get_analytics_dashboard(
    time_range: TimeRange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    now = datetime.now(tz=UTC)
    start_date = get_time_range_filter(time_range, now)
    
    # Get study sessions for the selected time range
    study_sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.start_time >= start_date
    ).all()
    
    # Get quiz sessions for the selected time range
    quiz_sessions = db.query(QuizSession).filter(
        QuizSession.user_id == current_user.id,
        QuizSession.start_time >= start_date
    ).all()
    
    # Calculate learning effectiveness score (weighted average of accuracy and mastery)
    study_accuracy = sum(s.accuracy or 0 for s in study_sessions) / len(study_sessions) if study_sessions else 0
    quiz_accuracy = sum(s.accuracy or 0 for s in quiz_sessions) / len(quiz_sessions) if quiz_sessions else 0
    
    # Get mastery rate from cards (user-specific)
    user_cards_query = db.query(Card).join(Card.deck).filter(Deck.user_id == current_user.id)
    
    # Filter by time range if not 'ALL'
    if time_range != TimeRange.ALL:
        # We check for cards that were reviewed in the period
        reviewed_cards_subquery = db.query(StudyRecord.card_id).join(StudySession).filter(
            StudySession.user_id == current_user.id,
            StudyRecord.studied_at >= start_date
        ).distinct().subquery()
        
        user_cards_query = user_cards_query.join(
            reviewed_cards_subquery, Card.id == reviewed_cards_subquery.c.card_id
        )

    total_cards = user_cards_query.count() or 1
    mastered_cards_query = db.query(func.count(Card.id)).join(Deck).filter(
        Deck.user_id == current_user.id,
        Card.success_rate >= 0.8
    )
    
    # Filter by time range if not 'ALL'
    if time_range != TimeRange.ALL:
        # We check for cards that were reviewed in the period
        reviewed_cards_subquery = db.query(StudyRecord.card_id).join(StudySession).filter(
            StudySession.user_id == current_user.id,
            StudyRecord.studied_at >= start_date
        ).distinct().subquery()
        
        user_cards_query = user_cards_query.join(
            reviewed_cards_subquery, Card.id == reviewed_cards_subquery.c.card_id
        )
        mastered_cards_query = mastered_cards_query.join(
            reviewed_cards_subquery, Card.id == reviewed_cards_subquery.c.card_id
        )

    total_cards = user_cards_query.count() or 1
    mastered_cards = mastered_cards_query.scalar() or 0
    mastery_rate = mastered_cards / total_cards if total_cards > 0 else 0
    
    # Learning effectiveness is weighted average of accuracies and mastery
    learning_effectiveness = (study_accuracy * 0.4 + quiz_accuracy * 0.4 + mastery_rate * 0.2) * 100
    
    # Get streak information
    streak = db.query(DailyStreak).filter(
        DailyStreak.user_id == current_user.id
    ).first()
    
    current_streak = streak.current_streak if streak else 0
    longest_streak = streak.longest_streak if streak else 0
    
    # Calculate total study time and average session duration
    total_study_seconds = sum((s.end_time - s.start_time).total_seconds() for s in study_sessions if s.end_time)
    total_quiz_seconds = sum((s.end_time - s.start_time).total_seconds() for s in quiz_sessions if s.end_time)
    total_duration_seconds = total_study_seconds + total_quiz_seconds
    
    total_study_time = total_duration_seconds / 3600  # In hours
    
    total_sessions = len(study_sessions) + len(quiz_sessions)
    avg_session_duration = (total_duration_seconds / 60) / total_sessions if total_sessions > 0 else 0
    
    # Generate study trend data with proper date formatting
    study_trend_data = []
    date_range = 7 if time_range == TimeRange.WEEK else (30 if time_range == TimeRange.MONTH else 1)
    
    for i in range(date_range):
        day = now - timedelta(days=date_range-1-i)  # Chronological order
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Get study records for the day (user-specific)
        day_study_records = db.query(StudyRecord).join(StudySession).filter(
            StudySession.user_id == current_user.id,
            StudyRecord.studied_at.between(day_start, day_end)
        ).all()
        
        if day_study_records:
            accuracy = sum(1 for r in day_study_records if r.response_quality in ["good", "perfect"]) / len(day_study_records)
            cards_studied = len(day_study_records)
            time_spent = sum(r.time_taken for r in day_study_records if r.time_taken) / 60  # Convert to minutes
        else:
            accuracy = 0
            cards_studied = 0
            time_spent = 0
        
        study_trend_data.append({
            "interval": day.strftime("%Y-%m-%d"),  # Frontend expects YYYY-MM-DD format
            "accuracy": round(accuracy * 100, 1),
            "cardsStudied": cards_studied,
            "timeSpent": int(round(time_spent))  # Convert to int as per schema
        })
    
    # Generate response quality distribution (user-specific)
    response_quality_data = [
        {"name": "Perfect", "value": 0, "color": "#4CAF50"},
        {"name": "Good", "value": 0, "color": "#2196F3"},
        {"name": "Hard", "value": 0, "color": "#FF9800"},
        {"name": "Again", "value": 0, "color": "#F44336"}
    ]
    
    study_records = db.query(StudyRecord).join(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudyRecord.studied_at >= start_date
    ).all()
    
    for record in study_records:
        if record.response_quality == "perfect":
            response_quality_data[0]["value"] += 1
        elif record.response_quality == "good":
            response_quality_data[1]["value"] += 1
        elif record.response_quality == "hard":
            response_quality_data[2]["value"] += 1
        else:  # again
            response_quality_data[3]["value"] += 1
    
    # Generate streak data (last 30 days) - user-specific
    # Frontend expects date as string in streakData
    streak_data = []
    for i in range(30):
        day = now - timedelta(days=29-i)  # Start from 30 days ago
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Check if user studied on this day
        studied = db.query(StudyRecord).join(StudySession).filter(
            StudySession.user_id == current_user.id,
            StudyRecord.studied_at.between(day_start, day_end)
        ).first() is not None
        
        streak_data.append({
            "date": day.strftime("%Y-%m-%d"),  # Frontend expects string format
            "value": 1 if studied else 0
        })
    
    # Generate quiz vs study performance data (user-specific)
    quiz_vs_study_data = []
    for i in range(date_range):
        day = now - timedelta(days=date_range-1-i)  # Chronological order
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Get study accuracy
        day_study_records = db.query(StudyRecord).join(StudySession).filter(
            StudySession.user_id == current_user.id,
            StudyRecord.studied_at.between(day_start, day_end)
        ).all()
        study_accuracy = sum(1 for r in day_study_records if r.response_quality in ["good", "perfect"]) / len(day_study_records) if day_study_records else 0
        
        # Get quiz accuracy
        day_quiz_answers = db.query(QuizAnswer).join(QuizSession).filter(
            QuizSession.user_id == current_user.id,
            QuizAnswer.submitted_at.between(day_start, day_end)
        ).all()
        quiz_accuracy = sum(1 for a in day_quiz_answers if a.is_correct) / len(day_quiz_answers) if day_quiz_answers else 0
        
        quiz_vs_study_data.append({
            "date": day.strftime("%Y-%m-%d"),  # Frontend expects YYYY-MM-DD format
            "quizAccuracy": round(quiz_accuracy * 100, 1),
            "studyAccuracy": round(study_accuracy * 100, 1)
        })
    
    # Get difficult cards (user-specific)
    difficult_cards = db.query(Card).join(Deck).filter(
        Deck.user_id == current_user.id,
        Card.success_rate < 0.6,
        Card.total_reviews > 3
    ).order_by(Card.success_rate.asc()).limit(5).all()
    
    difficult_cards_data = [
        {
            "id": str(card.id),  # Convert to string as per schema
            "front_content": card.front_content,
            "success_rate": round(card.success_rate * 100, 1),  # Convert to percentage for frontend
            "total_reviews": card.total_reviews
        }
        for card in difficult_cards
    ]
    
    # Generate points breakdown with actual user data
    study_points = sum(s.points_earned or 0 for s in study_sessions)
    quiz_points = sum(s.points_earned or 0 for s in quiz_sessions)
    streak_points = current_streak * 10  # 10 points per day of streak
    mastery_points = int(mastery_rate * 100)
    
    points_data = [
        {"name": "Study", "value": study_points, "color": "#4CAF50"},
        {"name": "Quiz", "value": quiz_points, "color": "#2196F3"},
        {"name": "Streak", "value": streak_points, "color": "#FF9800"},
    ]
    
    # Calculate rankings with corrected logic
    total_users = db.query(func.count(User.id)).scalar() or 1
    
    def get_rank_for_period(period_start):
        # Calculate current user's points for the period
        user_study_points = db.query(func.sum(StudySession.points_earned)).filter(
            StudySession.user_id == current_user.id,
            StudySession.start_time >= period_start
        ).scalar() or 0
        user_quiz_points = db.query(func.sum(QuizSession.points_earned)).filter(
            QuizSession.user_id == current_user.id,
            QuizSession.start_time >= period_start
        ).scalar() or 0
        user_total_points = user_study_points + user_quiz_points

        # Subquery to get combined points for all users in the period
        study_points_sq = select(StudySession.user_id, func.sum(StudySession.points_earned).label("points")).where(
            StudySession.start_time >= period_start, StudySession.points_earned.isnot(None)
        ).group_by(StudySession.user_id)
        
        quiz_points_sq = select(QuizSession.user_id, func.sum(QuizSession.points_earned).label("points")).where(
            QuizSession.start_time >= period_start, QuizSession.points_earned.isnot(None)
        ).group_by(QuizSession.user_id)

        all_points_sq = union_all(study_points_sq, quiz_points_sq).alias("all_points")

        total_points_sq = select(
            all_points_sq.c.user_id,
            func.sum(all_points_sq.c.points).label("total_points")
        ).group_by(all_points_sq.c.user_id).subquery()

        # Count users with more points
        better_users_count = db.query(func.count(total_points_sq.c.user_id)).filter(
            total_points_sq.c.total_points > user_total_points
        ).scalar() or 0
        
        return better_users_count + 1

    # Calculate ranks for different periods
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)
    
    ranking_data = {
        "daily": get_rank_for_period(today_start),
        "weekly": get_rank_for_period(week_start),
        "monthly": get_rank_for_period(month_start),
        "allTime": get_rank_for_period(datetime.min.replace(tzinfo=UTC)),
        "totalUsers": total_users
    }
    
    # Calculate session frequency with proper structure
    def get_session_frequency_for_period(period_start, target_days):
        sessions_in_period = len([s for s in study_sessions if s.start_time.replace(tzinfo=UTC) >= period_start]) + \
                           len([s for s in quiz_sessions if s.start_time.replace(tzinfo=UTC) >= period_start])
        target_sessions = target_days  # Assuming target is 1 session per day
        percentage = min((sessions_in_period / target_sessions) * 100, 100) if target_sessions > 0 else 0
        
        return SessionFrequency(
            count=sessions_in_period,
            percentage=round(percentage, 1)
        )
    
    session_frequency = SessionFrequencyData(
        daily=get_session_frequency_for_period(today_start, 1),
        weekly=get_session_frequency_for_period(week_start, 7),
        monthly=get_session_frequency_for_period(month_start, 30)
    )
    
    return AnalyticsDashboardResponse(
        learningEffectivenessScore=round(learning_effectiveness, 1),
        currentStreak=current_streak,
        longestStreak=longest_streak,
        totalStudyTime=round(total_study_time, 2),
        averageSessionDuration=round(avg_session_duration, 1),
        studyTrendData=study_trend_data,
        responseQualityData=response_quality_data,
        streakData=streak_data,
        quizVsStudyData=quiz_vs_study_data,
        difficultCardsData=difficult_cards_data,
        pointsData=points_data,
        rankingData=ranking_data,
        sessionFrequency=session_frequency
    )