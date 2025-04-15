from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from database import get_db
import schemas
from models import Card, CardInteraction, LLMResponse, Deck
from auth import get_current_active_user

router = APIRouter(
    prefix="/api/interactions",
    tags=["interactions"],
    responses={404: {"description": "Not found"}}
)

# Record a card interaction (chat or search)
@router.post("/cards/{card_id}/interactions", response_model=schemas.CardInteractionResponse, status_code=status.HTTP_201_CREATED)
async def create_card_interaction(
    card_id: UUID,
    interaction: schemas.CardInteractionBase,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify card exists and user has access
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or you don't have access to it"
        )
    
    # Create interaction record
    new_interaction = CardInteraction(
        card_id=card_id,
        user_id=current_user.id,
        interaction_type=interaction.interaction_type,
        content=interaction.content
    )
    
    db.add(new_interaction)
    db.commit()
    db.refresh(new_interaction)
    
    return new_interaction

# Get interactions for a card
@router.get("/cards/{card_id}/interactions", response_model=List[schemas.CardInteractionResponse])
async def get_card_interactions(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify card exists and user has access
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or you don't have access to it"
        )
    
    # Get interactions
    interactions = db.query(CardInteraction).filter(
        CardInteraction.card_id == card_id,
        CardInteraction.user_id == current_user.id
    ).order_by(CardInteraction.created_at.desc()).all()
    
    return interactions

# Generate a mnemonic for a card
@router.post("/cards/{card_id}/mnemonics", response_model=schemas.LLMResponseResponse)
async def generate_mnemonic(
    card_id: UUID,
    request: schemas.MnemonicRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify card exists and user has access
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or you don't have access to it"
        )
    
    # In a real implementation, you would call an LLM API here
    # This is a simplified example
    
    technique = request.technique or "default"
    front_content = card.front_content
    back_content = card.back_content
    
    # Simulated LLM response (in a real app, you'd call an actual LLM service)
    mnemonic_content = f"Here's a mnemonic to help you remember that {front_content} is {back_content}: "
    
    if technique == "acronym":
        mnemonic_content += f"Create an acronym from the first letters of key words in '{back_content}'."
    elif technique == "visualization":
        mnemonic_content += f"Visualize a vivid scene connecting '{front_content}' with '{back_content}'."
    elif technique == "rhyme":
        mnemonic_content += f"Create a rhyme connecting '{front_content}' with '{back_content}'."
    else:
        mnemonic_content += f"Associate '{front_content}' with '{back_content}' by creating a memorable connection."
    
    # Store the mnemonic
    new_mnemonic = LLMResponse(
        card_id=card_id,
        response_type="mnemonic",
        content=mnemonic_content,
        is_pinned=False
    )
    
    db.add(new_mnemonic)
    db.commit()
    db.refresh(new_mnemonic)
    
    return new_mnemonic

# Generate an explanation for a card
@router.post("/cards/{card_id}/explanations", response_model=schemas.LLMResponseResponse)
async def generate_explanation(
    card_id: UUID,
    request: schemas.ExplanationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify card exists and user has access
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or you don't have access to it"
        )
    
    # In a real implementation, you would call an LLM API here
    # This is a simplified example
    
    detail_level = request.detail_level
    front_content = card.front_content
    back_content = card.back_content
    
    # Simulated LLM response based on detail level
    if detail_level == "basic":
        explanation = f"Basic explanation of why {front_content} is {back_content}."
    elif detail_level == "detailed":
        explanation = f"Detailed explanation of why {front_content} is {back_content}, including historical context, related concepts, and practical applications."
    else:  # medium
        explanation = f"Medium-level explanation of why {front_content} is {back_content}, with some helpful context and related ideas."
    
    # Store the explanation
    new_explanation = LLMResponse(
        card_id=card_id,
        response_type="explanation",
        content=explanation,
        is_pinned=False
    )
    
    db.add(new_explanation)
    db.commit()
    db.refresh(new_explanation)
    
    return new_explanation

# Generate examples for a card
@router.post("/cards/{card_id}/examples", response_model=schemas.LLMResponseResponse)
async def generate_examples(
    card_id: UUID,
    request: schemas.ExampleRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify card exists and user has access
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or you don't have access to it"
        )
    
    # In a real implementation, you would call an LLM API here
    # This is a simplified example
    
    count = request.count
    front_content = card.front_content
    back_content = card.back_content
    
    # Simulated LLM response
    examples = f"Here are {count} examples related to {front_content}:\n\n"
    
    for i in range(1, count + 1):
        examples += f"{i}. Example {i} demonstrating how {front_content} relates to {back_content}.\n"
    
    # Store the examples
    new_examples = LLMResponse(
        card_id=card_id,
        response_type="example",
        content=examples,
        is_pinned=False
    )
    
    db.add(new_examples)
    db.commit()
    db.refresh(new_examples)
    
    return new_examples

# Get all LLM responses for a card
@router.get("/cards/{card_id}/llm-responses", response_model=List[schemas.LLMResponseResponse])
async def get_llm_responses(
    card_id: UUID,
    response_type: Optional[schemas.ResponseType] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify card exists and user has access
    card = db.query(Card).join(Deck).filter(
        Card.id == card_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or you don't have access to it"
        )
    
    # Build query
    query = db.query(LLMResponse).filter(LLMResponse.card_id == card_id)
    
    if response_type:
        query = query.filter(LLMResponse.response_type == response_type)
    
    # Order by pinned first, then by date
    responses = query.order_by(LLMResponse.is_pinned.desc(), LLMResponse.generated_at.desc()).all()
    
    return responses

# Pin/unpin an LLM response
@router.patch("/llm-responses/{response_id}", response_model=schemas.LLMResponseResponse)
async def update_llm_response(
    response_id: UUID,
    update: schemas.LLMResponseUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify response exists and user has access
    response = db.query(LLMResponse).join(Card).join(Deck).filter(
        LLMResponse.id == response_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found or you don't have access to it"
        )
    
    # Update pinned status
    response.is_pinned = update.is_pinned
    db.commit()
    db.refresh(response)
    
    return response

# Delete an LLM response
@router.delete("/llm-responses/{response_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_llm_response(
    response_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify response exists and user has access
    response = db.query(LLMResponse).join(Card).join(Deck).filter(
        LLMResponse.id == response_id,
        Deck.user_id == current_user.id
    ).first()
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found or you don't have access to it"
        )
    
    # Delete the response
    db.delete(response)
    db.commit()
    
    return None