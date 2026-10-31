import base64
import io
import zipfile

import pytest

import xbrl_it
from app import create_app
from xbrl_samples import CURRENT, build_instance, sign_p7m


def test_abridged_instance_values():
    out = xbrl_it.parse_xbrl(build_instance("abridged"))
    assert out["companyName"] == "ROSSI MECCANICA S.R.L."
    assert out["fiscalYear"] == 2024
    assert out["revenue"] == 5_000_000
    assert out["ebit"] == 250_000
    assert out["netIncome"] == -120_000
    assert out["netIncomePreviousYear"] == -40_000
    assert out["totalDebts"] == 3_300_000            # dimensional distractor ignored
    assert out["totalCurrentLiabilities"] == 2_300_000 + 100_000          # debts within + accrued
    assert out["totalNonCurrentLiabilities"] == 1_000_000 + 100_000 + 200_000  # beyond + funds + TFR
    assert out["provisions"] == 15_000
    assert out["retainedEarnings"] == -100_000 + 20_000
    assert out["taxDebts"] == 260_000 and out["socialSecurityDebts"] == 90_000
    assert out["operatingCashFlow"] == 90_000
    assert out["totalAssetsReported"] == CURRENT["TotaleAttivo"]
    meta = out["_xbrl"]
    assert meta["taxonomy"] == "2018-11-04"
    assert meta["periodEnd"] == "2024-12-31" and meta["previousPeriodEnd"] == "2023-12-31"
    assert meta["appSector"] == "manufacturing" and meta["cndcecSector"] == "BCD"
    assert meta["legalFormKey"] == "societa_capitali" and meta["debtSplitKnown"] is True


def test_ordinary_instance_sums_item_level_split():
    out = xbrl_it.parse_xbrl(build_instance("ordinary"))
    assert out["totalCurrentLiabilities"] == 900_000 + 1_050_000 + 260_000 + 90_000 + 100_000
    assert out["totalNonCurrentLiabilities"] == 1_000_000 + 100_000 + 200_000


def test_missing_split_treats_debts_as_short_term():
    out = xbrl_it.parse_xbrl(build_instance(with_split=False))
    assert out["totalCurrentLiabilities"] == 3_300_000 + 100_000
    assert out["_xbrl"]["debtSplitKnown"] is False


@pytest.mark.parametrize("wrap", ["p7m", "p7m_base64", "zip", "zip_p7m"])
def test_signed_and_zipped_files(wrap):
    xml = build_instance()
    if wrap == "p7m":
        data = sign_p7m(xml)
    elif wrap == "p7m_base64":
        data = base64.encodebytes(sign_p7m(xml))
    else:
        inner = sign_p7m(xml) if wrap == "zip_p7m" else xml
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("leggimi.txt", "x")
            zf.writestr("bilancio.xbrl.p7m" if wrap == "zip_p7m" else "bilancio.xbrl", inner)
        data = buf.getvalue()
    assert xbrl_it.parse_xbrl(data)["revenue"] == 5_000_000


@pytest.mark.parametrize("code,app,cndcec", [
    ("41.20.00", "construction", "F41"), ("43.21.01", "construction", "F42_43"), ("46.90", "trade", "G45_46"),
    ("47.11.40", "trade", "G47_I56"), ("56.10.11", "hospitality", "G47_I56"), ("55.10", "hospitality", "H_I55"),
    ("62.01", "info_comm", "JMN"), ("35.11", "energy", None), ("64.19", "finance_insurance", None),
    ("86.23", "health_social", "PQRS"), ("", None, None),
])
def test_ateco_mapping(code, app, cndcec):
    assert xbrl_it.ateco_to_app_sector(code) == app
    assert xbrl_it.ateco_to_cndcec(code) == cndcec


@pytest.mark.parametrize("data", [b"", b"<html><body>no</body></html>", b"random bytes \x00\x01",
                                  b'<?xml version="1.0"?><xbrl xmlns="http://www.xbrl.org/2003/instance"/>'])
def test_invalid_files(data):
    with pytest.raises(xbrl_it.XbrlError):
        xbrl_it.parse_xbrl(data)


def test_entity_expansion_is_rejected():
    bomb = (b'<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;">]>'
            b'<xbrl xmlns="http://www.xbrl.org/2003/instance">&b;</xbrl>')
    with pytest.raises(xbrl_it.XbrlError):
        xbrl_it.parse_xbrl(bomb)


# --- API ---

@pytest.fixture()
def client():
    return create_app().test_client()


def test_upload_xbrl_needs_no_ai_and_fills_profile(client, monkeypatch):
    import services
    monkeypatch.setattr(services, "ANTHROPIC_API_KEY", None)
    monkeypatch.setattr(services, "GEMINI_API_KEY", None)
    data = {"document": (io.BytesIO(sign_p7m(build_instance("ordinary", ateco="41.20.00"))), "bilancio.xbrl.p7m"),
            "country": "usa", "companyType": "private", "industrySector": "",
            "suppliersOverdue90": "120000", "suppliersNotDue": "100000"}
    r = client.post("/api/upload", data=data, content_type="multipart/form-data")
    assert r.status_code == 200, r.get_json()
    d = r.get_json()
    assert d["country"] == "Italy"
    assert d["industrySector"] == "construction"
    assert d["crisisAssessment"]["cndcec"]["sector"] == "F41"
    assert d["extraction"]["mode"] == "xbrl" and d["extraction"]["ateco"] == "41.20.00"
    assert d["ohlsonOScore"] != 'N/A'                       # previous year read from the filing
    assert d["inputsUsed"]["taxDebts"] == 260_000
    signals = {s["id"]: s["status"] for s in d["crisisAssessment"]["signals"]}
    assert signals["suppliers"] == "alert"


def test_user_choice_overrides_xbrl_sector(client):
    data = {"document": (io.BytesIO(build_instance(ateco="41.20.00")), "bilancio.xbrl"),
            "industrySector": "real_estate", "cndcecSector": "JMN"}
    d = client.post("/api/upload", data=data, content_type="multipart/form-data").get_json()
    assert d["industrySector"] == "real_estate" and d["crisisAssessment"]["cndcec"]["sector"] == "JMN"


def test_upload_rejects_unknown_files(client):
    data = {"document": (io.BytesIO(b"\x00\x01binary"), "foto.png")}
    assert client.post("/api/upload", data=data, content_type="multipart/form-data").status_code == 400


def test_upload_bad_xbrl_is_422(client):
    data = {"document": (io.BytesIO(b"<?xml version='1.0'?><root/>"), "bilancio.xbrl")}
    r = client.post("/api/upload", data=data, content_type="multipart/form-data")
    assert r.status_code == 422 and "XBRL" in r.get_json()["error"]
