"""学习资料接口：CRUD，全部按 user_id 隔离。"""
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.exceptions import APIError
from app.models.study_item import StudyItem
from app.models.user import User
from app.schemas.common import ApiResponse, DeleteResult, ListResponse
from app.schemas.study_item import StudyItemCreate, StudyItemOut, StudyItemUpdate

router = APIRouter(
    prefix="/study-items",
    tags=["study-items"],
    dependencies=[Depends(get_current_user)],
)


async def _get_owned(
    db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID
) -> StudyItem:
    item = await db.scalar(
        select(StudyItem).where(StudyItem.id == item_id, StudyItem.user_id == user_id)
    )
    if item is None:
        raise APIError(404, "not_found", "学习资料不存在")
    return item


@router.get(
    "", response_model=ApiResponse[ListResponse[StudyItemOut]], summary="学习资料列表"
)
async def list_study_items(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base = select(StudyItem).where(StudyItem.user_id == current_user.id)
    total = await db.scalar(select(func.count()).select_from(base.subquery()))
    rows = (
        await db.scalars(
            base.order_by(StudyItem.created_at.desc()).limit(limit).offset(offset)
        )
    ).all()
    return ApiResponse(
        data=ListResponse(
            items=[StudyItemOut.model_validate(r) for r in rows],
            total=total or 0,
            limit=limit,
            offset=offset,
        )
    )


@router.post(
    "",
    response_model=ApiResponse[StudyItemOut],
    status_code=201,
    summary="新建学习资料",
)
async def create_study_item(
    payload: StudyItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = StudyItem(user_id=current_user.id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return ApiResponse(data=StudyItemOut.model_validate(item))


@router.get(
    "/{item_id}", response_model=ApiResponse[StudyItemOut], summary="学习资料详情"
)
async def get_study_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_owned(db, current_user.id, item_id)
    return ApiResponse(data=StudyItemOut.model_validate(item))


@router.put(
    "/{item_id}", response_model=ApiResponse[StudyItemOut], summary="更新学习资料"
)
async def update_study_item(
    item_id: uuid.UUID,
    payload: StudyItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_owned(db, current_user.id, item_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return ApiResponse(data=StudyItemOut.model_validate(item))


@router.delete(
    "/{item_id}", response_model=ApiResponse[DeleteResult], summary="删除学习资料"
)
async def delete_study_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_owned(db, current_user.id, item_id)
    await db.delete(item)
    await db.commit()
    return ApiResponse(data=DeleteResult(id=item_id))
