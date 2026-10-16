from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text string to translate", examples=["Consent for processing personal data"])
    target_lang: str = Field("hi", description="Target language code: 'hi' (Hindi), 'mr' (Marathi), 'en' (English)", examples=["hi", "mr", "en"])
    source_lang: str = Field("auto", description="Source language code or 'auto'", examples=["auto", "en", "hi", "mr"])


class TranslateResponse(BaseModel):
    translated_text: str = Field(..., description="Translated output string")
    source_lang: str = Field(..., description="Identified or provided source language")
    target_lang: str = Field(..., description="Target language")
    engine: str = Field(..., description="Translation engine utilized: 'google_translator', 'cached', or 'offline_fallback'")


class NoticeTranslateRequest(BaseModel):
    purpose: str = Field(..., min_length=1, description="Stated purpose of the form collection", examples=["User account registration and login authentication"])
    fields: List[str] = Field(default_factory=list, description="List of personal data field names", examples=[["name", "email", "phone_number"]])
    company_name: Optional[str] = Field(None, description="Data Fiduciary / Organization legal name", examples=["Acme Corp"])
    dpo_email: Optional[str] = Field(None, description="Grievance Redressal Officer contact email", examples=["grievance@acme.com"])
    retention_period: Optional[str] = Field(None, description="Data retention timeframe", examples=["6 months following account closure"])
    has_children_data: Optional[bool] = Field(False, description="Whether data processing involves minors requiring parental consent")


class NoticeTranslateResponse(BaseModel):
    en: str = Field(..., description="Complete drafted consent notice in English")
    hi: str = Field(..., description="Complete drafted consent notice in Hindi")
    mr: str = Field(..., description="Complete drafted consent notice in Marathi")
    purpose: str = Field(..., description="Original purpose statement")
    purpose_translations: Dict[str, str] = Field(..., description="Translations of purpose in en, hi, mr")
    collected_fields: List[str] = Field(..., description="Form fields included in the notice")
    field_translations: Dict[str, List[str]] = Field(..., description="Translated field items in en, hi, mr")
    engine: str = Field(..., description="Translation engine utilized")
    disclaimer: str = Field(..., description="Legal advisory disclaimer")
