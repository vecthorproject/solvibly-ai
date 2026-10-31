import math

import pytest

from calculation import (
    altman_variant,
    calculate_altman_zscore,
    calculate_taffler_tscore,
    ohlson_probability,
    zmijewski_probability,
)


def base(**kw):
    d = {
        "totalAssets": 1000.0, "workingCapital": 200.0, "retainedEarnings": 100.0, "ebit": 80.0,
        "totalLiabilities": 600.0, "revenue": 1200.0, "totalEquity": 400.0, "marketCapitalization": 0.0,
        "isPubliclyListed": False, "industrySector": "manufacturing",
    }
    d.update(kw)
    return d


@pytest.mark.parametrize("public,sector,mcap,expected", [
    (True, "manufacturing", 500.0, "Z"),
    (True, "manufacturing", 0.0, "Z1"),     # no market value -> book-value variant
    (False, "manufacturing", 0.0, "Z1"),
    (False, "trade", 0.0, "Z2"),            # private non-manufacturing -> Z''
    (True, "trade", 500.0, "Z2"),
    (False, "", 0.0, "Z2"),
])
def test_altman_variant_selection(public, sector, mcap, expected):
    assert altman_variant(base(isPubliclyListed=public, industrySector=sector, marketCapitalization=mcap)) == expected


def test_altman_formulas():
    d = base()
    x1, x2, x3, x4, x5 = 0.2, 0.1, 0.08, 400 / 600, 1.2
    assert calculate_altman_zscore(d) == pytest.approx(round(0.717*x1 + 0.847*x2 + 3.107*x3 + 0.420*x4 + 0.998*x5, 4))
    d2 = base(industrySector="trade")
    assert calculate_altman_zscore(d2) == pytest.approx(round(6.56*x1 + 3.26*x2 + 6.72*x3 + 1.05*x4, 4))
    d3 = base(isPubliclyListed=True, marketCapitalization=900.0)
    assert calculate_altman_zscore(d3) == pytest.approx(round(1.2*x1 + 1.4*x2 + 3.3*x3 + 0.6*1.5 + 1.0*x5, 4))


def test_altman_zero_assets_is_na():
    assert calculate_altman_zscore(base(totalAssets=0.0)) == 'N/A'


def test_probabilities():
    assert zmijewski_probability(0) == pytest.approx(0.5)
    assert zmijewski_probability(1.96) == pytest.approx(0.975, abs=1e-3)
    assert ohlson_probability(0) == pytest.approx(0.5)
    assert ohlson_probability(-1000) == 0.0
    assert ohlson_probability('N/A') is None


def test_taffler_runs():
    d = {"ebit": 100.0, "interestExpense": 20.0, "totalCurrentLiabilities": 300.0, "totalCurrentAssets": 400.0,
         "totalLiabilities": 500.0, "totalAssets": 1000.0, "revenue": 1500.0, "inventories": 100.0}
    z = calculate_taffler_tscore(d)
    assert isinstance(z, float) and math.isfinite(z)
