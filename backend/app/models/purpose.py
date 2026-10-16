from typing import List
from pydantic import BaseModel, Field


class PurposeRule(BaseModel):
    id: str = Field(..., description="Unique slug for the purpose")
    name: str = Field(..., description="Display title for the purpose")
    description: str = Field(..., description="Short explanation of typical data flow")
    needed_fields: List[str] = Field(default_factory=list, description="Fields typically strictly needed")
    review_fields: List[str] = Field(default_factory=list, description="Fields that may be optional or borderline")
    typically_excess: List[str] = Field(default_factory=list, description="Fields that are typically excessive")


class CategoryMetadata(BaseModel):
    id: str
    name: str
    glyph: str
    sensitive: bool
    color: str
    bg_color: str
    description: str


class PurposesResponse(BaseModel):
    purposes: List[PurposeRule]
    categories: List[CategoryMetadata]
