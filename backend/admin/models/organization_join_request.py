from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .organization import Organization


class OrganizationJoinRequest(Base):
    __tablename__ = "organization_join_requests"
    __table_args__ = (
        Index(
            "uq_pending_join_request_by_name",
            "organization_id",
            func.lower(member_name if "member_name" in locals() else ""),
            unique=True,
            postgresql_where=text("status = 'pending'"),
            sqlite_where=text("status = 'pending'"),
        ),
    )

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    organization_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )
    submitted_join_code: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
    )
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    reviewed_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("admin_profiles.user_id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewer_note: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )

    organization: Mapped["Organization"] = relationship()
