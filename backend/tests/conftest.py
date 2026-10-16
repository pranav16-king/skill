import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Configure test environment
os.environ["APP_ENV"] = "testing"
os.environ["MONGODB_SERVER_SELECTION_TIMEOUT_MS"] = "200"
os.environ["LOCAL_STORAGE_PATH"] = "backend/data/test_audits.json"

from app.main import app
from app.database import db_manager


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    db_manager.connect()
    yield
    db_manager.close()
    # Clean up test fallback file
    test_file = backend_dir / "data" / "test_audits.json"
    if test_file.exists():
        try:
            test_file.unlink()
        except Exception:
            pass


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
