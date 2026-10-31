"""
xbrl_it.py — Reads Italian financial statements filed in XBRL (Registro Imprese, taxonomy "itcc-ci",
PCI 2018-11-04 and later versions in the same namespace family).

No AI is involved: values are read from the tagged facts, for the current and the previous year
(both are always in the filing). Supported inputs:
  - plain instance documents (.xbrl / .xml);
  - CAdES-signed files (.xbrl.p7m), DER or base64;
  - ZIP archives containing one of the above.

Element names come from the InfoCamere taxonomy model (GAAPItaliaCompleta 2018-11-04): the same names
are used by the ordinary, abridged ("abbreviato") and micro-company schemes.
"""
from __future__ import annotations

import base64
import binascii
import io
import re
import zipfile
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from defusedxml import ElementTree as SafeET

XBRLI_NS = "http://www.xbrl.org/2003/instance"
ITCC_NS_PREFIX = "http://www.infocamere.it/itnn/fr/itcc/ci"
MAX_XML_BYTES = 20 * 1024 * 1024


class XbrlError(ValueError):
    """The file is not a readable Italian XBRL financial statement."""


# --- Element names (taxonomy itcc-ci) ------------------------------------------------------------

E = {
    "totalAssets": "TotaleAttivo",
    "fixedAssets": "TotaleImmobilizzazioni",
    "tangibleFixedAssets": "TotaleImmobilizzazioniMateriali",
    "currentAssets": "TotaleAttivoCircolante",
    "inventories": "TotaleRimanenze",
    "equity": "TotalePatrimonioNetto",
    "capital": "PatrimonioNettoCapitale",
    "legalReserve": "PatrimonioNettoRiservaLegale",
    "statutoryReserves": "PatrimonioNettoRiserveStatutarie",
    "retainedEarnings": "PatrimonioNettoUtiliPerditePortatiNuovo",
    "provisionsFund": "TotaleFondiRischiOneri",
    "tfr": "TrattamentoFineRapportoLavoroSubordinato",
    "debts": "TotaleDebiti",
    "debtsWithin": "DebitiEsigibiliEntroEsercizioSuccessivo",
    "debtsBeyond": "DebitiEsigibiliOltreEsercizioSuccessivo",
    "accruedLiabilities": "PassivoRateiRisconti",
    "taxDebts": "DebitiDebitiTributariTotaleDebitiTributari",
    "socialDebts": "DebitiDebitiVersoIstitutiPrevidenzaSicurezzaSocialeTotaleDebitiVersoIstitutiPrevidenzaSicurezzaSociale",
    "revenue": "ValoreProduzioneRicaviVenditePrestazioni",
    "ebit": "DifferenzaValoreCostiProduzione",
    "depreciation": "CostiProduzioneAmmortamentiSvalutazioniTotaleAmmortamentiSvalutazioni",
    "riskProvisions": "CostiProduzioneAccantonamentiRischi",
    "otherProvisions": "CostiProduzioneAltriAccantonamenti",
    "interest": "ProventiOneriFinanziariInteressiAltriOneriFinanziariTotaleInteressiAltriOneriFinanziari",
    "netIncome": "UtilePerditaEsercizio",
    "netIncomeEquity": "PatrimonioNettoUtilePerditaEsercizio",
    "operatingCashFlow": "FlussoFinanziarioAttivitaOperativa",
    "name": "DatiAnagraficiDenominazione",
    "taxCode": "DatiAnagraficiCodiceFiscale",
    "legalForm": "DatiAnagraficiFormaGiuridica",
    "ateco": "DatiAnagraficiSettoreAttivitaPrevalenteAteco",
}

# Item-level "entro/oltre l'esercizio successivo" splits of D) Debiti (ordinary scheme).
_DEBT_ITEM_WITHIN = re.compile(r"^Debiti.+EsigibiliEntroEsercizioSuccessivo$")
_DEBT_ITEM_BEYOND = re.compile(r"^Debiti.+EsigibiliOltreEsercizioSuccessivo$")


# --- Unwrapping signed / zipped files ------------------------------------------------------------

def _looks_like_xml(data: bytes) -> bool:
    head = data[:2048].lstrip(b"\xef\xbb\xbf \t\r\n")
    return head.startswith(b"<?xml") or (head.startswith(b"<") and b"xbrl" in head.lower())


def _unwrap_p7m(data: bytes) -> bytes:
    from asn1crypto import cms

    raw = data
    if not raw[:1] == b"\x30":  # not DER: try base64
        try:
            raw = base64.b64decode(b"".join(data.split()), validate=False)
        except (binascii.Error, ValueError) as e:
            raise XbrlError("The signed file could not be decoded.") from e
    try:
        info = cms.ContentInfo.load(raw)
        content = info["content"]["encap_content_info"]["content"].native
    except Exception as e:  # malformed CMS
        raise XbrlError("The signed file could not be decoded.") from e
    if not content:
        raise XbrlError("The signed file does not contain the statement.")
    # Files signed more than once (.p7m.p7m) wrap another signature.
    return _unwrap(content)


def _unwrap_zip(data: bytes) -> bytes:
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as e:
        raise XbrlError("The ZIP archive could not be opened.") from e
    candidates = [i for i in zf.infolist() if re.search(r"\.(xbrl|xml|p7m)$", i.filename, re.I)]
    candidates.sort(key=lambda i: (not i.filename.lower().endswith(".xbrl"), i.filename))
    for info in candidates:
        if info.file_size > MAX_XML_BYTES:
            continue
        try:
            return _unwrap(zf.read(info))
        except XbrlError:
            continue
    raise XbrlError("The ZIP archive does not contain an XBRL statement.")


def _unwrap(data: bytes) -> bytes:
    if data[:4] == b"PK\x03\x04":
        return _unwrap_zip(data)
    if _looks_like_xml(data):
        return data
    return _unwrap_p7m(data)


def is_xbrl_upload(data: bytes, filename: str = "") -> bool:
    """Cheap check used to route an upload: XML/XBRL, signed XBRL or ZIP (not PDF)."""
    if data[:5] == b"%PDF-":
        return False
    name = (filename or "").lower()
    if name.endswith((".xbrl", ".xml", ".p7m", ".zip")):
        return True
    return _looks_like_xml(data) or data[:4] == b"PK\x03\x04"


# --- Parsing ---------------------------------------------------------------------------------------

def _local(tag: str) -> Tuple[str, str]:
    if tag.startswith("{"):
        ns, _, name = tag[1:].partition("}")
        return ns, name
    return "", tag


def _parse_date(text: Optional[str]) -> Optional[date]:
    if not text:
        return None
    try:
        return date.fromisoformat(text.strip()[:10])
    except ValueError:
        return None


def _contexts(root) -> Dict[str, Dict[str, Any]]:
    out = {}
    for ctx in root.iter(f"{{{XBRLI_NS}}}context"):
        cid = ctx.get("id")
        period = ctx.find(f"{{{XBRLI_NS}}}period")
        if cid is None or period is None:
            continue
        instant = period.find(f"{{{XBRLI_NS}}}instant")
        end = period.find(f"{{{XBRLI_NS}}}endDate")
        start = period.find(f"{{{XBRLI_NS}}}startDate")
        end_date = _parse_date(instant.text if instant is not None else (end.text if end is not None else None))
        # Dimensional contexts (tables of the notes) carry explicit/typed members.
        dimensional = any(_local(el.tag)[1] in ("explicitMember", "typedMember") for el in ctx.iter())
        out[cid] = {
            "end": end_date,
            "start": _parse_date(start.text if start is not None else None),
            "instant": instant is not None,
            "dimensional": dimensional,
        }
    return out


def _to_float(text: Optional[str]) -> Optional[float]:
    if text is None:
        return None
    s = text.strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _facts(root, contexts) -> Tuple[Dict[Tuple[str, date], Any], Optional[str]]:
    """Returns {(element, period end): value} for non-dimensional facts, and the taxonomy namespace."""
    facts: Dict[Tuple[str, date], Any] = {}
    taxonomy = None
    nil_attr = "{http://www.w3.org/2001/XMLSchema-instance}nil"
    for el in root:
        ns, name = _local(el.tag)
        if not ns.startswith(ITCC_NS_PREFIX):
            continue
        ctx = contexts.get(el.get("contextRef") or "")
        if not ctx or ctx["dimensional"] or ctx["end"] is None:
            continue
        if el.get(nil_attr) == "true":
            continue
        if taxonomy is None and re.search(r"/ci/\d{4}-\d{2}-\d{2}$", ns):
            taxonomy = ns.rsplit("/", 1)[-1]
        value: Any = _to_float(el.text) if el.get("unitRef") else (el.text or "").strip()
        if value is None or value == "":
            continue
        facts.setdefault((name, ctx["end"]), value)
    return facts, taxonomy


def _year_ends(facts) -> List[date]:
    anchors = (E["totalAssets"], E["equity"], E["netIncome"], E["revenue"])
    ends = {end for (name, end) in facts if name in anchors}
    if not ends:
        ends = {end for (_, end) in facts}
    return sorted(ends, reverse=True)


def _year_values(facts, end: date) -> Dict[str, Optional[float]]:
    def g(key):
        v = facts.get((E[key], end))
        return v if isinstance(v, float) else None

    def s(*keys):
        vals = [g(k) for k in keys]
        return sum(v for v in vals if v is not None) if any(v is not None for v in vals) else None

    debts = g("debts")
    within, beyond = g("debtsWithin"), g("debtsBeyond")
    if within is None and beyond is None:
        item_within = [v for (n, e), v in facts.items() if e == end and _DEBT_ITEM_WITHIN.match(n) and isinstance(v, float)]
        item_beyond = [v for (n, e), v in facts.items() if e == end and _DEBT_ITEM_BEYOND.match(n) and isinstance(v, float)]
        if item_within or item_beyond:
            within, beyond = sum(item_within), sum(item_beyond)
    split_known = within is not None or beyond is not None
    if not split_known and debts is not None:
        # Without the split, all debts are treated as short-term (prudent for the liquidity ratios).
        within, beyond = debts, 0.0

    accrued = g("accruedLiabilities") or 0.0
    funds = (g("provisionsFund") or 0.0) + (g("tfr") or 0.0)
    current_liabilities = (within or 0.0) + accrued if (within is not None or accrued) else None
    non_current_liabilities = (beyond or 0.0) + funds if (beyond is not None or funds) else None

    net_income = g("netIncome")
    if net_income is None:
        net_income = g("netIncomeEquity")

    return {
        "totalCurrentAssets": g("currentAssets"),
        "totalNonCurrentAssets": g("fixedAssets"),
        "inventories": g("inventories"),
        "tangibleFixedAssets": g("tangibleFixedAssets"),
        "totalCurrentLiabilities": current_liabilities,
        "totalNonCurrentLiabilities": non_current_liabilities,
        "totalDebts": debts,
        "totalEquity": g("equity"),
        "shareCapital": g("capital"),
        "retainedEarnings": s("retainedEarnings", "legalReserve", "statutoryReserves"),
        "revenue": g("revenue"),
        "ebit": g("ebit"),
        "depreciation": g("depreciation"),
        "provisions": s("riskProvisions", "otherProvisions"),
        "interestExpense": g("interest"),
        "netIncome": net_income,
        "taxDebts": g("taxDebts"),
        "socialSecurityDebts": g("socialDebts"),
        "operatingCashFlow": g("operatingCashFlow"),
        "totalAssetsReported": g("totalAssets"),
        "_debtSplitKnown": split_known,
    }


def _string(facts, key: str, end: Optional[date]) -> Optional[str]:
    candidates = [v for (n, e), v in facts.items() if n == E[key] and isinstance(v, str)]
    if end is not None:
        exact = facts.get((E[key], end))
        if isinstance(exact, str):
            return exact
    return candidates[0] if candidates else None


# --- ATECO / legal form ----------------------------------------------------------------------------

def _ateco_division(code: Optional[str]) -> Optional[int]:
    if not code:
        return None
    m = re.search(r"(\d{2})", code)
    return int(m.group(1)) if m else None


def ateco_to_app_sector(code: Optional[str]) -> Optional[str]:
    d = _ateco_division(code)
    if d is None:
        return None
    ranges = [
        ((1, 3), "agriculture"), ((5, 9), "mining"), ((10, 33), "manufacturing"), ((35, 35), "energy"),
        ((36, 39), "water_waste"), ((41, 43), "construction"), ((45, 47), "trade"), ((49, 53), "transport"),
        ((55, 56), "hospitality"), ((58, 63), "info_comm"), ((64, 66), "finance_insurance"),
        ((68, 68), "real_estate"), ((69, 75), "professional_scientific"), ((77, 82), "administrative"),
        ((84, 84), "public_admin"), ((85, 85), "education"), ((86, 88), "health_social"),
        ((90, 93), "arts_entertainment"), ((94, 96), "other_services"),
    ]
    for (lo, hi), sector in ranges:
        if lo <= d <= hi:
            return sector
    return None


def ateco_to_cndcec(code: Optional[str]) -> Optional[str]:
    """CNDCEC sector group from the ATECO division (2-digit codes are stable across ATECO 2007/2025).
    Electricity and gas (35) are split by activity in the CNDCEC table, so they are left to the user."""
    d = _ateco_division(code)
    if d is None:
        return None
    if 1 <= d <= 3:
        return "A"
    if 5 <= d <= 33:
        return "BCD"
    if 36 <= d <= 39:
        return "E"
    if d == 41:
        return "F41"
    if d in (42, 43):
        return "F42_43"
    if d in (45, 46):
        return "G45_46"
    if d in (47, 56):
        return "G47_I56"
    if 49 <= d <= 53 or d == 55:
        return "H_I55"
    if 58 <= d <= 63 or 69 <= d <= 75 or 77 <= d <= 82:
        return "JMN"
    if d == 85 or 86 <= d <= 88 or 90 <= d <= 96:
        return "PQRS"
    return None


def legal_form_key(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    t = text.lower()
    if "nome collettivo" in t or "accomandita semplice" in t:
        return "societa_persone"
    if "individual" in t:
        return "impresa_individuale"
    return "societa_capitali"


# --- Public API ------------------------------------------------------------------------------------

def parse_xbrl(data: bytes) -> Dict[str, Any]:
    """Returns the same structure produced by the AI extraction (services.extract_data_with_llm),
    plus XBRL metadata under '_xbrl'."""
    if not data:
        raise XbrlError("The file is empty.")
    xml = _unwrap(data)
    if len(xml) > MAX_XML_BYTES:
        raise XbrlError("The XBRL file is too large.")
    try:
        root = SafeET.fromstring(xml)
    except Exception as e:
        raise XbrlError("The file is not valid XML.") from e
    if _local(root.tag)[1] != "xbrl":
        raise XbrlError("The file is not an XBRL instance.")

    contexts = _contexts(root)
    facts, taxonomy = _facts(root, contexts)
    if not facts:
        raise XbrlError("No Italian financial statement data (taxonomy itcc-ci) found in the file.")
    ends = _year_ends(facts)
    current_end = ends[0]
    previous_end = next((e for e in ends[1:] if (current_end - e).days >= 300), None)

    current = _year_values(facts, current_end)
    previous = _year_values(facts, previous_end) if previous_end else {}

    ateco = _string(facts, "ateco", current_end)
    legal_form_text = _string(facts, "legalForm", current_end)
    out: Dict[str, Any] = {k: v for k, v in current.items() if not k.startswith("_")}
    out.update({
        "companyName": _string(facts, "name", current_end) or "N/A",
        "fiscalYear": current_end.year,
        "netIncomePreviousYear": previous.get("netIncome"),
        "marketCapitalization": None,
    })
    out["_xbrl"] = {
        "taxonomy": taxonomy,
        "periodEnd": current_end.isoformat(),
        "previousPeriodEnd": previous_end.isoformat() if previous_end else None,
        "ateco": ateco,
        "legalForm": legal_form_text,
        "taxCode": _string(facts, "taxCode", current_end),
        "appSector": ateco_to_app_sector(ateco),
        "cndcecSector": ateco_to_cndcec(ateco),
        "legalFormKey": legal_form_key(legal_form_text),
        "debtSplitKnown": current.get("_debtSplitKnown", False),
        "previousYear": {k: v for k, v in previous.items() if not k.startswith("_")} if previous else None,
    }
    return out
