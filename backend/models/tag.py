from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from database import Base


class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    
    # Relationships
    card_tags = relationship("CardTag", back_populates="tag")


class CardTag(Base):
    __tablename__ = "card_tags"
    
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True)
    
    # Relationships
    card = relationship("Card", back_populates="tags")
    tag = relationship("Tag", back_populates="card_tags")