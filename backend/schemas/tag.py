from pydantic import BaseModel, UUID4, Field
from typing import Optional, List

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None

class TagCreate(TagBase):
    pass

class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None

class TagResponse(TagBase):
    id: UUID4

    class Config:
        orm_mode = True

class CardTagBase(BaseModel):
    card_id: UUID4
    tag_id: UUID4

class CardTagCreate(CardTagBase):
    pass

class CardTagResponse(CardTagBase):
    class Config:
        orm_mode = True

# Additional response models for nested relationships
class TagWithCards(TagResponse):
    cards_count: int = Field(default=0, ge=0)
    cards: List[UUID4] = []

class TagStats(BaseModel):
    total_tags: int
    most_used_tags: List[TagResponse]
    tags_by_category: dict