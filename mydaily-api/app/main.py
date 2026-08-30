"""FastAPI 应用入口：统一鉴权中间件、统一错误处理、CORS、静态文件、路由装配。"""
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import APIError
from app.core.security import decode_token

logger = logging.getLogger("mydaily-api")


def _error_response(status_code: int, code: str, message: str, details=None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "data": None,
            "error": {"code": code, "message": message, "details": details},
        },
    )


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "个人记录 SaaS 后端服务：日记 / 学习资料 / 生活动态。"
        "所有接口返回 { data, error } 统一结构，除注册/登录外均需登录。"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ---------- CORS ----------
_origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials="*" not in _origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- 本地上传目录 + 静态文件 ----------
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


# ---------- 统一鉴权中间件 ----------
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    """从 cookie 解析 access JWT，注入 request.state.user_id（失败则忽略，交由依赖层兜底）。"""
    path = request.url.path
    if path.startswith(settings.api_v1_prefix):
        token = request.cookies.get("access_token")
        if token:
            try:
                payload = decode_token(token, settings.jwt_access_secret, "access")
                request.state.user_id = payload["sub"]
            except Exception:
                # token 无效/过期：不注入，受保护接口由 get_current_user 返回 401
                pass
    return await call_next(request)


# ---------- 统一错误处理 ----------
@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return _error_response(exc.status_code, exc.code, exc.message, exc.details)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return _error_response(exc.status_code, "http_error", str(exc.detail))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return _error_response(
        422,
        "validation_error",
        "请求参数校验失败",
        jsonable_encoder(exc.errors()),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    if settings.debug:
        return _error_response(500, "internal_error", str(exc))
    return _error_response(500, "internal_error", "服务器内部错误")


# ---------- 路由 ----------
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/api/health", tags=["health"], summary="健康检查")
async def health():
    return {"data": {"status": "ok"}, "error": None}


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")
