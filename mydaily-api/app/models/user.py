from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100), default="")
    # plan: free / pro（预留字段，本期不实现支付）
    plan: Mapped[str] = mapped_column(String(20), default="free")
    subscription_status: Mapped[str] = mapped_column(String(30), default="inactive")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    diaries: Mapped[list["Diary"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    study_items: Mapped[list["StudyItem"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    life_posts: Mapped[list["LifePost"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
