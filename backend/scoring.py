"""
scoring.py — Solvibly Score (composite risk 0..1) and risk mappings.

Every component is turned into a risk in [0, 1] with a monotone mapping:
  - probabilistic models (Ohlson logit, Zmijewski probit) use their own probability;
  - binary-cut-off models (Springate, Taffler, Fulmer, Grover, DSCR) are mapped linearly
    on a band around the cut-off, so that the published cut-off maps to 0.5;
  - Altman uses the distress/safe thresholds of the variant actually computed
    (Z, Z' or Z''), so the grey zone spans 1 → 0;
  - key ratios use simple linear bands.
Model risks and ratio risks are aggregated with the median (robust to outliers), then
blended with fixed weights. Missing pillars are dropped and the weights renormalised.
"""
from __future__ import annotations

import math
from typing import Any, Dict, Optional

from calculation import ALTMAN_VARIANTS, ohlson_probability, zmijewski_probability

# Pillar weights. The Vecthor Index only takes part when the company matches the
# population it was trained on (see ml_infer.vecthor_domain); otherwise its weight is 0.
WEIGHTS = {"vecthor": 0.10, "classics": 0.45, "ratios": 0.25, "esg": 0.20}

RISK_BAND_THRESHOLDS = (0.40, 0.60)


def _num(x: Any) -> Optional[float]:
    if x is None or x == 'N/A' or isinstance(x, bool):
        return None
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return v if math.isfinite(v) else None


def _clip01(x: Any) -> Optional[float]:
    v = _num(x)
    if v is None:
        return None
    return max(0.0, min(1.0, v))


def risk_higher_better(val: Any, low_bad: float, high_good: float) -> Optional[float]:
    v = _num(val)
    if v is None:
        return None
    if v <= low_bad:
        return 1.0
    if v >= high_good:
        return 0.0
    return (high_good - v) / (high_good - low_bad)


def risk_lower_better(val: Any, low_good: float, high_bad: float) -> Optional[float]:
    v = _num(val)
    if v is None:
        return None
    if v <= low_good:
        return 0.0
    if v >= high_bad:
        return 1.0
    return (v - low_good) / (high_bad - low_good)


def risk_around_cutoff(val: Any, cutoff: float, half_band: float) -> Optional[float]:
    """Higher values are safer; the cut-off maps to 0.5."""
    return risk_higher_better(val, cutoff - half_band, cutoff + half_band)


def altman_risk(z: Any, variant: str) -> Optional[float]:
    distress, safe = ALTMAN_VARIANTS.get(variant, ALTMAN_VARIANTS["Z2"])["thresholds"]
    return risk_higher_better(z, distress, safe)


def _median(values):
    vals = sorted(v for v in values if v is not None)
    if not vals:
        return None
    m = len(vals) // 2
    return vals[m] if len(vals) % 2 == 1 else (vals[m - 1] + vals[m]) / 2.0


def compute_solvibly_score(results: Dict[str, Any], vecthor_in_domain: bool) -> Dict[str, Any]:
    """Returns the fields to merge into the API results."""
    ml = _num(results.get("vecthorMLScore"))

    dscr_risk = risk_around_cutoff(results.get("dscr"), cutoff=1.0, half_band=0.2)
    ohlson_p = ohlson_probability(results.get("ohlsonOScore")) if _num(results.get("ohlsonOScore")) is not None else None
    zmij_p = zmijewski_probability(results.get("zmijewskiXScore")) if _num(results.get("zmijewskiXScore")) is not None else None
    altman_r = altman_risk(results.get("altmanZScore"), results.get("altmanVariant", "Z2"))
    spring_r = risk_around_cutoff(results.get("springateSScore"), cutoff=0.862, half_band=0.4)
    taffler_r = risk_around_cutoff(results.get("tafflerTScore"), cutoff=0.0, half_band=2.0)
    fulmer_r = risk_around_cutoff(results.get("fulmerHFactor"), cutoff=0.0, half_band=1.0)
    grover_r = risk_around_cutoff(results.get("groverGScore"), cutoff=0.0, half_band=0.3)

    esg_overall = _num(results.get("esgOverallScore"))
    esg_risk = None
    if esg_overall is not None:
        esg_norm01 = esg_overall / 100.0 if esg_overall > 1.0 else esg_overall
        esg_risk = _clip01(1.0 - esg_norm01)

    ratio_risks = {
        "currentRatio": risk_higher_better(results.get("currentRatio"), 1.0, 2.0),
        "quickRatio": risk_higher_better(results.get("quickRatio"), 1.0, 1.5),
        "interestCoverageRatio": risk_higher_better(results.get("interestCoverageRatio"), 1.0, 5.0),
        "roa": risk_higher_better(results.get("roa"), -0.05, 0.15),
        "roe": risk_higher_better(results.get("roe"), -0.10, 0.25),
        "roi": risk_higher_better(results.get("roi"), -0.05, 0.15),
        "ros": risk_higher_better(results.get("ros"), -0.05, 0.15),
        "assetTurnover": risk_higher_better(results.get("assetTurnover"), 0.20, 1.50),
        "debtToAssetsRatio": risk_lower_better(results.get("debtToAssetsRatio"), 0.20, 0.80),
        "debtToEquityRatio": risk_lower_better(results.get("debtToEquityRatio"), 0.50, 3.00),
    }
    ratios_risk = _median(ratio_risks.values())

    distress = {
        "ohlson_prob": ohlson_p,
        "altman_risk": altman_r,
        "zmijewski_prob": zmij_p,
        "springate_risk": spring_r,
        "taffler_risk": taffler_r,
        "fulmer_risk": fulmer_r,
        "grover_risk": grover_r,
        "dscr_risk": dscr_risk,
    }
    classic_risk = _median(distress.values())

    parts = []
    if ml is not None and vecthor_in_domain:
        parts.append(("vecthor", _clip01(ml)))
    if classic_risk is not None:
        parts.append(("classics", _clip01(classic_risk)))
    if ratios_risk is not None:
        parts.append(("ratios", _clip01(ratios_risk)))
    if esg_risk is not None:
        parts.append(("esg", _clip01(esg_risk)))

    solvibly = None
    w_sum = sum(WEIGHTS[k] for k, _ in parts)
    if parts and w_sum > 0:
        solvibly = sum(v * (WEIGHTS[k] / w_sum) for k, v in parts)

    t_low, t_high = RISK_BAND_THRESHOLDS
    if solvibly is None:
        band = 'N/A'
    else:
        band = "low" if solvibly < t_low else ("medium" if solvibly <= t_high else "high")

    used = {k for k, _ in parts}
    return {
        "solviblyScore": round(float(solvibly), 6) if solvibly is not None else 'N/A',
        "solviblyRiskBand": band,
        "solviblyRiskThresholds": {"t_low": t_low, "t_high": t_high},
        "solviblyBreakdown": {
            "weights_used": {k: (WEIGHTS[k] if k in used else 0.0) for k in WEIGHTS},
            "renorm_sum": w_sum,
            "components": {
                "vecthorMLScore": _clip01(ml) if vecthor_in_domain else None,
                "distress_models_median": _clip01(classic_risk),
                "ratios_median": _clip01(ratios_risk),
                "esg_risk": _clip01(esg_risk),
            },
            "distress_detail": {k: _clip01(v) for k, v in distress.items()},
            "ratios_detail": {k: _clip01(v) for k, v in ratio_risks.items()},
        },
    }
