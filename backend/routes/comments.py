from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID

from database import get_db
import schemas
from models import Deck, User, Comment
from auth import get_current_active_user

router = APIRouter(
    prefix="/api",
    tags=["comments"],
    responses={404: {"description": "Not found"}}
)

@router.get("/decks/{deck_id}/comments", response_model=List[schemas.CommentResponse])
def get_comments_for_deck(
    deck_id: UUID, 
    db: Session = Depends(get_db)
):
    """
    Get all top-level comments for a specific public deck, with nested replies.
    """
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.is_public == True).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public deck not found")

    comments = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).filter(
        Comment.deck_id == deck_id,
        Comment.parent_comment_id == None  # Fetch only top-level comments
    ).order_by(Comment.created_at.desc()).all()
    
    return comments

@router.post("/decks/{deck_id}/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    deck_id: UUID,
    comment_data: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new comment or a reply on a public deck.
    """
    deck = db.query(Deck).filter(Deck.id == deck_id, Deck.is_public == True).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Comments can only be added to public decks")

    if comment_data.parent_comment_id:
        parent_comment = db.query(Comment).filter(Comment.id == comment_data.parent_comment_id).first()
        if not parent_comment or parent_comment.deck_id != deck_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent comment not found in this deck")

    new_comment = Comment(
        content=comment_data.content,
        deck_id=deck_id,
        user_id=current_user.id,
        parent_comment_id=comment_data.parent_comment_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return new_comment

@router.put("/comments/{comment_id}", response_model=schemas.CommentResponse)
def update_comment(
    comment_id: UUID,
    comment_data: schemas.CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a comment. Only the author of the comment can update it.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this comment")

    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)
    
    return comment

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a comment. Only the author of the comment can delete it.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    
    return None 