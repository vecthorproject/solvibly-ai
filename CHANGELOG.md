# Changelog

## 0.4.0 — Italian interface, year comparison, client archive

### Added
- Comparison with the previous year when the XBRL contains it: revenue, operating result, net income,
  total assets, equity, debts, tax and social-security debts, current ratio, debt/equity, ROE and ROS with
  the change, plus the five CNDCEC indices for both years.
- Client archive (optional): registration and login (scrypt password hashes, signed tokens valid 30 days,
  login rate limit), clients matched by tax code or by name, saved analyses with editable notes, per-client
  trend across years, deletion of analyses, clients and the whole account. Only computed results are stored.
  Postgres via `DATABASE_URL` (e.g. Neon), SQLite locally; disabled on Render when no database is set.
- Draft privacy policy (`/privacy`) and terms of use (`/termini`), describing the actual data flows. To be
  completed and reviewed by a lawyer.
- `VITE_API_URL` so the frontend can be deployed on a different domain from the backend; without it the
  app falls back to the production backend when the host does not forward `/api`. Origins on
  `*.onrender.com` are allowed by the backend's CORS by default.
- `SECRET_KEY` is optional: the token-signing key is generated once and stored in the database.
- 404 page.

### Changed
- The whole interface and the API error messages are in Italian.
- The results page was rewritten: clearer sections, "Save to archive" next to "Print / Save PDF".

## 0.3.0 — XBRL import

### Added
- Upload of the Italian financial statement in XBRL as filed with the Registro Imprese (taxonomy itcc-ci,
  PCI 2018-11-04): plain `.xbrl`/`.xml`, digitally signed `.p7m` (DER or base64) and `.zip`. Values are read
  from the tagged facts, without AI and without an API key, for the current and the previous year
  (ordinary, abridged and micro schemes).
- From the XBRL data: company name, fiscal year, previous-year net income (Ohlson O-Score without a second
  document), ATECO code → industry sector and CNDCEC sector group, legal form → AdER threshold. Choices made
  by the user in the form take precedence.
- When a filing has no within/beyond-one-year split of debts, all debts are treated as short-term and a
  data-quality note says so.
- XML is parsed with `defusedxml` (entity expansion and external entities are rejected).

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
- Document extraction with Claude (Claude Haiku 5.5 by default) using structured outputs: the answer
  always follows a JSON schema and items absent from the document are reported as missing instead of 0.
  Gemini remains available with `AI_PROVIDER=gemini`.
- Scanned PDFs are sent to the model as PDF; only the pages with the financial statements are sent for
  long documents (e.g. a 99-page 10-K → 26 pages).
- `/api/health`, `.env.example`, pytest suite.

### Fixed
- Altman: the score is now compared with the thresholds of the variant actually computed (Z, Z', Z''),
  and private non-manufacturing companies use Z'' as Altman recommends.
- Taffler: cut-off 0 for the 1983 formulation in use (the 0.2/0.3 zones belong to another version).
- Zmijewski is mapped to its probit probability in the Solvibly Score.
- Ohlson "Moderate Risk" zone shown in grey instead of yellow.
- Corrupted accents in the Italian form labels.
- Negative values (losses, negative equity, negative cash flow) could not be typed in the form.
- Pasting formatted amounts ("1.234.567,89", "(12.500)", "€ 3.200") now works.
- Decimal values were rejected by the browser (missing `step="any"`).
- "Depreciation & Amortization" from the manual form was ignored by the backend.
- Upload with country "USA" showed the Italian flag (country not normalised).
- `debug=True` and CORS `*` were hard-coded; generic error messages no longer leak exceptions.
- `requirements.txt` was UTF-16 encoded.
- Deploy build ran out of memory: `requirements.txt` was a full freeze of an old environment (including the
  unused gRPC stack) with versions that have no prebuilt wheels for Python 3.14, so they were compiled from
  source. It now pins only what the backend uses, all available as wheels for Python 3.13 and 3.14;
  `.python-version` pins Python 3.13 and `gunicorn.conf.py` raises the worker timeout to 180 s.

### Removed
- Vecthor Index (Random Forest trained on US-listed companies): not validated for the target market
  (Italian SMEs). Model file, training script, inference code and the ML dependencies (scikit-learn,
  pandas, numpy, scipy, joblib) are removed; they remain available in the git history.

### Changed
- Italy is the default country.
- Vite template leftovers removed (favicon, unused assets and styles); Help and Pricing pages filled in.
