from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class TimestampModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime
    updated_at: datetime

class BaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)