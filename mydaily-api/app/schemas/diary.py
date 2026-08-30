import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DiaryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(default="")
    mood: str | None = Field(default=None, max_length=50)


class DiaryUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    mood: str | None = Field(default=None, max_length=50)


class DiaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: str
    mood: str | None
    created_at: datetime
    updated_at: datetime
