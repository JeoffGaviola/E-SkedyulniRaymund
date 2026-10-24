from fastapi import APIRouter

from ..runtime import database
from ..schemas.join_request import (
    PublicJoinRequestCreate,
    PublicJoinRequestCreatedResponse,
    PublicJoinRequestStatusResponse,
)
from ..services.organization_join_request_service import OrganizationJoinRequestService

router = APIRouter(prefix="/public/join-requests", tags=["Public Join Requests"])


def to_public_status_response(request):
    return {
        "id": request.id,
        "organizationName": request.organization.name,
        "status": request.status,
        "requestedAt": request.requested_at.isoformat(),
        "reviewedAt": request.reviewed_at.isoformat() if request.reviewed_at else None,
        "reviewerNote": request.reviewer_note,
        "message": (
            "Your request is waiting for administrator review."
            if request.status == "pending"
            else f"Your request was {request.status}."
        ),
    }


def to_created_response(request):
    return {
        **to_public_status_response(request),
        "organizationId": request.organization_id,
        "memberName": request.member_name,
        "submittedJoinCode": request.submitted_join_code,
    }


@router.post("", response_model=PublicJoinRequestCreatedResponse, status_code=201)
def create_join_request(data: PublicJoinRequestCreate):
    with database.session() as session:
        request = OrganizationJoinRequestService(session).create(data)
        session.refresh(request)
        return to_created_response(request)


@router.get("/{request_id}", response_model=PublicJoinRequestStatusResponse)
def get_join_request_status(request_id: str):
    with database.session() as session:
        request = OrganizationJoinRequestService(session).get_public_status(request_id)
        return to_public_status_response(request)
