import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _password_bytes_ok(value: str) -> str:
    """bcrypt 最多处理 72 字节，超长直接报校验错误。"""
    if len(value.encode("utf-8")) > 72:
        raise ValueError("password too long (max 72 bytes)")
    return value


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    display_name: str
    plan: str
    subscription_status: str
    created_at: datetime


class UserUpdate(BaseModel):
    """改昵称 / 改密码。改密码时必须携带 current_password。"""

    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    current_password: str | None = Field(default=None, max_length=72)
    new_password: str | None = Field(default=None, min_length=8, max_length=72)

    _new_password_bytes = field_validator("new_password")(_password_bytes_ok)
