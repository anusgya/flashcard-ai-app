from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from enum import Enum

import models
import schemas
from database import get_db
from enums import TimeRange, CardState
from auth import get_current_active_user
from utils.streak_utils import update_daily_streak

router = APIRouter(
    prefix="/api/study",
    tags=["study"],
    dependencies=[Depends(get_current_active_user)]
)

def format_timedelta_human_readable(td: timedelta) -> str:
    """Formats a timedelta into a human-readable string like '10m', '2d', '3mo'."""
    seconds = int(td.total_seconds())
    
    if seconds < 60:
        return "<1m"
        
    minutes = round(seconds / 60)
    if minutes < 60:
        return f"{minutes}m"
        
    hours = round(minutes / 60)
    if hours < 24:
        return f"{hours}h"
        
    days = round(hours / 24)
    if days < 30:
        return f"{days}d"
        
    months = round(days / 30)
    if months < 12:
        return f"{months}mo"
        
    years = round(days / 365)
    return f"{years}y"

def determine_card_state(next_review, interval, now=None):
    """
    Determine the card state based on its interval and next review date.
    
    Args:
        next_review (datetime): When the card is due for review next
        interval (int): Current interval in days
        now (datetime, optional): Current datetime for comparison
        
    Returns:
        CardState: The current state of the card (NEW, LEARNING, or REVIEW)
    """
    if now is None:
        now = datetime.now(timezone.utc)
    
    # If next_review is None, the card is new
    if next_review is None:
        return CardState.NEW
    
    # If interval is 0 or 1, card is still in learning phase
    if interval is not None and interval <= 1:
        return CardState.LEARNING
    
    # Otherwise, card is in review
    return CardState.REVIEW

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

@router.get("/recent", response_model=List[schemas.DeckResponse])
def get_recent_decks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):

    subquery = db.query(
        models.StudySession.deck_id,
        func.max(models.StudySession.start_time).label("latest_start_time")
    ).filter(
        models.StudySession.user_id == current_user.id
    ).group_by(
        models.StudySession.deck_id
    ).subquery()
    
    # Join with the decks table to get deck details
    recent_decks = db.query(models.Deck).join(
        subquery, models.Deck.id == subquery.c.deck_id
    ).filter(
        models.Deck.user_id == current_user.id  # Ensure user has access to these decks
    ).order_by(
        subquery.c.latest_start_time.desc()
    ).limit(3).all()
    
    for deck in recent_decks:
        # Get total cards count
        deck.total_cards = db.query(func.count(models.Card.id)).filter(
            models.Card.deck_id == deck.id
        ).scalar() or 0
        
        # Get learning cards count
        deck.learning_cards = db.query(func.count(models.Card.id)).filter(
            models.Card.deck_id == deck.id,
            models.Card.card_state == CardState.LEARNING
        ).scalar() or 0
    
    return recent_decks

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
    
    update_data = session_update.dict(exclude_unset=True)

    # Check if the session is being concluded
    is_ending = "end_time" in update_data and update_data["end_time"] is not None

    for key, value in update_data.items():
        setattr(session, key, value)
    
    # If the session has ended, update the user's total points
    if is_ending and session.points_earned and session.points_earned > 0:
        user = db.query(models.User).filter(models.User.id == current_user.id).first()
        if user:
            user.total_points = (user.total_points or 0) + session.points_earned
            db.add(user)

    db.commit()
    db.refresh(session)
    return session

@router.post("/records", response_model=schemas.StudyRecordResponse)
def create_study_record(
    record: schemas.StudyRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Update daily streak
    update_daily_streak(db, current_user)

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
    
    # Update the card's next review date, SR data, and state
    card.next_review = next_review

    card.current_streak = new_repetition
    card.total_reviews = card.total_reviews + 1 if card.total_reviews else 1
    
    # Update the card state based on next review and interval
    now = datetime.now(timezone.utc)
    card.card_state = determine_card_state(next_review, new_interval, now)
    
    # Update success rate based on response quality
    is_successful = record.response_quality in ["good", "perfect"]
    print(f"Response: {record.response_quality}, Now: {now}, Next review: {next_review}")

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

@router.get("/due/{deck_id}", response_model=schemas.DueCardsResponse)
def get_due_cards_count(
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

    now = datetime.now(timezone.utc)
    
    # Count cards by state and due status
    new_count = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id,
        models.Card.card_state == CardState.NEW
    ).scalar() or 0
    
    learning_due_count = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id,
        models.Card.card_state == CardState.LEARNING,
        models.Card.next_review <= now
    ).scalar() or 0
    
    review_due_count = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id,
        models.Card.card_state == CardState.REVIEW,
        models.Card.next_review <= now
    ).scalar() or 0
    
    learning_count = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id,
        models.Card.card_state == CardState.LEARNING
    ).scalar() or 0
    
    review_count = db.query(func.count(models.Card.id)).filter(
        models.Card.deck_id == deck_id,
        models.Card.card_state == CardState.REVIEW
    ).scalar() or 0
    
    return schemas.DueCardsResponse(
        due_now=learning_due_count + review_due_count,
        new_cards=new_count,
        learning_cards=learning_count,
        review_cards=review_count
    )

@router.get("/preview-intervals/{card_id}", response_model=dict)
def get_interval_previews(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Preview the next review intervals for a card based on all possible responses.
    """
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Verify deck access
    deck = db.query(models.Deck).filter(models.Deck.id == card.deck_id).first()
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")

    # Get latest study record for SR parameters
    latest_record = db.query(models.StudyRecord).filter(
        models.StudyRecord.card_id == card_id
    ).order_by(models.StudyRecord.studied_at.desc()).first()

    current_ease = latest_record.ease_factor if latest_record else 2.5
    current_interval = latest_record.interval if latest_record else 0
    repetition_number = latest_record.repetition_number if latest_record else 0

    now = datetime.now(timezone.utc)
    previews = {}
    
    # The frontend will be updated to use "easy"
    for quality in ["again", "hard", "good", "perfect"]:
        next_review, _, _, _ = models.StudyRecord.calculate_next_review(
            quality,
            current_ease,
            current_interval,
            repetition_number
        )
        time_delta = next_review - now
        previews[quality] = format_timedelta_human_readable(time_delta)
    

    return previews

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

@router.get("/progress/{deck_id}", response_model=schemas.SpacedRepetitionProgress)
def get_spaced_repetition_progress(
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
    
    # Count cards by state
    states = {
        "new": 0,
        "learning": 0,
        "review": 0
    }
    
    # Calculate average ease factor
    total_ease = 0
    cards_with_ease = 0
    
    for card in cards:
        # Count by state
        if card.card_state == CardState.NEW:
            states["new"] += 1
        elif card.card_state == CardState.LEARNING:
            states["learning"] += 1
        elif card.card_state == CardState.REVIEW:
            states["review"] += 1
            
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
        state_distribution=states,
        average_ease_factor=avg_ease
    )

@router.get("/next/{deck_id}", response_model=schemas.NextCardResponse)
def get_next_card(
    deck_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # ✅ Step 1: Verify deck access
    deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this deck")

    now = datetime.now(timezone.utc)

    # ✅ Priority 1: Get due LEARNING cards
    next_card = db.query(models.Card).filter(
        models.Card.deck_id == deck_id,
        models.Card.card_state == CardState.LEARNING,
        models.Card.next_review <= now
    ).order_by(models.Card.next_review).first()

    # ✅ Priority 2: Get due REVIEW cards
    if not next_card:
        next_card = db.query(models.Card).filter(
            models.Card.deck_id == deck_id,
            models.Card.card_state == CardState.REVIEW,
            models.Card.next_review <= now
        ).order_by(models.Card.next_review).first()

    # ✅ Priority 3: Get NEW cards
    if not next_card:
        next_card = db.query(models.Card).filter(
            models.Card.deck_id == deck_id,
            models.Card.card_state == CardState.NEW
        ).order_by(models.Card.created_at).first()

    # ✅ No card found
    if not next_card:
        raise HTTPException(status_code=404, detail="No cards due for review or new cards available")

    is_due = False
    if next_card.next_review is not None:
        # Ensure next_review has timezone info before comparison
        next_review = next_card.next_review
        if next_review.tzinfo is None:
            next_review = next_review.replace(tzinfo=timezone.utc)
        is_due = next_review <= now
        
    # ✅ Return the next card
    return schemas.NextCardResponse(
        card_id=next_card.id,
        due_date=next_card.next_review,
        current_streak=next_card.current_streak,
        total_reviews=next_card.total_reviews,
        card_state=next_card.card_state,
        is_due=is_due
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
        now = datetime.now(timezone.utc)
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

@router.post("/update-card-states", response_model=schemas.StatusResponse)
def update_all_card_states(
    deck_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    now = datetime.now(timezone.utc)
    
    # Filter by deck_id if provided
    query = db.query(models.Card)
    if deck_id:
        deck = db.query(models.Deck).filter(models.Deck.id == deck_id).first()
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        if not deck.is_public and deck.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this deck")
        query = query.filter(models.Card.deck_id == deck_id)
    
    cards = query.all()
    updated_count = 0
    
    for card in cards:
        # Get the latest study record for this card
        latest_record = db.query(models.StudyRecord).filter(
            models.StudyRecord.card_id == card.id
        ).order_by(models.StudyRecord.studied_at.desc()).first()
        
        # Get the interval from the record or use default
        interval = latest_record.interval if latest_record else None
        
        # Calculate the correct state
        new_state = determine_card_state(card.next_review, interval, now)
        
        # Only update if the state has changed
        if card.card_state != new_state:
            card.card_state = new_state
            updated_count += 1
    
    db.commit()
    return schemas.StatusResponse(
        success=True,
        message=f"Updated {updated_count} card states"
    )