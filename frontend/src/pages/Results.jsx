import styled from '@emotion/styled';
import { Link, useLocation } from 'react-router-dom';
import RatioDisplay from '../components/RatioDisplay';
import ModelDisplay from '../components/ModelDisplay';
import EsgDisplay from '../components/ESGDisplay.jsx';
import CrisisDisplay from '../components/CrisisDisplay.jsx';
import usaIcon from '../graphics/Results/usa.svg';
import italyIcon from '../graphics/Results/italy.svg';
import { industrySectors } from '../data/DictOb.js';

// --- STYLED COMPONENTS ---

const PageWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, sans-serif;
`;

const ResultsTopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2.5rem;
  border-bottom: 1px solid #eee;
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
`;

const RiskBlock = styled.div`
  display: flex;
  align-items: center;
`;

const StyledTitleCompany = styled.h3`
  font-weight: 700;
  font-size: 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledSubtitle = styled.p`
  font-weight: 400;
  font-size: 1rem;
  color: #555;
  margin: 0.25rem 0 0 0;
`;

const RiskScoreLabel = styled.span`
  font-size: 1.2rem;
  font-family: system-ui, sans-serif;
  font-weight: 600;
  color: #333;
`;

const RiskScoreValue = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
  font-family: system-ui, sans-serif;
  color: white;
  text-shadow: 
    -0.8px -0.8px 0 #718096,  
     0.8px -0.8px 0 #718096,
    -0.8px  0.8px 0 #718096,
     0.8px  0.8px 0 #718096;
  background-color: ${p => p.bgColor || '#B7F0D8'};
  padding: 5px 15px;
  border-radius: 20px;
  margin-left: 10px;
`;

const SectionTitle = styled.h2`
  font-size: 1.6rem;
  font-family: "Cascadia Mono", system-ui, sans-serif;
  color: #15a497;
  text-align: center;
  margin: 2.5rem 0 2rem 0;
  break-after: avoid;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin: 1rem 2.5rem 0;
  flex-wrap: wrap;
`;

const ToolbarButton = styled.button`
  background-color: #15a497;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.55rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  &:hover { background-color: #118a7e; }
`;

const ToolbarLink = styled(Link)`
  border: 1px solid #15a497;
  color: #15a497;
  border-radius: 8px;
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
`;

const NoticeBlock = styled.div`
  margin: 1.5rem 2.5rem;
  padding: 1rem 1.4rem;
  border-radius: 12px;
  border: 1px solid ${p => (p.tone === 'warning' ? '#D69E2E' : '#CBD5E0')};
  background: ${p => (p.tone === 'warning' ? '#FFFBEA' : '#F7FAFC')};
  text-align: left;
  font-family: system-ui, sans-serif;
  font-size: 0.85rem;
  color: #2D3748;
  line-height: 1.5;

  ul { margin: 0.4rem 0 0 1.1rem; padding: 0; }
  summary { cursor: pointer; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.6rem; }
  td { padding: 0.3rem 0.4rem; border-bottom: 1px solid #EDF2F7; }
  td:last-of-type { text-align: right; font-variant-numeric: tabular-nums; }
`;

const PrintHeader = styled.div`
  text-align: left;
  font-family: system-ui, sans-serif;
  border-bottom: 2px solid #15a497;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;

  h1 { font-size: 1.4rem; margin: 0; color: #15a497; }
  p { margin: 0.2rem 0 0; font-size: 0.85rem; color: #4A5568; }
`;

// --- KEY & TITLE DICTIONARY ---

const pageConfig = {
  keyRatios: [
    { key: 'currentRatio', title: 'Current Ratio' },
    { key: 'quickRatio', title: 'Quick Ratio' },
    { key: 'debtToEquityRatio', title: 'Debt-to-Equity Ratio' },
    { key: 'debtToAssetsRatio', title: 'Debt-to-Asset Ratio' },
    { key: 'interestCoverageRatio', title: 'Interest Coverage Ratio' },
    { key: 'roa', title: 'Return on Assets (ROA)' },
    { key: 'roe', title: 'Return on Equity (ROE)' },
    { key: 'roi', title: 'Return on Investment (ROI)' },
    { key: 'ros', title: 'Return on Sales (ROS)' },
    { key: 'assetTurnover', title: 'Asset Turnover' }
  ],
  financialDistressModels: [
    { key: 'altmanZScore', title: 'Altman Z-Score' },
    { key: 'springateSScore', title: 'Springate S-Score' },
    { key: 'tafflerTScore', title: 'Taffler T-Score' },
    { key: 'fulmerHFactor', title: 'Fulmer H-Factor' },
    { key: 'groverGScore', title: 'Grover G-Score' },
    { key: 'zmijewskiXScore', title: 'Zmijewski X-Score'},
    { key: 'ohlsonOScore', title: 'Ohlson O-Score'}
  ]
};

// --- HELPER FUNCTIONS ---

function getSectorShortLabel(country, sectorKey) {
  if (!sectorKey) {
    return 'N/A';
  }
  const sectors = industrySectors[country] || [];
  const sector = sectors.find(s => s.value === sectorKey);
  return sector ? sector.shortLabel : 'N/A';
}

const RISK_COLORS = {
  low: '#B7F0D8',
  medium: '#FAF3B6',
  high: '#F8B4B4'
};

function getRiskInfo(solviblyBand, score) {
  const band = (solviblyBand || '').toLowerCase();
  const labelMap = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk'
  };
  const color = RISK_COLORS[band] || '#E2E8F0';
  const label = labelMap[band] || 'N/A';
  const value = (typeof score === 'number' && isFinite(score)) ? score : null;
  return { label, color, value };
}

const INPUT_LABELS = {
  revenue: ['Ricavi (A.1)', 'Revenue'],
  ebit: ['Risultato operativo (A − B)', 'EBIT'],
  netIncome: ["Utile (perdita) d'esercizio", 'Net income'],
  netIncome_t_minus_1: ["Utile (perdita) dell'esercizio precedente", 'Net income (previous year)'],
  depreciation: ['Ammortamenti e svalutazioni (B.10)', 'Depreciation & amortization'],
  interestExpense: ['Oneri finanziari (C.17)', 'Interest expense'],
  totalCurrentAssets: ['Attivo circolante', 'Total current assets'],
  inventories: ['Rimanenze', 'Inventories'],
  totalNonCurrentAssets: ['Immobilizzazioni', 'Total non-current assets'],
  tangibleFixedAssets: ['Immobilizzazioni materiali', 'Tangible fixed assets'],
  totalCurrentLiabilities: ['Passività a breve', 'Total current liabilities'],
  totalNonCurrentLiabilities: ['Passività a medio-lungo', 'Total non-current liabilities'],
  totalEquity: ['Patrimonio netto', "Stockholders' equity"],
  retainedEarnings: ['Utili portati a nuovo e riserve', 'Retained earnings'],
  operatingCashFlow: ['Flusso di cassa operativo', 'Operating cash flow'],
  marketCapitalization: ['Capitalizzazione', 'Market capitalization'],
  totalDebts: ['Debiti totali (D)', 'Total debts'],
  taxDebts: ['Debiti tributari (D.12)', 'Tax debts'],
  socialSecurityDebts: ['Debiti previdenziali (D.13)', 'Social security debts'],
  provisions: ['Accantonamenti (B.12 + B.13)', 'Provisions'],
  shareCapital: ['Capitale sociale', 'Share capital'],
  totalAssetsReported: ['Totale attivo (da bilancio)', 'Total assets (reported)'],
};

function formatAmount(v) {
  return typeof v === 'number' && isFinite(v) ? v.toLocaleString('it-IT', { maximumFractionDigits: 2 }) : String(v);
}

// --- MAIN COMPONENT ---

function Results() {
  const location = useLocation();
  const resultsData = location.state?.results || {};

  if (!location.state?.results) {
    return (
      <PageWrapper>
        <NoticeBlock>
          No analysis to show. Start a new one from the <Link to="/">dashboard</Link>.
        </NoticeBlock>
      </PageWrapper>
    );
  }

  const companyName = resultsData.companyName ?? "N/A";
  const fiscalYear = resultsData.fiscalYear ?? "N/A";
  const country = resultsData.country ?? "USA";
  const industrySectorKey = resultsData.industrySector || null; 
  const countryKey =
    country?.toLowerCase() === 'italy' ? 'Italy' :
    country?.toLowerCase() === 'usa'   ? 'USA'   :
    country;
  const industrySectorLabel = getSectorShortLabel(countryKey, industrySectorKey);

  const { label: riskLabel, color: riskColor } =
    getRiskInfo(resultsData.solviblyRiskBand, resultsData.solviblyScore);

  const isItaly = countryKey === 'Italy';
  const crisis = resultsData.crisisAssessment;
  const warnings = resultsData.dataQuality?.warnings || [];
  const inputsUsed = resultsData.inputsUsed || {};
  const extraction = resultsData.extraction;

  const esgSource =
    resultsData.esgSource ||
    (resultsData.esgRating
      ? 'rating'
      : (resultsData.esgScore_E != null || resultsData.esgScore_S != null || resultsData.esgScore_G != null)
        ? 'sliders'
        : null);

  const showESG =
    (esgSource === 'rating'  && (resultsData.esgRating || resultsData.esgOverallScore != null)) ||
    (esgSource === 'sliders' && (resultsData.esgScore_E != null || resultsData.esgScore_S != null || resultsData.esgScore_G != null || resultsData.esgOverallScore != null));

  return(
    <PageWrapper>
      <PrintHeader className="print-only">
        <h1>Solvibly AI — {isItaly ? 'Report di analisi' : 'Analysis report'}</h1>
        <p>{companyName} · {fiscalYear} · {new Date().toLocaleDateString(isItaly ? 'it-IT' : 'en-US')}</p>
      </PrintHeader>

      <Toolbar className="no-print">
        <ToolbarLink to="/">{isItaly ? 'Nuova analisi' : 'New analysis'}</ToolbarLink>
        <ToolbarButton type="button" onClick={() => window.print()}>
          {isItaly ? 'Stampa / Salva PDF' : 'Print / Save PDF'}
        </ToolbarButton>
      </Toolbar>

      <ResultsTopSection>
        <InfoBlock>
          <StyledTitleCompany>
            <img
              src={country === "USA" ? usaIcon : italyIcon}
              alt={country}
              style={{ width: '1.8rem', height: '1.8rem', marginTop:"0.5rem" }}
            />
            <span style={{ fontWeight: '400', marginRight: '0.2rem', marginLeft: '0.4rem' }}>|</span>
            {companyName}
          </StyledTitleCompany>
          <StyledSubtitle>
            {industrySectorLabel} <span style={{display: 'inline', margin: '0 0.2rem 0 0.2rem' }}>-</span> {fiscalYear}
          </StyledSubtitle>
        </InfoBlock>
        <RiskBlock>
          <RiskScoreLabel>
            Solvibly Score: 
            <RiskScoreValue bgColor={riskColor}>
              {riskLabel}
            </RiskScoreValue>
          </RiskScoreLabel>
        </RiskBlock>
      </ResultsTopSection>

      {warnings.length > 0 && (
        <NoticeBlock tone="warning" role="alert">
          <strong>{isItaly ? 'Controlli di coerenza dei dati' : 'Data consistency checks'}</strong>
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </NoticeBlock>
      )}

      {isItaly && crisis?.applicable && (
        <>
          <SectionTitle>Verifica crisi d&apos;impresa (CCII)</SectionTitle>
          <CrisisDisplay assessment={crisis} companyName={companyName} fiscalYear={fiscalYear} />
        </>
      )}

      <SectionTitle>Key Ratios</SectionTitle>
      {pageConfig.keyRatios.map(config => (
        <RatioDisplay
          key={config.key}
          title={config.title}
          value={resultsData[config.key]}
          ratioKey={config.key}
          country={country}
          industrySector={industrySectorKey}
        />
      ))}

      {resultsData.dscr && resultsData.dscr !== 'N/A' && (
        <>
          <SectionTitle>Regulatory Alert Indicators (DSCR)</SectionTitle>
          <RatioDisplay
            title="Debt Service Coverage Ratio (DSCR)"
            value={resultsData.dscr}
            ratioKey="dscr"
            dataType="normative"
            country={country}
            industrySector={industrySectorKey}
          />
        </>
      )}

      <SectionTitle>Financial Distress Models</SectionTitle>
      {pageConfig.financialDistressModels
        .filter(config => {
          const val = resultsData[config.key];
          return val !== undefined && val !== null && val !== 'N/A';
        })
        .map(config => (
          <ModelDisplay
            key={config.key}
            title={config.title}
            value={resultsData[config.key]}
            modelKey={config.key}
            thresholdsOverride={config.key === 'altmanZScore' ? resultsData.altmanThresholds : undefined}
            subtitle={config.key === 'altmanZScore' ? resultsData.altmanVariantLabel : undefined}
          />
      ))}

      {showESG && (
        <>
          <SectionTitle>Sustainability (ESG)</SectionTitle>
          <EsgDisplay
            source={esgSource}
            rating={resultsData.esgRating}
            scoreE={resultsData.esgScore_E}
            scoreS={resultsData.esgScore_S}
            scoreG={resultsData.esgScore_G}
            overall={resultsData.esgOverallScore}
          />
        </>
      )}

      <NoticeBlock>
        <details>
          <summary>{isItaly ? 'Dati utilizzati per il calcolo' : 'Data used for the calculation'}</summary>
          {extraction && (
            <p>
              {isItaly ? 'Estratti con AI dal documento' : 'Extracted with AI from the document'}
              {` (${extraction.mode === 'pdf' ? (isItaly ? 'PDF scansionato' : 'scanned PDF') : (isItaly ? 'testo' : 'text')}; `}
              {isItaly ? 'pagine' : 'pages'} {extraction.pagesUsed?.join(', ')} / {extraction.pageCount}; {extraction.seconds}s).
              {' '}{isItaly ? 'Verifica i valori con il bilancio prima di usarli.' : 'Check them against the statements before relying on them.'}
            </p>
          )}
          <table>
            <tbody>
              {[...Object.keys(INPUT_LABELS), ...Object.keys(inputsUsed).filter(k => !INPUT_LABELS[k])]
                .filter(k => k in inputsUsed)
                .map(k => (
                  <tr key={k}>
                    <td>{(INPUT_LABELS[k] || [k, k])[isItaly ? 0 : 1]}</td>
                    <td>
                      {inputsUsed[k] === null
                        ? (isItaly ? 'n.d. (considerato 0)' : 'n/a (treated as 0)')
                        : formatAmount(inputsUsed[k])}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </NoticeBlock>

    </PageWrapper>
  )
}

export default Results;
