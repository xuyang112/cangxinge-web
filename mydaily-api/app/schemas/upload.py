from typing import Literal

from pydantic import BaseModel, Field


class PresignRequest(BaseModel):
    filename: str | None = Field(default=None, max_length=255)
    content_type: str | None = Field(default=None, max_length=100)


class PresignResponse(BaseModel):
    mode: Literal["r2", "local"]
    key: str
    upload_url: str | None
    public_url: str
    expires_in: int | None = None
