from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from database import Base


class CardInteraction(Base):
    __tablename__ = "card_interactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    interaction_type = Column(String, nullable=False)  # chat|search
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    card = relationship("Card", back_populates="interactions")
    user = relationship("User", back_populates="card_interactions")


class LLMResponse(Base):
    __tablename__ = "llm_responses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), nullable=False)
    response_type = Column(String, nullable=False)  # mnemonic|explanation|example
    content = Column(String, nullable=False)
    is_pinned = Column(Boolean, default=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    card = relationship("Card", back_populates="llm_responses")