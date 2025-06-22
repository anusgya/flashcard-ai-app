from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
import csv
import io
from datetime import datetime

from database import get_db
import schemas
from models import Deck, Card, User
from models.card import CardState  # Add this import
from auth import get_current_active_user

router = APIRouter(
    prefix="/api/decks",
    tags=["decks"],
    responses={404: {"description": "Not found"}}
)

# Get all decks for the current user
@router.get("", response_model=List[schemas.DeckResponse])
async def get_decks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Query decks with card count
    query = db.query(
        Deck, 
        func.count(Card.id).label("card_count")
    ).outerjoin(
        Card
    ).filter(
        Deck.user_id == current_user.id
    ).group_by(
        Deck.id
    ).offset(skip).limit(limit)
    
    results = query.all()
    
    # Format response with card count
    response = []
    for deck, card_count in results:
        deck_dict = schemas.DeckResponse.from_orm(deck).dict()
        
        # Use total_cards instead of card_count to match the schema
        deck_dict["total_cards"] = card_count
        
        # Get learning cards count
        from models.card import CardState  # Import at the top of the file instead
        learning_cards = db.query(func.count(Card.id)).filter(
            Card.deck_id == deck.id,
            Card.card_state == CardState.LEARNING
        ).scalar() or 0
        
        deck_dict["learning_cards"] = learning_cards
        
        response.append(schemas.DeckResponse(**deck_dict))
    
    return response

# Get public decks
@router.get("/public", response_model=List[schemas.DeckResponse])
async def get_public_decks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    # Query public decks with card count and user details
    query = db.query(
        Deck, 
        func.count(Card.id).label("card_count"),
        User.username.label("username"),
        User.avatar.label("avatar")
    ).outerjoin(
        Card
    ).join(
        User, Deck.user_id == User.id
    ).filter(
        Deck.is_public == True
    ).group_by(
        Deck.id, User.username, User.avatar
    ).offset(skip).limit(limit)
    
    results = query.all()
    
    # Format response with card count and creator details
    response = []
    for deck, card_count, username, avatar in results:
        deck_dict = schemas.DeckResponse.from_orm(deck).dict()
        deck_dict["total_cards"] = card_count
        deck_dict["creator_username"] = username
        deck_dict["creator_avatar"] = f"/media/avatars/{avatar}" if avatar else None
        response.append(schemas.DeckResponse(**deck_dict))
    
    return response

# Get a specific deck with cards
@router.get("/{deck_id}", response_model=schemas.DeckDetailResponse)
async def get_deck(
    deck_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Check if deck is public or belongs to user
    deck = db.query(Deck).filter(
        (Deck.id == deck_id) & 
        ((Deck.user_id == current_user.id) | (Deck.is_public == True))
    ).first()
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found or you don't have access to it"
        )
    
    # Get card count
    card_count = db.query(func.count(Card.id)).filter(Card.deck_id == deck_id).scalar()
    
    # Format response
    deck_dict = schemas.DeckDetailResponse.from_orm(deck).dict()
    deck_dict["total_cards"] = card_count
    
    return schemas.DeckDetailResponse(**deck_dict)

# Create a new deck
@router.post("/", response_model=schemas.DeckResponse, status_code=status.HTTP_201_CREATED)
async def create_deck(
    deck_data: schemas.DeckCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    new_deck = Deck(
        user_id=current_user.id,
        name=deck_data.name,
        description=deck_data.description,
        source_type=deck_data.source_type,
        is_public=deck_data.is_public
    )
    
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)
    
    return new_deck

# Update a deck
@router.put("/{deck_id}", response_model=schemas.DeckResponse)
async def update_deck(
    deck_id: UUID,
    deck_data: schemas.DeckUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    deck = db.query(Deck).filter(
        Deck.id == deck_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found or you don't have access to it"
        )
    
    # Update fields
    update_data = deck_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(deck, key, value)
    
    deck.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(deck)
    
    # Get card count
    card_count = db.query(func.count(Card.id)).filter(Card.deck_id == deck_id).scalar()
    
    # Format response
    deck_dict = schemas.DeckResponse.from_orm(deck).dict()
    deck_dict["card_count"] = card_count
    
    return schemas.DeckResponse(**deck_dict)

# Delete a deck
@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deck(
    deck_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    deck = db.query(Deck).filter(
        Deck.id == deck_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found or you don't have access to it"
        )
    
    try:
        db.delete(deck)
        db.commit()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error deleting deck: {str(e)}"
        )
    
    return None

# Import cards from CSV
@router.post("/{deck_id}/import/csv", response_model=schemas.DeckResponse)
async def import_cards_from_csv(
    deck_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify deck belongs to user
    deck = db.query(Deck).filter(
        Deck.id == deck_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found or you don't have access to it"
        )
    
    # Update deck source type
    deck.source_type = schemas.SourceType.CSV
    deck.updated_at = datetime.utcnow()
    
    # Read and process CSV
    try:
        content = await file.read()
        csv_content = content.decode('utf-8')
        csv_reader = csv.reader(io.StringIO(csv_content))
        
        # Skip header
        next(csv_reader, None)
        
        # Process rows (assuming front_content, back_content format)
        cards_added = 0
        for row in csv_reader:
            if len(row) >= 2:
                front_content = row[0].strip()
                back_content = row[1].strip()
                
                if front_content and back_content:
                    new_card = Card(
                        deck_id=deck_id,
                        front_content=front_content,
                        back_content=back_content,
                        source="csv_import",
                        difficulty_level="new",
                        card_state="new"
                    )
                    db.add(new_card)
                    cards_added += 1
        
        db.commit()
        db.refresh(deck)
        
        # Get updated card count
        card_count = db.query(func.count(Card.id)).filter(Card.deck_id == deck_id).scalar()
        
        # Format response
        deck_dict = schemas.DeckResponse.from_orm(deck).dict()
        deck_dict["card_count"] = card_count
        
        return schemas.DeckResponse(**deck_dict)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing CSV: {str(e)}"
        )

# Clone a public deck
@router.post("/{deck_id}/clone", response_model=schemas.DeckResponse, status_code=status.HTTP_201_CREATED)
async def clone_deck(
    deck_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Check if source deck exists and is public
    source_deck = db.query(Deck).filter(
        Deck.id == deck_id,
        Deck.is_public == True
    ).first()
    
    if not source_deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found or is not public"
        )
    
    # Create new deck
    new_deck = Deck(
        user_id=current_user.id,
        name=f"Clone of {source_deck.name}",
        description=source_deck.description,
        source_type=source_deck.source_type,
        is_public=False
    )
    
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)
    
    # Clone cards
    source_cards = db.query(Card).filter(Card.deck_id == deck_id).all()
    for card in source_cards:
        new_card = Card(
            deck_id=new_deck.id,
            front_content=card.front_content,
            back_content=card.back_content,
            source=f"cloned_from_{deck_id}",
            difficulty_level="new",
            card_state="new"
        )
        db.add(new_card)
    
    db.commit()
    
    # Get card count
    card_count = len(source_cards)
    
    # Format response
    deck_dict = schemas.DeckResponse.from_orm(new_deck).dict()
    deck_dict["card_count"] = card_count
    
    return schemas.DeckResponse(**deck_dict)