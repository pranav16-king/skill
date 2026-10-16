import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pymongo
from pymongo.errors import ConnectionFailure, PyMongoError, ServerSelectionTimeoutError

from app.config import LOCAL_STORAGE_ABS_PATH, settings

logger = logging.getLogger("dpdp_auditor.database")


class DatabaseManager:
    """
    Resilient Database Manager supporting MongoDB (localhost:27017)
    with automatic offline file-backed document fallback.
    """

    def __init__(self):
        self.client: Optional[pymongo.MongoClient] = None
        self.db = None
        self.is_connected = False
        self.last_check_time: Optional[datetime] = None
        self.last_error: Optional[str] = None
        self._lock = threading.Lock()
        self._init_local_storage()

    def _init_local_storage(self) -> None:
        """Ensure the local JSON fallback store directory and file exist."""
        try:
            LOCAL_STORAGE_ABS_PATH.parent.mkdir(parents=True, exist_ok=True)
            if not LOCAL_STORAGE_ABS_PATH.exists():
                with open(LOCAL_STORAGE_ABS_PATH, "w", encoding="utf-8") as f:
                    json.dump([], f)
        except Exception as e:
            logger.error(f"Failed to initialize local fallback storage: {e}")

    def connect(self) -> bool:
        """
        Attempts to connect to MongoDB.
        Does not throw unhandled exceptions if the MongoDB server is offline.
        """
        with self._lock:
            try:
                self.client = pymongo.MongoClient(
                    settings.mongodb_uri,
                    serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
                    connectTimeoutMS=settings.mongodb_server_selection_timeout_ms,
                    socketTimeoutMS=2000,
                )
                # Verify connection with ping
                self.client.admin.command("ping")
                self.db = self.client[settings.mongodb_db_name]
                # Ensure index on audits collection
                self.db.audits.create_index([("created_at", pymongo.DESCENDING)])
                self.db.audits.create_index([("id", pymongo.ASCENDING)], unique=True)
                self.is_connected = True
                self.last_error = None
                self.last_check_time = datetime.now(timezone.utc)
                logger.info("Successfully connected to MongoDB at %s", settings.mongodb_uri)
                return True
            except (ServerSelectionTimeoutError, ConnectionFailure, PyMongoError) as e:
                self.is_connected = False
                self.last_error = f"MongoDB connection error: {str(e)}"
                self.last_check_time = datetime.now(timezone.utc)
                logger.warning(
                    "MongoDB server is offline or unreachable at %s (%s). "
                    "Operating with persistent local fallback.",
                    settings.mongodb_uri,
                    str(e),
                )
                return False
            except Exception as e:
                self.is_connected = False
                self.last_error = f"Unexpected database error: {str(e)}"
                self.last_check_time = datetime.now(timezone.utc)
                logger.error("Unexpected error connecting to MongoDB: %s", str(e))
                return False

    def check_connection(self) -> bool:
        """Dynamically check MongoDB connection status and attempt reconnection if needed."""
        try:
            if self.client:
                self.client.admin.command("ping")
                self.is_connected = True
                self.last_error = None
                self.last_check_time = datetime.now(timezone.utc)
                return True
        except Exception:
            pass

        # Try reconnecting
        return self.connect()

    def close(self) -> None:
        """Close MongoDB connection pool cleanly."""
        if self.client:
            try:
                self.client.close()
            except Exception:
                pass
            self.is_connected = False

    # --- Local Fallback Storage Helpers ---

    def _read_local_audits(self) -> List[Dict[str, Any]]:
        with self._lock:
            if not LOCAL_STORAGE_ABS_PATH.exists():
                return []
            try:
                with open(LOCAL_STORAGE_ABS_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error reading local audit storage: {e}")
                return []

    def _write_local_audits(self, audits: List[Dict[str, Any]]) -> None:
        with self._lock:
            temp_path = LOCAL_STORAGE_ABS_PATH.with_suffix(".tmp")
            try:
                with open(temp_path, "w", encoding="utf-8") as f:
                    json.dump(audits, f, indent=2, default=str)
                temp_path.replace(LOCAL_STORAGE_ABS_PATH)
            except Exception as e:
                if temp_path.exists():
                    temp_path.unlink()
                logger.error(f"Error writing to local audit storage: {e}")
                raise

    # --- Unified Document Operations ---

    def save_audit(self, audit_doc: Dict[str, Any]) -> Dict[str, Any]:
        """
        Saves an audit document to MongoDB if connected;
        otherwise saves to local persistent store.
        """
        doc = dict(audit_doc)
        if "created_at" not in doc:
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
        elif isinstance(doc["created_at"], datetime):
            doc["created_at"] = doc["created_at"].isoformat()

        if self.check_connection() and self.db is not None:
            try:
                # Remove _id if it's None to let MongoDB assign or use custom id
                insert_doc = dict(doc)
                insert_doc.pop("_id", None)
                self.db.audits.replace_one({"id": doc["id"]}, insert_doc, upsert=True)
                return doc
            except Exception as e:
                logger.warning(f"MongoDB save failed ({e}); falling back to local storage.")
                self.is_connected = False

        # Fallback to local file persistence
        audits = self._read_local_audits()
        # Upsert by id
        filtered = [a for a in audits if a.get("id") != doc["id"]]
        filtered.insert(0, doc)
        self._write_local_audits(filtered)
        return doc

    def get_audits(self, skip: int = 0, limit: int = 20) -> Tuple[List[Dict[str, Any]], int]:
        """
        Retrieves paginated audits from MongoDB or local fallback.
        Returns (list_of_audits, total_count).
        """
        if self.check_connection() and self.db is not None:
            try:
                total = self.db.audits.count_documents({})
                cursor = (
                    self.db.audits.find({}, {"_id": 0})
                    .sort("created_at", pymongo.DESCENDING)
                    .skip(skip)
                    .limit(limit)
                )
                return list(cursor), total
            except Exception as e:
                logger.warning(f"MongoDB query failed ({e}); falling back to local storage.")
                self.is_connected = False

        audits = self._read_local_audits()
        total = len(audits)
        # audits are already newest-first
        paged = audits[skip : skip + limit]
        return paged, total

    def get_audit_by_id(self, audit_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single audit document by its unique id."""
        if self.check_connection() and self.db is not None:
            try:
                doc = self.db.audits.find_one({"id": audit_id}, {"_id": 0})
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB find failed ({e}); checking local storage.")
                self.is_connected = False

        audits = self._read_local_audits()
        for a in audits:
            if a.get("id") == audit_id:
                return a
        return None

    def get_health_status(self) -> Dict[str, Any]:
        """Returns connection health and storage metrics."""
        is_up = self.check_connection()
        total_count = 0
        if is_up and self.db is not None:
            try:
                total_count = self.db.audits.count_documents({})
            except Exception:
                total_count = len(self._read_local_audits())
        else:
            total_count = len(self._read_local_audits())

        return {
            "status": "ok",
            "mongodb": {
                "connected": is_up,
                "uri": settings.mongodb_uri,
                "database": settings.mongodb_db_name,
                "mode": "mongodb" if is_up else "offline_fallback",
                "message": (
                    "Connected to MongoDB on localhost:27017"
                    if is_up
                    else "MongoDB offline/unreachable on localhost:27017. Operating in persistent local store mode."
                ),
                "last_checked": self.last_check_time.isoformat() if self.last_check_time else None,
                "error": self.last_error if not is_up else None,
            },
            "storage": {
                "mode": "mongodb" if is_up else "offline_fallback",
                "audits_count": total_count,
                "fallback_path": str(LOCAL_STORAGE_ABS_PATH),
            },
        }


# Global database instance
db_manager = DatabaseManager()
