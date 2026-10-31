"""
db.py — Storage for accounts, clients and saved analyses.

DATABASE_URL selects the database (Postgres in production, e.g. a free Neon database). Without it:
  - locally, a SQLite file in backend/data/ is used;
  - on Render (RENDER env var set) the archive stays disabled, because the service filesystem is
    wiped at every deploy/restart and saved data would be lost.
Only computed results are stored, never the uploaded documents.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
)
from sqlalchemy.engine import Engine

log = logging.getLogger(__name__)

metadata = MetaData()

users = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("email", String(254), nullable=False, unique=True),
    Column("password_hash", String(255), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

clients = Table(
    "clients", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("name", String(300), nullable=False),
    Column("tax_code", String(32), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

analyses = Table(
    "analyses", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("client_id", Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("company_name", String(300), nullable=True),
    Column("fiscal_year", Integer, nullable=True),
    Column("source", String(16), nullable=True),
    Column("crisis_level", String(20), nullable=True),
    Column("solvibly_score", Float, nullable=True),
    Column("notes", Text, nullable=True),
    Column("results_json", Text, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

_engine: Optional[Engine] = None
_disabled_reason: Optional[str] = None


def now() -> datetime:
    return datetime.now(timezone.utc)


def _database_url() -> Optional[str]:
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        # Providers hand out postgres:// or postgresql:// URLs; SQLAlchemy needs the driver name.
        if url.startswith("postgres://"):
            url = "postgresql+psycopg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+psycopg://" + url[len("postgresql://"):]
        return url
    if os.getenv("RENDER"):
        return None
    folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(folder, exist_ok=True)
    return "sqlite:///" + os.path.join(folder, "solvibly.db")


def init_db() -> None:
    """Creates the engine and the tables (idempotent). Leaves the archive disabled when not configured."""
    global _engine, _disabled_reason
    _engine, _disabled_reason = None, None
    url = _database_url()
    if not url:
        _disabled_reason = "Archivio non configurato sul server: manca DATABASE_URL."
        log.warning(_disabled_reason)
        return
    kwargs = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    try:
        engine = create_engine(url, **kwargs)
        metadata.create_all(engine)
    except Exception:
        log.exception("Database initialisation failed")
        _disabled_reason = "Archivio non disponibile: il database non risponde."
        return
    _engine = engine


def get_engine() -> Optional[Engine]:
    return _engine


def disabled_reason() -> Optional[str]:
    return _disabled_reason
