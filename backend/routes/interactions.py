from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from database import get_db
from models import Card, Deck, CardInteraction, LLMResponse
from schemas.interaction import (
    CardInteractionBase, CardInteractionCreate, CardInteractionResponse,
    LLMResponseBase, LLMResponseCreate, LLMResponseResponse, LLMResponseUpdate,
    MnemonicRequest, ExplanationRequest, ExampleRequest, ResponseType
)
from auth import get_current_active_user
from utils.gemini_utils import generate_mnemonic, generate_explanation, generate_examples, chat_about_card

router = APIRouter(
    prefix="/api/interactions",
    tags=["interactions"],
    dependencies=[Depends(get_current_active_user)]
)



# Generate a mnemonic for a card
@router.post("/cards/{card_id}/mnemonics", response_model=LLMResponseResponse)
async def generate_card_mnemonic(
    card_id: UUID,
    request: MnemonicRequest,
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
    
    # Use Gemini to generate the mnemonic
    try:
        mnemonic_content = generate_mnemonic(
            card.front_content, 
            card.back_content, 
            request.technique
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate mnemonic: {str(e)}"
        )
    
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
@router.post("/cards/{card_id}/eli5", response_model=LLMResponseResponse)
async def generate_card_explanation(
    card_id: UUID,
    request: ExplanationRequest,
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
    
    # Use Gemini to generate the explanation
    try:
        explanation = generate_explanation(
            card.front_content, 
            card.back_content, 
            request.detail_level
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate explanation: {str(e)}"
        )
    
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
@router.post("/cards/{card_id}/examples", response_model=LLMResponseResponse)
async def generate_card_examples(
    card_id: UUID,
    request: ExampleRequest,
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
    
    # Use Gemini to generate examples
    try:
        examples = generate_examples(
            card.front_content, 
            card.back_content, 
            request.count
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate examples: {str(e)}"
        )
    
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
@router.get("/cards/{card_id}/llm-responses", response_model=List[LLMResponseResponse])
async def get_llm_responses(
    card_id: UUID,
    response_type: Optional[ResponseType] = None,
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
@router.patch("/llm-responses/{response_id}", response_model=LLMResponseResponse)
async def update_llm_response(
    response_id: UUID,
    update: LLMResponseUpdate,
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