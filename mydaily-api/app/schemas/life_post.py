import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LifePostCreate(BaseModel):
    text: str = Field(min_length=1)
    images: list[str] = Field(default_factory=list)


class LifePostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    text: str
    images: list[str]
    created_at: datetime
