from flask import request, jsonify
from calculation import *

# --- CONTROLLER LOGIC ---

def predict():
    data = request.get_json()

    try:
        numeric_keys = [
            "totalCurrentAssets", "totalNonCurrentAssets", "inventories", 
            "totalCurrentLiabilities", "totalNonCurrentLiabilities", 
            "retainedEarnings", "ebit", "revenue", "totalEquity", 
            "netIncome", "interestExpense", "tangibleFixedAssets", 
            "operatingCashFlow", "marketCapitalization"
        ]
        string_keys = ["country", "companyName", "industrySector", "fiscalYear", "isPubliclyListed"]

        financial_data = {}

        for key in numeric_keys:
            if key == "marketCapitalization" and not data.get("isPubliclyListed"):
                financial_data[key] = 0.0
            else:
                financial_data[key] = float(data.get(key, 0))

        for key in string_keys:
            financial_data[key] = data.get(key)
        
        financial_data["totalAssets"] = financial_data["totalCurrentAssets"] + financial_data["totalNonCurrentAssets"]
        financial_data["totalLiabilities"] = financial_data["totalCurrentLiabilities"] + financial_data["totalNonCurrentLiabilities"]
        financial_data["workingCapital"] = financial_data["totalCurrentAssets"] - financial_data["totalCurrentLiabilities"]

        results = {
            "country": financial_data["country"],
            "companyName": financial_data["companyName"],
            "industrySector": financial_data["industrySector"],
            "fiscalYear": financial_data["fiscalYear"],

            "currentRatio": round(financial_data["totalCurrentAssets"] / financial_data["totalCurrentLiabilities"], 4) if financial_data["totalCurrentLiabilities"] > 0 else 'N/A',
            "quickRatio": round((financial_data["totalCurrentAssets"] - financial_data["inventories"]) / financial_data["totalCurrentLiabilities"], 4) if financial_data["totalCurrentLiabilities"] > 0 else 'N/A',
            "debtToEquityRatio": round(financial_data["totalLiabilities"] / financial_data["totalEquity"], 4) if financial_data["totalEquity"] > 0 else 'N/A',
            "debtToAssetsRatio": round(financial_data["totalLiabilities"] / financial_data["totalAssets"], 4) if financial_data["totalAssets"] > 0 else 'N/A',
            "interestCoverageRatio": round(financial_data["ebit"] / financial_data["interestExpense"], 4) if financial_data["interestExpense"] > 0 else 'N/A',
            "roa": round(financial_data["netIncome"] / financial_data["totalAssets"], 4) if financial_data["totalAssets"] > 0 else 'N/A',
            "roe": round(financial_data["netIncome"] / financial_data["totalEquity"], 4) if financial_data["totalEquity"] > 0 else 'N/A',
            "roi": round(financial_data["ebit"] / financial_data["totalAssets"], 4) if financial_data["totalAssets"] > 0 else 'N/A',
            "ros": round(financial_data["ebit"] / financial_data["revenue"], 4) if financial_data["revenue"] > 0 else 'N/A',
            "assetTurnover": round(financial_data["revenue"] / financial_data["totalAssets"], 4) if financial_data["totalAssets"] > 0 else 'N/A',
            
            "altmanZScore": calculate_altman_zscore(financial_data),
            "springateSScore": calculate_springate_sscore(financial_data),
            "tafflerTScore": calculate_taffler_tscore(financial_data),
            "fulmerHFactor": calculate_fulmer_hfactor(financial_data),
            "groverGScore": calculate_grover_gscore(financial_data)
        }

        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500
