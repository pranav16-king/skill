from fastapi import APIRouter, HTTPException, status
from app.models.translate import (
    NoticeTranslateRequest,
    NoticeTranslateResponse,
    TranslateRequest,
    TranslateResponse,
)
from app.services.translator import translator_service

router = APIRouter(prefix="/api", tags=["Translation"])


@router.post(
    "/translate",
    response_model=TranslateResponse,
    status_code=status.HTTP_200_OK,
    summary="Translate arbitrary text",
    description="Translates text between English, Hindi ('hi'), and Marathi ('mr') using GoogleTranslator with resilient offline fallback.",
)
def translate_text(request: TranslateRequest) -> TranslateResponse:
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text to translate cannot be empty.",
        )

    valid_langs = {"en", "hi", "mr"}
    target = request.target_lang.lower().strip()
    if target not in valid_langs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported target language '{request.target_lang}'. Supported: 'en', 'hi', 'mr'.",
        )

    try:
        result = translator_service.translate(
            text=request.text,
            target_lang=target,
            source_lang=request.source_lang,
        )
        return TranslateResponse(
            translated_text=result["translated_text"],
            source_lang=result.get("source_lang", request.source_lang),
            target_lang=result.get("target_lang", target),
            engine=result.get("engine", "google_translator"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation error: {str(e)}",
        )


@router.post(
    "/translate/notice",
    response_model=NoticeTranslateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate multilingual DPDP consent notices",
    description="Generates complete Section 6 DPDP consent notices in English, Hindi, and Marathi with dynamic purpose and field translations.",
)
def translate_notice(request: NoticeTranslateRequest) -> NoticeTranslateResponse:
    if not request.purpose or not request.purpose.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Purpose cannot be empty.",
        )

    try:
        result = translator_service.generate_translated_notice(
            purpose=request.purpose,
            fields=request.fields,
            company_name=request.company_name,
            dpo_email=request.dpo_email,
            retention_period=request.retention_period,
            has_children_data=bool(request.has_children_data),
        )
        return NoticeTranslateResponse(
            en=result["en"],
            hi=result["hi"],
            mr=result["mr"],
            purpose=result["purpose"],
            purpose_translations=result["purpose_translations"],
            collected_fields=result["collected_fields"],
            field_translations=result["field_translations"],
            engine=result["engine"],
            disclaimer=result["disclaimer"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Notice translation error: {str(e)}",
        )
