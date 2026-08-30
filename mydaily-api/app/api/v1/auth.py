"""认证接口：注册 / 登录 / 刷新 / 登出。"""
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import clear_auth_cookies
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.common import ApiResponse
from app.schemas.user import UserOut
from app.services import auth as auth_svc

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=ApiResponse[UserOut],
    status_code=201,
    summary="注册（成功后自动登录并下发 cookie）",
)
async def register(
    payload: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user = await auth_svc.register(db, payload)
    auth_svc.issue_tokens(response, user)
    return ApiResponse(data=UserOut.model_validate(user))


@router.post("/login", response_model=ApiResponse[UserOut], summary="登录（下发 cookie）")
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user = await auth_svc.login(db, payload, response)
    return ApiResponse(data=UserOut.model_validate(user))


@router.post("/refresh", response_model=ApiResponse[dict], summary="刷新 token")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get("refresh_token")
    await auth_svc.refresh_tokens(db, refresh_token, response)
    return ApiResponse(data={"refreshed": True})


@router.post("/logout", response_model=ApiResponse[dict], summary="登出（清除 cookie）")
async def logout(response: Response, _: User = Depends(get_current_user)):
    clear_auth_cookies(response)
    return ApiResponse(data={"logged_out": True})
