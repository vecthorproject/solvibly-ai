from flask import Flask, request, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # To change before release!

# --- CALCULATION FUNCTIONS ---
def calculate_altman_zscore(financials):
    try:
        a = financials["workingCapital"] / financials["totalAssets"]
        b = financials["retainedEarnings"] / financials["totalAssets"]
        c = financials["ebit"] / financials["totalAssets"]
        e = financials["revenue"] / financials["totalAssets"]
        d_priv = financials["totalEquity"] / financials["totalLiabilities"]
        
        if financials["isPubliclyListed"]:
            d_pub = financials["marketCapitalization"] / financials["totalLiabilities"]
            if financials["industrySector"] == "manufacturing":
                zscore = 1.2*a + 1.4*b + 3.3*c + 0.6*d_pub + 1.0*e
            else:
                zscore = 6.56*a + 3.26*b + 6.72*c + 1.05*d_priv
        else:
            zscore = 0.717*a + 0.847*b + 3.107*c + 0.420*d_priv + 0.998*e
        
        return round(zscore, 4)
    except (ZeroDivisionError, KeyError):
        return 'N/A'

def calculate_springate_sscore(financials):
    try:
        a = financials["ebit"] / financials["totalAssets"]
        b = financials["netIncome"] / financials["totalAssets"]
        c = financials["ebit"] / financials["totalCurrentLiabilities"]
        d = financials["revenue"] / financials["totalAssets"]
        sscore = 1.03*a + 3.07*b + 0.66*c + 0.4*d
        return round(sscore, 4)
    except (ZeroDivisionError, KeyError):
        return 'N/A'

def calculate_taffler_tscore(financials):
    try:
        a = financials["ebit"] / financials["totalCurrentLiabilities"]
        b = financials["totalCurrentAssets"] / financials["totalLiabilities"]
        c = financials["totalCurrentLiabilities"] / financials["totalAssets"]
        d = financials["workingCapital"] / financials["totalAssets"]
        tscore = 0.53*a + 0.13*b + 0.18*c + 0.16*d
        return round(tscore, 4)
    except (ZeroDivisionError, KeyError):
        return 'N/A'

def calculate_fulmer_hfactor(financials):
    try:
        a = financials["retainedEarnings"] / financials["totalAssets"]
        b = financials["revenue"] / financials["totalAssets"]
        c = financials["ebit"] / financials["totalAssets"]
        d = financials["operatingCashFlow"] / financials["totalLiabilities"]
        e = financials["totalLiabilities"] / financials["totalAssets"]
        f = financials["totalCurrentLiabilities"] / financials["totalAssets"]
        g = math.log(financials["tangibleFixedAssets"]) if financials["tangibleFixedAssets"] > 0 else 0
        h = financials["workingCapital"] / financials["totalLiabilities"]
        
        ebit_to_interest = financials["ebit"] / financials["interestExpense"]
        i = math.log(ebit_to_interest) if ebit_to_interest > 0 else 0
        
        hfactor = 5.528*a + 0.212*b + 0.073*c + 1.270*d - 0.120*e + 2.335*f + 0.575*g + 1.083*h + 0.894*i - 6.075
        return round(hfactor, 4)
    except (ZeroDivisionError, KeyError, ValueError):
        return 'N/A'

def calculate_grover_gscore(financials):
    try:
        a = financials["ebit"] / financials["totalAssets"]
        b = financials["netIncome"] / financials["totalAssets"]
        c = financials["workingCapital"] / financials["totalAssets"]
        gscore = 1.650*a + 3.404*b - 0.016*c + 0.057
        return round(gscore, 4)
    except (ZeroDivisionError, KeyError):
        return 'N/A'


# --- MAIN PREDICTION ENDPOINT ---
@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()

    try:
        # --- 1. Data Preparation ---
        financial_data = {
            "totalCurrentAssets": float(data.get("totalCurrentAssets", 0)),
            "totalNonCurrentAssets": float(data.get("totalNonCurrentAssets", 0)),
            "inventories": float(data.get("inventories", 0)),
            "totalCurrentLiabilities": float(data.get("totalCurrentLiabilities", 0)),
            "totalNonCurrentLiabilities": float(data.get("totalNonCurrentLiabilities", 0)),
            "retainedEarnings": float(data.get("retainedEarnings", 0)),
            "ebit": float(data.get("ebit", 0)),
            "revenue": float(data.get("revenue", 0)),
            "totalEquity": float(data.get("totalEquity", 0)),
            "netIncome": float(data.get("netIncome", 0)),
            "interestExpense": float(data.get("interestExpense", 0)),
            "tangibleFixedAssets": float(data.get("tangibleFixedAssets", 0)),
            "operatingCashFlow": float(data.get("operatingCashFlow", 0)),
            "country": data.get("country"),
            "companyName": data.get("companyName"),
            "industrySector": data.get("industrySector"),
            "fiscalYear": data.get("fiscalYear"),
            "isPubliclyListed": data.get("isPubliclyListed"),
            "marketCapitalization": float(data.get("marketCapitalization", 0)) if data.get("isPubliclyListed") else 0
        }

        financial_data["totalAssets"] = financial_data["totalCurrentAssets"] + financial_data["totalNonCurrentAssets"]
        financial_data["totalLiabilities"] = financial_data["totalCurrentLiabilities"] + financial_data["totalNonCurrentLiabilities"]
        financial_data["workingCapital"] = financial_data["totalCurrentAssets"] - financial_data["totalCurrentLiabilities"]

        # --- 2. Calculation & Response ---
        results = {
            "country": financial_data["country"],
            "companyName": financial_data["companyName"],
            "industrySector": financial_data["industrySector"],
            "fiscalYear": financial_data["fiscalYear"],
            "isPubliclyListed": financial_data["isPubliclyListed"],

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
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500

# --- RUN SERVER ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)