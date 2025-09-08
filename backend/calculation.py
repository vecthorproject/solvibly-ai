import math

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
