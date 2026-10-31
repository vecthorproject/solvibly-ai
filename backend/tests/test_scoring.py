import pytest

from scoring import altman_risk, compute_solvibly_score, risk_around_cutoff


def test_cutoff_maps_to_half():
    assert risk_around_cutoff(0.862, cutoff=0.862, half_band=0.4) == pytest.approx(0.5)
    assert risk_around_cutoff(5, cutoff=0, half_band=1) == 0.0
    assert risk_around_cutoff(-5, cutoff=0, half_band=1) == 1.0


def test_altman_risk_uses_variant_thresholds():
    # Z' = 2.0 sits in the grey zone of the private model (1.23-2.90)...
    assert altman_risk(2.0, "Z1") == pytest.approx((2.90 - 2.0) / (2.90 - 1.23))
    # ...and would look much riskier with the original Z thresholds (1.81-2.99).
    assert altman_risk(2.0, "Z") == pytest.approx((2.99 - 2.0) / (2.99 - 1.81))
    assert altman_risk(1.0, "Z2") == 1.0
    assert altman_risk(3.0, "Z2") == 0.0


def results(**kw):
    r = {"currentRatio": 1.5, "quickRatio": 1.2, "altmanZScore": 2.0, "altmanVariant": "Z1",
         "springateSScore": 1.0}
    r.update(kw)
    return r


def test_weights_renormalised_without_esg():
    out = compute_solvibly_score(results())
    w = out["solviblyBreakdown"]["weights_used"]
    assert w["esg"] == 0.0 and w["classics"] > 0 and w["ratios"] > 0
    assert out["solviblyBreakdown"]["renorm_sum"] == pytest.approx(0.70)
    assert 0.0 <= out["solviblyScore"] <= 1.0


def test_band():
    out = compute_solvibly_score({})
    assert out["solviblyScore"] == 'N/A' and out["solviblyRiskBand"] == 'N/A'
