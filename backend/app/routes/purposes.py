from fastapi import APIRouter, status
from app.models.purpose import PurposesResponse
from app.services.rules import CATEGORIES_METADATA, PURPOSE_RULES

router = APIRouter(prefix="/api", tags=["Purposes"])


@router.get("/purposes", response_model=PurposesResponse, status_code=status.HTTP_200_OK)
def get_purposes_and_categories() -> PurposesResponse:
    """
    Returns the recognized purpose dictionaries, typical data needs,
    excess field criteria, and DPDP category definitions with UI tokens.
    """
    purposes_list = list(PURPOSE_RULES.values())
    return PurposesResponse(
        purposes=purposes_list,
        categories=CATEGORIES_METADATA,
    )
