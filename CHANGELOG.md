# Changelog

## 0.2.0 — Crisis checks (CCII) and fixes

### Added
- Italian Corporate Crisis Code checks (`backend/crisis.py`): equity test, prospective DSCR (6/12 months,
  from totals or components), CNDCEC sector indices, warning signals of art. 3, c. 4, public-creditor
  thresholds of art. 25-novies, "test pratico". Each check returns status, threshold, legal reference and
  the data source when something is missing.
- CCII input section in manual entry and upload (all fields optional) and results section with overall
  outcome, missing-data list, professional's notes and references.
- Printable report (Print / Save PDF).
- Data consistency checks (assets vs liabilities + equity, reported total assets) and a "data used" table,
  including values that were missing and treated as 0.
- Extraction of extra Italian balance-sheet items (total debts, tax and social-security debts, provisions,
  share capital, previous-year net income from the comparative column).
- Scanned PDFs are sent to Gemini as PDF; only the pages with the financial statements are sent for
  long documents (e.g. a 99-page 10-K → 26 pages).
- `/api/health`, `.env.example`, pytest suite (63 tests).

### Fixed
- Altman: the score is now compared with the thresholds of the variant actually computed (Z, Z', Z''),
  and private non-manufacturing companies use Z'' as Altman recommends.
- Taffler: cut-off 0 for the 1983 formulation in use (the 0.2/0.3 zones belong to another version).
- Zmijewski is mapped to its probit probability in the Solvibly Score.
- Vecthor Index: model loaded once per process instead of at every request; calibrated model detected from
  its metadata; excluded from the Solvibly Score for companies outside its training population.
- Ohlson "Moderate Risk" zone shown in grey instead of yellow.
- Corrupted accents in the Italian form labels.
- Negative values (losses, negative equity, negative cash flow) could not be typed in the form.
- Pasting formatted amounts ("1.234.567,89", "(12.500)", "€ 3.200") now works.
- Decimal values were rejected by the browser (missing `step="any"`).
- "Depreciation & Amortization" from the manual form was ignored by the backend.
- Upload with country "USA" showed the Italian flag (country not normalised).
- `debug=True` and CORS `*` were hard-coded; generic error messages no longer leak exceptions.
- `requirements.txt` was UTF-16 encoded.

### Changed
- Italy is the default country.
- Vite template leftovers removed (favicon, unused assets and styles); Help and Pricing pages filled in.
