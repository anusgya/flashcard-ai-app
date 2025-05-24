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
    # Query public decks with card count
    query = db.query(
        Deck, 
        func.count(Card.id).label("card_count"),
        User.username.label("username")
    ).outerjoin(
        Card
    ).join(
        User
    ).filter(
        Deck.is_public == True
    ).group_by(
        Deck.id, User.username
    ).offset(skip).limit(limit)
    
    results = query.all()
    
    # Format response with card count
    response = []
    for deck, card_count, username in results:
        deck_dict = schemas.DeckResponse.from_orm(deck).dict()
        deck_dict["card_count"] = card_count
        deck_dict["creator_username"] = username
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
    deck_dict["card_count"] = card_count
    
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
        
        # Use DictReader to read columns by name
        csv_file = io.StringIO(csv_content)
        csv_reader = csv.DictReader(csv_file)
        
        # Get headers
        headers = csv_reader.fieldnames if csv_reader.fieldnames else []
        
        if not headers:
            raise ValueError("CSV file has no headers")
        
        # Define possible column names for front and back content
        front_column_patterns = [
            'front', 'front_content', 'frontcontent', 'frontContent', 
            'question', 'prompt', 'term', 'front_side', 'frontside', 'frontSide'
        ]
        
        back_column_patterns = [
            'back', 'back_content', 'backcontent', 'backContent', 
            'answer', 'definition', 'explanation', 'back_side', 'backside', 'backSide'
        ]
        
        # Find the matching column names (case-insensitive)
        front_column = None
        back_column = None
        
        for header in headers:
            header_lower = header.lower()
            
            # Check for front content column
            if not front_column:
                for pattern in front_column_patterns:
                    if pattern == header_lower or pattern.replace('_', '') == header_lower.replace('_', ''):
                        front_column = header
                        break
            
            # Check for back content column
            if not back_column:
                for pattern in back_column_patterns:
                    if pattern == header_lower or pattern.replace('_', '') == header_lower.replace('_', ''):
                        back_column = header
                        break
        
        # If we couldn't find the columns, try using the first two columns
        if not front_column and not back_column and len(headers) >= 2:
            front_column = headers[0]
            back_column = headers[1]
        
        if not front_column or not back_column:
            raise ValueError(
                "Could not identify front and back content columns. "
                "Please use headers like 'front_content' and 'back_content', or 'question' and 'answer'."
            )
        
        # Process rows with identified columns
        cards_added = 0
        for row in csv_reader:
            front_content = row.get(front_column, '').strip()
            back_content = row.get(back_column, '').strip()
            
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
        
        if cards_added == 0:
            raise ValueError("No valid cards found in the CSV file")
        
        db.commit()
        db.refresh(deck)
        
        # Get updated card count
        card_count = db.query(func.count(Card.id)).filter(Card.deck_id == deck_id).scalar()
        
        # Format response
        deck_dict = schemas.DeckResponse.from_orm(deck).dict()
        deck_dict["card_count"] = card_count
        deck_dict["import_details"] = {
            "cards_added": cards_added,
            "front_column": front_column,
            "back_column": back_column
        }
        
        return schemas.DeckResponse(**deck_dict)
        
    except Exception as e:
        # Rollback in case of error
        db.rollback()
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

@router.post("/{deck_id}/import/text", response_model=schemas.DeckResponse)
async def import_cards_from_text(
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
    deck.source_type = schemas.SourceType.TEXT
    deck.updated_at = datetime.utcnow()
    
    # Read and process text file
    try:
        content = await file.read()
        text_content = content.decode('utf-8')
        
        # Split content into lines
        lines = text_content.split('\n')
        
        # Process file configuration
        separator = '\t'  # Default separator
        html_enabled = False
        tags_column = None
        
        # Look for configuration lines at the beginning of the file
        config_lines = []
        data_lines = []
        
        for line in lines:
            if line.strip() == '':
                continue
                
            if line.startswith('#'):
                config_lines.append(line)
            else:
                data_lines.append(line)
        
        # Process configuration
        for config in config_lines:
            if config.startswith('#separator:'):
                sep_value = config[len('#separator:'):].strip()
                if sep_value == 'tab':
                    separator = '\t'
                elif sep_value == 'comma':
                    separator = ','
                elif sep_value == 'semicolon':
                    separator = ';'
                elif len(sep_value) == 1:
                    separator = sep_value
            elif config.startswith('#html:'):
                html_value = config[len('#html:'):].strip().lower()
                html_enabled = (html_value == 'true')
            elif config.startswith('#tags column:'):
                try:
                    tags_column = int(config[len('#tags column:'):].strip()) - 1
                except ValueError:
                    pass
        
        # Process data lines
        cards_added = 0
        
        for line in data_lines:
            if not line.strip():
                continue
                
            # Split by separator
            fields = line.split(separator)
            
            if len(fields) < 2:
                continue  # Skip if not enough fields for front and back
            
            front_content = fields[0].strip()
            back_content = fields[1].strip()
            
            # Process tags if specified
            tags = None
            if tags_column is not None and tags_column < len(fields):
                tags = fields[tags_column].strip()
            
            # If HTML is disabled, escape HTML content
            if not html_enabled:
                # Simple HTML escaping (replace with more robust solution if needed)
                front_content = front_content.replace('<', '&lt;').replace('>', '&gt;')
                back_content = back_content.replace('<', '&lt;').replace('>', '&gt;')
            
            # Add card if we have content
            if front_content and back_content:
                new_card = Card(
                    deck_id=deck_id,
                    front_content=front_content,
                    back_content=back_content,
                    source="text_import",
                    difficulty_level="new",
                    card_state="new",
                    tags=tags
                )
                db.add(new_card)
                cards_added += 1
        
        if cards_added == 0:
            raise ValueError("No valid cards found in the text file")
        
        db.commit()
        db.refresh(deck)
        
        # Get updated card count
        card_count = db.query(func.count(Card.id)).filter(Card.deck_id == deck_id).scalar()
        
        # Format response
        deck_dict = schemas.DeckResponse.from_orm(deck).dict()
        deck_dict["card_count"] = card_count
        deck_dict["import_details"] = {
            "cards_added": cards_added,
            "format": "text",
            "html_enabled": html_enabled
        }
        
        return schemas.DeckResponse(**deck_dict)
        
    except Exception as e:
        # Rollback in case of error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing text file: {str(e)}"
        )