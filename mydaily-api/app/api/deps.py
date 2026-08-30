"""公共依赖：从中间件注入的 request.state.user_id 加载当前用户。"""
import uuid

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import APIError
from app.models.user import User


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """受保护接口的鉴权依赖（配合统一鉴权中间件使用）。"""
    raw = getattr(request.state, "user_id", None)
    if not raw:
        raise APIError(401, "unauthorized", "未登录或登录已过期")
    try:
        user_id = uuid.UUID(str(raw))
    except ValueError:
        raise APIError(401, "unauthorized", "无效的 token")
    user = await db.get(User, user_id)
    if user is None:
        raise APIError(401, "unauthorized", "用户不存在")
    return user
