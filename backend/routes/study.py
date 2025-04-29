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

# Modify the create_study_record function to use the SM-2 algorithm
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

    # Get the card to update its spaced repetition data
    card = db.query(models.Card).filter(models.Card.id == record.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Get the latest study record for this card to retrieve current SR parameters
    latest_record = db.query(models.StudyRecord).filter(
        models.StudyRecord.card_id == record.card_id
    ).order_by(models.StudyRecord.studied_at.desc()).first()
    
    # Use current values or defaults
    current_ease = latest_record.ease_factor if latest_record else 2.5
    current_interval = latest_record.interval if latest_record else 0
    repetition_number = latest_record.repetition_number if latest_record else 0
    
    # Calculate next review using SM-2 algorithm
    next_review, new_ease, new_interval, new_repetition = models.StudyRecord.calculate_next_review(
        record.response_quality, 
        current_ease, 
        current_interval, 
        repetition_number
    )
    
    # Calculate points
    points = calculate_points(record.response_quality, record.time_taken)
    
    # Create the study record with SR data
    db_record = models.StudyRecord(
        **record.dict(),
        next_review=next_review,
        points_earned=points,
        ease_factor=new_ease,
        interval=new_interval,
        repetition_number=new_repetition
    )
    db.add(db_record)
    
    # Update the card's next review date and SR data
    card.next_review = next_review
    card.current_streak = new_repetition
    card.total_reviews = card.total_reviews + 1 if card.total_reviews else 1
    
    # Update success rate based on response quality
    is_successful = record.response_quality in ["good", "perfect"]
    total_reviews = card.total_reviews
    if not card.success_rate:
        card.success_rate = 1.0 if is_successful else 0.0
    else:
        card.success_rate = ((card.success_rate * (total_reviews - 1)) + (1.0 if is_successful else 0.0)) / total_reviews
    
    # Update session stats
    session.cards_studied += 1
    if session.accuracy is None:
        session.accuracy = 1.0 if is_successful else 0.0
    else:
        session.accuracy = ((session.accuracy * (session.cards_studied - 1)) + (1.0 if is_successful else 0.0)) / session.cards_studied
    
    session.points_earned = (session.points_earned or 0) + points
    
    db.commit()
    db.refresh(db_record)
    return db_record

# Add a new route to get due cards count
# @router.get("/due/{deck_id}", response_model=schemas.CardResponse)
# def get_due_cards_count(
#     deck_id: str,
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(get_current_active_user)
# ):
    # Verify deck access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")

    # Count cards due for review
    now = datetime.now(tz=UTC)
    due_count = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id,
        models.Card.next_review <= now
    ).scalar() or 0
    
    # Count new cards (never studied)
    new_count = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id,
        models.Card.next_review == None
    ).scalar() or 0
    
    # Count cards due later today
    end_of_day = now.replace(hour=23, minute=59, second=59)
    due_later_count = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id,
        models.Card.next_review > now,
        models.Card.next_review <= end_of_day
    ).scalar() or 0
    
    return schemas.DueCardsResponse(
        due_now=due_count,
        new_cards=new_count,
        due_later_today=due_later_count
    )

# Add a helper function to calculate points based on response quality and time
def calculate_points(response_quality: str, time_taken: int) -> int:
    points_map = {
        "again": 0,
        "hard": 5,
        "good": 10,
        "perfect": 15
    }
    
    base_points = points_map.get(response_quality, 0)
    time_bonus = max(0, 60 - time_taken) // 10  # Bonus points for quick responses
    
    return base_points + time_bonus

# Add a route to get spaced repetition progress for a deck
# @router.get("/progress/{deck_id}", response_model=schemas.SpacedRepetitionProgress)
# def get_spaced_repetition_progress(
#     deck_id: str,
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(get_current_active_user)
# ):
    # Verify deck access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")
    
    # Get all cards in the deck with their latest study records
    cards = db.query(models.Card).filter(models.Card.deck_id == deck_id).all()
    
    # Initialize counters for interval groups
    intervals = {
        "new": 0,
        "learning": 0,
        "review_1_7": 0,
        "review_8_30": 0,
        "review_31_90": 0,
        "review_91_plus": 0
    }
    
    # Calculate average ease factor
    total_ease = 0
    cards_with_ease = 0
    
    for card in cards:
        # Get the latest study record for this card
        latest_record = db.query(models.StudyRecord).filter(
            models.StudyRecord.card_id == card.id
        ).order_by(models.StudyRecord.studied_at.desc()).first()
        
        if not latest_record:
            intervals["new"] += 1
            continue
        
        interval = latest_record.interval
        total_ease += latest_record.ease_factor
        cards_with_ease += 1
        
        if interval == 0:
            intervals["new"] += 1
        elif interval <= 1:
            intervals["learning"] += 1
        elif interval <= 7:
            intervals["review_1_7"] += 1
        elif interval <= 30:
            intervals["review_8_30"] += 1
        elif interval <= 90:
            intervals["review_31_90"] += 1
        else:
            intervals["review_91_plus"] += 1
    
    avg_ease = total_ease / cards_with_ease if cards_with_ease > 0 else 2.5
    
    return schemas.SpacedRepetitionProgress(
        total_cards=len(cards),
        interval_distribution=intervals,
        average_ease_factor=avg_ease
    )

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

    now = datetime.utcnow() # Use UTC consistently

    # Priority 1: Get next due card
    next_card = db.query(models.Card).filter(
        models.Card.deck_id == deck_id,
        models.Card.next_review <= now
    ).order_by(models.Card.next_review).first()

    # Priority 2: If no due cards, get the oldest new card
    if not next_card:
        next_card = db.query(models.Card).filter(
            models.Card.deck_id == deck_id,
            models.Card.next_review == None
        ).order_by(models.Card.created_at).first() # Fetch oldest new card first

    # If still no card found (neither due nor new)
    if not next_card:
        raise HTTPException(status_code=404, detail="No cards due for review or new cards available")

    return schemas.NextCardResponse(
        card_id=next_card.id,
        due_date=next_card.next_review, # Will be None for new cards
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