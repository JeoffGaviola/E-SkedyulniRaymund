from datetime import datetime, timezone
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from admin.core.errors import ConflictError, NotFoundError
from admin.database import Base
from admin.models.admin_profile import AdminProfile
from admin.models.organization import Organization
from admin.schemas.join_request import JoinRequestDecisionRequest, PublicJoinRequestCreate
from admin.services.organization_join_request_service import OrganizationJoinRequestService
from admin.services.organization_membership_service import OrganizationMembershipService


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        now = datetime.now(timezone.utc)
        admin = AdminProfile(
            user_id=uuid4(),
            username="test-admin",
            email="test-admin@example.com",
            full_name="Test Admin",
            role="admin",
            active=True,
            created_at=now,
        )
        db.add(admin)
        db.add_all([
            Organization(
                id="org-active", name="Active Organization", description="",
                contact_email="active@example.com", phone="", timezone="Asia/Manila",
                address="", category="General", status="active",
                join_code="ESK-ACTIVE01", created_at=now,
            ),
            Organization(
                id="org-inactive", name="Inactive Organization", description="",
                contact_email="inactive@example.com", phone="", timezone="Asia/Manila",
                address="", category="General", status="inactive",
                join_code="ESK-INACTIVE", created_at=now,
            ),
        ])
        db.commit()
        yield db
    engine.dispose()


def test_admin_can_join_an_active_organization_using_code(session):
    admin = session.query(AdminProfile).filter_by(username="test-admin").one()
    service = OrganizationMembershipService(session)
    organization, membership = service.join_by_code(" esk-active01 ", admin.user_id)
    assert organization.id == "org-active"
    assert membership.user_id == admin.user_id
    assert service.mine(admin.user_id)[0].id == "org-active"


def test_admin_cannot_join_with_invalid_code(session):
    admin = session.query(AdminProfile).filter_by(username="test-admin").one()
    with pytest.raises(ConflictError, match="invalid"):
        OrganizationMembershipService(session).join_by_code("BAD-CODE", admin.user_id)


def test_admin_cannot_join_inactive_organization_by_code(session):
    admin = session.query(AdminProfile).filter_by(username="test-admin").one()
    with pytest.raises(ConflictError, match="active organization"):
        OrganizationMembershipService(session).join_by_code("ESK-INACTIVE", admin.user_id)


def test_public_member_can_submit_request_and_admin_can_approve(session):
    admin = session.query(AdminProfile).filter_by(username="test-admin").one()
    service = OrganizationJoinRequestService(session)
    request = service.create(PublicJoinRequestCreate(memberName="  Alex   Santos ", joinCode=" esk-active01 "))
    assert request.organization_id == "org-active"
    assert request.member_name == "Alex Santos"
    assert request.status == "pending"

    reviewed = service.decide(
        request.id,
        JoinRequestDecisionRequest(decision="approved", note="Welcome."),
        admin.user_id,
    )
    assert reviewed.status == "approved"
    assert reviewed.reviewer_note == "Welcome."
    assert reviewed.reviewed_by == admin.user_id


def test_public_member_cannot_submit_using_inactive_organization_code(session):
    service = OrganizationJoinRequestService(session)
    with pytest.raises(NotFoundError, match="invalid or the organization is inactive"):
        service.create(PublicJoinRequestCreate(memberName="Alex Santos", joinCode="ESK-INACTIVE"))


def test_pending_request_cannot_be_reviewed_twice(session):
    admin = session.query(AdminProfile).filter_by(username="test-admin").one()
    service = OrganizationJoinRequestService(session)
    request = service.create(PublicJoinRequestCreate(memberName="Jordan Lee", joinCode="ESK-ACTIVE01"))
    service.decide(request.id, JoinRequestDecisionRequest(decision="rejected"), admin.user_id)
    with pytest.raises(ConflictError, match="already been reviewed"):
        service.decide(request.id, JoinRequestDecisionRequest(decision="approved"), admin.user_id)


def test_duplicate_pending_request_for_same_name_is_rejected(session):
    service = OrganizationJoinRequestService(session)
    service.create(PublicJoinRequestCreate(memberName="Casey Reyes", joinCode="ESK-ACTIVE01"))
    with pytest.raises(ConflictError, match="pending request"):
        service.create(PublicJoinRequestCreate(memberName=" casey reyes ", joinCode="ESK-ACTIVE01"))
