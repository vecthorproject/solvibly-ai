# Solvibly AI

Solvibly AI reads a company's financial statements and returns the analysis below. Input options:
the **XBRL file filed with the Italian Registro Imprese** (`.xbrl`, signed `.p7m` or `.zip`, read directly,
no AI, current and previous year, ATECO code and legal form included), a **PDF** (read with AI) or
**manual entry**. Results:

- **Crisis checks under the Italian Corporate Crisis Code (CCII, D.Lgs. 14/2019)** for Italian companies:
  equity test, prospective DSCR (6 or 12 months), the five CNDCEC sector indices, the warning signals of
  art. 3, c. 4 (payroll, suppliers, banks), the public-creditor thresholds of art. 25-novies (INPS, INAIL,
  VAT, Agenzia Entrate-Riscossione) and the "test pratico" debt/flows ratio. Each check shows the outcome,
  the legal threshold applied and, when data is missing, where to find it.
- **Key ratios** with sector benchmarks (indicative values).
- **Distress models**: Altman (Z, Z', Z'' picked by company profile), Springate, Taffler, Fulmer, Grover,
  Zmijewski, Ohlson.
- **Solvibly Score**: a composite 0–1 risk with Low / Medium / High bands.
- **Comparison with the previous year** (from XBRL: key figures, ratios and CNDCEC indices for both years).
- A **printable report** (Print / Save PDF) with the professional's notes.
- An optional **client archive**: accounts, clients (matched by tax code or name), saved analyses with notes
  and the trend across years. Only computed results are stored, never the uploaded documents.

The interface is in Italian.

> Work in progress. The tool supports the assessment of directors, statutory auditors and advisers; it does
> not replace it.

## Tech stack

- **Frontend:** React 19 + Vite, Emotion
- **Backend:** Python 3.11+ / Flask, PyMuPDF, Claude (Anthropic API) for document extraction, Gemini optional

## Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                # then set ANTHROPIC_API_KEY
python app.py                       # http://127.0.0.1:5000
pytest                              # unit + API tests
```

Production: `gunicorn app:app` (settings in `gunicorn.conf.py`, 180 s timeout for AI extraction) with
`FLASK_DEBUG=0` and `ALLOWED_ORIGINS` set to the frontend domain. The Python version is pinned in
`.python-version` (3.13). `requirements.txt` is fully pinned and contains only packages with prebuilt
wheels for Python 3.13 and 3.14; direct dependencies are in `requirements.in`.

### Frontend

```bash
cd frontend
npm install
npm run dev                         # http://localhost:5173 (proxies /api to :5000)
npm run lint
npm run build
```

### Configuration (`backend/.env`)

| Variable | Purpose | Default |
|---|---|---|
| `AI_PROVIDER` | `claude` or `gemini`. If empty: Claude when `ANTHROPIC_API_KEY` is set, otherwise Gemini | `claude` |
| `ANTHROPIC_API_KEY` | Claude API key, used to read uploaded statements (text, or the PDF itself when scanned). API data is not used for training. | — |
| `CLAUDE_MODEL` | Claude model id | `claude-haiku-5-5` |
| `CLAUDE_EFFORT` | `low` / `medium` / `high`: how much the model reasons before answering | `medium` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional alternative. For apps offered to EU/EEA, Swiss or UK users, Google's terms allow only the paid services. | — / `gemini-2.5-flash` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `FLASK_DEBUG` | Flask debug mode (development only) | `0` |
| `MAX_UPLOAD_MB` | Max request size | `25` |
| `DATABASE_URL` | Postgres URL for the client archive (e.g. Neon). Empty locally: SQLite in `backend/data/`. Empty on Render: archive disabled | — |
| `SECRET_KEY` | Signs login tokens. Required in production (long random string) | random per process (dev) |

Frontend (build time): `VITE_API_URL`, the backend URL when the frontend is served from another domain
(e.g. `https://solvibly-ai-backend.onrender.com`). Leave empty in development.

## Deploy (Render + Neon, free tiers)

1. **Database**: create a free Postgres project on [Neon](https://neon.tech) in an EU region and copy the
   connection string.
2. **Backend** (Render web service, root `backend`, build `pip install -r requirements.txt`, start
   `gunicorn app:app`): set `ANTHROPIC_API_KEY`, `DATABASE_URL`, `SECRET_KEY` and
   `ALLOWED_ORIGINS=https://<frontend>.onrender.com`. Tables are created at startup.
3. **Frontend** (Render static site, root `frontend`, build `npm ci && npm run build`, publish `dist`): set
   `VITE_API_URL=https://<backend>.onrender.com` and add the rewrite rule `/*` → `/index.html` so that
   links like `/clienti/3` work on reload.

The free Render web service sleeps after 15 minutes without requests; the first request then takes about a
minute.

## How it works

```
backend/
  app.py          Flask app factory, CORS, upload limits, /api/health
  controller.py   /api/predict (manual data) and /api/upload (PDF or XBRL) → results JSON
  services.py     PDF reading (only the statement pages; scanned PDFs sent as PDF), AI extraction (Claude / Gemini)
  xbrl_it.py      Italian XBRL reader (taxonomy itcc-ci): facts, current/previous year, ATECO → sector
  calculation.py  ratios and distress models
  scoring.py      Solvibly Score (risk mappings, weights)
  crisis.py       CCII checks with legal references and thresholds
  db.py           database setup (Postgres via DATABASE_URL, SQLite locally): users, clients, analyses
  archive.py      /api/auth/*, /api/clients, /api/analyses (token auth, per-user data)
  tests/          pytest suite
frontend/src/
  components/CrisisInput.jsx    CCII data entry (all fields optional)
  components/CrisisDisplay.jsx  CCII results, missing data, notes, references
  components/ResultsView.jsx    results page, printable report, save to archive
  components/YearComparison.jsx comparison with the previous year
  auth/                         login state and token handling
  pages/Login, Clients, ClientDetail, SavedAnalysis   client archive
  pages/Privacy, Terms          draft legal pages (to be reviewed by a lawyer)
```

### Score methodology

Each component becomes a risk between 0 and 1: Ohlson and Zmijewski through their own probability
(logit / probit), models with a single cut-off linearly around it (cut-off = 0.5), Altman with the thresholds
of the variant actually computed, ratios with simple bands. Model risks and ratio risks are combined with the
median, then blended (`scoring.py`: classics 0.45, ratios 0.25, ESG 0.20).
Missing pillars are dropped and the weights renormalised. The weights are expert-set and still need
validation on outcome data.

### CCII thresholds

Thresholds are in `backend/crisis.py` with their legal source (art. 3 and art. 25-novies CCII as amended by
D.Lgs. 83/2022 and D.L. 73/2022; CNDCEC sector indices of 20 October 2019). Review them whenever the law
changes.

---

**Built by [Vecthor](https://github.com/vecthorproject)**
