import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

StudyItemType = Literal["书", "课程", "文章", "视频"]


class StudyItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    type: StudyItemType
    note: str | None = None
    progress: float = Field(default=0.0, ge=0, le=100)


class StudyItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    type: StudyItemType | None = None
    note: str | None = None
    progress: float | None = Field(default=None, ge=0, le=100)


class StudyItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    type: str
    note: str | None
    progress: float
    created_at: datetime
