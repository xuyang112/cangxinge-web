"""日记接口：CRUD，全部按 user_id 隔离。"""
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.exceptions import APIError
from app.models.diary import Diary
from app.models.user import User
from app.schemas.common import ApiResponse, DeleteResult, ListResponse
from app.schemas.diary import DiaryCreate, DiaryOut, DiaryUpdate

router = APIRouter(
    prefix="/diaries",
    tags=["diaries"],
    dependencies=[Depends(get_current_user)],
)


async def _get_owned(db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID) -> Diary:
    diary = await db.scalar(
        select(Diary).where(Diary.id == item_id, Diary.user_id == user_id)
    )
    if diary is None:
        raise APIError(404, "not_found", "日记不存在")
    return diary


@router.get("", response_model=ApiResponse[ListResponse[DiaryOut]], summary="日记列表")
async def list_diaries(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base = select(Diary).where(Diary.user_id == current_user.id)
    total = await db.scalar(select(func.count()).select_from(base.subquery()))
    rows = (
        await db.scalars(
            base.order_by(Diary.created_at.desc()).limit(limit).offset(offset)
        )
    ).all()
    return ApiResponse(
        data=ListResponse(
            items=[DiaryOut.model_validate(r) for r in rows],
            total=total or 0,
            limit=limit,
            offset=offset,
        )
    )


@router.post(
    "",
    response_model=ApiResponse[DiaryOut],
    status_code=201,
    summary="新建日记",
)
async def create_diary(
    payload: DiaryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    diary = Diary(user_id=current_user.id, **payload.model_dump())
    db.add(diary)
    await db.commit()
    await db.refresh(diary)
    return ApiResponse(data=DiaryOut.model_validate(diary))


@router.get("/{item_id}", response_model=ApiResponse[DiaryOut], summary="日记详情")
async def get_diary(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    diary = await _get_owned(db, current_user.id, item_id)
    return ApiResponse(data=DiaryOut.model_validate(diary))


@router.put("/{item_id}", response_model=ApiResponse[DiaryOut], summary="更新日记")
async def update_diary(
    item_id: uuid.UUID,
    payload: DiaryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    diary = await _get_owned(db, current_user.id, item_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(diary, field, value)
    await db.commit()
    await db.refresh(diary)
    return ApiResponse(data=DiaryOut.model_validate(diary))


@router.delete(
    "/{item_id}", response_model=ApiResponse[DeleteResult], summary="删除日记"
)
async def delete_diary(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    diary = await _get_owned(db, current_user.id, item_id)
    await db.delete(diary)
    await db.commit()
    return ApiResponse(data=DeleteResult(id=item_id))
