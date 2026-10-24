from fastapi import APIRouter

from ..config import Settings
from ..database import Database
from ..schemas.join_request import JoinCodeValidationRequest, JoinCodeValidationResponse
from ..services.organization_join_request_service import OrganizationJoinRequestService

router = APIRouter(prefix="/public/organizations", tags=["Public Organizations"])
settings = Settings.from_env()
database = Database(settings.database_url)


@router.post("/validate-join-code", response_model=JoinCodeValidationResponse)
def validate_join_code(data: JoinCodeValidationRequest):
    with database.session() as session:
        organization = OrganizationJoinRequestService(session).validate_code(data.joinCode)
        return {
            "id": organization.id,
            "name": organization.name,
            "category": organization.category,
            "status": organization.status,
            "message": f"Valid join code for {organization.name}.",
        }
