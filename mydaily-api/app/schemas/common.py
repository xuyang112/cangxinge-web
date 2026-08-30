"""通用契约：统一响应包 { data, error }。"""
import uuid
from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Any | None = None


class ApiResponse(BaseModel, Generic[T]):
    """所有接口的统一响应结构。"""

    data: T | None = None
    error: ErrorDetail | None = None


class ListResponse(BaseModel, Generic[T]):
    """分页列表。"""

    items: list[T]
    total: int
    limit: int
    offset: int


class DeleteResult(BaseModel):
    id: uuid.UUID
    deleted: bool = True
