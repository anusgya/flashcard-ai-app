from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func
from datetime import datetime, timedelta, UTC

import models
import schemas
from database import get_db
from enums import TimeRange
from auth import get_current_active_user

router = APIRouter(
    prefix="/api/study",
    tags=["study"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/sessions", response_model=schemas.StudySessionResponse)
def create_study_session(
    session: schemas.StudySessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify deck exists and user has access
    deck = db.query(models.Deck).filter(models.Deck.id == session.deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")

    db_session = models.StudySession(
        deck_id=session.deck_id,
        user_id=current_user.id
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/sessions/{session_id}", response_model=schemas.StudySessionResponse)
def get_study_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    return session

@router.put("/sessions/{session_id}", response_model=schemas.StudySessionResponse)
def update_study_session(
    session_id: str,
    session_update: schemas.StudySessionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Study session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this session")
    
    for key, value in session_update.dict().items():
        setattr(session, key, value)
    
    db.commit()
    db.refresh(session)
    return session

@router.post("/records", response_model=schemas.StudyRecordResponse)
def create_study_record(
    record: schemas.StudyRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify session belongs to user
    session = db.query(models.StudySession).filter(models.StudySession.id == record.session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Invalid study session")

    # Calculate next review date and points based on response quality
    next_review, points = calculate_review_schedule(record.response_quality, record.time_taken)

    db_record = models.StudyRecord(
        **record.dict(),
        next_review=next_review,
        points_earned=points
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.get("/next/{deck_id}", response_model=schemas.NextCardResponse)
def get_next_card(
    deck_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify deck access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")

    # Get next due card
    next_card = db.query(models.Card).filter(
        models.Card.deck_id == deck_id,
        models.Card.next_review <= datetime.utcnow()
    ).order_by(models.Card.next_review).first()

    if not next_card:
        raise HTTPException(status_code=404, detail="No cards due for review")

    return schemas.NextCardResponse(
        card_id=next_card.id,
        due_date=next_card.next_review,
        current_streak=next_card.current_streak,
        total_reviews=next_card.total_reviews
    )

@router.get("/stats/{deck_id}", response_model=schemas.StudySessionStats)
def get_study_stats(
    deck_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify deck access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")

    # Calculate statistics
    sessions = db.query(models.StudySession).filter(
        models.StudySession.deck_id == deck_id,
        models.StudySession.user_id == current_user.id
    ).all()

    if not sessions:
        return schemas.StudySessionStats(
            total_sessions=0,
            total_cards_studied=0,
            average_accuracy=0.0,
            total_points=0,
            average_time_per_card=0.0,
            mastery_rate=0.0
        )

    total_sessions = len(sessions)
    total_cards = sum(session.cards_studied for session in sessions)
    total_points = sum(session.points_earned for session in sessions)
    avg_accuracy = sum(session.accuracy for session in sessions) / total_sessions

    # Calculate mastery rate
    total_records = db.query(models.StudyRecord).join(models.StudySession).filter(
        models.StudySession.deck_id == deck_id,
        models.StudySession.user_id == current_user.id
    ).all()
    
    total_time = sum(record.time_taken for record in total_records)
    avg_time = total_time / len(total_records) if total_records else 0
    
    mastered_cards = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id,
        models.Card.success_rate >= 0.8
    ).scalar() or 0
    
    total_deck_cards = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id
    ).scalar() or 1
    
    mastery_rate = mastered_cards / total_deck_cards

    return schemas.StudySessionStats(
        total_sessions=total_sessions,
        total_cards_studied=total_cards,
        average_accuracy=avg_accuracy,
        total_points=total_points,
        average_time_per_card=avg_time,
        mastery_rate=mastery_rate
    )

def calculate_review_schedule(response_quality: str, time_taken: int) -> tuple[datetime, int]:
    intervals = {
        "again": timedelta(minutes=10),
        "hard": timedelta(days=1),
        "good": timedelta(days=3),
        "perfect": timedelta(days=7)
    }
    points = {
        "again": 0,
        "hard": 5,
        "good": 10,
        "perfect": 15
    }
    
    next_review = datetime.utcnow() + intervals[response_quality]
    base_points = points[response_quality]
    time_bonus = max(0, 60 - time_taken) // 10  # Bonus points for quick responses
    
    return next_review, base_points + time_bonus

# Add after your existing endpoints
@router.get("/sessions", response_model=List[schemas.StudySessionResponse])
def list_study_sessions(
    time_range: TimeRange,
    deck_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):  
    try:
        # Base query for user's sessions
        query = db.query(models.StudySession).filter(
            models.StudySession.user_id == current_user.id
        )

        import logging
        logger = logging.getLogger(__name__)
        
        # Apply time range filter
        now = datetime.now(tz=UTC)
        if time_range == TimeRange.TODAY:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(models.StudySession.end_time >= start_date)
        elif time_range == TimeRange.WEEK:
            start_date = now - timedelta(days=7)
            query = query.filter(models.StudySession.end_time >= start_date)
        elif time_range == TimeRange.MONTH:
            start_date = now - timedelta(days=30)
            query = query.filter(models.StudySession.end_time >= start_date)
        
        # Apply deck filter if provided
        if deck_id:
            query = query.filter(models.StudySession.deck_id == deck_id)
        
        # Order by creation date, newest first
        query = query.order_by(models.StudySession.end_time.desc())
    
    except Exception as e:
        print(f"error: {e}")
        logger.error(f"Error listing study sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    return query.all()