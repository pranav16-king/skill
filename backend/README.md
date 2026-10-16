# DPDP Form Auditor - Backend Architecture

Production-grade Python 3.11 + FastAPI + MongoDB backend for the **DPDP Form Auditor**, compliant with the **Digital Personal Data Protection (DPDP) Act, 2023** data minimisation, purpose limitation, and consent notice requirements.

---

## 1. Key Features

- **FastAPI REST API**: High-throughput asynchronous endpoints with Pydantic validation.
- **MongoDB Connection (Default: `mongodb://localhost:27017`)**:
  - Connects to `dpdp_auditor` database using PyMongo.
  - Automatically manages connection pooling and query indexing on `created_at` and `id`.
- **Graceful Offline Fallback**:
  - If MongoDB is offline, unconfigured, or unreachable, the backend **never crashes** or throws unhandled startup exceptions.
  - Automatically activates an atomic, persistent JSON document store (`backend/data/audits.json`).
  - Dynamically probes and recovers MongoDB connectivity without requiring application restarts.
  - Clear connectivity reporting through `/api/health`.
- **Comprehensive DPDP Audit Engine**:
  - Accepts raw HTML snippets or plain-text lists of field names.
  - Deep heuristic token normalization (e.g. `usr_nm`, `mob_no`, `dob_dd`, `aadhar_no`, `csrf_token`).
  - Classifies into 11 DPDP categories with sensitivity markers.
  - Purpose-aware excess field detection with plain-language rationales.
  - 0–100 Compliance scoring with itemized point deductions and actionable recommendations.
  - Section 6 compliant Draft Consent Notices in **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.
- **Audit Persistence & History**:
  - Full audit records persisted with pagination (`GET /api/history`).
- **Audit Export**:
  - Downloadable formatted `.txt` compliance reports and structured `.json`.

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entrypoint & lifecycle
│   ├── config.py            # Environment configuration & Pydantic settings
│   ├── database.py          # MongoDB client with resilient persistent fallback
│   ├── models/
│   │   ├── __init__.py
│   │   ├── audit.py         # Request/Response, FieldResult, DraftNotice models
│   │   └── purpose.py       # PurposeRule, CategoryMetadata models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── parser.py        # HTML & field token extraction
│   │   ├── rules.py         # Category classification & DPDP verdict evaluation
│   │   ├── scorer.py        # Compliance score calculator (0-100)
│   │   ├── notice.py        # Trilingual draft consent notice generator (EN, HI, MR)
│   │   ├── audit_service.py # Audit orchestration & document persistence
│   │   └── exporter.py      # Plain-text and JSON export formatting
│   └── routes/
│       ├── __init__.py
│       ├── audit.py         # POST /api/audit
│       ├── history.py       # GET /api/history & GET /api/history/{id}
│       ├── purposes.py      # GET /api/purposes
│       ├── health.py        # GET /api/health
│       └── export.py        # POST /api/export
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures and TestClient configuration
│   ├── test_parser.py       # Parser unit tests
│   ├── test_rules.py        # Category & verdict unit tests
│   ├── test_scorer.py       # Scoring algorithm tests
│   ├── test_notice.py       # Multilingual notice generator tests
│   └── test_api.py          # End-to-end integration tests
├── requirements.txt         # Production & development dependencies
├── .env.example             # Configuration template
├── .env                     # Local configuration
└── README.md                # System documentation
```

---

## 3. Getting Started

### Prerequisites
- Python 3.11+
- Optional: MongoDB running on `mongodb://localhost:27017` (If MongoDB is not installed, backend will automatically operate in resilient persistent fallback mode).

### Installation

```bash
cd backend
python -m pip install -r requirements.txt
```

### Running the Server

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 4. API Specification

### 1. `POST /api/audit`
Audits a form and generates compliance findings.

**Request:**
```json
{
  "form_input": "<form><input name=\"email\"><input name=\"aadhaar_no\"></form>",
  "purpose": "newsletter signup"
}
```

**Response:**
```json
{
  "id": "aud_a1b2c3d4e5f6",
  "created_at": "2026-10-16T06:00:00Z",
  "purpose": "newsletter signup",
  "input_mode": "html",
  "summary": {
    "total_fields": 2,
    "personal_data_count": 2,
    "needed_count": 1,
    "excess_count": 1,
    "review_count": 0,
    "not_personal_count": 0
  },
  "fields": [
    {
      "name": "aadhaar_no",
      "category": "government_id",
      "sensitive": true,
      "verdict": "excess",
      "reason": "Government identification numbers are disproportionate and strictly unnecessary for a newsletter.",
      "matchedBy": ["token:aadhaar"]
    },
    {
      "name": "email",
      "category": "contact",
      "sensitive": false,
      "verdict": "needed",
      "reason": "Essential to deliver the newsletter to this recipient.",
      "matchedBy": ["token:email"]
    }
  ],
  "score": {
    "score": 68,
    "band": "fair",
    "reasons": [
      "-20 Collects sensitive data 'aadhaar_no' (government id) without necessity"
    ],
    "improvements": [
      "Remove excessive fields ('aadhaar_no') to adhere to DPDP data minimisation."
    ]
  },
  "notice": {
    "en": "...",
    "hi": "...",
    "mr": "...",
    "collected_fields": ["Email"],
    "purpose": "newsletter signup"
  }
}
```

### 2. `GET /api/history`
Retrieves past audits with pagination:
- `skip`: pagination offset (default: 0)
- `limit`: items per page (default: 20, max: 100)

### 3. `GET /api/purposes`
Returns standard recognized purposes, required/excess categories, and UI tokens.

### 4. `GET /api/health`
Returns system status, active storage mode, and live MongoDB connectivity state on `localhost:27017`.

### 5. `POST /api/export`
Generates a downloadable `.txt` or `.json` report:
```json
{
  "audit_id": "aud_a1b2c3d4e5f6",
  "format": "txt",
  "language": "en"
}
```

---

## 5. Running Tests

```bash
cd backend
python -m pytest tests/ -v
```
