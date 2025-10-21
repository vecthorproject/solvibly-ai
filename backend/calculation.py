import math

# --- HELPER FUNCTIONS ---

def _safe_ratio(num, den):
    try:
        return float(num) / float(den) if den not in (0, None) else None
    except (TypeError, ValueError):
        return None

def _round_or_na(x, nd=4):
    try:
        return round(x, nd) if isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) else 'N/A'
    except Exception:
        return 'N/A'

# --- DSCR ---

def calculate_dscr(financials):
    cash_flow = financials.get("dscrCashFlow", 0)
    debt_service = financials.get("dscrDebtService", 0)
    r = _safe_ratio(cash_flow, debt_service)
    return _round_or_na(r)

# --- MODELS ---

def calculate_altman_zscore(financials):
    try:
        ta = financials["totalAssets"]
        wc = financials["workingCapital"]
        re = financials["retainedEarnings"]
        ebit = financials["ebit"]
        tl = financials["totalLiabilities"]
        sales = financials["revenue"]

        X1 = wc / ta
        X2 = re / ta
        X3 = ebit / ta
        X5 = sales / ta

        is_public = bool(financials.get("isPubliclyListed"))
        sector = str(financials.get("industrySector", "")).strip().lower()

        if is_public and sector == "manufacturing":
            X4_pub = financials["marketCapitalization"] / tl
            z = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4_pub + 1.0*X5
        elif is_public and sector != "manufacturing":
            X4_priv = financials["totalEquity"] / tl
            z = 6.56*X1 + 3.26*X2 + 6.72*X3 + 1.05*X4_priv
        else:
            X4_priv = financials["totalEquity"] / tl
            z = 0.717*X1 + 0.847*X2 + 3.107*X3 + 0.420*X4_priv + 0.998*X5

        return _round_or_na(z)
    except (ZeroDivisionError, KeyError, TypeError):
        return 'N/A'


def calculate_springate_sscore(financials):
    try:
        ta = financials["totalAssets"]
        wc = financials["workingCapital"]
        ebit = financials["ebit"]
        cl = financials["totalCurrentLiabilities"]
        sales = financials["revenue"]
        interest = financials.get("interestExpense", 0.0)

        a = wc / ta
        b = ebit / ta
        ebt = ebit - interest
        c = _safe_ratio(ebt, cl)
        d = sales / ta

        if c is None:
            return 'N/A'
        s = 1.03*a + 3.07*b + 0.66*c + 0.4*d
        return _round_or_na(s)
    except (ZeroDivisionError, KeyError, TypeError):
        return 'N/A'


def calculate_taffler_tscore(financials):
    try:
        ebit = financials["ebit"]
        interest = financials.get("interestExpense", 0.0)
        pbt = ebit - interest

        cl = financials["totalCurrentLiabilities"]
        ca = financials["totalCurrentAssets"]
        tl = financials["totalLiabilities"]
        ta = financials["totalAssets"]
        sales = financials["revenue"]

        qa = financials.get("quickAssets")
        if qa is None:
            inv = (financials.get("inventories") 
                   if "inventories" in financials 
                   else financials.get("inventory"))
            if inv is not None:
                qa = ca - inv

        depreciation = financials.get("depreciation", 0.0)

        x1 = _safe_ratio(pbt, cl)
        x2 = _safe_ratio(ca, tl)
        x3 = _safe_ratio(cl, ta)

        nci = None
        if qa is not None:
            doe = (sales - pbt - depreciation) / 365.0
            if doe != 0:
                nci = (qa - cl) / doe

        if None in (x1, x2, x3) or nci is None:
            return 'N/A'

        z = 3.20 + 12.18*x1 + 2.50*x2 - 10.68*x3 + 0.029*nci
        return _round_or_na(z)
    except (ZeroDivisionError, KeyError, TypeError, ValueError):
        return 'N/A'


def calculate_fulmer_hfactor(financials):
    try:
        re = financials["retainedEarnings"]
        sales = financials["revenue"]
        ebit = financials["ebit"]
        ocf = financials["operatingCashFlow"]

        ta = financials["totalAssets"]
        tl = financials.get("totalLiabilities")
        total_debt = financials.get("totalDebt", tl)
        wc = financials["workingCapital"]
        cl = financials["totalCurrentLiabilities"]
        equity = financials["totalEquity"]
        tfa = financials.get("tangibleFixedAssets")
        ie = financials.get("interestExpense")

        F1 = _safe_ratio(re, ta)
        F2 = _safe_ratio(sales, ta)
        ebt = ebit - (ie or 0.0)
        F3 = _safe_ratio(ebt, equity)
        F4 = _safe_ratio(ocf, total_debt)
        F5 = _safe_ratio(total_debt, ta)
        F6 = _safe_ratio(cl, ta)
        if tfa is None or tfa <= 0:
            return 'N/A'
        F7 = math.log(tfa)
        F8 = _safe_ratio(wc, total_debt)
        if ebit is None or ebit <= 0 or ie in (None, 0):
            return 'N/A'
        F9 = math.log(ebit) / ie

        if None in (F1, F2, F3, F4, F5, F6, F8):
            return 'N/A'

        H = (5.528*F1 + 0.212*F2 + 0.073*F3 + 1.270*F4
             - 0.120*F5 + 2.335*F6 + 0.575*F7 + 1.083*F8 + 0.894*F9 - 6.075)
        return _round_or_na(H)
    except (ZeroDivisionError, KeyError, TypeError, ValueError):
        return 'N/A'


def calculate_grover_gscore(financials):
    try:
        ta = financials["totalAssets"]
        wc = financials["workingCapital"]
        ebit = financials["ebit"]
        ni = financials["netIncome"]

        X1 = wc / ta
        X2 = ebit / ta
        X3 = ni / ta
        G = 1.650*X1 + 3.404*X2 - 0.016*X3 + 0.057
        return _round_or_na(G)
    except (ZeroDivisionError, KeyError, TypeError):
        return 'N/A'


def calculate_zmijewski_xscore(financials):
    try:
        roa = _safe_ratio(financials.get("netIncome", 0), financials.get("totalAssets", 1))
        lev = _safe_ratio(financials.get("totalLiabilities", 0), financials.get("totalAssets", 1))
        cr = _safe_ratio(financials.get("totalCurrentAssets", 0), financials.get("totalCurrentLiabilities", 1))
        if None in (roa, lev, cr):
            return 'N/A'
        X = -4.336 - 4.513*roa + 5.679*lev + 0.004*cr
        return _round_or_na(X)
    except (ZeroDivisionError, KeyError, TypeError):
        return 'N/A'


def calculate_ohlson_oscore(financials):
    try:
        ta = financials.get("totalAssets", 1.0)
        gnp_index = financials.get("gnpPriceLevelIndex")
        size = math.log(ta / gnp_index) if gnp_index not in (None, 0) else math.log(ta)

        tl = financials.get("totalLiabilities", 0.0)
        ca = financials.get("totalCurrentAssets", 1.0)
        cl = financials.get("totalCurrentLiabilities", 0.0)
        wc = financials.get("workingCapital", 0.0)
        ni_t = financials.get("netIncome", 0.0)
        ni_tm1 = financials.get("netIncome_t_minus_1")
        ffo = financials.get("operatingCashFlow", 0.0)

        tlta = tl / ta
        wcta = wc / ta
        clca = _safe_ratio(cl, ca)
        nita = ni_t / ta
        futl = _safe_ratio(ffo, tl)
        oeneg = 1 if tl > ta else 0

        intwo = 1 if (ni_tm1 is not None and ni_t < 0 and float(ni_tm1) < 0) else 0
        chin = 0.0
        if ni_tm1 is not None:
            denom = abs(ni_t) + abs(float(ni_tm1))
            if denom > 0:
                chin = (ni_t - float(ni_tm1)) / denom

        if None in (clca, futl):
            return 'N/A'

        O = (-1.32
             - 0.407*size
             + 6.03*tlta
             - 1.43*wcta
             + 0.076*clca
             - 1.72*oeneg
             - 2.37*nita
             - 1.83*futl
             + 0.285*intwo
             - 0.521*chin)

        return _round_or_na(O)
    except (ZeroDivisionError, KeyError, TypeError, ValueError):
        return 'N/A'

# --- ESG ---

_MSCI_MAP = {
    "AAA": 100, "AA": 90, "A": 80,
    "BBB": 70, "BB": 60, "B": 50,
    "CCC": 40, "CC": 30, "C": 20
}

def _to_float_or_none(v):
    try:
        if v is None or v == "":
            return None
        f = float(v)
        return f if f != 0 else None
    except Exception:
        return None

def compute_esg_score(esg_rating=None, e=None, s=None, g=None, weights=None, esg_overall=None):
    """
    Aggiunte:
      - esg_overall (0–100): se presente e valido, restituisce sia il numerico (0–100)
        sia la lettera AAA..C (mappatura interna), solo se non è già stato fornito un rating letterale
        e non sono disponibili i tre slider E/S/G.
    Ordine di priorità (invariato, con l'inserimento del numerico al terzo posto):
      1) rating letterale AAA..C
      2) slider E/S/G (1–5) -> normalizzati a 0–100
      3) esg_overall (0–100) -> anche lettera per UI
      4) fallback: None
    """
    rating = (esg_rating or "").strip().upper()
    e = _to_float_or_none(e)
    s = _to_float_or_none(s)
    g = _to_float_or_none(g)

    if rating in _MSCI_MAP:
        return {
            "overall_esg_score": _MSCI_MAP[rating],
            "source": "rating",
            "rating": rating,
            "e": None, "s": None, "g": None
        }

    if e is not None and s is not None and g is not None:
        if weights and len(weights) == 3:
            we, ws, wg = weights
            avg_1_5 = we*e + ws*s + wg*g
        else:
            avg_1_5 = (e + s + g) / 3.0
        normalized = round((avg_1_5 - 1) / 4 * 100)
        return {
            "overall_esg_score": normalized,
            "source": "sliders",
            "rating": "",
            "e": e, "s": s, "g": g
        }

    esg_num = None
    if esg_overall is not None and str(esg_overall) != "":
        try:
            esg_num = float(esg_overall)
        except Exception:
            esg_num = None

    if esg_num is not None and esg_num >= 0 and esg_num <= 100:
        def _to_letter(v):
            if v >= 85: return "AAA"
            if v >= 75: return "AA"
            if v >= 65: return "A"
            if v >= 55: return "BBB"
            if v >= 45: return "BB"
            if v >= 35: return "B"
            if v >= 25: return "CCC"
            if v >= 15: return "CC"
            return "C"

        return {
            "overall_esg_score": round(esg_num),
            "source": "numeric",
            "rating": _to_letter(esg_num),
            "e": None, "s": None, "g": None
        }

    return {
        "overall_esg_score": None,
        "source": None,
        "rating": "",
        "e": e, "s": s, "g": g
    }
