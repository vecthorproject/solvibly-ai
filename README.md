# Solvibly AI

Solvibly AI reads a company's financial statements (PDF upload or manual entry) and returns:

- **Crisis checks under the Italian Corporate Crisis Code (CCII, D.Lgs. 14/2019)** for Italian companies:
  equity test, prospective DSCR (6 or 12 months), the five CNDCEC sector indices, the warning signals of
  art. 3, c. 4 (payroll, suppliers, banks), the public-creditor thresholds of art. 25-novies (INPS, INAIL,
  VAT, Agenzia Entrate-Riscossione) and the "test pratico" debt/flows ratio. Each check shows the outcome,
  the legal threshold applied and, when data is missing, where to find it.
- **Key ratios** with sector benchmarks (indicative values).
- **Distress models**: Altman (Z, Z', Z'' picked by company profile), Springate, Taffler, Fulmer, Grover,
  Zmijewski, Ohlson.
- **Solvibly Score**: a composite 0–1 risk with Low / Medium / High bands.
- **Vecthor Index** (experimental): a calibrated Random Forest trained on US-listed companies. It enters the
  Solvibly Score only for companies that match that population; for others (e.g. Italian SMEs) it is shown as
  experimental.
- A **printable report** (Print / Save PDF) with the professional's notes.

> Work in progress. The tool supports the assessment of directors, statutory auditors and advisers; it does
> not replace it.

## Tech stack

- **Frontend:** React 19 + Vite, Emotion
- **Backend:** Python 3.11+ / Flask, scikit-learn, PyMuPDF, Google Gemini (document extraction)

## Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                # then set GEMINI_API_KEY
python app.py                       # http://127.0.0.1:5000
pytest                              # unit + API tests
```

Production: `gunicorn app:app` with `FLASK_DEBUG=0` and `ALLOWED_ORIGINS` set to the frontend domain.

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
| `GEMINI_API_KEY` | Key used to read uploaded statements. In the EU/EEA use a paid key: on the free tier content may be used by Google to improve its products, and the terms only allow paid services for apps offered to EEA users. | — |
| `GEMINI_MODEL` | Gemini model id | `gemini-2.5-flash` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `FLASK_DEBUG` | Flask debug mode (development only) | `0` |
| `MAX_UPLOAD_MB` | Max request size | `25` |

## How it works

```
backend/
  app.py          Flask app factory, CORS, upload limits, /api/health
  controller.py   /api/predict (manual data) and /api/upload (PDF) → results JSON
  services.py     PDF reading (only the statement pages; scanned PDFs sent as PDF), Gemini extraction
  calculation.py  ratios and distress models
  scoring.py      Solvibly Score (risk mappings, weights)
  crisis.py       CCII checks with legal references and thresholds
  ml_infer.py     Vecthor Index inference (model cached in memory)
  tests/          pytest suite
frontend/src/
  components/CrisisInput.jsx    CCII data entry (all fields optional)
  components/CrisisDisplay.jsx  CCII results, missing data, notes, references
  pages/Results.jsx             results page and printable report
```

### Score methodology

Each component becomes a risk between 0 and 1: Ohlson and Zmijewski through their own probability
(logit / probit), models with a single cut-off linearly around it (cut-off = 0.5), Altman with the thresholds
of the variant actually computed, ratios with simple bands. Model risks and ratio risks are combined with the
median, then blended (`scoring.py`: classics 0.45, ratios 0.25, ESG 0.20, Vecthor 0.10 when in domain).
Missing pillars are dropped and the weights renormalised. The weights are expert-set and still need
validation on outcome data.

### CCII thresholds

Thresholds are in `backend/crisis.py` with their legal source (art. 3 and art. 25-novies CCII as amended by
D.Lgs. 83/2022 and D.L. 73/2022; CNDCEC sector indices of 20 October 2019). Review them whenever the law
changes.

---

**Built by [Vecthor](https://github.com/vecthorproject)**
