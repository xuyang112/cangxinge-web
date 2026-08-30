"""聚合 /api/v1 下全部子路由。"""
from fastapi import APIRouter

from app.api.v1 import auth, diaries, life_posts, study_items, uploads, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(diaries.router)
api_router.include_router(study_items.router)
api_router.include_router(life_posts.router)
api_router.include_router(uploads.router)
