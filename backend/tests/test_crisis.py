import pytest

from crisis import (
    ALERT, NOT_EVALUATED, OK, WARNING,
    assess_crisis, check_ader, check_banks, check_dscr, check_equity, check_inail, check_inps,
    check_payroll, check_practical_test, check_suppliers, check_vat, compute_cndcec_indices,
    resolve_cndcec_sector,
)


# --- art. 3, c. 4 ---

@pytest.mark.parametrize("overdue,monthly,status", [
    (None, 100.0, NOT_EVALUATED),
    (0, None, OK),
    (50.0, 100.0, OK),       # exactly half: not "oltre la metà"
    (50.01, 100.0, ALERT),
    (10.0, None, NOT_EVALUATED),
])
def test_payroll(overdue, monthly, status):
    assert check_payroll({"payrollOverdue30": overdue, "payrollMonthly": monthly})["status"] == status


@pytest.mark.parametrize("overdue,not_due,status", [
    (100.0, 100.0, OK),      # must be strictly greater
    (100.01, 100.0, ALERT),
    (10.0, 0.0, ALERT),
    (0, None, OK),
])
def test_suppliers(overdue, not_due, status):
    assert check_suppliers({"suppliersOverdue90": overdue, "suppliersNotDue": not_due})["status"] == status


@pytest.mark.parametrize("overdue,total,status", [
    (4.99, 100.0, OK),
    (5.0, 100.0, ALERT),     # "almeno il cinque per cento"
    (1.0, 0.0, NOT_EVALUATED),
])
def test_banks(overdue, total, status):
    assert check_banks({"bankOverdue60": overdue, "bankTotalExposure": total})["status"] == status


# --- art. 25-novies ---

def test_inps_with_employees_needs_both_thresholds():
    assert check_inps({"inpsOverdue90": 15_000, "hasEmployees": True, "inpsDuePrevYear": 10_000})["status"] == OK
    assert check_inps({"inpsOverdue90": 16_000, "hasEmployees": True, "inpsDuePrevYear": 50_000})["status"] == ALERT
    assert check_inps({"inpsOverdue90": 16_000, "hasEmployees": True, "inpsDuePrevYear": 100_000})["status"] == OK
    assert check_inps({"inpsOverdue90": 16_000, "hasEmployees": True})["status"] == NOT_EVALUATED


def test_inps_without_employees():
    assert check_inps({"inpsOverdue90": 5_000, "hasEmployees": False})["status"] == OK
    assert check_inps({"inpsOverdue90": 5_001, "hasEmployees": "false"})["status"] == ALERT


def test_inail():
    assert check_inail({"inailOverdue90": 5_000})["status"] == OK
    assert check_inail({"inailOverdue90": 5_000.01})["status"] == ALERT
    assert check_inail({})["status"] == NOT_EVALUATED


def test_vat():
    assert check_vat({"vatOverdue": 5_000})["status"] == OK
    assert check_vat({"vatOverdue": 6_000, "vatTurnoverPrevYear": 50_000})["status"] == ALERT     # >= 10%
    assert check_vat({"vatOverdue": 6_000, "vatTurnoverPrevYear": 100_000})["status"] == OK
    assert check_vat({"vatOverdue": 6_000})["status"] == NOT_EVALUATED
    assert check_vat({"vatOverdue": 20_001, "vatTurnoverPrevYear": 10_000_000})["status"] == ALERT


@pytest.mark.parametrize("form,debt,status", [
    ("impresa_individuale", 100_001, ALERT),
    ("societa_persone", 150_000, OK),
    ("societa_persone", 200_001, ALERT),
    ("societa_capitali", 400_000, OK),
    (None, 500_001, ALERT),
])
def test_ader(form, debt, status):
    assert check_ader({"aderOverdue90": debt, "legalForm": form})["status"] == status


# --- equity, DSCR, test pratico ---

def test_equity():
    assert check_equity({"totalEquity": -1})["status"] == ALERT
    assert check_equity({"totalEquity": 0})["status"] == ALERT
    assert check_equity({"totalEquity": 60, "shareCapital": 100})["status"] == WARNING
    assert check_equity({"totalEquity": 70, "shareCapital": 100})["status"] == OK
    assert check_equity({})["status"] == NOT_EVALUATED


def test_dscr():
    assert check_dscr({"dscrCashFlow": 90, "dscrDebtService": 100})["status"] == ALERT
    assert check_dscr({"dscrCashFlow": 100, "dscrDebtService": 100})["status"] == OK
    assert check_dscr({})["status"] == NOT_EVALUATED
    comp = check_dscr({"dscrOperatingFreeCashFlow": 50, "dscrOpeningCash": 30,
                       "dscrFinancialDebtService": 60, "dscrOverdueTaxSocial": 40})
    assert comp["status"] == ALERT and comp["value"] == pytest.approx(0.8)
    assert "12 mesi" in check_dscr({"dscrCashFlow": 1, "dscrDebtService": 1, "dscrHorizonMonths": 12})["title"]


def test_practical_test_bands():
    assert check_practical_test({"restructuringDebt": 200, "annualDebtServiceFlows": 100})["status"] == OK
    assert check_practical_test({"restructuringDebt": 300, "annualDebtServiceFlows": 100})["status"] == WARNING
    assert check_practical_test({"restructuringDebt": 500, "annualDebtServiceFlows": 100})["status"] == ALERT
    assert check_practical_test({"restructuringDebt": 500, "annualDebtServiceFlows": -10})["status"] == ALERT


# --- CNDCEC ---

def italian_company(**kw):
    d = {"industrySector": "manufacturing", "revenue": 1000.0, "interestExpense": 40.0, "totalEquity": 50.0,
         "totalDebts": 900.0, "totalCurrentAssets": 400.0, "totalCurrentLiabilities": 500.0,
         "netIncome": -10.0, "depreciation": 12.0, "provisions": 0.0, "totalAssets": 1000.0,
         "taxDebts": 40.0, "socialSecurityDebts": 20.0}
    d.update(kw)
    return d


def test_cndcec_all_breached_is_alert():
    res = compute_cndcec_indices(italian_company())
    assert res["sector"] == "BCD"
    assert res["breachedCount"] == 5 and res["status"] == ALERT


def test_cndcec_partial_excludes_joint_signal():
    res = compute_cndcec_indices(italian_company(taxDebts=None, socialSecurityDebts=None, interestExpense=1.0))
    assert res["evaluated"] == 4 and res["status"] == WARNING  # 3 breached out of 4
    res2 = compute_cndcec_indices(italian_company(taxDebts=None, socialSecurityDebts=None,
                                                  interestExpense=1.0, totalCurrentAssets=900.0))
    assert res2["status"] == OK


def test_cndcec_sector_resolution():
    assert resolve_cndcec_sector({"industrySector": "construction"}) is None
    assert resolve_cndcec_sector({"industrySector": "construction", "cndcecSector": "F41"}) == "F41"
    assert compute_cndcec_indices(italian_company(industrySector="trade"))["status"] == NOT_EVALUATED


# --- overall ---

def test_overall_levels():
    assert assess_crisis({})["overall"]["level"] == "grey"
    healthy = italian_company(totalEquity=600.0, totalDebts=300.0, totalCurrentAssets=900.0, interestExpense=5.0,
                              netIncome=80.0, taxDebts=5.0, socialSecurityDebts=5.0,
                              dscrCashFlow=200.0, dscrDebtService=100.0,
                              payrollOverdue30=0, suppliersOverdue90=0, bankOverdue60=0, inpsOverdue90=0)
    assert assess_crisis(healthy)["overall"]["level"] == "green"
    no_signals = {k: v for k, v in healthy.items() if not k.endswith(("Overdue30", "Overdue90", "Overdue60"))}
    assert assess_crisis(no_signals)["overall"]["level"] == "green_partial"
    sick = dict(healthy, vatOverdue=25_000)
    out = assess_crisis(sick)
    assert out["overall"]["level"] == "red" and any("IVA" in a for a in out["overall"]["alerts"])


def test_cndcec_only_counts_when_dscr_missing():
    company = italian_company()  # all five indices breached
    with_dscr = assess_crisis(dict(company, dscrCashFlow=150.0, dscrDebtService=100.0))
    assert not any("cinque" in a for a in with_dscr["overall"]["alerts"])
    without = assess_crisis(company)
    assert any("cinque" in a for a in without["overall"]["alerts"])
