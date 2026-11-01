import io
import itertools

import pytest

import archive
import db
from app import create_app
from xbrl_samples import build_instance

_counter = itertools.count()


@pytest.fixture()
def client():
    return create_app().test_client()


def _register(client, email=None, password="password123"):
    email = email or f"user{next(_counter)}@example.com"
    r = client.post("/api/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.get_json()
    return r.get_json()["token"], email


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _xbrl_results(client, **form):
    data = {"document": (io.BytesIO(build_instance("abridged")), "bilancio.xbrl"), **form}
    r = client.post("/api/upload", data=data, content_type="multipart/form-data")
    assert r.status_code == 200
    return r.get_json()


def test_status_enabled(client):
    assert client.get("/api/archive/status").get_json()["enabled"] is True


def test_register_login_me(client):
    token, email = _register(client)
    assert client.get("/api/auth/me", headers=_auth(token)).get_json()["user"]["email"] == email
    r = client.post("/api/auth/login", json={"email": email.upper(), "password": "password123"})
    assert r.status_code == 200 and r.get_json()["token"]
    assert client.post("/api/auth/login", json={"email": email, "password": "wrong-pass"}).status_code == 401
    assert client.post("/api/auth/register", json={"email": email, "password": "password123"}).status_code == 409


@pytest.mark.parametrize("email,password", [("not-an-email", "password123"), ("a@b.it", "short")])
def test_register_validation(client, email, password):
    assert client.post("/api/auth/register", json={"email": email, "password": password}).status_code == 400


def test_protected_routes_need_token(client):
    assert client.get("/api/clients").status_code == 401
    assert client.get("/api/clients", headers=_auth("garbage")).status_code == 401


def test_login_rate_limit(client):
    _, email = _register(client)
    for _ in range(5):
        client.post("/api/auth/login", json={"email": email, "password": "nope-nope"})
    r = client.post("/api/auth/login", json={"email": email, "password": "password123"})
    assert r.status_code == 429


def test_save_list_open_update_delete(client):
    token, _ = _register(client)
    results = _xbrl_results(client)
    r = client.post("/api/analyses", json={"results": results, "notes": "Prima verifica"}, headers=_auth(token))
    assert r.status_code == 201
    analysis_id, client_id = r.get_json()["id"], r.get_json()["clientId"]

    # A second analysis of the same company (same tax code) goes to the same client.
    r2 = client.post("/api/analyses", json={"results": results}, headers=_auth(token))
    assert r2.get_json()["clientId"] == client_id

    clients = client.get("/api/clients", headers=_auth(token)).get_json()["clients"]
    assert len(clients) == 1 and clients[0]["name"] == "ROSSI MECCANICA S.R.L."
    assert clients[0]["taxCode"] == "01234567890" and clients[0]["analysesCount"] == 2

    detail = client.get(f"/api/clients/{client_id}", headers=_auth(token)).get_json()
    first = detail["analyses"][0]
    assert first["fiscalYear"] == 2024 and first["source"] == "xbrl"
    assert first["keyFigures"]["revenue"] == 5_000_000

    saved = client.get(f"/api/analyses/{analysis_id}", headers=_auth(token)).get_json()
    assert saved["notes"] == "Prima verifica" and saved["results"]["companyName"] == "ROSSI MECCANICA S.R.L."

    assert client.patch(f"/api/analyses/{analysis_id}", json={"notes": "Aggiornate"},
                        headers=_auth(token)).status_code == 200
    assert client.get(f"/api/analyses/{analysis_id}", headers=_auth(token)).get_json()["notes"] == "Aggiornate"

    assert client.delete(f"/api/analyses/{analysis_id}", headers=_auth(token)).status_code == 200
    assert client.get(f"/api/analyses/{analysis_id}", headers=_auth(token)).status_code == 404
    assert client.delete(f"/api/clients/{client_id}", headers=_auth(token)).status_code == 200
    assert client.get("/api/clients", headers=_auth(token)).get_json()["clients"] == []


def test_users_cannot_see_each_other(client):
    token_a, _ = _register(client)
    token_b, _ = _register(client)
    r = client.post("/api/analyses", json={"results": _xbrl_results(client)}, headers=_auth(token_a))
    analysis_id, client_id = r.get_json()["id"], r.get_json()["clientId"]
    assert client.get(f"/api/analyses/{analysis_id}", headers=_auth(token_b)).status_code == 404
    assert client.get(f"/api/clients/{client_id}", headers=_auth(token_b)).status_code == 404
    assert client.delete(f"/api/clients/{client_id}", headers=_auth(token_b)).status_code == 404
    assert client.post("/api/analyses", json={"results": _xbrl_results(client), "clientId": client_id},
                       headers=_auth(token_b)).status_code == 404
    assert client.get("/api/clients", headers=_auth(token_b)).get_json()["clients"] == []


def test_save_rejects_invalid_results(client):
    token, _ = _register(client)
    assert client.post("/api/analyses", json={"results": {"foo": 1}}, headers=_auth(token)).status_code == 400


def test_delete_account(client):
    token, email = _register(client)
    client.post("/api/analyses", json={"results": _xbrl_results(client)}, headers=_auth(token))
    assert client.delete("/api/auth/account", headers=_auth(token)).status_code == 200
    assert client.get("/api/auth/me", headers=_auth(token)).status_code == 401
    assert client.post("/api/auth/login", json={"email": email, "password": "password123"}).status_code == 401


def test_archive_disabled_on_render_without_config(monkeypatch):
    monkeypatch.setenv("RENDER", "true")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("SECRET_KEY", raising=False)
    app = create_app()
    c = app.test_client()
    status = c.get("/api/archive/status").get_json()
    assert status["enabled"] is False and "DATABASE_URL" in status["reason"]
    assert c.post("/api/auth/login", json={"email": "a@b.it", "password": "x"}).status_code == 503
    # The analysis itself keeps working without the archive.
    assert c.get("/api/health").status_code == 200
    monkeypatch.undo()
    db.init_db()
    archive.init_auth()


def test_signing_key_is_kept_in_the_database(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)
    db.init_db()
    assert archive.init_auth() is None
    first = archive._secret_key
    assert len(first) == 64
    token = archive._token_for(123)
    # A restart (new process) finds the same key, so existing logins stay valid.
    archive._secret_key = None
    assert archive.init_auth() is None
    assert archive._secret_key == first
    assert archive._serializer().loads(token, max_age=60)["uid"] == 123
    # An explicit SECRET_KEY always wins over the stored one.
    monkeypatch.setenv("SECRET_KEY", "explicit-key")
    archive.init_auth()
    assert archive._secret_key == "explicit-key"
    monkeypatch.undo()
    db.init_db()
    archive.init_auth()


def test_get_or_create_setting_survives_a_race(monkeypatch):
    from sqlalchemy import insert
    db.init_db()
    calls = []

    def make_value():
        calls.append(1)
        # Another worker wins the insert between our select and our insert.
        with db.get_engine().begin() as conn:
            conn.execute(insert(db.settings).values(key="race-test", value="winner"))
        return "loser"

    assert db.get_or_create_setting("race-test", make_value) == "winner"
    assert db.get_or_create_setting("race-test", make_value) == "winner"
    assert len(calls) == 1


def test_postgres_url_is_normalised(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://u:p@host:5432/dbname")
    assert db._database_url() == "postgresql+psycopg://u:p@host:5432/dbname"
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@host/dbname?sslmode=require")
    assert db._database_url().startswith("postgresql+psycopg://u:p@host/dbname")
