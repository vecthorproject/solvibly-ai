"""
services.py — PDF reading and AI extraction of financial data.

Speed and robustness:
  - only the pages that contain the financial statements are sent to the model
    (balance sheet, income statement, cash flow, notes on debts), with a fallback
    to the whole document when the selection is too small;
  - scanned PDFs (no text layer) are sent to the model as PDF so it can read the page images;
  - the current-year and previous-year documents are processed in parallel;
  - the AI client is created once and reused.

AI provider: Claude (Anthropic) by default, Gemini as an alternative. Set AI_PROVIDER=claude|gemini;
when it is not set, Claude is used if ANTHROPIC_API_KEY is present, otherwise Gemini if GEMINI_API_KEY is.
"""
from __future__ import annotations

import base64
import json
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional

import pymupdf
import pymupdf4llm
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-5-5")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
AI_PROVIDER = os.getenv("AI_PROVIDER", "").strip().lower()

# Output budget for Claude: adaptive thinking counts toward max_tokens, so leave room for it.
CLAUDE_MAX_TOKENS = int(os.getenv("CLAUDE_MAX_TOKENS", "8000"))
# Effort controls how much Claude thinks (low | medium | high); "medium" is Haiku 5.5's default.
CLAUDE_EFFORT = os.getenv("CLAUDE_EFFORT", "medium")

# Below this many characters of extractable text, a PDF is treated as scanned.
MIN_TEXT_CHARS = 400
# Documents up to this many pages are sent whole.
SMALL_DOC_PAGES = 12


class AIServiceUnavailable(RuntimeError):
    """Raised when the AI provider is not configured."""


class ExtractionError(RuntimeError):
    """Raised when the document cannot be read or the AI answer is not usable."""


_clients: Dict[str, Any] = {}


def active_provider() -> str:
    if AI_PROVIDER in ("claude", "gemini"):
        return AI_PROVIDER
    if ANTHROPIC_API_KEY:
        return "claude"
    if GEMINI_API_KEY:
        return "gemini"
    return "claude"


def active_model() -> str:
    return CLAUDE_MODEL if active_provider() == "claude" else GEMINI_MODEL


def _get_client(provider: str):
    if provider in _clients:
        return _clients[provider]
    if provider == "claude":
        if not ANTHROPIC_API_KEY:
            raise AIServiceUnavailable("ANTHROPIC_API_KEY is not set")
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY, max_retries=2, timeout=180)
    else:
        if not GEMINI_API_KEY:
            raise AIServiceUnavailable("GEMINI_API_KEY is not set")
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
    _clients[provider] = client
    return client


# --- FIELDS ---

NUMERIC_KEYS = [
    "totalCurrentAssets", "totalNonCurrentAssets", "inventories",
    "totalCurrentLiabilities", "totalNonCurrentLiabilities",
    "retainedEarnings", "ebit", "revenue", "totalEquity",
    "netIncome", "interestExpense", "tangibleFixedAssets",
    "operatingCashFlow", "marketCapitalization",
    "depreciation", "totalAssetsReported", "netIncomePreviousYear",
]
# Extra fields used by the Italian crisis checks (art. 2424 / 2425 c.c. items).
ITALY_EXTRA_KEYS = ["totalDebts", "provisions", "taxDebts", "socialSecurityDebts", "shareCapital"]
CONTEXT_KEYS = ["companyName", "fiscalYear"]

ITALY_FIELD_GUIDE = """
Mapping to the Italian civil-code schemes (art. 2424 and 2425 c.c.); use the column of the most recent year:
- totalCurrentAssets: "C) Attivo circolante" total.
- totalNonCurrentAssets: "B) Immobilizzazioni" total.
- inventories: "C.I Rimanenze" total.
- tangibleFixedAssets: "B.II Immobilizzazioni materiali" total.
- totalCurrentLiabilities: debts due within the next financial year ("esigibili entro l'esercizio successivo") plus "E) Ratei e risconti" if shown.
- totalNonCurrentLiabilities: debts due beyond the next financial year plus "B) Fondi per rischi e oneri" plus "C) Trattamento di fine rapporto".
- totalDebts: "D) Debiti" total (both within and beyond the year).
- totalEquity: "A) Patrimonio netto" total.
- shareCapital: "A.I Capitale".
- retainedEarnings: "A.VIII Utili (perdite) portati a nuovo" plus revenue reserves; 0 if absent.
- revenue: "A.1 Ricavi delle vendite e delle prestazioni".
- ebit: "Differenza tra valore e costi della produzione (A - B)".
- depreciation: "B.10 Ammortamenti e svalutazioni" total.
- provisions: "B.12 Accantonamenti per rischi" plus "B.13 Altri accantonamenti".
- interestExpense: "C.17 Interessi e altri oneri finanziari".
- netIncome: "21) Utile (perdita) dell'esercizio".
- netIncomePreviousYear: the same item in the previous-year column, if shown.
- taxDebts: "D.12 Debiti tributari".
- socialSecurityDebts: "D.13 Debiti verso istituti di previdenza e di sicurezza sociale".
- operatingCashFlow: cash flow from operating activities ("flusso finanziario dell'attività operativa", section A of the rendiconto finanziario).
- totalAssetsReported: "Totale attivo".
- marketCapitalization: 0 unless the company is listed and the value is stated.
"""

US_FIELD_GUIDE = """
Use the consolidated statements of the most recent fiscal year.
- totalNonCurrentAssets: total assets minus total current assets if not stated.
- totalNonCurrentLiabilities: total liabilities minus total current liabilities if not stated.
- depreciation: depreciation and amortization.
- netIncomePreviousYear: net income of the prior fiscal year shown in the income statement.
- totalAssetsReported: "Total assets".
"""

# Keywords used to locate the financial statement pages.
PAGE_KEYWORDS = {
    "italy": [
        "stato patrimoniale", "conto economico", "rendiconto finanziario", "totale attivo",
        "patrimonio netto", "valore della produzione", "debiti tributari", "attivo circolante",
        "costi della produzione", "utile (perdita) dell'esercizio",
    ],
    "usa": [
        "balance sheet", "statements of operations", "statements of income", "income statement",
        "cash flows", "total assets", "total liabilities", "stockholders' equity", "shareholders' equity",
        "net income", "total current assets",
    ],
}


def _country_key(country: Optional[str]) -> str:
    return "italy" if str(country or "").strip().lower() == "italy" else "usa"


def _build_extraction_prompt(country: str, keys: Optional[List[str]] = None) -> str:
    italy = _country_key(country) == "italy"
    numeric = NUMERIC_KEYS + (ITALY_EXTRA_KEYS if italy else [])
    target_keys = keys or (numeric + CONTEXT_KEYS)
    intro = (
        "You are an expert financial analyst specialised in Italian financial statements (Bilancio d'esercizio, "
        "ordinario, abbreviato or micro)."
        if italy else
        "You are an expert financial analyst specialised in US financial statements (Form 10-K)."
    )
    guide = ITALY_FIELD_GUIDE if italy else US_FIELD_GUIDE
    missing_rule = (
        "When an item is not present in the document, set it to 0 and add its name to the 'missing' list "
        "(do not guess). 'missing' must list only items that are really absent."
        if active_provider() == "claude" else
        "Use null when an item is not present in the document (do not guess, do not use 0 for missing items)."
    )
    return f"""
{intro}
Read the financial statement provided and return the values of these items for the most recent fiscal year:
{', '.join(target_keys)}.
{guide}
Rules:
- Respond with a single valid JSON object whose keys match exactly the names above.
- Numbers must be plain numbers in units (no currency symbols, no thousands separators). If the statement is
  expressed in thousands or millions, convert to units.
- Losses and negative values keep the minus sign.
- {missing_rule}
- 'companyName' is a string ("N/A" if missing); 'fiscalYear' is a four-digit year (YYYY).
"""


# --- PDF ---

def select_statement_pages(doc: "pymupdf.Document", country: str) -> List[int]:
    """Returns the 0-based pages that most likely contain the financial statements."""
    n = doc.page_count
    if n <= SMALL_DOC_PAGES:
        return list(range(n))
    keywords = PAGE_KEYWORDS[_country_key(country)]
    scored = []
    for i in range(n):
        text = doc.load_page(i).get_text("text").lower()
        hits = sum(1 for k in keywords if k in text)
        digits = len(re.findall(r"\d[\d.,]{3,}", text))
        if hits >= 2 and digits >= 15:
            scored.append(i)
    if len(scored) < 2:
        return list(range(n))
    selected = set()
    for i in scored:
        selected.update({i - 1, i, i + 1})
    pages = sorted(p for p in selected if 0 <= p < n)
    # Hard cap to keep requests fast (primary statements come before most notes).
    return pages[:40]


def read_pdf(path: str, country: str) -> Dict[str, Any]:
    """Returns {'markdown': str|None, 'pdf_bytes': bytes|None, 'pages': [...], 'page_count': n}."""
    try:
        doc = pymupdf.open(path)
    except Exception as e:  # corrupted / not a PDF
        raise ExtractionError("The file could not be opened as a PDF.") from e
    try:
        if doc.needs_pass:
            raise ExtractionError("The PDF is password protected.")
        n = doc.page_count
        total_text = sum(len(doc.load_page(i).get_text("text").strip()) for i in range(min(n, 60)))
        if total_text < MIN_TEXT_CHARS:
            # Scanned document: let the model read the PDF itself.
            with open(path, "rb") as fh:
                return {"markdown": None, "pdf_bytes": fh.read(), "pages": list(range(n)), "page_count": n}
        pages = select_statement_pages(doc, country)
        md = pymupdf4llm.to_markdown(doc, pages=pages, show_progress=False)
        return {"markdown": md, "pdf_bytes": None, "pages": pages, "page_count": n}
    finally:
        doc.close()


# --- AI ---

def _gemini_response_text(response) -> str:
    raw = getattr(response, "text", None)
    if raw:
        return raw
    cand = getattr(response, "candidates", None)
    if cand and hasattr(cand[0], "content") and hasattr(cand[0].content, "parts"):
        return "".join(getattr(p, "text", "") or "" for p in cand[0].content.parts)
    return ""


def _claude_response_text(response) -> str:
    # Thinking blocks are skipped: only the text blocks carry the answer.
    return "".join(getattr(b, "text", "") or "" for b in (response.content or []) if getattr(b, "type", "") == "text")


def _parse_json(raw: str) -> Dict[str, Any]:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Fall back to the outermost JSON object in the answer.
        start, end = text.find("{"), text.rfind("}")
        try:
            data = json.loads(text[start:end + 1]) if 0 <= start < end else None
        except json.JSONDecodeError:
            data = None
        if data is None:
            raise ExtractionError("The AI answer was not valid JSON.")
    if not isinstance(data, dict):
        raise ExtractionError("The AI answer was not a JSON object.")
    return data


def extraction_schema(numeric_keys: List[str]) -> Dict[str, Any]:
    """JSON schema for Claude structured outputs. Every key is required (no unions/optionals, which the
    API limits); items absent from the document are reported in 'missing'."""
    props: Dict[str, Any] = {k: {"type": "number"} for k in numeric_keys}
    props["companyName"] = {"type": "string"}
    props["fiscalYear"] = {"type": "integer"}
    props["missing"] = {"type": "array", "items": {"type": "string", "enum": list(numeric_keys)}}
    return {"type": "object", "properties": props, "required": list(props), "additionalProperties": False}


PREVIOUS_YEAR_SCHEMA = {
    "type": "object",
    "properties": {"netIncome": {"type": "number"}, "found": {"type": "boolean"}},
    "required": ["netIncome", "found"],
    "additionalProperties": False,
}


def _call_claude(prompt: str, content: Dict[str, Any], schema: Optional[Dict[str, Any]] = None) -> str:
    import anthropic

    client = _get_client("claude")
    blocks: List[Dict[str, Any]] = []
    if content.get("pdf_bytes"):
        blocks.append({
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": "application/pdf",
                "data": base64.standard_b64encode(content["pdf_bytes"]).decode("ascii"),
            },
        })
    else:
        blocks.append({"type": "text", "text": "<financial_statement>\n" + (content.get("markdown") or "") + "\n</financial_statement>"})
    blocks.append({"type": "text", "text": prompt + "\nAnswer with the JSON object only, no other text."})
    output_config: Dict[str, Any] = {"effort": CLAUDE_EFFORT}
    if schema:
        output_config["format"] = {"type": "json_schema", "schema": schema}
    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=CLAUDE_MAX_TOKENS,
            messages=[{"role": "user", "content": blocks}],
            output_config=output_config,
        )
    except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as e:
        raise AIServiceUnavailable("The Claude API key is not valid.") from e
    except anthropic.RateLimitError as e:
        raise ExtractionError("The AI service is busy, please retry in a minute.") from e
    except anthropic.APIError as e:
        log.warning("Claude API error: %s", e)
        raise ExtractionError("The AI service could not read the document.") from e
    stop = getattr(response, "stop_reason", None)
    if stop == "max_tokens":
        raise ExtractionError("The AI answer was cut off; the document may be too long.")
    if stop == "refusal":
        raise ExtractionError("The AI service declined to process the document.")
    return _claude_response_text(response)


def _call_gemini(prompt: str, content: Dict[str, Any]) -> str:
    from google.genai import types
    client = _get_client("gemini")
    if content.get("pdf_bytes"):
        contents = [types.Part.from_bytes(data=content["pdf_bytes"], mime_type="application/pdf"), prompt]
    else:
        contents = prompt + "\n\nMARKDOWN_TEXT:\n" + (content.get("markdown") or "")
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0),
    )
    return _gemini_response_text(response)


def _call_model(prompt: str, content: Dict[str, Any], schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    provider = active_provider()
    raw = _call_claude(prompt, content, schema) if provider == "claude" else _call_gemini(prompt, content)
    return _parse_json(raw)


def to_number(value: Any) -> Optional[float]:
    """Parses numbers written in Italian or US style ("1.234.567,89", "(1,234)", "€ -12")."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if value == value and value not in (float("inf"), float("-inf")) else None
    s = str(value).strip()
    if not s or s.lower() in ("null", "n/a", "na", "none", "-"):
        return None
    negative = s.startswith("(") and s.endswith(")")
    s = re.sub(r"[^\d,.\-]", "", s)
    if s.count("-") > 0:
        negative = negative or s.startswith("-")
        s = s.replace("-", "")
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        parts = s.split(",")
        thousands = len(parts) > 2 or (len(parts[-1]) == 3 and parts[0] not in ("", "0"))
        s = s.replace(",", "") if thousands else s.replace(",", ".")
    elif s.count(".") > 1:
        s = s.replace(".", "")
    elif "." in s:
        # A single dot followed by exactly three digits is read as a thousands separator ("1.234" = 1234),
        # as amounts in financial statements are not written with three decimals.
        head, tail = s.split(".")
        if len(tail) == 3 and head not in ("", "0"):
            s = head + tail
    try:
        v = float(s)
    except ValueError:
        return None
    return -v if negative else v


def extract_data_with_llm(content: Dict[str, Any], country: str, keys: Optional[List[str]] = None) -> Dict[str, Any]:
    italy = _country_key(country) == "italy"
    numeric = [k for k in (keys or NUMERIC_KEYS + (ITALY_EXTRA_KEYS if italy else [])) if k not in CONTEXT_KEYS]
    prompt = _build_extraction_prompt(country, keys)
    try:
        data = _call_model(prompt, content, extraction_schema(numeric))
    except (AIServiceUnavailable, ExtractionError):
        raise
    except Exception as e:
        log.exception("AI extraction failed")
        raise ExtractionError("AI data extraction failed.") from e

    missing = set(data.pop("missing", None) or [])
    out: Dict[str, Any] = {}
    for k, v in data.items():
        if k in CONTEXT_KEYS:
            out[k] = v
        else:
            out[k] = None if k in missing else to_number(v)
    return out


def _previous_year_prompt(country: str) -> str:
    italy = _country_key(country) == "italy"
    item = "the Net Income (\"Utile (perdita) dell'esercizio\")" if italy else "the Net Income (net earnings)"
    return f"""
You are an expert financial analyst. Extract only {item} for the most recent fiscal year shown in this document.
Respond with a single JSON object: {{"netIncome": <number>, "found": <true|false>}}. Plain number in units,
minus sign for losses. If net income is not in the document, use 0 and "found": false.
"""


def extract_previous_year_net_income(path: str, country: str) -> Optional[float]:
    content = read_pdf(path, country)
    data = _call_model(_previous_year_prompt(country), content, PREVIOUS_YEAR_SCHEMA)
    if data.get("found") is False:
        return None
    return to_number(data.get("netIncome"))


def _save_upload(file_storage) -> str:
    import tempfile
    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    file_storage.save(path)
    return path


def _remove(path: Optional[str]) -> None:
    if not path:
        return
    for _ in range(5):
        try:
            if os.path.exists(path):
                os.remove(path)
            return
        except PermissionError:
            time.sleep(0.1)
        except OSError:
            return


def process_document_data(file_storage, country, company_type, industry_sector, *, keys=None, prev_file=None):
    """Saves the uploads, extracts the data (current and previous year in parallel), cleans up."""
    main_path = _save_upload(file_storage)
    prev_path = _save_upload(prev_file) if prev_file else None
    started = time.monotonic()
    try:
        main_content = read_pdf(main_path, country)
        with ThreadPoolExecutor(max_workers=2) as pool:
            fut_main = pool.submit(extract_data_with_llm, main_content, country, keys)
            fut_prev = pool.submit(extract_previous_year_net_income, prev_path, country) if prev_path else None
            financial_data = fut_main.result()
            ni_prev = None
            if fut_prev is not None:
                try:
                    ni_prev = fut_prev.result()
                except Exception:
                    log.warning("Previous-year extraction failed; continuing without it", exc_info=True)

        if ni_prev is not None:
            financial_data["netIncome_t_minus_1"] = ni_prev
        elif financial_data.get("netIncomePreviousYear") is not None:
            financial_data["netIncome_t_minus_1"] = financial_data["netIncomePreviousYear"]

        financial_data['country'] = country
        financial_data['isPubliclyListed'] = company_type == 'public'
        financial_data['industrySector'] = industry_sector

        if not financial_data.get("fiscalYear"):
            financial_data["fiscalYear"] = int(time.strftime("%Y"))

        if not financial_data.get("companyName") or financial_data.get("companyName") == "N/A":
            fname = file_storage.filename or "document.pdf"
            base, ext = os.path.splitext(fname)
            if len(base) > 25:
                base = base[:25] + "…"
            financial_data["companyName"] = f"Doc: {base}{ext}"

        financial_data["_extraction"] = {
            "pagesUsed": [p + 1 for p in main_content["pages"]],
            "pageCount": main_content["page_count"],
            "mode": "pdf" if main_content.get("pdf_bytes") else "text",
            "seconds": round(time.monotonic() - started, 1),
            "model": active_model(),
        }
        return financial_data
    finally:
        _remove(main_path)
        _remove(prev_path)
