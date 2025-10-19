from flask import request, jsonify
from calculation import *
from calculation import compute_esg_score, _to_float_or_none
from services import process_document_data

# --- CALCULATIONS LOGIC ---

def _calculate_results(financial_data):
    financial_data["totalAssets"] = financial_data.get("totalCurrentAssets", 0) + financial_data.get("totalNonCurrentAssets", 0)
    financial_data["totalLiabilities"] = financial_data.get("totalCurrentLiabilities", 0) + financial_data.get("totalNonCurrentLiabilities", 0)
    financial_data["workingCapital"] = financial_data.get("totalCurrentAssets", 0) - financial_data.get("totalCurrentLiabilities", 0)

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
    }

    esg = compute_esg_score(
        esg_rating=financial_data.get("esgRating"),
        e=financial_data.get("esgScore_E"),
        s=financial_data.get("esgScore_S"),
        g=financial_data.get("esgScore_G"),
    )
    results["esgOverallScore"] = esg["overall_esg_score"]
    results["esgSource"] = esg["source"]
    results["esgRating"] = esg["rating"]
    results["esgScore_E"] = esg["e"]
    results["esgScore_S"] = esg["s"]
    results["esgScore_G"] = esg["g"]

    enriched_financial_data = {**financial_data, **results}

    dscr_value = 'N/A'
    if enriched_financial_data.get("dscrCashFlow") and enriched_financial_data.get("dscrDebtService"):
        dscr_value = calculate_dscr(enriched_financial_data)
    
    results["dscr"] = dscr_value
    results["altmanZScore"] = calculate_altman_zscore(enriched_financial_data)
    results["springateSScore"] = calculate_springate_sscore(enriched_financial_data)
    results["tafflerTScore"] = calculate_taffler_tscore(enriched_financial_data)
    results["fulmerHFactor"] = calculate_fulmer_hfactor(enriched_financial_data)
    results["groverGScore"] = calculate_grover_gscore(enriched_financial_data)
    results["zmijewskiXScore"] = calculate_zmijewski_xscore(enriched_financial_data)
    results["ohlsonOScore"] = 'N/A'
    if enriched_financial_data.get("netIncome_t_minus_1"):
        results["ohlsonOScore"] = calculate_ohlson_oscore(enriched_financial_data)
    
    return results

# --- ENDPOINTS LOGIC ---

def predict():
    """MANUAL FORM LOGIC"""
    try:
        data = request.get_json()
    
        numeric_keys = [
            "totalCurrentAssets", "totalNonCurrentAssets", "inventories",
            "totalCurrentLiabilities", "totalNonCurrentLiabilities",
            "retainedEarnings", "ebit", "revenue", "totalEquity",
            "netIncome", "interestExpense", "tangibleFixedAssets",
            "operatingCashFlow", "marketCapitalization",
            "dscrCashFlow", "dscrDebtService", "netIncome_t_minus_1"
        ]
        string_keys = ["country", "companyName", "industrySector", "fiscalYear", "isPubliclyListed", "esgRating"]

        financial_data = {}
        for key in numeric_keys:
            if key == "marketCapitalization" and not data.get("isPubliclyListed"):
                financial_data[key] = 0.0
            else:
                financial_data[key] = float(data.get(key) or 0)
        for key in string_keys:
            financial_data[key] = data.get(key)

        financial_data["esgRating"] = (financial_data.get("esgRating") or "").strip().upper()
        financial_data["esgScore_E"] = _to_float_or_none(data.get("esgScore_E"))
        financial_data["esgScore_S"] = _to_float_or_none(data.get("esgScore_S"))
        financial_data["esgScore_G"] = _to_float_or_none(data.get("esgScore_G"))
        
        results = _calculate_results(financial_data)
        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500


def upload():
    """UPLOAD FILE LOGIC"""
    try:
        file = request.files.get('document')
        previous_pdf = request.files.get('previousDocument')
        country = request.form.get('country')
        company_type = request.form.get('companyType')
        industry_sector = request.form.get('industrySector')

        dscr_cash_flow = request.form.get('dscrCashFlow')
        dscr_debt_service = request.form.get('dscrDebtService')
        net_income_prev = request.form.get('netIncome_t_minus_1')

        esg_rating = request.form.get('esgRating')
        esg_e = request.form.get('esgScore_E')
        esg_s = request.form.get('esgScore_S')
        esg_g = request.form.get('esgScore_G')

        if not file:
            return jsonify({'error': 'No file part'}), 400

        financial_data_from_file = process_document_data(
            file, country, company_type, industry_sector, prev_file=previous_pdf
        )

        financial_data_from_file['dscrCashFlow'] = float(dscr_cash_flow or 0)
        financial_data_from_file['dscrDebtService'] = float(dscr_debt_service or 0)

        if net_income_prev:
            financial_data_from_file['netIncome_t_minus_1'] = float(net_income_prev)

        financial_data_from_file['esgRating'] = (esg_rating or '').strip().upper()
        financial_data_from_file['esgScore_E'] = _to_float_or_none(esg_e)
        financial_data_from_file['esgScore_S'] = _to_float_or_none(esg_s)
        financial_data_from_file['esgScore_G'] = _to_float_or_none(esg_g)

        results = _calculate_results(financial_data_from_file)
        return jsonify(results)
        
    except Exception as e:
        import traceback
        traceback.print_exc() #to remove
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500
