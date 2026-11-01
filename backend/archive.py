"""
archive.py — Accounts, clients and saved analyses (Flask blueprint).

Authentication: email + password (hashed with Werkzeug's scrypt), signed bearer tokens valid 30 days
(itsdangerous). The signing key is SECRET_KEY when set; otherwise it is generated once and stored in
the database next to the data it protects. Every query is scoped to the logged-in user.
"""
from __future__ import annotations

import json
import logging
import os
import re
import secrets
import threading
import time
from functools import wraps
from typing import Any, Dict, Optional

from flask import Blueprint, g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import delete, func, select, update
from werkzeug.security import check_password_hash, generate_password_hash

import db

log = logging.getLogger(__name__)

bp = Blueprint("archive", __name__)

TOKEN_MAX_AGE = 30 * 24 * 3600
MAX_NOTES = 20_000
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

_secret_key: Optional[str] = None
_login_failures: Dict[str, list] = {}
_failures_lock = threading.Lock()


def init_auth() -> Optional[str]:
    """Chooses the key that signs login tokens. Call after db.init_db().
    Returns a warning when the key is random (logins reset at every restart)."""
    global _secret_key
    key = os.getenv("SECRET_KEY", "").strip()
    if key:
        _secret_key = key
        return None
    if db.get_engine() is not None:
        try:
            _secret_key = db.get_or_create_setting("auth_secret", lambda: secrets.token_hex(32))
            return None
        except Exception:
            log.exception("Could not read or store the signing key in the database")
    _secret_key = secrets.token_hex(32)
    return "SECRET_KEY not set and no database: using a random key (logins reset at every restart)."


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(_secret_key, salt="solvibly-auth")


def _err(message: str, status: int):
    return jsonify({"error": message}), status


def _unavailable_reason() -> Optional[str]:
    if db.get_engine() is None:
        return db.disabled_reason() or "Archivio non disponibile."
    if not _secret_key:
        return "Archivio non disponibile: chiave di firma non inizializzata."
    return None


def archive_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        reason = _unavailable_reason()
        if reason:
            return _err(reason, 503)
        return fn(*args, **kwargs)
    return wrapper


def login_required(fn):
    @archive_required
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header[7:].strip() if header.lower().startswith("bearer ") else ""
        if not token:
            return _err("Accesso richiesto.", 401)
        try:
            data = _serializer().loads(token, max_age=TOKEN_MAX_AGE)
        except SignatureExpired:
            return _err("Sessione scaduta: accedi di nuovo.", 401)
        except BadSignature:
            return _err("Sessione non valida: accedi di nuovo.", 401)
        with db.get_engine().connect() as conn:
            user = conn.execute(select(db.users.c.id, db.users.c.email).where(db.users.c.id == data.get("uid"))).first()
        if not user:
            return _err("Sessione non valida: accedi di nuovo.", 401)
        g.user_id, g.user_email = user.id, user.email
        return fn(*args, **kwargs)
    return wrapper


def _token_for(user_id: int) -> str:
    return _serializer().dumps({"uid": user_id})


def _too_many_failures(key: str) -> bool:
    cutoff = time.time() - 15 * 60
    with _failures_lock:
        attempts = [t for t in _login_failures.get(key, []) if t > cutoff]
        _login_failures[key] = attempts
        return len(attempts) >= 5


def _record_failure(key: str) -> None:
    with _failures_lock:
        _login_failures.setdefault(key, []).append(time.time())


# --- Auth ---------------------------------------------------------------------------------------

@bp.get("/api/archive/status")
def status():
    reason = _unavailable_reason()
    return jsonify({"enabled": reason is None, "reason": reason})


@bp.post("/api/auth/register")
@archive_required
def register():
    body = request.get_json(silent=True) or {}
    email = str(body.get("email") or "").strip().lower()
    password = str(body.get("password") or "")
    if not EMAIL_RE.match(email) or len(email) > 254:
        return _err("Indirizzo email non valido.", 400)
    if len(password) < 8:
        return _err("La password deve avere almeno 8 caratteri.", 400)
    with db.get_engine().begin() as conn:
        exists = conn.execute(select(db.users.c.id).where(db.users.c.email == email)).first()
        if exists:
            return _err("Esiste già un account con questa email.", 409)
        result = conn.execute(db.users.insert().values(
            email=email, password_hash=generate_password_hash(password), created_at=db.now()))
        user_id = result.inserted_primary_key[0]
    return jsonify({"token": _token_for(user_id), "user": {"id": user_id, "email": email}}), 201


@bp.post("/api/auth/login")
@archive_required
def login():
    body = request.get_json(silent=True) or {}
    email = str(body.get("email") or "").strip().lower()
    password = str(body.get("password") or "")
    key = f"{request.remote_addr}|{email}"
    if _too_many_failures(key):
        return _err("Troppi tentativi: riprova tra 15 minuti.", 429)
    with db.get_engine().connect() as conn:
        user = conn.execute(select(db.users).where(db.users.c.email == email)).first()
    if not user or not check_password_hash(user.password_hash, password):
        _record_failure(key)
        return _err("Email o password non corretti.", 401)
    return jsonify({"token": _token_for(user.id), "user": {"id": user.id, "email": user.email}})


@bp.get("/api/auth/me")
@login_required
def me():
    return jsonify({"user": {"id": g.user_id, "email": g.user_email}})


# --- Clients and analyses -----------------------------------------------------------------------

def _analysis_summary(row) -> Dict[str, Any]:
    return {
        "id": row.id,
        "clientId": row.client_id,
        "companyName": row.company_name,
        "fiscalYear": row.fiscal_year,
        "source": row.source,
        "crisisLevel": row.crisis_level,
        "solviblyScore": row.solvibly_score,
        "createdAt": row.created_at.isoformat() if row.created_at else None,
        "updatedAt": row.updated_at.isoformat() if row.updated_at else None,
    }


def _key_figures(results: Dict[str, Any]) -> Dict[str, Any]:
    used = results.get("inputsUsed") or {}
    crisis = results.get("crisisAssessment") or {}
    return {
        "revenue": used.get("revenue"),
        "netIncome": used.get("netIncome"),
        "totalEquity": used.get("totalEquity"),
        "totalDebts": used.get("totalDebts"),
        "dscr": results.get("dscr") if isinstance(results.get("dscr"), (int, float)) else None,
        "cndcecBreached": (crisis.get("cndcec") or {}).get("breachedCount"),
    }


@bp.get("/api/clients")
@login_required
def list_clients():
    a = db.analyses
    with db.get_engine().connect() as conn:
        rows = conn.execute(select(db.clients).where(db.clients.c.user_id == g.user_id)
                            .order_by(func.lower(db.clients.c.name))).all()
        out = []
        for c in rows:
            last = conn.execute(select(a).where(a.c.client_id == c.id)
                                .order_by(a.c.fiscal_year.desc(), a.c.created_at.desc()).limit(1)).first()
            count = conn.execute(select(func.count()).select_from(a).where(a.c.client_id == c.id)).scalar()
            out.append({"id": c.id, "name": c.name, "taxCode": c.tax_code, "analysesCount": count,
                        "lastAnalysis": _analysis_summary(last) if last else None})
    return jsonify({"clients": out})


@bp.get("/api/clients/<int:client_id>")
@login_required
def get_client(client_id: int):
    a = db.analyses
    with db.get_engine().connect() as conn:
        c = conn.execute(select(db.clients).where(db.clients.c.id == client_id,
                                                  db.clients.c.user_id == g.user_id)).first()
        if not c:
            return _err("Cliente non trovato.", 404)
        rows = conn.execute(select(a).where(a.c.client_id == c.id)
                            .order_by(a.c.fiscal_year.desc(), a.c.created_at.desc())).all()
    items = []
    for r in rows:
        item = _analysis_summary(r)
        try:
            item["keyFigures"] = _key_figures(json.loads(r.results_json))
        except (TypeError, ValueError):
            item["keyFigures"] = {}
        items.append(item)
    return jsonify({"client": {"id": c.id, "name": c.name, "taxCode": c.tax_code}, "analyses": items})


@bp.delete("/api/clients/<int:client_id>")
@login_required
def delete_client(client_id: int):
    with db.get_engine().begin() as conn:
        owned = conn.execute(select(db.clients.c.id).where(db.clients.c.id == client_id,
                                                           db.clients.c.user_id == g.user_id)).first()
        if not owned:
            return _err("Cliente non trovato.", 404)
        conn.execute(delete(db.analyses).where(db.analyses.c.client_id == client_id))
        conn.execute(delete(db.clients).where(db.clients.c.id == client_id))
    return jsonify({"deleted": True})


def _find_or_create_client(conn, name: str, tax_code: Optional[str]) -> int:
    c = db.clients
    if tax_code:
        row = conn.execute(select(c.c.id).where(c.c.user_id == g.user_id, c.c.tax_code == tax_code)).first()
        if row:
            return row.id
    row = conn.execute(select(c.c.id).where(c.c.user_id == g.user_id,
                                            func.lower(c.c.name) == name.lower())).first()
    if row:
        if tax_code:
            conn.execute(update(c).where(c.c.id == row.id, c.c.tax_code.is_(None)).values(tax_code=tax_code))
        return row.id
    result = conn.execute(c.insert().values(user_id=g.user_id, name=name, tax_code=tax_code, created_at=db.now()))
    return result.inserted_primary_key[0]


@bp.post("/api/analyses")
@login_required
def save_analysis():
    body = request.get_json(silent=True) or {}
    results = body.get("results")
    if not isinstance(results, dict) or "solviblyScore" not in results:
        return _err("Risultati mancanti o non validi.", 400)
    notes = str(body.get("notes") or "")[:MAX_NOTES]
    name = str(results.get("companyName") or "Senza nome").strip()[:300] or "Senza nome"
    tax_code = str(results.get("companyTaxCode") or "").strip()[:32] or None
    try:
        fiscal_year = int(results.get("fiscalYear"))
    except (TypeError, ValueError):
        fiscal_year = None
    crisis = results.get("crisisAssessment") or {}
    score = results.get("solviblyScore")
    mode = (results.get("extraction") or {}).get("mode")
    source = "xbrl" if mode == "xbrl" else ("pdf" if mode in ("text", "pdf") else "manual")
    with db.get_engine().begin() as conn:
        client_id = body.get("clientId")
        if client_id is not None:
            owned = conn.execute(select(db.clients.c.id).where(db.clients.c.id == client_id,
                                                               db.clients.c.user_id == g.user_id)).first()
            if not owned:
                return _err("Cliente non trovato.", 404)
        else:
            client_id = _find_or_create_client(conn, name, tax_code)
        stamp = db.now()
        result = conn.execute(db.analyses.insert().values(
            user_id=g.user_id, client_id=client_id, company_name=name, fiscal_year=fiscal_year,
            source=source, crisis_level=(crisis.get("overall") or {}).get("level"),
            solvibly_score=score if isinstance(score, (int, float)) else None,
            notes=notes, results_json=json.dumps(results), created_at=stamp, updated_at=stamp))
        analysis_id = result.inserted_primary_key[0]
    return jsonify({"id": analysis_id, "clientId": client_id}), 201


def _owned_analysis(conn, analysis_id: int):
    return conn.execute(select(db.analyses).where(db.analyses.c.id == analysis_id,
                                                  db.analyses.c.user_id == g.user_id)).first()


@bp.get("/api/analyses/<int:analysis_id>")
@login_required
def get_analysis(analysis_id: int):
    with db.get_engine().connect() as conn:
        row = _owned_analysis(conn, analysis_id)
    if not row:
        return _err("Analisi non trovata.", 404)
    out = _analysis_summary(row)
    out["notes"] = row.notes or ""
    out["results"] = json.loads(row.results_json)
    return jsonify(out)


@bp.patch("/api/analyses/<int:analysis_id>")
@login_required
def update_analysis(analysis_id: int):
    body = request.get_json(silent=True) or {}
    notes = str(body.get("notes") or "")[:MAX_NOTES]
    with db.get_engine().begin() as conn:
        if not _owned_analysis(conn, analysis_id):
            return _err("Analisi non trovata.", 404)
        conn.execute(update(db.analyses).where(db.analyses.c.id == analysis_id)
                     .values(notes=notes, updated_at=db.now()))
    return jsonify({"updated": True})


@bp.delete("/api/analyses/<int:analysis_id>")
@login_required
def delete_analysis(analysis_id: int):
    with db.get_engine().begin() as conn:
        if not _owned_analysis(conn, analysis_id):
            return _err("Analisi non trovata.", 404)
        conn.execute(delete(db.analyses).where(db.analyses.c.id == analysis_id))
    return jsonify({"deleted": True})


@bp.delete("/api/auth/account")
@login_required
def delete_account():
    """Deletes the account with all its clients and analyses (GDPR erasure)."""
    with db.get_engine().begin() as conn:
        conn.execute(delete(db.analyses).where(db.analyses.c.user_id == g.user_id))
        conn.execute(delete(db.clients).where(db.clients.c.user_id == g.user_id))
        conn.execute(delete(db.users).where(db.users.c.id == g.user_id))
    return jsonify({"deleted": True})
