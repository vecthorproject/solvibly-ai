"""
train_vecthor_model.py — addestra il Vecthor Index (probabilità 0–1 a 12 mesi)

Versione "no-warnings":
  • prevenzione warning su log/0/NaN
  • imputer sicuro che non genera "Skipping features..."
  • pipeline picklable (niente lambda)

Input:  vecthor_training_v3.csv (generato dallo script ETL)
Output: models/
  • vecthor_best.joblib        (pipeline completa, pronta per l'inferenza)
  • metrics.txt                (ROC-AUC, PR-AUC, ecc.)
  • preds_full.csv             (predizioni out-of-fold su tutto il dataset)
  • top500.csv                 (i 500 casi con probabilità più alta)

Uso:
  pip install -U scikit-learn joblib pandas numpy
  python train_vecthor_model.py --data ./vecthor_training_v3.csv --outdir ./models
"""
from __future__ import annotations

import os
import argparse
import warnings
from typing import List, Dict, Any, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.metrics import roc_auc_score, average_precision_score
from sklearn.pipeline import Pipeline
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler, FunctionTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from joblib import dump

from sklearn.calibration import CalibratedClassifierCV

# Sopprimi warning fastidiosi a schermo
warnings.filterwarnings("ignore")
np.seterr(all="ignore")  # ignora warning numerici (div/0, invalid, ecc.)

# --------------------------------------------------------------------------------------
# Colonne attese (coerenti con l’ETL e future inference)
# --------------------------------------------------------------------------------------
FEATURE_COLUMNS: List[str] = [
    "sic", "fiscalYear",
    "totalCurrentAssets", "totalNonCurrentAssets", "totalCurrentLiabilities", "totalNonCurrentLiabilities",
    "inventories", "totalAssets", "totalLiabilities", "totalEquity",
    "revenue", "ebit", "netIncome", "interestExpense", "operatingCashFlow",
    "tangibleFixedAssets", "retainedEarnings", "depreciation",
    "workingCapital", "netIncome_t_minus_1", "quickAssets",
    "sharesOutstanding", "marketCapitalization", "isPubliclyListed",
    "gnpPriceLevelIndex",
    "longTermDebtCurrent", "dscrCashFlow_proxy", "dscrDebtService_proxy",
]

# colonne aggiuntive create da _feat_eng
ENGINEERED_EXTRA = [
    "r_currentRatio", "r_quickRatio", "r_debtToEquity", "r_debtToAssets",
    "r_interestCoverage", "r_roa", "r_roe", "r_roi", "r_ros", "r_assetTurnover",
    "r_dscr_proxy",
    "m_altmanZ", "m_zmijewskiX", "m_ohlsonO",
    "log_totalAssets", "log_revenue", "log_totalLiab",
]
ENGINEERED_COLUMNS = FEATURE_COLUMNS + ENGINEERED_EXTRA

TARGET_COL = "label"
GROUP_COL = "cik"
ID_COLS = ["cik", "companyName", "fiscalYear", "datadate"]

# --------------------------------------------------------------------------------------
# Utils
# --------------------------------------------------------------------------------------
def _bool01(v: Any) -> float:
    if isinstance(v, bool):
        return 1.0 if v else 0.0
    if isinstance(v, str):
        vv = v.strip().lower()
        if vv in ("true", "yes", "y", "1"):
            return 1.0
        if vv in ("false", "no", "n", "0", ""):
            return 0.0
    try:
        return 1.0 if float(v) != 0.0 else 0.0
    except Exception:
        return 0.0


def _safelog_series(s: pd.Series) -> pd.Series:
    arr = pd.to_numeric(s, errors="coerce").to_numpy()
    with np.errstate(divide="ignore", invalid="ignore"):  # no warning
        out = np.where(arr > 0.0, np.log(arr), np.nan)
    return pd.Series(out, index=s.index)


def _safe_div(a: pd.Series, b: pd.Series) -> pd.Series:
    a = pd.to_numeric(a, errors="coerce").astype(float)
    b = pd.to_numeric(b, errors="coerce").astype(float)
    with np.errstate(divide='ignore', invalid='ignore'):
        r = np.where((b == 0.0) | ~np.isfinite(b), np.nan, a / b)
    return pd.Series(r, index=a.index)

# --------------------------------------------------------------------------------------
# Feature engineering (top-level + picklable)
# --------------------------------------------------------------------------------------
def _feat_eng(df: pd.DataFrame) -> pd.DataFrame:
    """Feature engineering: ripara base e crea ratios + punteggi classici (subset).
    Restituisce SEMPRE solo colonne numeriche (no warning in scaler/clf).
    """
    X = df.copy()

    # assicurati che tutte le colonne attese esistano
    for c in FEATURE_COLUMNS:
        if c not in X.columns:
            X[c] = np.nan

    # tipi
    X["isPubliclyListed"] = X["isPubliclyListed"].apply(_bool01)

    # derivati base
    tca = pd.to_numeric(X["totalCurrentAssets"], errors="coerce").astype(float)
    tnca = pd.to_numeric(X["totalNonCurrentAssets"], errors="coerce").astype(float)
    tcl = pd.to_numeric(X["totalCurrentLiabilities"], errors="coerce").astype(float)
    tncl = pd.to_numeric(X["totalNonCurrentLiabilities"], errors="coerce").astype(float)

    # total assets / liabilities fallback
    X["totalAssets"] = pd.to_numeric(X["totalAssets"], errors="coerce").astype(float).fillna(tca + tnca)
    X["totalLiabilities"] = pd.to_numeric(X["totalLiabilities"], errors="coerce").astype(float).fillna(tcl + tncl)

    # equity fallback
    X["totalEquity"] = pd.to_numeric(X["totalEquity"], errors="coerce").astype(float)
    eq_fallback = (X["totalAssets"] - X["totalLiabilities"]).where(
        X["totalEquity"].isna() | ~np.isfinite(X["totalEquity"])
    )
    X["totalEquity"] = X["totalEquity"].fillna(eq_fallback)

    # working capital & quick assets fallback
    X["workingCapital"] = pd.to_numeric(X["workingCapital"], errors="coerce").astype(float)
    X.loc[X["workingCapital"].isna(), "workingCapital"] = (tca - tcl)

    X["inventories"] = pd.to_numeric(X["inventories"], errors="coerce").astype(float)
    X["quickAssets"] = pd.to_numeric(X["quickAssets"], errors="coerce").astype(float)
    X.loc[X["quickAssets"].isna(), "quickAssets"] = (tca - X["inventories"].fillna(0.0))

    # DSCR proxy fallback
    X["operatingCashFlow"] = pd.to_numeric(X["operatingCashFlow"], errors="coerce").astype(float)
    X["interestExpense"] = pd.to_numeric(X["interestExpense"], errors="coerce").astype(float)
    X["longTermDebtCurrent"] = pd.to_numeric(X["longTermDebtCurrent"], errors="coerce").astype(float)

    X["dscrCashFlow_proxy"] = pd.to_numeric(X["dscrCashFlow_proxy"], errors="coerce").astype(float)
    X.loc[X["dscrCashFlow_proxy"].isna(), "dscrCashFlow_proxy"] = X["operatingCashFlow"]

    X["dscrDebtService_proxy"] = pd.to_numeric(X["dscrDebtService_proxy"], errors="coerce").astype(float)
    X.loc[X["dscrDebtService_proxy"].isna(), "dscrDebtService_proxy"] = (
        X["interestExpense"].fillna(0.0) + X["longTermDebtCurrent"].fillna(0.0)
    )

    # altri numerici
    for c in [
        "sic", "fiscalYear", "revenue", "ebit", "netIncome", "tangibleFixedAssets",
        "retainedEarnings", "depreciation", "netIncome_t_minus_1", "sharesOutstanding",
        "marketCapitalization", "gnpPriceLevelIndex"
    ]:
        X[c] = pd.to_numeric(X[c], errors="coerce").astype(float)

    # ---------------- ratios
    X["r_currentRatio"]     = _safe_div(X["totalCurrentAssets"], X["totalCurrentLiabilities"])  # CA/CL
    X["r_quickRatio"]       = _safe_div(X["quickAssets"], X["totalCurrentLiabilities"])         # (CA-Inv)/CL
    X["r_debtToEquity"]     = _safe_div(X["totalLiabilities"], X["totalEquity"])                # TL/EQ
    X["r_debtToAssets"]     = _safe_div(X["totalLiabilities"], X["totalAssets"])                # TL/TA
    X["r_interestCoverage"] = _safe_div(X["ebit"], X["interestExpense"])                        # EBIT/Int
    X["r_roa"]              = _safe_div(X["netIncome"], X["totalAssets"])                       # NI/TA
    X["r_roe"]              = _safe_div(X["netIncome"], X["totalEquity"])                       # NI/EQ
    X["r_roi"]              = _safe_div(X["ebit"], X["totalAssets"])                            # EBIT/TA
    X["r_ros"]              = _safe_div(X["ebit"], X["revenue"])                                # EBIT/Sales
    X["r_assetTurnover"]    = _safe_div(X["revenue"], X["totalAssets"])                         # Sales/TA
    X["r_dscr_proxy"]       = _safe_div(X["dscrCashFlow_proxy"], X["dscrDebtService_proxy"])    # OCF/(Int+LTDC)

    # ---------------- classic scores (Altman/Zmijewski/Ohlson)
    ta = X["totalAssets"]
    tl = X["totalLiabilities"]
    sales = X["revenue"]
    wc = X["workingCapital"]
    ebit = X["ebit"]
    eq = X["totalEquity"]

    X1 = _safe_div(wc, ta)
    RE = X["retainedEarnings"]
    X2 = _safe_div(RE, ta)
    X3 = _safe_div(ebit, ta)
    X5 = _safe_div(sales, ta)

    def _is_manu(sic_val: Any) -> float:
        try:
            sv = float(sic_val)
            return 1.0 if 2000.0 <= sv < 4000.0 else 0.0
        except Exception:
            return 0.0

    manu = X["sic"].apply(_is_manu)

    def _safe_div_plain(a: pd.Series, b: pd.Series) -> pd.Series:
        with np.errstate(divide='ignore', invalid='ignore'):
            r = pd.to_numeric(a, errors="coerce") / pd.to_numeric(b, errors="coerce")
            r[~np.isfinite(r)] = np.nan
            return r

    mc_over_tl = _safe_div_plain(X["marketCapitalization"], tl)
    eq_over_tl = _safe_div_plain(eq, tl)

    altman_pub_manu  = 1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * mc_over_tl + 1.0 * X5
    altman_pub_other = 6.56 * X1 + 3.26 * X2 + 6.72 * X3 + 1.05 * eq_over_tl
    altman_priv      = 0.717 * X1 + 0.847 * X2 + 3.107 * X3 + 0.420 * eq_over_tl + 0.998 * X5

    is_pub = X["isPubliclyListed"]
    X["m_altmanZ"] = (
        altman_pub_manu * (is_pub.eq(1.0) & manu.eq(1.0))
        + altman_pub_other * (is_pub.eq(1.0) & manu.eq(0.0))
        + altman_priv * (is_pub.eq(0.0))
    ).astype(float)
    X["m_altmanZ"] = X["m_altmanZ"].fillna(0.0)  # evita colonne all-NaN

    roa = _safe_div(X["netIncome"], ta)
    lev = _safe_div(tl, ta)
    cr  = _safe_div(X["totalCurrentAssets"], X["totalCurrentLiabilities"])
    X["m_zmijewskiX"] = (-4.336 - 4.513 * roa + 5.679 * lev + 0.004 * cr).astype(float)

    ca = X["totalCurrentAssets"]
    cl = X["totalCurrentLiabilities"]
    ni_t  = X["netIncome"]
    ni_tm1= X["netIncome_t_minus_1"]
    ffo   = X["operatingCashFlow"]
    gnp   = X["gnpPriceLevelIndex"]

    ratio = _safe_div(ta, gnp)
    size  = _safelog_series(ratio)
    size  = size.where((gnp.notna()) & (gnp > 0.0), _safelog_series(ta))

    tlta = _safe_div(tl, ta)
    wcta = _safe_div(X["workingCapital"], ta)
    clca = _safe_div(cl, ca)
    nita = _safe_div(ni_t, ta)
    futl = _safe_div(ffo, tl)
    oeneg= (tl > ta).astype(float)
    intwo= ((ni_tm1.notna()) & (ni_t < 0.0) & (ni_tm1 < 0.0)).astype(float)

    denom = (ni_t.abs() + ni_tm1.abs())
    chin  = ((ni_t - ni_tm1) / denom).where(denom > 0.0, np.nan)

    X["m_ohlsonO"] = (
        -1.32
        - 0.407 * size
        + 6.03 * tlta
        - 1.43 * wcta
        + 0.076 * clca
        - 1.72 * oeneg
        - 2.37 * nita
        - 1.83 * futl
        + 0.285 * intwo
        - 0.521 * chin
    ).astype(float)

    # log features senza warning
    X["log_totalAssets"] = _safelog_series(X["totalAssets"])
    X["log_revenue"]     = _safelog_series(X["revenue"])
    X["log_totalLiab"]   = _safelog_series(X["totalLiabilities"])

    # forza esistenza di tutte le engineered (riempite con NaN, poi SafeImputer gestisce)
    for c in ENGINEERED_COLUMNS:
        if c not in X.columns:
            X[c] = np.nan

    # PREVENZIONE warning Imputer: evita colonne tutte NaN (metti 0.0 dove tutto NaN)
    always_nan_cols = [c for c in ENGINEERED_COLUMNS if pd.isna(X[c]).all()]
    for c in always_nan_cols:
        X[c] = 0.0

    # ritorna solo features numeriche nell'ordine previsto
    return X[ENGINEERED_COLUMNS].apply(pd.to_numeric, errors="coerce")

# --------------------------------------------------------------------------------------
# Imputer sicuro: median quando possibile, altrimenti costante 0.0 (niente warning)
# --------------------------------------------------------------------------------------
class SafeImputer(BaseEstimator, TransformerMixin):
    def __init__(self, strategy: str = "median", fill_value: float = 0.0):
        self.strategy = strategy
        self.fill_value = fill_value
        self.imputers_: Dict[str, Any] = {}
        self.columns_: List[str] = []

    # Compatibilità con Pipeline.set_output(...)
    def set_output(self, *, transform=None):
        return self

    def fit(self, X, y=None):
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X)
        self.columns_ = list(X.columns)
        self.stats_: Dict[str, float] = {}
        for c in self.columns_:
            col = pd.to_numeric(X[c], errors="coerce")
            if col.notna().any():
                # usa mediana reale
                self.stats_[c] = float(col.median())
            else:
                # nessun valore osservato -> fallback costante
                self.stats_[c] = float(self.fill_value)
        return self

    def transform(self, X):
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=self.columns_)
        out = pd.DataFrame(index=X.index)
        for c in self.columns_:
            col = pd.to_numeric(X[c], errors="coerce").astype(float)
            fillv = self.stats_[c]
            out[c] = col.fillna(fillv).to_numpy()
        return out

# --------------------------------------------------------------------------------------
# Training helpers
# --------------------------------------------------------------------------------------
def _feat_names_out(transformer, input_features):
    """Nomi colonna dell'output del FunctionTransformer (picklable)."""
    return ENGINEERED_COLUMNS


def build_pipelines(random_state: int = 42) -> Dict[str, Pipeline]:
    feat = FunctionTransformer(
        _feat_eng,
        validate=False,
        feature_names_out=_feat_names_out,
    )

    imputer = SafeImputer(strategy="median", fill_value=0.0)
    scaler = StandardScaler(with_mean=True, with_std=True)

    # Logistic Regression (baseline robusta)
    pipe_lr = Pipeline([
        ("feat", feat),
        ("impute", imputer),
        ("scale", scaler),
        ("clf", LogisticRegression(max_iter=5000, class_weight="balanced", solver="lbfgs")),
    ]).set_output(transform="pandas")

    # RandomForest base (foglie un po' più grandi per evitare foglie pure)
    rf_base = RandomForestClassifier(
        n_estimators=500,
        max_depth=None,
        min_samples_leaf=5,  # <- prima era 2
        class_weight="balanced",
        random_state=random_state,
        n_jobs=-1,
    )

    pipe_rf = Pipeline([
        ("feat", feat),
        ("impute", imputer),
        ("clf", rf_base),
    ]).set_output(transform="pandas")

    # RandomForest calibrato (isotonic) per probabilità "pulite"
    pipe_rf_cal = Pipeline([
        ("feat", feat),
        ("impute", imputer),
        ("clf", CalibratedClassifierCV(
            estimator=rf_base,   # <-- questo è il nome giusto del parametro
            method="isotonic",
            cv=5
        )),
    ]).set_output(transform="pandas")

    return {"logreg": pipe_lr, "rf": pipe_rf, "rf_cal": pipe_rf_cal}


def evaluate_cv(pipe: Pipeline, X: pd.DataFrame, y: np.ndarray, groups: np.ndarray, n_splits: int = 5) -> Tuple[float, float, np.ndarray]:
    gkf = GroupKFold(n_splits=n_splits)
    try:
        oof = cross_val_predict(pipe, X, y, groups=groups, cv=gkf, method="predict_proba", n_jobs=-1)[:, 1]
    except Exception:
        oof = cross_val_predict(pipe, X, y, groups=groups, cv=gkf, method="decision_function", n_jobs=-1)
        oof = 1.0 / (1.0 + np.exp(-oof))

    try:
        roc = roc_auc_score(y, oof)
    except Exception:
        roc = float("nan")
    try:
        pr = average_precision_score(y, oof)
    except Exception:
        pr = float("nan")
    return roc, pr, oof


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="Path a vecthor_training_v3.csv")
    ap.add_argument("--outdir", required=True, help="Cartella output modelli")
    ap.add_argument("--splits", type=int, default=5)
    ap.add_argument("--random-state", type=int, default=42)
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    # 1) carica dati
    df = pd.read_csv(args.data, low_memory=False)

    # 2) filtra righe valide
    df = df.dropna(subset=[TARGET_COL])
    df[TARGET_COL] = df[TARGET_COL].astype(int)

    # 3) prepara X, y, groups
    for c in FEATURE_COLUMNS:
        if c not in df.columns:
            df[c] = np.nan
    df["isPubliclyListed"] = df["isPubliclyListed"].apply(_bool01)

    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COL].values
    groups = df[GROUP_COL].values

    # 4) costruisci pipelines e valuta CV
    pipes = build_pipelines(random_state=args.random_state)
    results: Dict[str, Dict[str, Any]] = {}

    for name, pipe in pipes.items():
        print(f"[CV] Valuto {name}…", flush=True)
        roc, pr, oof = evaluate_cv(pipe, X, y, groups, n_splits=args.splits)
        results[name] = {"roc_auc": roc, "pr_auc": pr, "oof": oof}
        print(f"    ROC-AUC={roc:.4f} | PR-AUC={pr:.4f}")

    # 5) scegli il migliore (PR-AUC primario su dataset sbilanciati)
    best_name = max(results, key=lambda k: (results[k]["pr_auc"], results[k]["roc_auc"]))

    # ✅ Forza il calibrato per probabilità “pulite”
    if "rf_cal" in results:
        # se il calibrato è vicino al RF, preferiscilo; oppure forzalo sempre:
        if results["rf_cal"]["pr_auc"] >= results.get("rf", {"pr_auc": -1})["pr_auc"] - 0.05:
            best_name = "rf_cal"
        # in alternativa, per forzarlo SEMPRE:
        # best_name = "rf_cal"

    best_pipe = build_pipelines(args.random_state)[best_name]

    print(f"\n[MIGLIORE] {best_name}  (PR-AUC={results[best_name]['pr_auc']:.4f}, ROC-AUC={results[best_name]['roc_auc']:.4f})")

    # 6) salva preds_full.csv e top500.csv dagli oof del migliore
    oof = results[best_name]["oof"]
    out_pred = df[[*ID_COLS, TARGET_COL]].copy()
    out_pred["prob_12m"] = oof
    out_pred = out_pred.sort_values("prob_12m", ascending=False)

    out_pred.to_csv(os.path.join(args.outdir, "preds_full.csv"), index=False)
    out_pred.head(500).to_csv(os.path.join(args.outdir, "top500.csv"), index=False)

    # 7) fit finale su TUTTO il dataset e salva il modello
    print("[FIT] Refit del modello migliore su tutto il dataset…")
    best_pipe.fit(X, y)

    meta = {
        "feature_columns": FEATURE_COLUMNS,
        "engineered_columns": ENGINEERED_COLUMNS,
        "model": best_name,
        "splits": args.splits,
        "random_state": args.random_state,
        "metrics_cv": {k: {"roc_auc": float(v["roc_auc"]), "pr_auc": float(v["pr_auc"])} for k, v in results.items()},
        "version": 3,
    }

    model_path = os.path.join(args.outdir, "vecthor_best.joblib")
    dump({"pipeline": best_pipe, "meta": meta}, model_path)

    # 8) metrics.txt
    with open(os.path.join(args.outdir, "metrics.txt"), "w", encoding="utf-8") as fh:
        fh.write("Vecthor ML — CV results\n")
        for k, v in results.items():
            fh.write(f"{k}: ROC-AUC={v['roc_auc']:.4f} | PR-AUC={v['pr_auc']:.4f}\n")
        fh.write(f"\nBest: {best_name}\n")
        fh.write(f"Saved: {model_path}\n")

    print("\n✅ Salvato modello in:", model_path)
    print("   Predizioni:", os.path.join(args.outdir, "preds_full.csv"))
    print("   Top500:", os.path.join(args.outdir, "top500.csv"))
    print("   Metriche:", os.path.join(args.outdir, "metrics.txt"))


if __name__ == "__main__":
    main()
