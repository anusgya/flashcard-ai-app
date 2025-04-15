from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func
from datetime import UTC, datetime

import models
import schemas
from database import get_db
from enums import TimeRange
from auth import get_current_active_user
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(
    prefix="/api/quiz",
    tags=["quiz"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/sessions", response_model=schemas.QuizSessionResponse)
def create_quiz_session(
    session: schemas.QuizSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify deck exists and user has access
    try:
        deck = db.query(models.Deck).filter(models.Deck.id == session.deck_id).first()
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        if not deck.is_public and deck.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this deck")

        db_session = models.QuizSession(
            deck_id=session.deck_id,
            user_id=current_user.id
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
    except Exception as e:
        print(e)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return db_session

# Add this helper function before your routes
def parse_time_range(time_range: str) -> timedelta:
    if not time_range or len(time_range) < 2:
        return None
    
    amount = int(time_range[:-1])
    unit = time_range[-1].lower()
    
    if unit == 'd':  # days
        return timedelta(days=amount)
    elif unit == 'w':  # weeks
        return timedelta(weeks=amount)
    elif unit == 'm':  # months (approximate)
        return timedelta(days=amount * 30)
    elif unit == 'y':  # years (approximate)
        return timedelta(days=amount * 365)
    return None

@router.get("/sessions/{session_id}", response_model=schemas.QuizSessionResponse)
def get_quiz_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    session = db.query(models.QuizSession).filter(models.QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    return session

@router.put("/sessions/{session_id}", response_model=schemas.QuizSessionResponse)
def update_quiz_session(
    session_id: str,
    session_update: schemas.QuizSessionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    session = db.query(models.QuizSession).filter(models.QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this session")
    
    for key, value in session_update.dict().items():
        setattr(session, key, value)
    
    db.commit()
    db.refresh(session)
    return session

@router.post("/questions", response_model=schemas.QuizQuestionResponse)
def create_quiz_question(
    question: schemas.QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify card exists and user has access
    card = db.query(models.Card).filter(models.Card.id == question.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    deck = db.query(models.Deck).filter(models.Deck.id == card.deck_id).first()
    if not deck.is_public and deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this card")

    db_question = models.QuizQuestion(**question.dict())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

@router.post("/answers", response_model=schemas.QuizAnswerResponse)
def submit_quiz_answer(
    answer: schemas.QuizAnswerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify session exists and belongs to user
    session = db.query(models.QuizSession).filter(models.QuizSession.id == answer.session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Invalid quiz session")

    # Get question to verify answer
    question = db.query(models.QuizQuestion).filter(models.QuizQuestion.id == answer.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Calculate points based on time taken and difficulty
    points = calculate_points(answer.time_taken, question.difficulty)
    is_correct = answer.user_answer.lower() == question.correct_answer.lower()

    db_answer = models.QuizAnswer(
        **answer.dict(),
        is_correct=is_correct,
        points_earned=points if is_correct else 0
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer

@router.get("/stats/{deck_id}", response_model=schemas.QuizSessionStats)
def get_quiz_stats(
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
    sessions = db.query(models.QuizSession).filter(
        models.QuizSession.deck_id == deck_id,
        models.QuizSession.user_id == current_user.id
    ).all()

    if not sessions:
        return schemas.QuizSessionStats(
            total_sessions=0,
            average_accuracy=0.0,
            total_points=0,
            best_score=0,
            average_time=0.0,
            completion_rate=0.0
        )

    total_sessions = len(sessions)
    total_points = sum(session.points_earned for session in sessions)
    best_score = max(session.points_earned for session in sessions)
    average_accuracy = sum(session.accuracy for session in sessions) / total_sessions
    average_time = sum(session.time_taken for session in sessions) / total_sessions
    completed_sessions = len([s for s in sessions if s.end_time is not None])
    completion_rate = completed_sessions / total_sessions

    return schemas.QuizSessionStats(
        total_sessions=total_sessions,
        average_accuracy=average_accuracy,
        total_points=total_points,
        best_score=best_score,
        average_time=average_time,
        completion_rate=completion_rate
    )

def calculate_points(time_taken: int, difficulty: str) -> int:
    base_points = {
        "easy": 10,
        "medium": 20,
        "hard": 30
    }
    time_bonus = max(0, 30 - time_taken) // 5  # Bonus points for quick answers
    return base_points[difficulty] + time_bonus

# Add this new endpoint after your existing endpoints
@router.get("/sessions", response_model=List[schemas.QuizSessionResponse])
def list_quiz_sessions(
    time_range: TimeRange,
    deck_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    try:
        # Start with base query for user's sessions
        query = db.query(models.QuizSession).filter(
            models.QuizSession.user_id == current_user.id
        )
        
        # Apply time range filter
        now = datetime.now(tz=UTC)
        if time_range == TimeRange.TODAY:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(models.QuizSession.end_time >= start_date)
        elif time_range == TimeRange.WEEK:
            start_date = now - timedelta(days=7)
            query = query.filter(models.QuizSession.end_time >= start_date)
        elif time_range == TimeRange.MONTH:
            start_date = now - timedelta(days=30)
            query = query.filter(models.QuizSession.end_time >= start_date)
        
        # Apply deck filter if provided
        if deck_id:
            query = query.filter(models.QuizSession.deck_id == deck_id)
        
        # Order by creation date, newest first
        query = query.order_by(models.QuizSession.end_time.desc())
        
        return query.all()
    except Exception as e:
        print(e)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return query.all()
