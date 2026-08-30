"""安全工具：bcrypt 密码哈希 + JWT 签发/校验 + httpOnly cookie 设置。"""
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Response

from app.core.config import settings

ALGORITHM = settings.jwt_algorithm


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------- 密码 ----------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


# ---------- JWT ----------

def _encode(subject: uuid.UUID, token_type: str, secret: str, expires: timedelta) -> str:
    now = _utcnow()
    payload = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + expires,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def create_access_token(subject: uuid.UUID) -> str:
    return _encode(
        subject,
        "access",
        settings.jwt_access_secret,
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(subject: uuid.UUID) -> str:
    return _encode(
        subject,
        "refresh",
        settings.jwt_refresh_secret,
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str, secret: str, expected_type: str) -> dict:
    """校验签名与类型；过期/伪造/类型不符均抛 jwt 异常。"""
    payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("token type mismatch")
    return payload


# ---------- Cookie ----------

def _cookie_kwargs() -> dict:
    return {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
        "path": "/",
    }


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    kwargs = _cookie_kwargs()
    response.set_cookie(
        "access_token",
        access_token,
        max_age=settings.access_token_expire_minutes * 60,
        **kwargs,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        **kwargs,
    )


def clear_auth_cookies(response: Response) -> None:
    kwargs = _cookie_kwargs()
    response.delete_cookie("access_token", **kwargs)
    response.delete_cookie("refresh_token", **kwargs)
