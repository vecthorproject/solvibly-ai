"""
crisis.py — Verifiche previste dal Codice della crisi d'impresa e dell'insolvenza (CCII, D.Lgs. 14/2019).

Cosa calcola, per un'impresa italiana:
  1. Patrimonio netto (primo livello della gerarchia CNDCEC; artt. 2446-2447 / 2482-bis-ter c.c.).
  2. DSCR prospettico (secondo livello CNDCEC; art. 3, c. 3, lett. b CCII: sostenibilità dei
     debiti per almeno i dodici mesi successivi).
  3. I cinque indici settoriali CNDCEC ("Crisi d'impresa – Gli indici dell'allerta", 20/10/2019),
     significativi solo se superati congiuntamente.
  4. I segnali dell'art. 3, c. 4 CCII (retribuzioni, fornitori, banche) e le esposizioni verso i
     creditori pubblici qualificati dell'art. 25-novies, c. 1 (INPS, INAIL, IVA, Agenzia Riscossione).
  5. Il test pratico per la verifica della ragionevole perseguibilità del risanamento
     (art. 13, c. 2 CCII e decreto dirigenziale): rapporto debito da ristrutturare / flussi annui.

Ogni verifica restituisce lo stato 'alert' | 'warning' | 'ok' | 'not_evaluated', il valore, la soglia,
il riferimento normativo e, se mancano dati, dove reperirli. L'esito complessivo è uno strumento di
supporto alla valutazione degli adeguati assetti (art. 2086 c.c.), non una diagnosi automatica.

Le soglie sono quelle in vigore all'ultima verifica (art. 25-novies come modificato dal
D.L. 73/2022, conv. L. 122/2022). Vanno ricontrollate a ogni modifica normativa.
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

ALERT, WARNING, OK, NOT_EVALUATED = "alert", "warning", "ok", "not_evaluated"

# --- Soglie settoriali CNDCEC (valori in %) --------------------------------------------------
# financialCharges   = oneri finanziari (C.17) / ricavi (A.1)                 -> segnale se >=
# equityToDebt       = patrimonio netto / debiti totali (D)                   -> segnale se <=
# liquidity          = attivo a breve / passivo a breve                       -> segnale se <=
# cashFlowToAssets   = cash flow (utile + costi non monetari) / totale attivo -> segnale se <=
# taxSocialToAssets  = (debiti tributari D.12 + previdenziali D.13) / attivo  -> segnale se >=
CNDCEC_SECTORS: Dict[str, Dict[str, Any]] = {
    "A":       {"label": "Agricoltura, silvicoltura e pesca (A)",
                "thresholds": (2.8, 9.4, 92.1, 0.3, 5.6)},
    "BCD":     {"label": "Estrazione, manifattura, produzione energia/gas (B, C, D)",
                "thresholds": (3.0, 7.6, 93.7, 0.5, 4.9)},
    "E":       {"label": "Acqua, reti fognarie, rifiuti; trasmissione energia/gas (E, D)",
                "thresholds": (2.6, 6.7, 84.2, 1.9, 6.5)},
    "F41":     {"label": "Costruzione di edifici (F41)",
                "thresholds": (3.8, 4.9, 108.0, 0.4, 3.8)},
    "F42_43":  {"label": "Ingegneria civile e lavori di costruzione specializzati (F42, F43)",
                "thresholds": (2.8, 5.3, 101.1, 1.4, 5.3)},
    "G45_46":  {"label": "Commercio all'ingrosso e di autoveicoli; distribuzione energia/gas (G45, G46, D)",
                "thresholds": (2.1, 6.3, 101.4, 0.6, 2.9)},
    "G47_I56": {"label": "Commercio al dettaglio; bar e ristoranti (G47, I56)",
                "thresholds": (1.5, 4.2, 89.8, 1.0, 7.8)},
    "H_I55":   {"label": "Trasporto e magazzinaggio; alloggio (H, I55)",
                "thresholds": (1.5, 4.1, 86.0, 1.4, 10.2)},
    "JMN":     {"label": "Servizi alle imprese (J, M, N)",
                "thresholds": (1.8, 5.2, 95.4, 1.7, 11.9)},
    "PQRS":    {"label": "Servizi alle persone (P, Q, R, S)",
                "thresholds": (2.7, 2.3, 69.8, 0.5, 14.6)},
}

# Mappatura dai settori dell'app ai gruppi CNDCEC. None = ambiguo: serve la scelta dell'utente.
APP_SECTOR_TO_CNDCEC: Dict[str, Optional[str]] = {
    "agriculture": "A",
    "mining": "BCD",
    "manufacturing": "BCD",
    "energy": "BCD",
    "water_waste": "E",
    "construction": None,          # F41 oppure F42/F43
    "trade": None,                 # G45/G46 oppure G47
    "transport": "H_I55",
    "hospitality": None,           # I55 (alloggio) oppure I56 (ristorazione)
    "info_comm": "JMN",
    "finance_insurance": None,     # settore K: non coperto dagli indici CNDCEC
    "real_estate": None,           # settore L: scelta manuale
    "professional_scientific": "JMN",
    "administrative": "JMN",
    "public_admin": None,          # settore O: non coperto
    "education": "PQRS",
    "health_social": "PQRS",
    "arts_entertainment": "PQRS",
    "other_services": "PQRS",
}

INDEX_DEFS = [
    # id, etichetta, formula, direzione segnale
    ("financialCharges", "Sostenibilità degli oneri finanziari",
     "Oneri finanziari (C.17) / Ricavi (A.1)", ">="),
    ("equityToDebt", "Adeguatezza patrimoniale",
     "Patrimonio netto / Debiti totali (D)", "<="),
    ("liquidity", "Liquidità",
     "Attivo a breve / Passivo a breve", "<="),
    ("cashFlowToAssets", "Ritorno liquido dell'attivo",
     "Cash flow (utile + ammortamenti e accantonamenti) / Totale attivo", "<="),
    ("taxSocialToAssets", "Indebitamento previdenziale e tributario",
     "(Debiti tributari D.12 + previdenziali D.13) / Totale attivo", ">="),
]

# Soglie art. 25-novies, c. 1 CCII
INPS_WITH_EMPLOYEES_PCT = 0.30
INPS_WITH_EMPLOYEES_MIN = 15_000.0
INPS_NO_EMPLOYEES_MIN = 5_000.0
INAIL_MIN = 5_000.0
VAT_MIN = 5_000.0
VAT_TURNOVER_PCT = 0.10
VAT_ALWAYS = 20_000.0
ADER_THRESHOLDS = {
    "impresa_individuale": 100_000.0,
    "societa_persone": 200_000.0,
    "societa_capitali": 500_000.0,
}

REFERENCES = [
    "D.Lgs. 12 gennaio 2019, n. 14 (CCII), artt. 2, 3, 13 e 25-novies, come modificati dal D.Lgs. 83/2022",
    "Art. 2086, c. 2 c.c. — adeguati assetti organizzativi, amministrativi e contabili",
    "CNDCEC, \"Crisi d'impresa – Gli indici dell'allerta\", 20 ottobre 2019 (soglie settoriali)",
    "Test pratico per la verifica della ragionevole perseguibilità del risanamento (art. 13, c. 2 CCII)",
]


# --- helpers --------------------------------------------------------------------------------

def _num(x: Any) -> Optional[float]:
    """None se il dato non è stato fornito; 0 è un valore valido (es. nessun debito scaduto)."""
    if x is None or isinstance(x, bool):
        return None
    if isinstance(x, str):
        x = x.strip()
        if x == "" or x.upper() == "N/A":
            return None
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return v if math.isfinite(v) else None


def _bool(x: Any) -> Optional[bool]:
    if isinstance(x, bool):
        return x
    if x is None:
        return None
    s = str(x).strip().lower()
    if s in ("true", "1", "yes", "si", "sì", "on"):
        return True
    if s in ("false", "0", "no", "off"):
        return False
    return None


def _ratio(num: Optional[float], den: Optional[float]) -> Optional[float]:
    if num is None or den is None or den == 0:
        return None
    return num / den


def _eur(v: Optional[float]) -> str:
    if v is None:
        return "n.d."
    s = f"{v:,.0f}".replace(",", ".")
    return f"€ {s}"


def _check(id_: str, title: str, law: str, status: str, detail: str,
           value: Any = None, threshold: Any = None, source: Optional[str] = None,
           missing: Optional[List[str]] = None) -> Dict[str, Any]:
    return {
        "id": id_,
        "title": title,
        "law": law,
        "status": status,
        "detail": detail,
        "value": value,
        "threshold": threshold,
        "source": source,
        "missing": missing or [],
    }


def resolve_cndcec_sector(data: Dict[str, Any]) -> Optional[str]:
    explicit = str(data.get("cndcecSector") or "").strip()
    if explicit in CNDCEC_SECTORS:
        return explicit
    app_sector = str(data.get("industrySector") or "").strip()
    return APP_SECTOR_TO_CNDCEC.get(app_sector)


def normalise_legal_form(value: Any) -> str:
    s = str(value or "").strip().lower()
    if s in ADER_THRESHOLDS:
        return s
    if s in ("ditta", "ditta_individuale", "individuale", "sole_proprietorship"):
        return "impresa_individuale"
    if s in ("snc", "sas", "societa_di_persone", "partnership"):
        return "societa_persone"
    return "societa_capitali"


# --- 1. Patrimonio netto ----------------------------------------------------------------------

def check_equity(data: Dict[str, Any]) -> Dict[str, Any]:
    equity = _num(data.get("totalEquity"))
    capital = _num(data.get("shareCapital"))
    legal_form = normalise_legal_form(data.get("legalForm"))
    title = "Patrimonio netto"
    law = "Gerarchia CNDCEC, livello 1; artt. 2446-2447 e 2482-bis/ter c.c."
    if equity is None:
        return _check("equity", title, law, NOT_EVALUATED,
                      "Patrimonio netto non disponibile.", source="Stato patrimoniale, voce A) del passivo",
                      missing=["totalEquity"])
    if equity <= 0:
        return _check("equity", title, law, ALERT,
                      f"Patrimonio netto non positivo ({_eur(equity)}): ragionevole presunzione di crisi; "
                      "valutare ricapitalizzazione o scioglimento.", value=equity, threshold=0)
    if legal_form == "societa_capitali" and capital is not None and capital > 0 and equity < capital * 2 / 3:
        return _check("equity", title, law, WARNING,
                      f"Patrimonio netto ({_eur(equity)}) inferiore ai due terzi del capitale sociale "
                      f"({_eur(capital)}): perdite oltre un terzo del capitale.",
                      value=equity, threshold=round(capital * 2 / 3, 2))
    return _check("equity", title, law, OK, f"Patrimonio netto positivo ({_eur(equity)}).",
                  value=equity, threshold=0)


# --- 2. DSCR ------------------------------------------------------------------------------------

def compute_dscr_from_components(data: Dict[str, Any]) -> Dict[str, Optional[float]]:
    """DSCR secondo l'approccio 2 CNDCEC (flussi operativi), se l'utente ha fornito le componenti."""
    num_parts = [_num(data.get(k)) for k in ("dscrOperatingFreeCashFlow", "dscrOpeningCash", "dscrAvailableCreditLines")]
    den_parts = [_num(data.get(k)) for k in ("dscrFinancialDebtService", "dscrOverdueTaxSocial", "dscrOverdueSuppliers")]
    if all(p is None for p in num_parts) or all(p is None for p in den_parts):
        return {"cashFlow": None, "debtService": None}
    return {
        "cashFlow": sum(p for p in num_parts if p is not None),
        "debtService": sum(p for p in den_parts if p is not None),
    }


def check_dscr(data: Dict[str, Any]) -> Dict[str, Any]:
    horizon = int(_num(data.get("dscrHorizonMonths")) or 6)
    horizon = 12 if horizon >= 12 else 6
    comp = compute_dscr_from_components(data)
    cash_flow = comp["cashFlow"] if comp["cashFlow"] is not None else _num(data.get("dscrCashFlow"))
    debt_service = comp["debtService"] if comp["debtService"] is not None else _num(data.get("dscrDebtService"))
    title = f"DSCR prospettico ({horizon} mesi)"
    law = "Art. 3, c. 3, lett. b) CCII; gerarchia CNDCEC, livello 2"
    if cash_flow is None or debt_service is None or (cash_flow == 0 and debt_service == 0):
        return _check("dscr", title, law, NOT_EVALUATED,
                      "Servono i flussi di cassa attesi e il servizio del debito dello stesso periodo.",
                      source="Budget di tesoreria / piano finanziario a 6-12 mesi",
                      missing=["dscrCashFlow", "dscrDebtService"])
    if debt_service <= 0:
        return _check("dscr", title, law, OK,
                      "Nessun servizio del debito nel periodo: DSCR non significativo, nessun segnale.",
                      value=None, threshold=1.0)
    dscr = cash_flow / debt_service
    if dscr < 1:
        return _check("dscr", title, law, ALERT,
                      f"DSCR {dscr:.2f} < 1: i flussi attesi non coprono il debito in scadenza nel periodo.",
                      value=round(dscr, 4), threshold=1.0)
    return _check("dscr", title, law, OK,
                  f"DSCR {dscr:.2f} ≥ 1: debiti in scadenza coperti dai flussi attesi.",
                  value=round(dscr, 4), threshold=1.0)


# --- 3. Indici settoriali CNDCEC -----------------------------------------------------------------

def compute_cndcec_indices(data: Dict[str, Any]) -> Dict[str, Any]:
    sector = resolve_cndcec_sector(data)
    revenue = _num(data.get("revenue"))
    financial_charges = _num(data.get("interestExpense"))
    equity = _num(data.get("totalEquity"))
    total_assets = _num(data.get("totalAssets"))
    current_assets = _num(data.get("totalCurrentAssets"))
    current_liabilities = _num(data.get("totalCurrentLiabilities"))
    tax_debts = _num(data.get("taxDebts"))
    social_debts = _num(data.get("socialSecurityDebts"))

    notes: List[str] = []

    total_debts = _num(data.get("totalDebts"))
    if total_debts is None:
        total_debts = _num(data.get("totalLiabilities"))
        if total_debts is not None:
            notes.append("Debiti totali approssimati con il totale delle passività (include fondi e TFR).")

    net_income = _num(data.get("netIncome"))
    depreciation = _num(data.get("depreciation"))
    provisions = _num(data.get("provisions"))
    cash_flow = None
    if net_income is not None and (depreciation is not None or provisions is not None):
        cash_flow = net_income + (depreciation or 0.0) + (provisions or 0.0)
    elif _num(data.get("operatingCashFlow")) is not None and _num(data.get("operatingCashFlow")) != 0:
        cash_flow = _num(data.get("operatingCashFlow"))
        notes.append("Cash flow approssimato con il flusso di cassa operativo (mancano ammortamenti/accantonamenti).")

    tax_social = None
    if tax_debts is not None or social_debts is not None:
        tax_social = (tax_debts or 0.0) + (social_debts or 0.0)

    def pct(num, den):
        r = _ratio(num, den)
        return round(r * 100, 2) if r is not None else None

    values = {
        "financialCharges": pct(financial_charges, revenue),
        "equityToDebt": pct(equity, total_debts),
        "liquidity": pct(current_assets, current_liabilities),
        "cashFlowToAssets": pct(cash_flow, total_assets),
        "taxSocialToAssets": pct(tax_social, total_assets),
    }

    thresholds = CNDCEC_SECTORS[sector]["thresholds"] if sector else None
    indices = []
    breached_count = 0
    evaluated = 0
    for i, (idx_id, label, formula, direction) in enumerate(INDEX_DEFS):
        value = values[idx_id]
        thr = thresholds[i] if thresholds else None
        breached = None
        if value is not None and thr is not None:
            breached = value >= thr if direction == ">=" else value <= thr
            evaluated += 1
            breached_count += int(breached)
        indices.append({
            "id": idx_id, "label": label, "formula": formula, "direction": direction,
            "value": value, "threshold": thr, "breached": breached,
        })

    if not sector:
        status = NOT_EVALUATED
        detail = ("Seleziona il gruppo di settore CNDCEC: per questo settore la corrispondenza non è automatica "
                  "(i settori K e O non sono coperti dagli indici).")
    elif evaluated < 5:
        missing_labels = [ix["label"] for ix in indices if ix["value"] is None]
        joint_breach_excluded = (evaluated - breached_count) >= 1
        if evaluated == 0:
            status = NOT_EVALUATED
        elif breached_count >= 3:
            status = WARNING
        elif joint_breach_excluded:
            status = OK
        else:
            status = NOT_EVALUATED
        conclusion = ("almeno un indice è entro soglia, quindi il segnale congiunto è escluso"
                      if joint_breach_excluded else "il segnale congiunto non è determinabile")
        detail = (f"Calcolati {evaluated} indici su 5 ({breached_count} oltre soglia): {conclusion}. "
                  f"Mancano: {', '.join(missing_labels)}.")
    elif breached_count == 5:
        status = ALERT
        detail = "Tutti e cinque gli indici superano le soglie di settore: segnale di crisi secondo il CNDCEC."
    elif breached_count >= 3:
        status = WARNING
        detail = (f"{breached_count} indici su 5 oltre soglia. Il segnale CNDCEC richiede il superamento di tutti e cinque, "
                  "ma la concentrazione di squilibri merita un approfondimento.")
    else:
        status = OK
        detail = f"{breached_count} indici su 5 oltre soglia: nessun segnale secondo il CNDCEC."

    return {
        "sector": sector,
        "sectorLabel": CNDCEC_SECTORS[sector]["label"] if sector else None,
        "indices": indices,
        "evaluated": evaluated,
        "breachedCount": breached_count,
        "status": status,
        "detail": detail,
        "notes": notes,
        "law": "CNDCEC, indici di settore (livello 3 della gerarchia, da usare se il DSCR non è disponibile o attendibile)",
    }


# --- 4. Segnali art. 3, c. 4 e art. 25-novies -------------------------------------------------------

def check_payroll(data):
    monthly = _num(data.get("payrollMonthly"))
    overdue = _num(data.get("payrollOverdue30"))
    title, law = "Debiti per retribuzioni", "Art. 3, c. 4, lett. a) CCII"
    source = "Libro unico del lavoro / cedolini e pagamenti"
    if overdue is None or (monthly is None and overdue > 0):
        return _check("payroll", title, law, NOT_EVALUATED,
                      "Indica retribuzioni scadute da almeno 30 giorni e il monte retribuzioni mensile.",
                      source=source, missing=[k for k, v in (("payrollOverdue30", overdue), ("payrollMonthly", monthly)) if v is None])
    if overdue == 0:
        return _check("payroll", title, law, OK, "Nessuna retribuzione scaduta da almeno 30 giorni.", value=0, source=source)
    limit = monthly * 0.5
    if overdue > limit:
        return _check("payroll", title, law, ALERT,
                      f"Retribuzioni scadute da ≥30 giorni ({_eur(overdue)}) oltre la metà del monte mensile ({_eur(monthly)}).",
                      value=overdue, threshold=round(limit, 2), source=source)
    return _check("payroll", title, law, OK,
                  f"Retribuzioni scadute ({_eur(overdue)}) entro la metà del monte mensile ({_eur(monthly)}).",
                  value=overdue, threshold=round(limit, 2), source=source)


def check_suppliers(data):
    overdue = _num(data.get("suppliersOverdue90"))
    not_due = _num(data.get("suppliersNotDue"))
    title, law = "Debiti verso fornitori", "Art. 3, c. 4, lett. b) CCII"
    source = "Scadenzario fornitori dal gestionale contabile"
    if overdue is None or (not_due is None and overdue > 0):
        return _check("suppliers", title, law, NOT_EVALUATED,
                      "Indica i debiti verso fornitori scaduti da almeno 90 giorni e quelli non ancora scaduti.",
                      source=source, missing=[k for k, v in (("suppliersOverdue90", overdue), ("suppliersNotDue", not_due)) if v is None])
    if overdue == 0:
        return _check("suppliers", title, law, OK, "Nessun debito verso fornitori scaduto da almeno 90 giorni.", value=0, source=source)
    if overdue > not_due:
        return _check("suppliers", title, law, ALERT,
                      f"Debiti scaduti da ≥90 giorni ({_eur(overdue)}) superiori ai debiti non scaduti ({_eur(not_due)}).",
                      value=overdue, threshold=not_due, source=source)
    return _check("suppliers", title, law, OK,
                  f"Debiti scaduti da ≥90 giorni ({_eur(overdue)}) non superiori ai non scaduti ({_eur(not_due)}).",
                  value=overdue, threshold=not_due, source=source)


def check_banks(data):
    overdue = _num(data.get("bankOverdue60"))
    total = _num(data.get("bankTotalExposure"))
    title, law = "Esposizioni verso banche e intermediari", "Art. 3, c. 4, lett. c) CCII"
    source = "Centrale Rischi Banca d'Italia (scaduto/sconfinamenti) ed estratti conto"
    if overdue is None or (total is None and overdue > 0):
        return _check("banks", title, law, NOT_EVALUATED,
                      "Indica le esposizioni scadute o sconfinate da oltre 60 giorni e il totale delle esposizioni.",
                      source=source, missing=[k for k, v in (("bankOverdue60", overdue), ("bankTotalExposure", total)) if v is None])
    if overdue == 0:
        return _check("banks", title, law, OK, "Nessuna esposizione bancaria scaduta o sconfinata da oltre 60 giorni.", value=0, source=source)
    if not total or total <= 0:
        return _check("banks", title, law, NOT_EVALUATED, "Il totale delle esposizioni deve essere maggiore di zero.",
                      source=source, missing=["bankTotalExposure"])
    share = overdue / total
    if share >= 0.05:
        return _check("banks", title, law, ALERT,
                      f"Esposizioni scadute/sconfinate da oltre 60 giorni pari al {share*100:.1f}% del totale (soglia 5%).",
                      value=round(share * 100, 2), threshold=5.0, source=source)
    return _check("banks", title, law, OK,
                  f"Esposizioni scadute/sconfinate pari al {share*100:.1f}% del totale, sotto la soglia del 5%.",
                  value=round(share * 100, 2), threshold=5.0, source=source)


def check_inps(data):
    overdue = _num(data.get("inpsOverdue90"))
    has_employees = _bool(data.get("hasEmployees"))
    due_prev = _num(data.get("inpsDuePrevYear"))
    title, law = "Contributi INPS", "Art. 25-novies, c. 1, lett. a) CCII"
    source = "Cassetto previdenziale INPS / DURC"
    if overdue is None:
        return _check("inps", title, law, NOT_EVALUATED,
                      "Indica i contributi previdenziali non versati da oltre 90 giorni.",
                      source=source, missing=["inpsOverdue90"])
    if has_employees is False:
        alert = overdue > INPS_NO_EMPLOYEES_MIN
        detail = (f"Contributi scaduti da oltre 90 giorni {_eur(overdue)} "
                  f"{'oltre' if alert else 'entro'} la soglia di {_eur(INPS_NO_EMPLOYEES_MIN)} (impresa senza dipendenti).")
        return _check("inps", title, law, ALERT if alert else OK, detail,
                      value=overdue, threshold=INPS_NO_EMPLOYEES_MIN, source=source)
    # con dipendenti (default se non indicato): entrambe le condizioni
    if overdue <= INPS_WITH_EMPLOYEES_MIN:
        return _check("inps", title, law, OK,
                      f"Contributi scaduti {_eur(overdue)} non superiori a {_eur(INPS_WITH_EMPLOYEES_MIN)}.",
                      value=overdue, threshold=INPS_WITH_EMPLOYEES_MIN, source=source)
    if due_prev is None:
        return _check("inps", title, law, NOT_EVALUATED,
                      "Serve anche il totale dei contributi dovuti nell'anno precedente (soglia del 30%).",
                      value=overdue, source=source, missing=["inpsDuePrevYear"])
    limit = max(INPS_WITH_EMPLOYEES_MIN, due_prev * INPS_WITH_EMPLOYEES_PCT)
    alert = overdue > due_prev * INPS_WITH_EMPLOYEES_PCT
    detail = (f"Contributi scaduti {_eur(overdue)}: soglie € 15.000 e 30% dei contributi dell'anno precedente "
              f"({_eur(due_prev * INPS_WITH_EMPLOYEES_PCT)}) {'entrambe superate' if alert else 'non entrambe superate'}.")
    return _check("inps", title, law, ALERT if alert else OK, detail,
                  value=overdue, threshold=round(limit, 2), source=source)


def check_inail(data):
    overdue = _num(data.get("inailOverdue90"))
    title, law = "Premi INAIL", "Art. 25-novies, c. 1, lett. b) CCII"
    source = "Sezione Servizi online INAIL / DURC"
    if overdue is None:
        return _check("inail", title, law, NOT_EVALUATED,
                      "Indica i premi assicurativi scaduti da oltre 90 giorni e non versati.",
                      source=source, missing=["inailOverdue90"])
    alert = overdue > INAIL_MIN
    return _check("inail", title, law, ALERT if alert else OK,
                  f"Premi scaduti {_eur(overdue)} {'oltre' if alert else 'entro'} la soglia di {_eur(INAIL_MIN)}.",
                  value=overdue, threshold=INAIL_MIN, source=source)


def check_vat(data):
    debt = _num(data.get("vatOverdue"))
    turnover = _num(data.get("vatTurnoverPrevYear"))
    title, law = "Debito IVA (liquidazioni periodiche)", "Art. 25-novies, c. 1, lett. c) CCII"
    source = "Comunicazioni LIPE e cassetto fiscale"
    if debt is None:
        return _check("vat", title, law, NOT_EVALUATED,
                      "Indica il debito IVA scaduto e non versato risultante dalle liquidazioni periodiche.",
                      source=source, missing=["vatOverdue"])
    if debt > VAT_ALWAYS:
        return _check("vat", title, law, ALERT,
                      f"Debito IVA {_eur(debt)} oltre {_eur(VAT_ALWAYS)}: segnalazione dovuta in ogni caso.",
                      value=debt, threshold=VAT_ALWAYS, source=source)
    if debt <= VAT_MIN:
        return _check("vat", title, law, OK,
                      f"Debito IVA {_eur(debt)} non superiore a {_eur(VAT_MIN)}.",
                      value=debt, threshold=VAT_MIN, source=source)
    if turnover is None:
        return _check("vat", title, law, NOT_EVALUATED,
                      "Debito tra € 5.000 e € 20.000: serve il volume d'affari dell'anno precedente (soglia 10%).",
                      value=debt, source=source, missing=["vatTurnoverPrevYear"])
    limit = turnover * VAT_TURNOVER_PCT
    alert = debt >= limit
    return _check("vat", title, law, ALERT if alert else OK,
                  f"Debito IVA {_eur(debt)} {'non inferiore' if alert else 'inferiore'} al 10% del volume d'affari ({_eur(limit)}).",
                  value=debt, threshold=round(max(VAT_MIN, limit), 2), source=source)


def check_ader(data):
    debt = _num(data.get("aderOverdue90"))
    legal_form = normalise_legal_form(data.get("legalForm"))
    limit = ADER_THRESHOLDS[legal_form]
    title, law = "Carichi affidati all'Agenzia delle Entrate-Riscossione", "Art. 25-novies, c. 1, lett. d) CCII"
    source = "Estratto di ruolo (area riservata Agenzia Entrate-Riscossione)"
    if debt is None:
        return _check("ader", title, law, NOT_EVALUATED,
                      "Indica i crediti affidati all'Agente della riscossione scaduti da oltre 90 giorni.",
                      source=source, missing=["aderOverdue90"])
    alert = debt > limit
    return _check("ader", title, law, ALERT if alert else OK,
                  f"Carichi scaduti {_eur(debt)} {'oltre' if alert else 'entro'} la soglia di {_eur(limit)} per la forma giuridica indicata.",
                  value=debt, threshold=limit, source=source)


# --- 5. Test pratico --------------------------------------------------------------------------------

def check_practical_test(data):
    debt = _num(data.get("restructuringDebt"))
    flows = _num(data.get("annualDebtServiceFlows"))
    title = "Test pratico (debito da ristrutturare / flussi annui)"
    law = "Art. 13, c. 2 CCII — test pratico per la ragionevole perseguibilità del risanamento"
    source = "Piano: debito scaduto, riscadenziato, rate a 24 mesi, investimenti; MOL normalizzato al netto di investimenti di mantenimento e imposte"
    if debt is None or flows is None:
        return _check("practicalTest", title, law, NOT_EVALUATED,
                      "Facoltativo: indica il debito da ristrutturare e i flussi annui al servizio del debito.",
                      source=source, missing=[k for k, v in (("restructuringDebt", debt), ("annualDebtServiceFlows", flows)) if v is None])
    if debt <= 0:
        return _check("practicalTest", title, law, OK, "Nessun debito da ristrutturare.", value=0, source=source)
    if flows <= 0:
        return _check("practicalTest", title, law, ALERT,
                      "Flussi al servizio del debito non positivi: il risanamento non è perseguibile con i soli flussi correnti.",
                      value=None, source=source)
    ratio = debt / flows
    if ratio <= 2:
        status, detail = OK, f"Rapporto {ratio:.2f}: squilibrio contenuto (fino a 2 in assenza di particolari specificità)."
    elif ratio <= 4:
        status, detail = WARNING, f"Rapporto {ratio:.2f}: serve un piano d'impresa solido e l'effettiva realizzazione delle iniziative."
    else:
        status, detail = ALERT, f"Rapporto {ratio:.2f}: probabile necessità di cessioni, aggregazioni o altre misure di discontinuità."
    return _check("practicalTest", title, law, status, detail + " Valore indicativo, non sostituisce il giudizio professionale.",
                  value=round(ratio, 4), threshold=2.0, source=source)


# --- Sintesi --------------------------------------------------------------------------------------

def assess_crisis(data: Dict[str, Any]) -> Dict[str, Any]:
    """Esegue tutte le verifiche CCII su un dizionario di dati già normalizzati."""
    equity = check_equity(data)
    dscr = check_dscr(data)
    cndcec = compute_cndcec_indices(data)
    signals = [check_payroll(data), check_suppliers(data), check_banks(data),
               check_inps(data), check_inail(data), check_vat(data), check_ader(data)]
    practical = check_practical_test(data)

    reasons_alert: List[str] = []
    reasons_warning: List[str] = []

    if equity["status"] == ALERT:
        reasons_alert.append(equity["detail"])
    elif equity["status"] == WARNING:
        reasons_warning.append(equity["detail"])

    if dscr["status"] == ALERT:
        reasons_alert.append(dscr["detail"])

    # Gli indici CNDCEC contano come segnale solo se il DSCR non è disponibile.
    if cndcec["status"] == ALERT and dscr["status"] == NOT_EVALUATED:
        reasons_alert.append(cndcec["detail"])
    elif cndcec["status"] in (ALERT, WARNING):
        reasons_warning.append(cndcec["detail"])

    for s in signals:
        if s["status"] == ALERT:
            reasons_alert.append(f"{s['title']} — {s['detail']}")

    if practical["status"] == ALERT:
        reasons_warning.append(practical["detail"])
    elif practical["status"] == WARNING:
        reasons_warning.append(practical["detail"])

    signals_evaluated = sum(1 for s in signals if s["status"] != NOT_EVALUATED)
    core_evaluated = (equity["status"] != NOT_EVALUATED) and (
        dscr["status"] != NOT_EVALUATED or cndcec["status"] != NOT_EVALUATED)

    if reasons_alert:
        level, headline = "red", "Segnali di crisi rilevati"
    elif reasons_warning:
        level, headline = "yellow", "Situazione da approfondire"
    elif core_evaluated and signals_evaluated >= 3:
        level, headline = "green", "Nessun segnale di crisi rilevato"
    elif core_evaluated:
        level, headline = "green_partial", "Nessun segnale dai dati di bilancio — verifica incompleta"
    else:
        level, headline = "grey", "Dati insufficienti per la verifica"

    missing = []
    for item in [equity, dscr, *signals]:
        if item["status"] == NOT_EVALUATED and item.get("source"):
            missing.append({"id": item["id"], "title": item["title"], "source": item["source"]})

    return {
        "applicable": True,
        "overall": {
            "level": level,
            "headline": headline,
            "alerts": reasons_alert,
            "warnings": reasons_warning,
            "signalsEvaluated": signals_evaluated,
            "signalsTotal": len(signals),
        },
        "equity": equity,
        "dscr": dscr,
        "cndcec": cndcec,
        "signals": signals,
        "practicalTest": practical,
        "missingData": missing,
        "references": REFERENCES,
        "disclaimer": ("Strumento di supporto alla verifica degli adeguati assetti (art. 2086 c.c.) e dei segnali "
                       "previsti dal CCII. Non sostituisce la valutazione dell'organo amministrativo, dell'organo di "
                       "controllo o del professionista."),
    }


CRISIS_NUMERIC_KEYS = [
    "shareCapital", "totalDebts", "depreciation", "provisions", "taxDebts", "socialSecurityDebts",
    "payrollMonthly", "payrollOverdue30", "suppliersOverdue90", "suppliersNotDue",
    "bankOverdue60", "bankTotalExposure", "inpsOverdue90", "inpsDuePrevYear", "inailOverdue90",
    "vatOverdue", "vatTurnoverPrevYear", "aderOverdue90", "restructuringDebt", "annualDebtServiceFlows",
    "dscrHorizonMonths", "dscrOperatingFreeCashFlow", "dscrOpeningCash", "dscrAvailableCreditLines",
    "dscrFinancialDebtService", "dscrOverdueTaxSocial", "dscrOverdueSuppliers",
]
CRISIS_STRING_KEYS = ["legalForm", "cndcecSector", "hasEmployees"]
