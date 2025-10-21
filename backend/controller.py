from flask import request, jsonify
from calculation import *
from calculation import compute_esg_score, _to_float_or_none
from services import process_document_data
from ml_infer import score_from_financial_dict, MODEL_PATH_DEFAULT
import math
import os

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

    # --- Vecthor Index ---
    used_calibrated = False
    try:
        fin_for_model = {
            "sic": financial_data.get("sic"),
            "fiscalYear": financial_data.get("fiscalYear"),
            "totalCurrentAssets": financial_data.get("totalCurrentAssets"),
            "totalNonCurrentAssets": financial_data.get("totalNonCurrentAssets"),
            "totalCurrentLiabilities": financial_data.get("totalCurrentLiabilities"),
            "totalNonCurrentLiabilities": financial_data.get("totalNonCurrentLiabilities"),
            "inventories": financial_data.get("inventories"),
            "totalAssets": financial_data.get("totalAssets"),
            "totalLiabilities": financial_data.get("totalLiabilities"),
            "totalEquity": financial_data.get("totalEquity"),
            "revenue": financial_data.get("revenue"),
            "ebit": financial_data.get("ebit"),
            "netIncome": financial_data.get("netIncome"),
            "interestExpense": financial_data.get("interestExpense"),
            "operatingCashFlow": financial_data.get("operatingCashFlow"),
            "tangibleFixedAssets": financial_data.get("tangibleFixedAssets"),
            "retainedEarnings": financial_data.get("retainedEarnings"),
            "depreciation": financial_data.get("depreciation"),
            "workingCapital": financial_data.get("workingCapital"),
            "netIncome_t_minus_1": financial_data.get("netIncome_t_minus_1"),
            "quickAssets": financial_data.get("quickAssets"),
            "sharesOutstanding": financial_data.get("sharesOutstanding"),
            "marketCapitalization": financial_data.get("marketCapitalization"),
            "isPubliclyListed": financial_data.get("isPubliclyListed"),
            "gnpPriceLevelIndex": financial_data.get("gnpPriceLevelIndex"),
            "longTermDebtCurrent": financial_data.get("longTermDebtCurrent"),
            "dscrCashFlow_proxy": financial_data.get("dscrCashFlow", financial_data.get("operatingCashFlow")),
            "dscrDebtService_proxy": (
                financial_data.get("dscrDebtService")
                if financial_data.get("dscrDebtService") is not None
                else (financial_data.get("interestExpense", 0.0) + financial_data.get("longTermDebtCurrent", 0.0))
            ),
        }
        model_path_try = MODEL_PATH_DEFAULT
        cal_try = r".\models\vecthor_rf_cal.joblib"
        if os.path.exists(cal_try):
            model_path_try = cal_try
            used_calibrated = True

        ml_out = score_from_financial_dict(model_path_try, fin_for_model)
        p = float(ml_out["prob_12m"])
        if p <= 0.0 or p >= 1.0:
            p = max(1e-6, min(1.0 - 1e-6, p))
        results["vecthorMLScore"] = round(p, 6)
    except Exception:
        results["vecthorMLScore"] = "N/A"
        used_calibrated = False
    
    # --- Solvibly Score — full blend (Vecthor Index + Ratios + Models + ESG + Vecthor Index) ---
    def _to_num(x):
        try:
            v = float(x)
            return v if math.isfinite(v) else None
        except Exception:
            return None

    def _clip01(x):
        try:
            x = float(x)
            if not math.isfinite(x): return None
            return max(0.0, min(1.0, x))
        except Exception:
            return None

    # linear mapping 0..1 (risk)
    def _lin_risk_higher_better(val, low_bad, high_good):
        v = _to_num(val)
        if v is None: return None
        if v <= low_bad: return 1.0
        if v >= high_good: return 0.0
        return (high_good - v) / (high_good - low_bad)

    def _lin_risk_lower_better(val, low_good, high_bad):
        v = _to_num(val)
        if v is None: return None
        if v <= low_good: return 0.0
        if v >= high_bad: return 1.0
        return (v - low_good) / (high_bad - low_good)

    # Vecthor index -> risk
    ml = results.get("vecthorMLScore")
    ml = float(ml) if isinstance(ml, (int, float)) else None

    # DSCR -> risk
    def _risk_from_dscr(dscr, low=0.8, high=1.5):
        d = _to_num(dscr)
        if d is None: return None
        return _clip01(1.0 - (d - low) / (high - low))
    dscr_risk = _risk_from_dscr(results.get("dscr")) if results.get("dscr") not in (None, 'N/A') else None

    # Ohlson -> prob. - risk
    def _prob_from_ohlson(ohlson_o):
        z = _to_num(ohlson_o)
        if z is None: return None
        return 1.0 / (1.0 + math.exp(-z))
    ohlson_prob = _prob_from_ohlson(results.get("ohlsonOScore")) if results.get("ohlsonOScore") not in (None, 'N/A') else None

    # Altman -> risk
    def _risk_from_altman(z, z_safe=3.0, z_distress=1.81):
        v = _to_num(z)
        if v is None: return None
        if v >= z_safe: return 0.0
        if v <= z_distress: return 1.0
        return (z_safe - v) / (z_safe - z_distress)
    altman_risk = _risk_from_altman(results.get("altmanZScore")) if results.get("altmanZScore") not in (None, 'N/A') else None

    # Zmijewski -> risk
    def _risk_from_zmijewski(x):
        v = _to_num(x)
        if v is None: return None
        if v <= -2.0: return 0.0
        if v >= 2.0:  return 1.0
        return (v - (-2.0)) / (2.0 - (-2.0))
    zmij_risk = _risk_from_zmijewski(results.get("zmijewskiXScore")) if results.get("zmijewskiXScore") not in (None, 'N/A') else None

    # Springate / Taffler / Fulmer / Grover -> risk
    def _risk_from_springate(s): return _lin_risk_higher_better(s, low_bad=0.86, high_good=1.10)
    def _risk_from_taffler(t):  return _lin_risk_higher_better(t, low_bad=0.20, high_good=0.30)
    def _risk_from_fulmer(h):   return _lin_risk_higher_better(h, low_bad=-1.0, high_good=1.0)
    def _risk_from_grover(g):   return _lin_risk_higher_better(g, low_bad=-0.50, high_good=0.20)

    spring_risk = _risk_from_springate(results.get("springateSScore")) if results.get("springateSScore") not in (None, 'N/A') else None
    taffler_risk = _risk_from_taffler(results.get("tafflerTScore"))   if results.get("tafflerTScore")   not in (None, 'N/A') else None
    fulmer_risk  = _risk_from_fulmer(results.get("fulmerHFactor"))    if results.get("fulmerHFactor")    not in (None, 'N/A') else None
    grover_risk  = _risk_from_grover(results.get("groverGScore"))     if results.get("groverGScore")     not in (None, 'N/A') else None

    # ESG -> risk
    esg_overall = results.get("esgOverallScore")
    esg_overall_num = _to_num(esg_overall)
    if esg_overall_num is not None:
        esg_norm01 = esg_overall_num / 100.0 if esg_overall_num > 1.0 else esg_overall_num
        esg_risk = _clip01(1.0 - esg_norm01)
    else:
        esg_risk = None

    # Key ratios -> risk
    cr_r  = _lin_risk_higher_better(results.get("currentRatio"),          low_bad=1.0,  high_good=2.0)
    qr_r  = _lin_risk_higher_better(results.get("quickRatio"),            low_bad=1.0,  high_good=1.5)
    icr_r = _lin_risk_higher_better(results.get("interestCoverageRatio"), low_bad=1.0,  high_good=5.0)
    roa_r = _lin_risk_higher_better(results.get("roa"),                   low_bad=-0.05, high_good=0.15)
    roe_r = _lin_risk_higher_better(results.get("roe"),                   low_bad=-0.10, high_good=0.25)
    roi_r = _lin_risk_higher_better(results.get("roi"),                   low_bad=-0.05, high_good=0.15)
    ros_r = _lin_risk_higher_better(results.get("ros"),                   low_bad=-0.05, high_good=0.15)
    at_r  = _lin_risk_higher_better(results.get("assetTurnover"),         low_bad=0.20, high_good=1.50)
    dta_r = _lin_risk_lower_better (results.get("debtToAssetsRatio"),     low_good=0.20, high_bad=0.80)
    dte_r = _lin_risk_lower_better (results.get("debtToEquityRatio"),     low_good=0.50, high_bad=3.00)

    ratios_parts = [x for x in [cr_r, qr_r, icr_r, roa_r, roe_r, roi_r, ros_r, at_r, dta_r, dte_r] if x is not None]
    ratios_risk = None
    if ratios_parts:
        ratios_parts.sort()
        m = len(ratios_parts)//2
        ratios_risk = ratios_parts[m] if len(ratios_parts)%2==1 else (ratios_parts[m-1]+ratios_parts[m])/2.0

    # Distress models aggregated
    classic_parts = [x for x in [
        ohlson_prob, altman_risk, zmij_risk, spring_risk, taffler_risk, fulmer_risk, grover_risk, dscr_risk
    ] if x is not None]
    classic_risk = None
    if classic_parts:
        classic_parts.sort()
        m = len(classic_parts)//2
        classic_risk = classic_parts[m] if len(classic_parts)%2==1 else (classic_parts[m-1]+classic_parts[m])/2.0

    # Final blend
    if used_calibrated:
        W = {"vecthor": 0.65, "classics": 0.15, "ratios": 0.07, "esg": 0.13}
    else:
        W = {"vecthor": 0.10, "classics": 0.45, "ratios": 0.25, "esg": 0.20} #to remove for new ML model

    parts = []
    if ml is not None:            parts.append(("vecthor", _clip01(ml)))
    if classic_risk is not None:  parts.append(("classics", _clip01(classic_risk)))
    if ratios_risk is not None:   parts.append(("ratios", _clip01(ratios_risk)))
    if esg_risk is not None:      parts.append(("esg", _clip01(esg_risk)))

    if parts:
        w_sum = sum(W[k] for k,_ in parts)
        solvibly = sum(_clip01(v) * (W[k]/w_sum) for k,v in parts)
    else:
        solvibly = None

    results["solviblyScore"] = round(float(solvibly), 6) if solvibly is not None else 'N/A'
    results["solviblyBreakdown"] = {
        "weights_used": {k: (W[k] if any(p[0]==k for p in parts) else 0.0) for k in W},
        "renorm_sum": sum(W[k] for k,_ in parts) if parts else 0.0,
        "components": {
            "vecthorMLScore": _clip01(ml),
            "distress_models_median": _clip01(classic_risk),
            "ratios_median": _clip01(ratios_risk),
            "esg_risk": _clip01(esg_risk),
        },
        "distress_detail": {
            "ohlson_prob": _clip01(ohlson_prob),
            "altman_risk": _clip01(altman_risk),
            "zmijewski_risk": _clip01(zmij_risk),
            "springate_risk": _clip01(spring_risk),
            "taffler_risk": _clip01(taffler_risk),
            "fulmer_risk": _clip01(fulmer_risk),
            "grover_risk": _clip01(grover_risk),
            "dscr_risk": _clip01(dscr_risk),
        },
        "ratios_detail": {
            "currentRatio": _clip01(cr_r),
            "quickRatio": _clip01(qr_r),
            "interestCoverageRatio": _clip01(icr_r),
            "roa": _clip01(roa_r),
            "roe": _clip01(roe_r),
            "roi": _clip01(roi_r),
            "ros": _clip01(ros_r),
            "assetTurnover": _clip01(at_r),
            "debtToAssetsRatio": _clip01(dta_r),
            "debtToEquityRatio": _clip01(dte_r),
        }
    }

    t_low, t_high = 0.40, 0.60
    if solvibly is None:
        results["solviblyRiskBand"] = 'N/A'
    else:
        band = "low" if solvibly < t_low else ("medium" if solvibly <= t_high else "high")
        results["solviblyRiskBand"] = band
    results["solviblyRiskThresholds"] = {"t_low": t_low, "t_high": t_high}

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

        isp = financial_data.get("isPubliclyListed")
        if isinstance(isp, str):
            isp_l = isp.strip().lower()
            financial_data["isPubliclyListed"] = isp_l in ("true", "1", "yes", "y", "on")

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

        financial_data_from_file['isPubliclyListed'] = str(company_type or '').strip().lower() in ('public', 'listed', 'yes', 'true', 'on', '1')

        financial_data_from_file['esgRating'] = (esg_rating or '').strip().upper()
        financial_data_from_file['esgScore_E'] = _to_float_or_none(esg_e)
        financial_data_from_file['esgScore_S'] = _to_float_or_none(esg_s)
        financial_data_from_file['esgScore_G'] = _to_float_or_none(esg_g)

        results = _calculate_results(financial_data_from_file)
        return jsonify(results)
        
    except Exception as e:
        import traceback #to remove
        traceback.print_exc() #to remove
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500
