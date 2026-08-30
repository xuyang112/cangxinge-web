"""存储服务：Cloudflare R2 预签名上传；未配置时降级为本地 public/uploads。"""
import mimetypes
import uuid
from pathlib import Path

import boto3
from botocore.config import Config as BotoConfig

from app.core.config import settings
from app.core.exceptions import APIError


def _extension_for(filename: str | None, content_type: str | None) -> str:
    if filename:
        ext = Path(filename).suffix.lower()
        if ext and len(ext) <= 10:
            return ext
    if content_type:
        ext = mimetypes.guess_extension(content_type)
        if ext:
            return ext
    return ""


def build_key(user_id: uuid.UUID, folder: str, filename: str | None, content_type: str | None) -> str:
    ext = _extension_for(filename, content_type)
    return f"{folder}/{user_id}/{uuid.uuid4().hex}{ext}"


def _r2_client():
    endpoint = f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=BotoConfig(signature_version="s3v4"),
    )


def presign_upload(
    user_id: uuid.UUID, filename: str | None = None, content_type: str | None = None
) -> dict:
    """返回预签名上传信息。R2 未配置时降级为本地模式。"""
    key = build_key(user_id, "uploads", filename, content_type)
    if settings.r2_enabled:
        params: dict = {"Bucket": settings.r2_bucket_name, "Key": key}
        if content_type:
            params["ContentType"] = content_type
        url = _r2_client().generate_presigned_url(
            "put_object",
            Params=params,
            ExpiresIn=settings.r2_presign_expire_seconds,
        )
        if settings.r2_public_base_url:
            public_url = f"{settings.r2_public_base_url.rstrip('/')}/{key}"
        else:
            public_url = (
                f"https://{settings.r2_bucket_name}.{settings.r2_account_id}"
                f".r2.cloudflarestorage.com/{key}"
            )
        return {
            "mode": "r2",
            "key": key,
            "upload_url": url,
            "public_url": public_url,
            "expires_in": settings.r2_presign_expire_seconds,
        }
    return {
        "mode": "local",
        "key": key,
        "upload_url": "/api/v1/uploads/local",
        "public_url": f"/uploads/{key}",
        "expires_in": None,
    }


def save_local_upload(
    user_id: uuid.UUID, filename: str | None, content_type: str | None, data: bytes
) -> dict:
    """本地降级上传：仅允许图片，写入 settings.upload_dir。"""
    if content_type and not content_type.startswith("image/"):
        raise APIError(415, "unsupported_media_type", "仅支持图片上传")
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise APIError(
            413,
            "file_too_large",
            f"文件超过 {settings.max_upload_size_mb}MB 限制",
        )
    key = build_key(user_id, "uploads", filename, content_type)
    target = Path(settings.upload_dir) / key
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {"key": key, "public_url": f"/uploads/{key}"}
