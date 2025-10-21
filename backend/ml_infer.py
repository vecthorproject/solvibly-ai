# ml_infer.py — ML for Vecthor Index
from __future__ import annotations
import argparse, json, os, sys
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from joblib import load

# path modello di default: ./models/vecthor_best.joblib accanto a questo file
HERE = os.path.dirname(__file__)
MODEL_PATH_DEFAULT = os.path.join(HERE, "models", "vecthor_best.joblib")

# hack per far trovare gli oggetti picklati (_feat_eng, _feat_names_out, SafeImputer)
import train_vecthor_model
sys.modules["__main__"]._feat_eng = train_vecthor_model._feat_eng
sys.modules["__main__"]._feat_names_out = train_vecthor_model._feat_names_out
sys.modules["__main__"].SafeImputer = train_vecthor_model.SafeImputer

# colonne base attese dal modello
FEATURE_COLUMNS: List[str] = [
    "sic","fiscalYear",
    "totalCurrentAssets","totalNonCurrentAssets","totalCurrentLiabilities","totalNonCurrentLiabilities",
    "inventories","totalAssets","totalLiabilities","totalEquity",
    "revenue","ebit","netIncome","interestExpense","operatingCashFlow",
    "tangibleFixedAssets","retainedEarnings","depreciation",
    "workingCapital","netIncome_t_minus_1","quickAssets",
    "sharesOutstanding","marketCapitalization","isPubliclyListed",
    "gnpPriceLevelIndex",
    "longTermDebtCurrent","dscrCashFlow_proxy","dscrDebtService_proxy",
]

def _bool01(v: Any) -> float:
    if isinstance(v, bool):
        return 1.0 if v else 0.0
    if isinstance(v, str):
        vv = v.strip().lower()
        if vv in ("true","yes","y","1"): return 1.0
        if vv in ("false","no","n","0",""): return 0.0
    try:
        return 1.0 if float(v) != 0.0 else 0.0
    except Exception:
        return 0.0

def _coerce_row(fin: Dict[str, Any]) -> pd.DataFrame:
    row = {}
    for c in FEATURE_COLUMNS:
        if c not in fin:
            row[c] = np.nan
        else:
            v = fin[c]
            if c == "isPubliclyListed":
                row[c] = _bool01(v)
            else:
                try:
                    row[c] = float(v) if v not in (None, "") else np.nan
                except Exception:
                    row[c] = np.nan
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)

def _score_with_pipe(pipe, X: pd.DataFrame) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    # usa l'intera pipeline: gestisce feat → impute → scale (se c'è) → clf
    if hasattr(pipe, "predict_proba"):
        proba = pipe.predict_proba(X)[0]
        p = float(proba[1])
        # smoothing anti-0/1 “duri” per una UX più pulita
        eps = 1e-6
        p = min(max(p, eps), 1.0 - eps)
        out["prob_12m"] = p
        out["proba_raw"] = [float(proba[0]), float(proba[1])]
    else:
        z = float(pipe.decision_function(X)[0])
        p = 1.0 / (1.0 + np.exp(-z))
        eps = 1e-6
        p = min(max(p, eps), 1.0 - eps)
        out["prob_12m"] = p
        out["decision"] = z
    return out

def score_from_financial_dict(model_path: str, financials: Dict[str, Any]) -> Dict[str, Any]:
    obj = load(model_path)
    pipe = obj["pipeline"]
    meta = obj.get("meta", {})
    X = _coerce_row(financials)
    out = _score_with_pipe(pipe, X)
    out["model"] = meta.get("model", "unknown")
    return out

def score_from_csv_row(model_path: str, csv_path: str, cik: int, year: int) -> Dict[str, Any]:
    obj = load(model_path)
    pipe = obj["pipeline"]
    meta = obj.get("meta", {})
    df = pd.read_csv(csv_path, low_memory=False)
    row = df[(df["cik"] == cik) & (df["fiscalYear"] == year)]
    if row.empty:
        raise SystemExit("No CSV line for that CIK/year.")
    fin = {c: (row.iloc[0][c] if c in row.columns else None) for c in FEATURE_COLUMNS}
    X = _coerce_row(fin)
    out = _score_with_pipe(pipe, X)
    out["model"] = meta.get("model", "unknown")
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=MODEL_PATH_DEFAULT, help="Path to .joblib (models/vecthor_best.joblib)")
    ap.add_argument("--json", help="Path to JSON with financial fields")
    ap.add_argument("--csv", help="Path to vecthor_training_v3.csv")
    ap.add_argument("--cik", type=int, help="CIK")
    ap.add_argument("--year", type=int, help="fiscalYear")
    args = ap.parse_args()

    if not os.path.exists(args.model):
        raise SystemExit(f"Model not found: {args.model}")

    if args.json:
        with open(args.json, "r", encoding="utf-8") as fh:
            fin = json.load(fh)
        out = score_from_financial_dict(args.model, fin)
        print(json.dumps(out, indent=2))
        return

    if args.csv and args.cik and args.year:
        out = score_from_csv_row(args.model, args.csv, args.cik, args.year)
        print(json.dumps(out, indent=2))
        return

    ap.print_help()

if __name__ == "__main__":
    main()
