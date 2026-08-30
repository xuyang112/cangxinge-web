from pydantic import BaseModel, EmailStr, Field, field_validator


def _password_bytes_ok(value: str) -> str:
    """bcrypt 最多处理 72 字节，超长直接报校验错误。"""
    if len(value.encode("utf-8")) > 72:
        raise ValueError("password too long (max 72 bytes)")
    return value


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    display_name: str = Field(min_length=1, max_length=100)

    _password_bytes = field_validator("password")(_password_bytes_ok)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

    _password_bytes = field_validator("password")(_password_bytes_ok)
