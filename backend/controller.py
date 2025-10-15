from flask import request, jsonify
from calculation import *
from services import process_document_data


import traceback

# --- CALCULATIONS LOGIC ---

def _calculate_results(financial_data):
    financial_data["totalAssets"] = financial_data.get("totalCurrentAssets", 0) + financial_data.get("totalNonCurrentAssets", 0)
    financial_data["totalLiabilities"] = financial_data.get("totalCurrentLiabilities", 0) + financial_data.get("totalNonCurrentLiabilities", 0)
    financial_data["workingCapital"] = financial_data.get("totalCurrentAssets", 0) - financial_data.get("totalCurrentLiabilities", 0)

    dscr_value = 'N/A'
    if financial_data.get("dscrCashFlow") and financial_data.get("dscrDebtService"):
        dscr_value = calculate_dscr(financial_data)
    
    results = {
        "country": financial_data.get("country"),
        "companyName": financial_data.get("companyName"),
        "industrySector": financial_data.get("industrySector"),
        "fiscalYear": financial_data.get("fiscalYear"),

        "currentRatio": round(financial_data["totalCurrentAssets"] / financial_data["totalCurrentLiabilities"], 4) if financial_data.get("totalCurrentLiabilities") > 0 else 'N/A',
        "quickRatio": round((financial_data["totalCurrentAssets"] - financial_data.get("inventories", 0)) / financial_data["totalCurrentLiabilities"], 4) if financial_data.get("totalCurrentLiabilities") > 0 else 'N/A',
        "debtToEquityRatio": round(financial_data["totalLiabilities"] / financial_data["totalEquity"], 4) if financial_data.get("totalEquity") > 0 else 'N/A',
        "debtToAssetsRatio": round(financial_data["totalLiabilities"] / financial_data["totalAssets"], 4) if financial_data.get("totalAssets") > 0 else 'N/A',
        "interestCoverageRatio": round(financial_data["ebit"] / financial_data["interestExpense"], 4) if financial_data.get("interestExpense") > 0 else 'N/A',
        "roa": round(financial_data["netIncome"] / financial_data["totalAssets"], 4) if financial_data.get("totalAssets") > 0 else 'N/A',
        "roe": round(financial_data["netIncome"] / financial_data["totalEquity"], 4) if financial_data.get("totalEquity") > 0 else 'N/A',
        "roi": round(financial_data["ebit"] / financial_data["totalAssets"], 4) if financial_data.get("totalAssets") > 0 else 'N/A',
        "ros": round(financial_data["ebit"] / financial_data["revenue"], 4) if financial_data.get("revenue") > 0 else 'N/A',
        "assetTurnover": round(financial_data["revenue"] / financial_data["totalAssets"], 4) if financial_data.get("totalAssets") > 0 else 'N/A',
        
        "altmanZScore": calculate_altman_zscore(financial_data),
        "springateSScore": calculate_springate_sscore(financial_data),
        "tafflerTScore": calculate_taffler_tscore(financial_data),
        "fulmerHFactor": calculate_fulmer_hfactor(financial_data),
        "groverGScore": calculate_grover_gscore(financial_data),

        "dscr": dscr_value
    }
    return results

# --- ENDPOINTS LOGIC ---

def predict():
    """MANUAL FORM LOGIC"""
    try:
        data = request.get_json()
    
        numeric_keys = ["totalCurrentAssets", "totalNonCurrentAssets", "inventories", "totalCurrentLiabilities", "totalNonCurrentLiabilities", "retainedEarnings", "ebit", "revenue", "totalEquity", "netIncome", "interestExpense", "tangibleFixedAssets", "operatingCashFlow", "marketCapitalization", "dscrCashFlow", "dscrDebtService"]
        string_keys = ["country", "companyName", "industrySector", "fiscalYear", "isPubliclyListed"]
        financial_data = {}
        for key in numeric_keys:
            if key == "marketCapitalization" and not data.get("isPubliclyListed"):
                financial_data[key] = 0.0
            else:
                financial_data[key] = float(data.get(key) or 0)
        for key in string_keys:
            financial_data[key] = data.get(key)
        
        results = _calculate_results(financial_data)
        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500


def upload():
    """UPLOAD FILE LOGIC"""
    try:
        file = request.files.get('document')
        country = request.form.get('country')
        company_type = request.form.get('companyType')
        industry_sector = request.form.get('industrySector')

        dscr_cash_flow = request.form.get('dscrCashFlow')
        dscr_debt_service = request.form.get('dscrDebtService')

        if not file:
            return jsonify({'error': 'No file part'}), 400

        financial_data_from_file = process_document_data(file, country, company_type, industry_sector)

        financial_data_from_file['dscrCashFlow'] = float(dscr_cash_flow or 0)
        financial_data_from_file['dscrDebtService'] = float(dscr_debt_service or 0)

        results = _calculate_results(financial_data_from_file)
        return jsonify(results)
        
    except Exception as e:
        print("🔥 ERRORE NELLA ROTTA /upload 🔥")
        traceback.print_exc()
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500
