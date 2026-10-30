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
         "vecthorMLScore": 0.9, "springateSScore": 1.0}
    r.update(kw)
    return r


def test_vecthor_excluded_out_of_domain():
    out = compute_solvibly_score(results(), vecthor_in_domain=False)
    assert out["solviblyBreakdown"]["weights_used"]["vecthor"] == 0.0
    inside = compute_solvibly_score(results(), vecthor_in_domain=True)
    assert inside["solviblyBreakdown"]["weights_used"]["vecthor"] > 0
    assert inside["solviblyScore"] > out["solviblyScore"]


def test_band():
    out = compute_solvibly_score({}, vecthor_in_domain=False)
    assert out["solviblyScore"] == 'N/A' and out["solviblyRiskBand"] == 'N/A'
