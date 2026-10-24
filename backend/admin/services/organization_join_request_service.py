from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..core.errors import ConflictError, NotFoundError
from ..core.join_codes import normalize_join_code
from ..models.organization_join_request import OrganizationJoinRequest
from ..repositories.organization_repository import OrganizationRepository
from ..schemas.join_request import JoinRequestDecisionRequest, PublicJoinRequestCreate


class OrganizationJoinRequestService:
    def __init__(self, session: Session):
        self.session = session
        self.organizations = OrganizationRepository(session)

    def validate_code(self, join_code: str):
        code = normalize_join_code(join_code)
        organization = self.organizations.by_join_code(code)
        if not organization or organization.status != "active":
            raise NotFoundError("That join code is invalid or the organization is inactive.")
        return organization

    def create(self, data: PublicJoinRequestCreate):
        code = normalize_join_code(data.joinCode)
        organization = self.validate_code(code)
        member_name = " ".join(data.memberName.split())

        pending = self.session.scalar(
            select(OrganizationJoinRequest).where(
                OrganizationJoinRequest.organization_id == organization.id,
                func.lower(OrganizationJoinRequest.member_name) == member_name.lower(),
                OrganizationJoinRequest.status == "pending",
            )
        )
        if pending:
            raise ConflictError(
                "A pending request for this name already exists for this organization."
            )

        request = OrganizationJoinRequest(
            id=uuid4().hex,
            organization_id=organization.id,
            member_name=member_name,
            submitted_join_code=code,
            status="pending",
            requested_at=datetime.now(timezone.utc),
            reviewed_at=None,
            reviewed_by=None,
            reviewer_note="",
        )
        self.session.add(request)
        try:
            self.session.commit()
        except IntegrityError as exc:
            self.session.rollback()
            raise ConflictError(
                "A pending request for this name already exists for this organization."
            ) from exc
        self.session.refresh(request)
        return request

    def get_public_status(self, request_id: str):
        request = self.session.get(OrganizationJoinRequest, request_id)
        if not request:
            raise NotFoundError("Join request not found.")
        return request

    def list_requests(self, status: str = "all"):
        statement = select(OrganizationJoinRequest).options(
            selectinload(OrganizationJoinRequest.organization)
        ).order_by(OrganizationJoinRequest.requested_at.desc())
        if status != "all":
            statement = statement.where(OrganizationJoinRequest.status == status)
        return list(self.session.scalars(statement))

    def decide(self, request_id: str, decision: JoinRequestDecisionRequest, reviewer_id: UUID):
        request = self.session.get(OrganizationJoinRequest, request_id)
        if not request:
            raise NotFoundError("Join request not found.")
        if request.status != "pending":
            raise ConflictError("This join request has already been reviewed.")

        organization = self.organizations.get(request.organization_id)
        if decision.decision == "approved" and organization.status != "active":
            raise ConflictError(
                "The organization is inactive. Activate it before approving a request."
            )

        request.status = decision.decision
        request.reviewed_at = datetime.now(timezone.utc)
        request.reviewed_by = reviewer_id
        request.reviewer_note = decision.note.strip()
        self.session.commit()
        self.session.refresh(request)
        return request

    def delete(self, request_id: str) -> None:
        request = self.session.get(OrganizationJoinRequest, request_id)
        if not request:
            raise NotFoundError("Join request not found.")
        self.session.delete(request)
        self.session.commit()
