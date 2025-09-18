import os
import tempfile
import time
import json
import pymupdf4llm
import google.generativeai as genai

# --- AI CONFIGURATION ---

GEMINI_API_KEY = "AIzaSyAgZnXiBti7BTH2i4XVQntSQti665IiRQc"
genai.configure(api_key=GEMINI_API_KEY)

# --- MAIN LOGIC ---

def _build_extraction_prompt(country):
    """Builds the prompt for data extraction."""
    numeric_keys = ["totalCurrentAssets", "totalNonCurrentAssets", "inventories", "totalCurrentLiabilities", "totalNonCurrentLiabilities", "retainedEarnings", "ebit", "revenue", "totalEquity", "netIncome", "interestExpense", "tangibleFixedAssets", "operatingCashFlow", "marketCapitalization"]

    context_keys = ["companyName", "fiscalYear"]
    all_keys = numeric_keys + context_keys
    
    language_instructions = (
        "You are an expert financial analyst specializing in extracting data from Italian financial statements (Bilancio d'Esercizio)."
        if country.lower() == 'italy' else
        "You are an expert financial analyst specializing in extracting data from US financial statements (Form 10-K)."
    )

    prompt = f"""
    {language_instructions}
    Analyze the Markdown text from a financial document. Identify the values for these items for the most recent year: {', '.join(all_keys)}.
    Your response MUST be a single, valid JSON object and nothing else.
    - JSON keys must exactly match the item names.
    - For numerical keys, values must be numbers only. If a value is not found, it MUST be 0.
    - For 'companyName', the value must be a string. If not found, use "N/A".
    - For 'fiscalYear', the value must be a number. If not found, use 0.
    """
    return prompt

def extract_data_with_llm(md_text, country):
    """Sends the text to the Gemini API to extract financial data."""
    prompt = _build_extraction_prompt(country)
    try:
        print("--- CALLING GEMINI API FOR DATA EXTRACTION ---")
        model = genai.GenerativeModel('gemini-1.5-flash')
        full_prompt = prompt + "\n\nMARKDOWN_TEXT:\n" + md_text
        
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
        )
        
        extracted_data = json.loads(response.text)
        print("--- AI RESPONSE RECEIVED ---")
        return extracted_data
    except Exception as e:
        raise ValueError(f"AI data extraction failed: {e}")
    
def process_document_data(file_storage, country, company_type, industry_sector):
    """Orchestrates file saving, conversion, AI extraction, and cleanup."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        temp_path = tmp.name
        file_storage.save(temp_path)

    try:
        print(f"Step 1: Converting '{file_storage.filename}' to Markdown...")
        md_text = pymupdf4llm.to_markdown(temp_path)
        
        print("Step 2: Extracting raw data with AI...")
        financial_data = extract_data_with_llm(md_text, country)
        financial_data['country'] = country
        financial_data['isPubliclyListed'] = company_type == 'public'
        financial_data['industrySector'] = industry_sector
        
        if not financial_data.get("fiscalYear") or financial_data["fiscalYear"] == 0:
            financial_data["fiscalYear"] = 2025

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
                    print(f"Successfully cleaned up {temp_path}")
                    break
                except PermissionError:
                    time.sleep(0.1)
                except Exception:
                    break
