"""
services.py — PDF reading and AI extraction of financial data.

Speed and robustness:
  - only the pages that contain the financial statements are sent to the model
    (balance sheet, income statement, cash flow, notes on debts), with a fallback
    to the whole document when the selection is too small;
  - scanned PDFs (no text layer) are sent to Gemini as PDF so the model can read them;
  - the current-year and previous-year documents are processed in parallel;
  - the Gemini client is created once and reused.
"""
from __future__ import annotations

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
from google import genai
from google.genai import types

load_dotenv()

log = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Below this many characters of extractable text, a PDF is treated as scanned.
MIN_TEXT_CHARS = 400
# Documents up to this many pages are sent whole.
SMALL_DOC_PAGES = 12


class AIServiceUnavailable(RuntimeError):
    """Raised when the AI provider is not configured."""


class ExtractionError(RuntimeError):
    """Raised when the document cannot be read or the AI answer is not usable."""


_client = None


def _get_client():
    global _client
    if not GEMINI_API_KEY:
        raise AIServiceUnavailable("GEMINI_API_KEY is not set")
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


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
- Use null when an item is not present in the document (do not guess, do not use 0 for missing items).
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

def _response_text(response) -> str:
    raw = getattr(response, "text", None)
    if raw:
        return raw
    cand = getattr(response, "candidates", None)
    if cand and hasattr(cand[0], "content") and hasattr(cand[0].content, "parts"):
        return "".join(getattr(p, "text", "") or "" for p in cand[0].content.parts)
    return ""


def _parse_json(raw: str) -> Dict[str, Any]:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise ExtractionError("The AI answer was not valid JSON.") from e
    if not isinstance(data, dict):
        raise ExtractionError("The AI answer was not a JSON object.")
    return data


def _call_model(prompt: str, content: Dict[str, Any]) -> Dict[str, Any]:
    client = _get_client()
    if content.get("pdf_bytes"):
        contents = [types.Part.from_bytes(data=content["pdf_bytes"], mime_type="application/pdf"), prompt]
    else:
        contents = prompt + "\n\nMARKDOWN_TEXT:\n" + (content.get("markdown") or "")
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0),
    )
    return _parse_json(_response_text(response))


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
    prompt = _build_extraction_prompt(country, keys)
    try:
        data = _call_model(prompt, content)
    except (AIServiceUnavailable, ExtractionError):
        raise
    except Exception as e:
        log.exception("AI extraction failed")
        raise ExtractionError("AI data extraction failed.") from e

    out: Dict[str, Any] = {}
    for k, v in data.items():
        if k in CONTEXT_KEYS:
            out[k] = v
        else:
            out[k] = to_number(v)
    return out


def _previous_year_prompt(country: str) -> str:
    italy = _country_key(country) == "italy"
    item = "the Net Income (\"Utile (perdita) dell'esercizio\")" if italy else "the Net Income (net earnings)"
    return f"""
You are an expert financial analyst. Extract only {item} for the most recent fiscal year shown in this document.
Respond with a single JSON object: {{"netIncome": <number or null>}}. Plain number in units, minus sign for losses.
"""


def extract_previous_year_net_income(path: str, country: str) -> Optional[float]:
    content = read_pdf(path, country)
    data = _call_model(_previous_year_prompt(country), content)
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
            "model": GEMINI_MODEL,
        }
        return financial_data
    finally:
        _remove(main_path)
        _remove(prev_path)
