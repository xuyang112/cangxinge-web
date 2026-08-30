"""认证服务：注册 / 登录 / 刷新 / 修改用户。"""
import uuid

from fastapi import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import APIError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    set_auth_cookies,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UserUpdate


def issue_tokens(response: Response, user: User) -> None:
    """签发 access + refresh，写入 httpOnly cookie。"""
    set_auth_cookies(
        response,
        create_access_token(user.id),
        create_refresh_token(user.id),
    )


async def register(db: AsyncSession, payload: RegisterRequest) -> User:
    email = payload.email.lower()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise APIError(409, "email_taken", "该邮箱已被注册", {"email": email})
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login(db: AsyncSession, payload: LoginRequest, response: Response) -> User:
    email = payload.email.lower()
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise APIError(401, "invalid_credentials", "邮箱或密码错误")
    issue_tokens(response, user)
    return user


async def refresh_tokens(
    db: AsyncSession, refresh_token: str | None, response: Response
) -> None:
    if not refresh_token:
        raise APIError(401, "unauthorized", "缺少 refresh token")
    try:
        payload = decode_token(refresh_token, settings.jwt_refresh_secret, "refresh")
        user_id = uuid.UUID(payload["sub"])
    except Exception:
        raise APIError(401, "invalid_refresh_token", "refresh token 无效或已过期")
    user = await db.get(User, user_id)
    if user is None:
        raise APIError(401, "invalid_refresh_token", "用户不存在")
    issue_tokens(response, user)


async def update_user(db: AsyncSession, user: User, payload: UserUpdate) -> User:
    if payload.display_name is not None:
        user.display_name = payload.display_name
    if payload.new_password is not None:
        if not payload.current_password or not verify_password(
            payload.current_password, user.password_hash
        ):
            raise APIError(
                400, "invalid_current_password", "修改密码需提供正确的 current_password"
            )
        user.password_hash = hash_password(payload.new_password)
    await db.commit()
    await db.refresh(user)
    return user
