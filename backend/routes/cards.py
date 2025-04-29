from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os
from datetime import datetime

from database import get_db
import schemas
from models import Card, CardMedia, CardTag, Deck
from auth import get_current_active_user

router = APIRouter(
    prefix="/api/cards",
    tags=["cards"],
    responses={404: {"description": "Not found"}}
)

# Get all cards (with optional filtering)
@router.get("", response_model=List[schemas.CardResponse])
async def get_cards(
    deck_id: Optional[UUID] = None,
    tag_id: Optional[UUID] = None,
    difficulty: Optional[schemas.DifficultyLevel] = None,
    state: Optional[schemas.CardState] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = db.query(Card).join(Deck).filter(Deck.user_id == current_user.id)
    
    if deck_id:
        query = query.filter(Card.deck_id == deck_id)
    
    if tag_id:
        query = query.join(CardTag).filter(CardTag.tag_id == tag_id)
        
    if difficulty:
        query = query.filter(Card.difficulty_level == difficulty)
        
    if state:
        query = query.filter(Card.card_state == state)
    
    cards = query.offset(skip).limit(limit).all()
    return cards

# Get a specific card by ID
@router.get("/{card_id}", response_model=schemas.CardResponse)
async def get_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found"
        )
    
    return card

# Create a new card
@router.post("/", response_model=schemas.CardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
    card_data: schemas.CardCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify deck belongs to user
    deck = db.query(Deck).filter(
        Deck.id == card_data.deck_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found or you don't have access to it"
        )
    
    new_card = Card(
        deck_id=card_data.deck_id,
        front_content=card_data.front_content,
        back_content=card_data.back_content,
        source=card_data.source,
        difficulty_level=schemas.DifficultyLevel.NEW,
        card_state=schemas.CardState.NEW
    )
    
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    
    # Add tags if provided
    if card_data.tags:
        for tag_id in card_data.tags:
            tag_association = CardTag(card_id=new_card.id, tag_id=tag_id)
            db.add(tag_association)
        db.commit()
    
    return new_card

# Update a card
@router.put("/{card_id}", response_model=schemas.CardResponse)
async def update_card(
    card_id: UUID,
    card_data: schemas.CardUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Find card and verify ownership
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or you don't have access to it"
        )
    
    # If changing deck, verify new deck belongs to user
    if card_data.deck_id and card_data.deck_id != card.deck_id:
        new_deck = db.query(Deck).filter(
            Deck.id == card_data.deck_id,
            Deck.user_id == current_user.id
        ).first()
        
        if not new_deck:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="New deck not found or you don't have access to it"
            )
    
    # Update fields
    update_data = card_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(card, key, value)
    
    card.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(card)
    
    return card

# Delete a card
@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Find card and verify ownership
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or you don't have access to it"
        )
    
    db.delete(card)
    db.commit()
    
    return None

# Add media to a card
@router.post("/{card_id}/media", response_model=schemas.CardMediaResponse)
async def add_card_media(
    card_id: UUID,
    media_file: UploadFile = File(...),
    side: schemas.MediaSide = Form(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Find card and verify ownership
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or you don't have access to it"
        )
    
    # Determine media type from content type
    media_type = schemas.MediaType.IMAGE
    if "audio" in media_file.content_type:
        media_type = schemas.MediaType.AUDIO
    
    # Save file - in production, use cloud storage
    upload_dir = os.path.join("media", str(current_user.id), str(card.deck_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = os.path.splitext(media_file.filename)[1]
    filename = f"{card_id}_{datetime.utcnow().timestamp()}{file_ext}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save the file
    content = await media_file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create media record
    new_media = CardMedia(
        card_id=card_id,
        media_type=media_type.value,
        file_path=file_path,
        original_filename=media_file.filename,
        mime_type=media_file.content_type,
        file_size=len(content),
        side=side.value
    )
    
    db.add(new_media)
    db.commit()
    db.refresh(new_media)
    
    return new_media

# Delete media from a card
@router.delete("/{card_id}/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card_media(
    card_id: UUID,
    media_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Find media and verify ownership
    media = db.query(CardMedia).join(Card).join(Deck).filter(
        CardMedia.id == media_id,
        CardMedia.card_id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found or you don't have access to it"
        )
    
    # Delete the file
    try:
        if os.path.exists(media.file_path):
            os.remove(media.file_path)
    except Exception:
        # Log error but continue with database removal
        pass
    
    db.delete(media)
    db.commit()
    
    return None