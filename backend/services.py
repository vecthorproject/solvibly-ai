import os
import tempfile
import time
import json
import pymupdf4llm
from google import genai
from google.genai import types
from dotenv import load_dotenv

# --- AI CONFIGURATION ---

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- PROMPTS ---

def _build_extraction_prompt(country, keys=None):
    """Builds the prompt for data extraction."""
    numeric_keys = [
        "totalCurrentAssets", "totalNonCurrentAssets", "inventories",
        "totalCurrentLiabilities", "totalNonCurrentLiabilities",
        "retainedEarnings", "ebit", "revenue", "totalEquity",
        "netIncome", "interestExpense", "tangibleFixedAssets",
        "operatingCashFlow", "marketCapitalization"
    ]
    context_keys = ["companyName", "fiscalYear"]
    default_keys = numeric_keys + context_keys

    target_keys = keys or default_keys

    language_instructions = (
        "You are an expert financial analyst specializing in extracting data from Italian financial statements (Bilancio d'Esercizio)."
        if country.lower() == 'italy' else
        "You are an expert financial analyst specializing in extracting data from US financial statements (Form 10-K)."
    )

    prompt = f"""
    {language_instructions}
    Analyze the Markdown text from a financial statement and identify the values for these items for the most recent fiscal year shown: {', '.join(target_keys)}.
    Your response must be a single valid JSON object.
    - Keys must exactly match the provided names.
    - Numeric values must be pure numbers. Use 0 if not found.
    - 'companyName' must be a string; if missing, use "N/A".
    - 'fiscalYear' must be a four-digit year (YYYY). If missing, use the current year.
    """
    return prompt


def extract_data_with_llm(md_text, country, keys=None):
    """Sends the text to the Gemini API to extract financial data."""
    prompt = _build_extraction_prompt(country, keys)
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        model_id = "gemini-2.5-flash"

        response = client.models.generate_content(
            model=model_id,
            contents=prompt + "\n\nMARKDOWN_TEXT:\n" + md_text,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        raw = getattr(response, "text", None)
        if not raw:
            cand = getattr(response, "candidates", None)
            if cand and hasattr(cand[0], "content") and hasattr(cand[0].content, "parts"):
                raw = "".join(getattr(p, "text", "") for p in cand[0].content.parts)

        if isinstance(raw, dict):
            extracted_data = raw
        else:
            extracted_data = json.loads(str(raw).strip())

        return extracted_data
    except Exception as e:
        raise ValueError(f"AI data extraction failed: {e}")


def _build_previous_year_prompt(country: str) -> str:
    """Builds a focused prompt for extracting only Net Income t-1 from the previous-year PDF."""
    language_instructions = (
        "You are an expert financial analyst specialized in Italian financial statements (Bilancio d'Esercizio). "
        "Extract only the Net Income (Utile Netto) for the most recent fiscal year shown in this document."
        if country.lower() == "italy"
        else
        "You are an expert financial analyst specialized in US financial statements (Form 10-K or 10-Q). "
        "Extract only the Net Income (Net Earnings or Net Profit) for the most recent fiscal year shown in this document."
    )

    prompt = f"""
    {language_instructions}

    Your task:
    - Identify and extract **only** the value of Net Income for the latest fiscal year.
    - Respond with a single valid JSON object in this format:
        {{
            "netIncome": <numeric_value>
        }}

    Rules:
    - The numeric value must be a plain number (no text, no currency symbol, no commas).
    - If Net Income is negative, use the minus sign (e.g., -1234567).
    - If multiple years are shown, always choose the most recent one.
    - If Net Income is not found, return {{"netIncome": 0}}.
    - Do NOT include any explanation, text, or formatting beyond the JSON object.
    """
    return prompt


def extract_previous_year_net_income(prev_file_storage, country):
    """Estrae il Net Income t-1 dal PDF del bilancio precedente."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        temp_path = tmp.name
        prev_file_storage.save(temp_path)
        tmp.flush()
        tmp.close()
        time.sleep(0.1)

    try:
        md_text = pymupdf4llm.to_markdown(temp_path)
        prompt = _build_previous_year_prompt(country)

        client = genai.Client(api_key=GEMINI_API_KEY)
        model_id = "gemini-2.5-flash"
        response = client.models.generate_content(
            model=model_id,
            contents=prompt + "\n\nMARKDOWN_TEXT:\n" + md_text,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        raw = getattr(response, "text", None)

        if not raw:
            cand = getattr(response, "candidates", None)
            if cand and hasattr(cand[0], "content") and hasattr(cand[0].content, "parts"):
                raw = "".join(getattr(p, "text", "") for p in cand[0].content.parts)

        data = json.loads(str(raw).strip())
        value = data.get("netIncome")

        if isinstance(value, str):
            value = value.replace(",", "").replace(" ", "")
            try:
                value = float(value)
            except ValueError:
                value = None

        return value if isinstance(value, (int, float)) else None

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


def process_document_data(file_storage, country, company_type, industry_sector, *, keys=None, prev_file=None):
    """Orchestrates file saving, conversion, AI extraction, and cleanup."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        temp_path = tmp.name
        file_storage.save(temp_path)
        tmp.flush()
        tmp.close()
        time.sleep(0.1)

    try:
        md_text = pymupdf4llm.to_markdown(temp_path)
        financial_data = extract_data_with_llm(md_text, country, keys=keys)

        if prev_file:
            ni_prev = extract_previous_year_net_income(prev_file, country)
            if ni_prev is not None:
                financial_data["netIncome_t_minus_1"] = ni_prev

        financial_data['country'] = country
        financial_data['isPubliclyListed'] = company_type == 'public'
        financial_data['industrySector'] = industry_sector

        if not financial_data.get("fiscalYear"):
            financial_data["fiscalYear"] = int(time.strftime("%Y"))

        if not financial_data.get("companyName") or financial_data.get("companyName") == "N/A":
            fname = file_storage.filename
            max_len = 25
            base, ext = os.path.splitext(fname)
            if len(base) > max_len:
                base = base[:max_len] + "…"
            financial_data["companyName"] = f"Doc: {base}{ext}"

        return financial_data

    finally:
        if os.path.exists(temp_path):
            for _ in range(5):
                try:
                    os.remove(temp_path)
                    break
                except PermissionError:
                    time.sleep(0.1)
                except Exception:
                    break
