from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

import models
import schemas
from database import get_db
from auth import get_current_active_user, get_password_hash

router = APIRouter(
    prefix="/api/users",
    tags=["users"]
)

@router.post("", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        avatar=user.avatar  # Include the avatar field
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=schemas.UserResponse)
def read_user_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_user_me(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Check if new username or email conflicts with existing ones
    if user_update.username:
        existing_user = db.query(models.User).filter(
            models.User.username == user_update.username,
            models.User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    if user_update.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    # The avatar will be automatically included if it's in the update_data dictionary
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/stats", response_model=schemas.UserStats)
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Get deck and card counts
    total_decks = db.query(func.count(models.Deck.id)).filter(
        models.Deck.user_id == current_user.id
    ).scalar() or 0
    
    total_cards = db.query(func.count(models.Card.id)).join(models.Deck).filter(
        models.Deck.user_id == current_user.id
    ).scalar() or 0
    
    # Get study session stats
    study_sessions = db.query(models.StudySession).filter(
        models.StudySession.user_id == current_user.id
    ).all()
    
    quiz_sessions = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == current_user.id
    ).all()
    
    # Calculate average accuracy
    study_accuracy = sum(s.accuracy for s in study_sessions) if study_sessions else 0
    quiz_accuracy = sum(s.accuracy for s in quiz_sessions) if quiz_sessions else 0
    total_sessions = len(study_sessions) + len(quiz_sessions)
    average_accuracy = (study_accuracy + quiz_accuracy) / total_sessions if total_sessions > 0 else 0
    
    # Get user rank
    rank = db.query(func.count(models.User.id)).filter(
        models.User.total_points > current_user.total_points
    ).scalar() + 1
    
    return schemas.UserStats(
        total_decks=total_decks,
        total_cards=total_cards,
        study_sessions=len(study_sessions),
        quiz_sessions=len(quiz_sessions),
        average_accuracy=average_accuracy,
        total_points=current_user.total_points,
        rank=rank
    )

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db.delete(current_user)
    db.commit()