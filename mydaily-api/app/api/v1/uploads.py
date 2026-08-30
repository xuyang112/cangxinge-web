"""上传接口：R2 预签名（可选） / 本地降级上传。"""
from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.exceptions import APIError
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.upload import PresignRequest, PresignResponse
from app.services import storage

router = APIRouter(
    prefix="/uploads",
    tags=["uploads"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/presign",
    response_model=ApiResponse[PresignResponse],
    summary="获取预签名上传 URL（R2 未配置时返回本地模式）",
)
async def presign(
    payload: PresignRequest,
    current_user: User = Depends(get_current_user),
):
    result = storage.presign_upload(current_user.id, payload.filename, payload.content_type)
    return ApiResponse(data=result)


@router.post(
    "/local",
    response_model=ApiResponse[dict],
    summary="本地模式图片上传（multipart，仅 R2 未配置时可用）",
)
async def upload_local(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if settings.r2_enabled:
        raise APIError(400, "r2_mode_active", "已配置 R2，请改用 /uploads/presign")
    data = await file.read()
    result = storage.save_local_upload(
        current_user.id, file.filename, file.content_type, data
    )
    return ApiResponse(data=result)
