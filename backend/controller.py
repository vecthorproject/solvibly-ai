import logging
import math
import time

from flask import jsonify, request

from calculation import (
    ALTMAN_VARIANTS,
    _to_float_or_none,
    altman_variant,
    calculate_altman_zscore,
    calculate_dscr,
    calculate_fulmer_hfactor,
    calculate_grover_gscore,
    calculate_ohlson_oscore,
    calculate_springate_sscore,
    calculate_taffler_tscore,
    calculate_zmijewski_xscore,
    compute_esg_score,
)
from crisis import CRISIS_NUMERIC_KEYS, CRISIS_STRING_KEYS, assess_crisis, compute_dscr_from_components
from scoring import compute_solvibly_score
from services import AIServiceUnavailable, ExtractionError, process_document_data, to_number
from xbrl_it import XbrlError, is_xbrl_upload, parse_xbrl

log = logging.getLogger(__name__)

# Fields used by the ratios and distress models. Missing values default to 0 (historical behaviour).
MODEL_NUMERIC_KEYS = [
    "totalCurrentAssets", "totalNonCurrentAssets", "inventories",
    "totalCurrentLiabilities", "totalNonCurrentLiabilities",
    "retainedEarnings", "ebit", "revenue", "totalEquity",
    "netIncome", "interestExpense", "tangibleFixedAssets",
    "operatingCashFlow", "marketCapitalization",
]
# Optional fields where "not provided" must stay distinguishable from 0.
OPTIONAL_NUMERIC_KEYS = ["dscrCashFlow", "dscrDebtService", "netIncome_t_minus_1", "totalAssetsReported"]

INPUTS_ECHO_KEYS = MODEL_NUMERIC_KEYS + [
    "depreciation", "netIncome_t_minus_1", "totalDebts", "provisions",
    "taxDebts", "socialSecurityDebts", "shareCapital", "totalAssetsReported",
]


def normalise_country(value):
    v = str(value or "").strip().lower()
    if v in ("italy", "italia", "it"):
        return "Italy"
    return "USA"


def _is_true(value):
    if isinstance(value, bool):
        return value
    return str(value or "").strip().lower() in ("true", "1", "yes", "y", "on", "public", "listed")


# --- CALCULATIONS LOGIC ---

def _safe_div(num, den):
    try:
        return round(num / den, 4) if den and den > 0 else 'N/A'
    except (TypeError, ZeroDivisionError):
        return 'N/A'


def _quality_checks(fd, italian):
    """Consistency checks on the data actually used, to flag extraction or typing errors."""
    msgs = []

    def add(it, en):
        msgs.append(it if italian else en)

    ta = fd.get("totalAssets") or 0
    reported = fd.get("totalAssetsReported")
    if reported and ta and abs(ta - reported) / abs(reported) > 0.05:
        add(f"Il totale attivo calcolato ({ta:,.0f}) differisce di oltre il 5% da quello riportato in bilancio ({reported:,.0f}).",
            f"Computed total assets ({ta:,.0f}) differ by more than 5% from the reported total ({reported:,.0f}).")
    tl_te = (fd.get("totalLiabilities") or 0) + (fd.get("totalEquity") or 0)
    if ta > 0 and abs(ta - tl_te) / ta > 0.05:
        add("Attivo e passivo non quadrano (scarto oltre il 5%): verifica passività e patrimonio netto.",
            "Assets do not match liabilities plus equity (gap above 5%): check liabilities and equity.")
    for note in fd.get("_qualityNotes", []):
        msgs.append(note)
    if (fd.get("revenue") or 0) <= 0:
        add("Ricavi nulli o negativi: diversi indici non sono significativi.",
            "Revenue is zero or negative: several ratios are not meaningful.")
    if ta <= 0:
        add("Totale attivo nullo: impossibile calcolare gli indici.", "Total assets are zero: ratios cannot be computed.")
    return msgs


def _calculate_results(financial_data):
    fd = financial_data
    italian = fd.get("country") == "Italy"

    fd["totalAssets"] = fd.get("totalCurrentAssets", 0) + fd.get("totalNonCurrentAssets", 0)
    fd["totalLiabilities"] = fd.get("totalCurrentLiabilities", 0) + fd.get("totalNonCurrentLiabilities", 0)
    fd["workingCapital"] = fd.get("totalCurrentAssets", 0) - fd.get("totalCurrentLiabilities", 0)

    results = {
        "country": fd.get("country"),
        "companyName": fd.get("companyName"),
        "industrySector": fd.get("industrySector"),
        "fiscalYear": fd.get("fiscalYear"),
        "isPubliclyListed": bool(fd.get("isPubliclyListed")),
        "currentRatio": _safe_div(fd["totalCurrentAssets"], fd["totalCurrentLiabilities"]),
        "quickRatio": _safe_div(fd["totalCurrentAssets"] - fd.get("inventories", 0), fd["totalCurrentLiabilities"]),
        "debtToEquityRatio": _safe_div(fd["totalLiabilities"], fd["totalEquity"]),
        "debtToAssetsRatio": _safe_div(fd["totalLiabilities"], fd["totalAssets"]),
        "interestCoverageRatio": _safe_div(fd["ebit"], fd["interestExpense"]),
        "roa": _safe_div(fd["netIncome"], fd["totalAssets"]),
        "roe": _safe_div(fd["netIncome"], fd["totalEquity"]),
        "roi": _safe_div(fd["ebit"], fd["totalAssets"]),
        "ros": _safe_div(fd["ebit"], fd["revenue"]),
        "assetTurnover": _safe_div(fd["revenue"], fd["totalAssets"]),
    }

    esg = compute_esg_score(
        esg_rating=fd.get("esgRating"),
        e=fd.get("esgScore_E"),
        s=fd.get("esgScore_S"),
        g=fd.get("esgScore_G"),
    )
    results["esgOverallScore"] = esg["overall_esg_score"]
    results["esgSource"] = esg["source"]
    results["esgRating"] = esg["rating"]
    results["esgScore_E"] = esg["e"]
    results["esgScore_S"] = esg["s"]
    results["esgScore_G"] = esg["g"]

    enriched = {**fd, **results}

    # DSCR: from the detailed components when given, otherwise from the two totals.
    comp = compute_dscr_from_components(fd)
    if comp["cashFlow"] is not None and comp["debtService"] is not None:
        enriched["dscrCashFlow"], enriched["dscrDebtService"] = comp["cashFlow"], comp["debtService"]
    dscr_value = 'N/A'
    if enriched.get("dscrCashFlow") is not None and enriched.get("dscrDebtService"):
        dscr_value = calculate_dscr(enriched)
    results["dscr"] = dscr_value

    variant = altman_variant(enriched)
    results["altmanZScore"] = calculate_altman_zscore(enriched)
    results["altmanVariant"] = variant
    results["altmanVariantLabel"] = ALTMAN_VARIANTS[variant]["label"]
    results["altmanThresholds"] = list(ALTMAN_VARIANTS[variant]["thresholds"])
    results["springateSScore"] = calculate_springate_sscore(enriched)
    results["tafflerTScore"] = calculate_taffler_tscore(enriched)
    results["fulmerHFactor"] = calculate_fulmer_hfactor(enriched)
    results["groverGScore"] = calculate_grover_gscore(enriched)
    results["zmijewskiXScore"] = calculate_zmijewski_xscore(enriched)
    results["ohlsonOScore"] = 'N/A'
    if enriched.get("netIncome_t_minus_1") is not None:
        results["ohlsonOScore"] = calculate_ohlson_oscore(enriched)

    # --- Solvibly Score ---
    results.update(compute_solvibly_score(results))

    # --- Crisis checks (Italian CCII) ---
    if italian:
        results["crisisAssessment"] = assess_crisis(fd)
    else:
        results["crisisAssessment"] = {"applicable": False}

    # --- Transparency ---
    results["dataQuality"] = {"warnings": _quality_checks(fd, italian)}
    public = bool(fd.get("isPubliclyListed"))
    defaulted = {k for k in fd.get("_defaulted", []) if public or k != "marketCapitalization"}
    results["inputsUsed"] = {
        k: (None if k in defaulted else fd.get(k))
        for k in INPUTS_ECHO_KEYS
        if fd.get(k) is not None and (public or k != "marketCapitalization")
    }
    results["inputsDefaulted"] = sorted(defaulted)
    if fd.get("_extraction"):
        results["extraction"] = fd["_extraction"]

    return results


# --- INPUT PARSING ---

def _build_financial_data(src, *, base=None):
    """Normalises a JSON body or a multipart form into the internal dictionary."""
    fd = dict(base or {})

    defaulted = []
    for key in MODEL_NUMERIC_KEYS:
        if key in fd and fd[key] is not None:
            continue
        v = to_number(src.get(key))
        if v is None:
            defaulted.append(key)
        fd[key] = v if v is not None else 0.0
    fd["_defaulted"] = defaulted

    # The manual form calls it depreciationAndAmortization.
    dep = to_number(src.get("depreciation"))
    if dep is None:
        dep = to_number(src.get("depreciationAndAmortization"))
    if dep is not None:
        fd["depreciation"] = dep

    for key in OPTIONAL_NUMERIC_KEYS + CRISIS_NUMERIC_KEYS:
        v = to_number(src.get(key))
        if v is not None:
            fd[key] = v
        elif key not in fd:
            fd[key] = None

    for key in CRISIS_STRING_KEYS:
        if src.get(key) not in (None, ""):
            fd[key] = src.get(key)

    if "country" in src or "country" not in fd:
        fd["country"] = normalise_country(src.get("country") or fd.get("country"))
    for key in ("companyName", "industrySector", "fiscalYear"):
        if src.get(key) not in (None, ""):
            fd[key] = src.get(key)

    if "isPubliclyListed" in src:
        fd["isPubliclyListed"] = _is_true(src.get("isPubliclyListed"))
    elif "companyType" in src:
        fd["isPubliclyListed"] = _is_true(src.get("companyType"))

    if not fd.get("isPubliclyListed"):
        fd["marketCapitalization"] = 0.0

    fd["esgRating"] = (src.get("esgRating") or "").strip().upper()
    fd["esgScore_E"] = _to_float_or_none(src.get("esgScore_E"))
    fd["esgScore_S"] = _to_float_or_none(src.get("esgScore_S"))
    fd["esgScore_G"] = _to_float_or_none(src.get("esgScore_G"))
    return fd


def _error(message, status):
    return jsonify({"error": message}), status


# --- ENDPOINTS LOGIC ---

def predict():
    """MANUAL FORM LOGIC"""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return _error("Invalid JSON body.", 400)
    try:
        financial_data = _build_financial_data(data)
        return jsonify(_sanitise(_calculate_results(financial_data)))
    except Exception:
        log.exception("predict failed")
        return _error("An unexpected error occurred while calculating the results.", 500)


def _looks_like_pdf(file_storage):
    head = file_storage.stream.read(5)
    file_storage.stream.seek(0)
    return head == b"%PDF-"


def _read_xbrl_upload(file_storage, form):
    """Reads an Italian XBRL statement (no AI). Returns the extracted dict and the derived form defaults."""
    started = time.monotonic()
    data = file_storage.read()
    parsed = parse_xbrl(data)
    meta = parsed.pop("_xbrl")
    if parsed.get("netIncomePreviousYear") is not None:
        parsed["netIncome_t_minus_1"] = parsed["netIncomePreviousYear"]
    parsed["_extraction"] = {
        "mode": "xbrl",
        "taxonomy": meta["taxonomy"],
        "periodEnd": meta["periodEnd"],
        "previousPeriodEnd": meta["previousPeriodEnd"],
        "ateco": meta["ateco"],
        "legalForm": meta["legalForm"],
        "seconds": round(time.monotonic() - started, 2),
    }
    notes = []
    if not meta["debtSplitKnown"]:
        notes.append("Il bilancio XBRL non distingue i debiti entro e oltre l'esercizio: sono stati considerati "
                     "tutti a breve termine (scelta prudente per gli indici di liquidità).")
    parsed["_qualityNotes"] = notes
    defaults = {}
    if not form.get("industrySector") and meta["appSector"]:
        defaults["industrySector"] = meta["appSector"]
    if not form.get("cndcecSector") and meta["cndcecSector"]:
        defaults["cndcecSector"] = meta["cndcecSector"]
    if not form.get("legalForm") and meta["legalFormKey"]:
        defaults["legalForm"] = meta["legalFormKey"]
    return parsed, defaults


def _file_head(file_storage, n=4096):
    head = file_storage.stream.read(n)
    file_storage.stream.seek(0)
    return head


def upload():
    """UPLOAD FILE LOGIC: PDF (read with AI) or Italian XBRL (read directly)."""
    file = request.files.get('document')
    previous_pdf = request.files.get('previousDocument')
    if not file:
        return _error("No file uploaded.", 400)

    form = request.form.to_dict()
    head = _file_head(file)
    is_pdf = head.startswith(b"%PDF-")
    is_xbrl = not is_pdf and is_xbrl_upload(head, file.filename or "")
    if not (is_pdf or is_xbrl):
        return _error("Upload a PDF or an XBRL file (.xbrl, .xml, signed .p7m or .zip).", 400)

    if is_xbrl:
        try:
            extracted, defaults = _read_xbrl_upload(file, form)
        except XbrlError as e:
            return _error(str(e), 422)
        except Exception:
            log.exception("xbrl read failed")
            return _error("An unexpected error occurred while reading the XBRL file.", 500)
        form = dict(form)
        for key, value in defaults.items():
            if not form.get(key):
                form[key] = value
        form["country"] = "italy"
        country = "Italy"
        return _respond_with(extracted, form, country)

    if previous_pdf and not _looks_like_pdf(previous_pdf):
        return _error("The previous-year document must be a PDF.", 400)

    country = normalise_country(form.get('country'))
    company_type = str(form.get('companyType') or '').strip().lower()

    try:
        extracted = process_document_data(
            file, country, company_type, form.get('industrySector'), prev_file=previous_pdf
        )
    except AIServiceUnavailable:
        return _error("The AI service is not configured on the server (missing or invalid API key).", 503)
    except ExtractionError as e:
        return _error(str(e), 422)
    except Exception:
        log.exception("upload extraction failed")
        return _error("An unexpected error occurred while reading the document.", 500)

    return _respond_with(extracted, form, country)


def _respond_with(extracted, form, country):
    try:
        base = {k: v for k, v in extracted.items() if v is not None}
        base["country"] = country
        # Values typed by the user in the form override the extracted ones.
        overrides = {k: v for k, v in form.items() if v not in (None, "")}
        overrides["companyType"] = str(form.get('companyType') or '').strip().lower()
        financial_data = _build_financial_data({**overrides, "country": country}, base=base)
        return jsonify(_sanitise(_calculate_results(financial_data)))
    except Exception:
        log.exception("upload calculation failed")
        return _error("An unexpected error occurred while calculating the results.", 500)


def _sanitise(obj):
    """Replaces NaN/inf with None so the JSON is always valid."""
    if isinstance(obj, float):
        return obj if math.isfinite(obj) else None
    if isinstance(obj, dict):
        return {k: _sanitise(v) for k, v in obj.items() if not str(k).startswith("_")}
    if isinstance(obj, (list, tuple)):
        return [_sanitise(v) for v in obj]
    return obj
