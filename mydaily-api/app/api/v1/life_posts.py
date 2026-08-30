"""生活动态接口：列表 / 新建 / 详情 / 删除，全部按 user_id 隔离。"""
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.exceptions import APIError
from app.models.life_post import LifePost
from app.models.user import User
from app.schemas.common import ApiResponse, DeleteResult, ListResponse
from app.schemas.life_post import LifePostCreate, LifePostOut

router = APIRouter(
    prefix="/life-posts",
    tags=["life-posts"],
    dependencies=[Depends(get_current_user)],
)


async def _get_owned(db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID) -> LifePost:
    post = await db.scalar(
        select(LifePost).where(LifePost.id == item_id, LifePost.user_id == user_id)
    )
    if post is None:
        raise APIError(404, "not_found", "动态不存在")
    return post


@router.get(
    "", response_model=ApiResponse[ListResponse[LifePostOut]], summary="生活动态列表"
)
async def list_life_posts(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base = select(LifePost).where(LifePost.user_id == current_user.id)
    total = await db.scalar(select(func.count()).select_from(base.subquery()))
    rows = (
        await db.scalars(
            base.order_by(LifePost.created_at.desc()).limit(limit).offset(offset)
        )
    ).all()
    return ApiResponse(
        data=ListResponse(
            items=[LifePostOut.model_validate(r) for r in rows],
            total=total or 0,
            limit=limit,
            offset=offset,
        )
    )


@router.post(
    "",
    response_model=ApiResponse[LifePostOut],
    status_code=201,
    summary="发布动态",
)
async def create_life_post(
    payload: LifePostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = LifePost(user_id=current_user.id, **payload.model_dump())
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return ApiResponse(data=LifePostOut.model_validate(post))


@router.get(
    "/{item_id}", response_model=ApiResponse[LifePostOut], summary="动态详情"
)
async def get_life_post(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_owned(db, current_user.id, item_id)
    return ApiResponse(data=LifePostOut.model_validate(post))


@router.delete(
    "/{item_id}", response_model=ApiResponse[DeleteResult], summary="删除动态"
)
async def delete_life_post(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_owned(db, current_user.id, item_id)
    await db.delete(post)
    await db.commit()
    return ApiResponse(data=DeleteResult(id=item_id))
