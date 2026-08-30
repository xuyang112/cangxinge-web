"""用户接口：/users/me。"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.user import UserOut, UserUpdate
from app.services import auth as auth_svc

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/me", response_model=ApiResponse[UserOut], summary="当前用户信息")
async def get_me(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=UserOut.model_validate(current_user))


@router.put("/me", response_model=ApiResponse[UserOut], summary="修改昵称 / 密码")
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await auth_svc.update_user(db, current_user, payload)
    return ApiResponse(data=UserOut.model_validate(user))
