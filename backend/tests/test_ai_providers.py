import json
from types import SimpleNamespace

import anthropic
import httpx2
import pytest

import services


class FakeMessages:
    def __init__(self, payload=None, stop_reason="end_turn", error=None):
        self.payload = payload
        self.stop_reason = stop_reason
        self.error = error
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return SimpleNamespace(
            stop_reason=self.stop_reason,
            content=[SimpleNamespace(type="thinking", thinking="..."),
                     SimpleNamespace(type="text", text=json.dumps(self.payload))],
        )


@pytest.fixture()
def claude(monkeypatch):
    def install(**kw):
        fake = FakeMessages(**kw)
        monkeypatch.setattr(services, "AI_PROVIDER", "claude")
        monkeypatch.setattr(services, "ANTHROPIC_API_KEY", "test-key")
        monkeypatch.setattr(services, "_clients", {"claude": SimpleNamespace(messages=fake)})
        return fake
    return install


def italian_payload(**kw):
    keys = services.NUMERIC_KEYS + services.ITALY_EXTRA_KEYS
    d = {k: 1000.0 for k in keys}
    d.update(companyName="Rossi Srl", fiscalYear=2024, missing=["operatingCashFlow", "taxDebts"])
    d.update(kw)
    return d


def test_provider_selection(monkeypatch):
    monkeypatch.setattr(services, "AI_PROVIDER", "")
    monkeypatch.setattr(services, "ANTHROPIC_API_KEY", None)
    monkeypatch.setattr(services, "GEMINI_API_KEY", "g")
    assert services.active_provider() == "gemini"
    monkeypatch.setattr(services, "ANTHROPIC_API_KEY", "a")
    assert services.active_provider() == "claude"
    monkeypatch.setattr(services, "AI_PROVIDER", "gemini")
    assert services.active_provider() == "gemini"


def test_claude_text_mode_uses_structured_output_and_missing(claude):
    fake = claude(payload=italian_payload())
    out = services.extract_data_with_llm({"markdown": "STATO PATRIMONIALE ..."}, "Italy")
    call = fake.calls[0]
    assert call["model"] == services.CLAUDE_MODEL
    fmt = call["output_config"]["format"]
    assert fmt["type"] == "json_schema" and fmt["schema"]["additionalProperties"] is False
    assert set(fmt["schema"]["required"]) >= {"taxDebts", "missing", "companyName"}
    blocks = call["messages"][0]["content"]
    assert blocks[0]["type"] == "text" and "STATO PATRIMONIALE" in blocks[0]["text"]
    assert out["operatingCashFlow"] is None and out["taxDebts"] is None   # reported missing
    assert out["revenue"] == 1000.0 and out["companyName"] == "Rossi Srl"
    assert "missing" not in out


def test_claude_scanned_pdf_sent_as_document(claude):
    fake = claude(payload=italian_payload(missing=[]))
    services.extract_data_with_llm({"pdf_bytes": b"%PDF-1.7 fake"}, "Italy")
    blocks = fake.calls[0]["messages"][0]["content"]
    assert blocks[0]["type"] == "document"
    assert blocks[0]["source"]["media_type"] == "application/pdf"


def test_us_schema_has_no_italian_items(claude):
    keys = services.NUMERIC_KEYS
    fake = claude(payload={**{k: 1.0 for k in keys}, "companyName": "X", "fiscalYear": 2024, "missing": []})
    services.extract_data_with_llm({"markdown": "balance sheet"}, "USA")
    props = fake.calls[0]["output_config"]["format"]["schema"]["properties"]
    assert "taxDebts" not in props and "revenue" in props


def test_claude_cut_off_answer_is_an_error(claude):
    claude(payload=italian_payload(), stop_reason="max_tokens")
    with pytest.raises(services.ExtractionError):
        services.extract_data_with_llm({"markdown": "x"}, "Italy")


def test_claude_invalid_key_maps_to_unavailable(claude):
    resp = httpx2.Response(401, request=httpx2.Request("POST", "https://api.anthropic.com/v1/messages"))
    claude(error=anthropic.AuthenticationError("invalid x-api-key", response=resp, body=None))
    with pytest.raises(services.AIServiceUnavailable):
        services.extract_data_with_llm({"markdown": "x"}, "Italy")


def test_previous_year_not_found(claude, monkeypatch):
    claude(payload={"netIncome": 0, "found": False})
    monkeypatch.setattr(services, "read_pdf", lambda path, country: {"markdown": "x"})
    assert services.extract_previous_year_net_income("unused.pdf", "Italy") is None
    claude(payload={"netIncome": -1234.0, "found": True})
    assert services.extract_previous_year_net_income("unused.pdf", "Italy") == -1234.0


def test_parse_json_tolerates_wrapping_text():
    assert services._parse_json('Ecco:\n{"a": 1}\nFine') == {"a": 1}
    assert services._parse_json('```json\n{"a": 2}\n```') == {"a": 2}
    with pytest.raises(services.ExtractionError):
        services._parse_json("nessun json")
