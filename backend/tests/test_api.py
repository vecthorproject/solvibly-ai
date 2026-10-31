import io

import pymupdf
import pytest

import controller
import services
from app import create_app


@pytest.fixture()
def client():
    return create_app().test_client()


ITALIAN = {
    "country": "Italy", "companyName": "Rossi Srl", "industrySector": "manufacturing", "fiscalYear": 2025,
    "isPubliclyListed": False, "revenue": 5_000_000, "ebit": 250_000, "netIncome": -120_000,
    "depreciationAndAmortization": 180_000, "interestExpense": 160_000, "totalCurrentAssets": 2_100_000,
    "inventories": 700_000, "totalNonCurrentAssets": 1_900_000, "tangibleFixedAssets": 1_500_000,
    "totalCurrentLiabilities": 2_300_000, "totalNonCurrentLiabilities": 1_400_000, "totalEquity": 300_000,
    "retainedEarnings": -50_000, "operatingCashFlow": 90_000, "netIncome_t_minus_1": -40_000,
}


def test_predict_italy_includes_crisis(client):
    r = client.post("/api/predict", json=dict(ITALIAN, vatOverdue=30_000))
    assert r.status_code == 200
    d = r.get_json()
    assert d["country"] == "Italy"
    assert d["crisisAssessment"]["applicable"] is True
    assert d["crisisAssessment"]["overall"]["level"] == "red"
    assert d["altmanVariant"] == "Z1"
    assert d["inputsUsed"]["depreciation"] == 180_000  # form field name is mapped
    assert "vecthorMLScore" not in d and "vecthor" not in d["solviblyBreakdown"]["weights_used"]


def test_predict_usa_has_no_crisis_block(client):
    d = client.post("/api/predict", json=dict(ITALIAN, country="USA")).get_json()
    assert d["crisisAssessment"] == {"applicable": False}


def test_predict_rejects_bad_body(client):
    assert client.post("/api/predict", data="nope", content_type="text/plain").status_code == 400


def test_upload_rejects_non_pdf(client):
    data = {"document": (io.BytesIO(b"hello"), "x.pdf"), "country": "italy"}
    assert client.post("/api/upload", data=data, content_type="multipart/form-data").status_code == 400


def _pdf_bytes(pages_text):
    doc = pymupdf.open()
    for t in pages_text:
        page = doc.new_page()
        page.insert_textbox(pymupdf.Rect(40, 40, 560, 800), t, fontsize=8)
    out = doc.tobytes()
    doc.close()
    return out


def test_upload_without_api_key_returns_503(client, monkeypatch):
    monkeypatch.setattr(services, "GEMINI_API_KEY", None)
    monkeypatch.setattr(services, "_client", None)
    pdf = _pdf_bytes(["Stato patrimoniale Totale attivo 1.000.000 " * 20])
    data = {"document": (io.BytesIO(pdf), "bilancio.pdf"), "country": "italy", "companyType": "private"}
    r = client.post("/api/upload", data=data, content_type="multipart/form-data")
    assert r.status_code == 503


def test_upload_with_mocked_ai(client, monkeypatch):
    extracted = {k: v for k, v in ITALIAN.items() if k not in ("country", "isPubliclyListed", "industrySector")}
    extracted.update({"taxDebts": 100_000.0, "socialSecurityDebts": 50_000.0, "totalDebts": 3_000_000.0,
                      "netIncomePreviousYear": -40_000.0, "totalAssetsReported": 4_000_000.0})
    monkeypatch.setattr(services, "extract_data_with_llm", lambda content, country, keys=None: dict(extracted))
    pdf = _pdf_bytes(["Stato patrimoniale Totale attivo Patrimonio netto 1.000.000 2.000.000 " * 10])
    data = {"document": (io.BytesIO(pdf), "bilancio.pdf"), "country": "italy", "companyType": "private",
            "industrySector": "manufacturing", "suppliersOverdue90": "120000", "suppliersNotDue": "100000"}
    r = client.post("/api/upload", data=data, content_type="multipart/form-data")
    assert r.status_code == 200, r.get_json()
    d = r.get_json()
    assert d["country"] == "Italy" and d["ohlsonOScore"] != 'N/A'
    signals = {s["id"]: s for s in d["crisisAssessment"]["signals"]}
    assert signals["suppliers"]["status"] == "alert"
    assert d["extraction"]["mode"] == "text"


@pytest.mark.parametrize("raw,expected", [
    ("1.234.567,89", 1234567.89), ("1,234,567.89", 1234567.89), ("(1.234)", -1234.0),
    ("€ -12.500", -12500.0), ("12,5", 12.5), ("1,234", 1234.0), ("0,123", 0.123), ("", None), (None, None),
    (42, 42.0), ("n/a", None),
])
def test_to_number(raw, expected):
    assert services.to_number(raw) == (pytest.approx(expected) if expected is not None else None)


def test_page_selection_keeps_statement_pages():
    filler = ["Relazione sulla gestione. Testo descrittivo senza tabelle numeriche."] * 30
    pages = filler[:]
    pages[10] = "STATO PATRIMONIALE Totale attivo Patrimonio netto " + " ".join(f"{i}.000.{i:03d}" for i in range(40))
    pages[11] = "CONTO ECONOMICO Valore della produzione Costi della produzione " + " ".join(f"{i}.100.{i:03d}" for i in range(40))
    doc = pymupdf.open(stream=_pdf_bytes(pages), filetype="pdf")
    selected = services.select_statement_pages(doc, "Italy")
    assert 10 in selected and 11 in selected and len(selected) <= 5


def test_controller_normalises_country():
    assert controller.normalise_country("italy") == "Italy"
    assert controller.normalise_country("usa") == "USA"


def test_missing_inputs_are_reported(client):
    payload = {k: v for k, v in ITALIAN.items() if k != "operatingCashFlow"}
    d = client.post("/api/predict", json=payload).get_json()
    assert "operatingCashFlow" in d["inputsDefaulted"]
    assert d["inputsUsed"]["operatingCashFlow"] is None
    assert "marketCapitalization" not in d["inputsUsed"]  # private company
