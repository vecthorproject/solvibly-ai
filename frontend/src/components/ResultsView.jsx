import styled from '@emotion/styled';
import axios from 'axios';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RatioDisplay from './RatioDisplay';
import ModelDisplay from './ModelDisplay';
import EsgDisplay from './ESGDisplay.jsx';
import CrisisDisplay from './CrisisDisplay.jsx';
import YearComparison from './YearComparison.jsx';
import usaIcon from '../graphics/Results/usa.svg';
import italyIcon from '../graphics/Results/italy.svg';
import { industrySectors } from '../data/DictOb.js';
import { useAuth } from '../auth/context.js';

// --- STYLED COMPONENTS ---

const PageWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, sans-serif;

  @media (max-width: 720px) {
    padding: 1rem 0.5rem;
  }
`;

const ResultsTopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.5rem 2.5rem;
  border-bottom: 1px solid #eee;

  @media (max-width: 720px) {
    padding: 1rem 0.5rem;
  }
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  text-align: left;
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
  font-weight: 600;
  color: #333;
`;

const RiskScoreValue = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  background-color: ${p => p.bgColor || '#B7F0D8'};
  padding: 5px 15px;
  border-radius: 20px;
  margin-left: 10px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
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
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 2.5rem 0;
  flex-wrap: wrap;

  @media (max-width: 720px) {
    margin: 1rem 0.5rem 0;
  }
`;

const ToolbarButton = styled.button`
  background-color: ${p => (p.variant === 'ghost' ? 'white' : '#15a497')};
  color: ${p => (p.variant === 'ghost' ? '#15a497' : 'white')};
  border: 1px solid #15a497;
  border-radius: 8px;
  padding: 0.55rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) { filter: brightness(0.95); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ToolbarLink = styled(Link)`
  border: 1px solid #15a497;
  color: #15a497;
  border-radius: 8px;
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
`;

const SaveStatus = styled.span`
  font-size: 0.85rem;
  color: ${p => (p.error ? '#C53030' : '#2F855A')};

  a { color: #15a497; margin-left: 0.4rem; }
`;

const NoticeBlock = styled.div`
  margin: 1.5rem 2.5rem;
  padding: 1rem 1.4rem;
  border-radius: 12px;
  border: 1px solid ${p => (p.tone === 'warning' ? '#D69E2E' : '#CBD5E0')};
  background: ${p => (p.tone === 'warning' ? '#FFFBEA' : '#F7FAFC')};
  text-align: left;
  font-size: 0.85rem;
  color: #2D3748;
  line-height: 1.5;

  ul { margin: 0.4rem 0 0 1.1rem; padding: 0; list-style: disc; }
  summary { cursor: pointer; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.6rem; }
  td { padding: 0.3rem 0.4rem; border-bottom: 1px solid #EDF2F7; }
  td:last-of-type { text-align: right; font-variant-numeric: tabular-nums; }

  @media (max-width: 720px) {
    margin: 1rem 0.5rem;
  }
`;

const PrintHeader = styled.div`
  text-align: left;
  border-bottom: 2px solid #15a497;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;

  h1 { font-size: 1.4rem; margin: 0; color: #15a497; }
  p { margin: 0.2rem 0 0; font-size: 0.85rem; color: #4A5568; }
`;

// --- CONFIG ---

const RATIOS = [
  { key: 'currentRatio', title: 'Liquidità corrente (Current ratio)' },
  { key: 'quickRatio', title: 'Liquidità immediata (Quick ratio)' },
  { key: 'debtToEquityRatio', title: 'Indebitamento (Passività / Patrimonio netto)' },
  { key: 'debtToAssetsRatio', title: 'Passività / Totale attivo' },
  { key: 'interestCoverageRatio', title: 'Copertura degli oneri finanziari (EBIT / Oneri)' },
  { key: 'roa', title: "Redditività dell'attivo (ROA)" },
  { key: 'roe', title: 'Redditività del capitale proprio (ROE)' },
  { key: 'roi', title: 'Redditività del capitale investito (ROI)' },
  { key: 'ros', title: 'Redditività delle vendite (ROS)' },
  { key: 'assetTurnover', title: "Rotazione dell'attivo" },
];

const MODELS = [
  { key: 'altmanZScore', title: 'Altman Z-Score' },
  { key: 'springateSScore', title: 'Springate S-Score' },
  { key: 'tafflerTScore', title: 'Taffler T-Score' },
  { key: 'fulmerHFactor', title: 'Fulmer H-Factor' },
  { key: 'groverGScore', title: 'Grover G-Score' },
  { key: 'zmijewskiXScore', title: 'Zmijewski X-Score' },
  { key: 'ohlsonOScore', title: 'Ohlson O-Score' },
];

const RISK = {
  low: { label: 'Rischio basso', color: '#B7F0D8' },
  medium: { label: 'Rischio medio', color: '#FAF3B6' },
  high: { label: 'Rischio alto', color: '#F8B4B4' },
};

const INPUT_LABELS = {
  revenue: 'Ricavi (A.1)',
  ebit: 'Risultato operativo (A − B)',
  netIncome: "Utile (perdita) d'esercizio",
  netIncome_t_minus_1: "Utile (perdita) dell'esercizio precedente",
  depreciation: 'Ammortamenti e svalutazioni (B.10)',
  interestExpense: 'Oneri finanziari (C.17)',
  totalCurrentAssets: 'Attivo circolante',
  inventories: 'Rimanenze',
  totalNonCurrentAssets: 'Immobilizzazioni',
  tangibleFixedAssets: 'Immobilizzazioni materiali',
  totalCurrentLiabilities: 'Passività a breve',
  totalNonCurrentLiabilities: 'Passività a medio-lungo',
  totalEquity: 'Patrimonio netto',
  retainedEarnings: 'Utili portati a nuovo e riserve',
  operatingCashFlow: 'Flusso di cassa operativo',
  marketCapitalization: 'Capitalizzazione di borsa',
  totalDebts: 'Debiti totali (D)',
  taxDebts: 'Debiti tributari (D.12)',
  socialSecurityDebts: 'Debiti previdenziali (D.13)',
  provisions: 'Accantonamenti (B.12 + B.13)',
  shareCapital: 'Capitale sociale',
  totalAssetsReported: 'Totale attivo (da bilancio)',
};

function sectorLabel(sectorKey) {
  if (!sectorKey) return 'Settore n.d.';
  const sector = (industrySectors.Italy || []).find(s => s.value === sectorKey);
  return sector ? sector.shortLabel : 'Settore n.d.';
}

function formatAmount(v) {
  return typeof v === 'number' && isFinite(v) ? v.toLocaleString('it-IT', { maximumFractionDigits: 2 }) : String(v);
}

function hasValue(v) {
  return v !== undefined && v !== null && v !== 'N/A';
}

// --- MAIN COMPONENT ---

/**
 * Full results page. `saved` is set when showing an analysis from the archive: {id, clientId, notes}.
 */
function ResultsView({ results, saved }) {
  const { user, archive } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState(saved?.notes || '');
  const [save, setSave] = useState({
    status: 'idle', analysisId: saved?.id ?? null, clientId: saved?.clientId ?? null, error: null,
  });

  const companyName = results.companyName ?? 'N/D';
  const fiscalYear = results.fiscalYear ?? 'N/D';
  const isItaly = String(results.country || '').toLowerCase() === 'italy';
  const risk = RISK[(results.solviblyRiskBand || '').toLowerCase()] || { label: 'N/D', color: '#E2E8F0' };
  const crisis = results.crisisAssessment;
  const warnings = results.dataQuality?.warnings || [];
  const inputsUsed = results.inputsUsed || {};
  const extraction = results.extraction;

  const esgSource = results.esgSource
    || (results.esgRating ? 'rating'
      : (results.esgScore_E != null || results.esgScore_S != null || results.esgScore_G != null) ? 'sliders' : null);
  const showESG =
    (esgSource === 'rating' && (results.esgRating || results.esgOverallScore != null)) ||
    (esgSource === 'sliders' && (results.esgScore_E != null || results.esgScore_S != null
      || results.esgScore_G != null || results.esgOverallScore != null));

  const handleSave = async () => {
    if (!user) {
      navigate('/accedi', { state: { pendingSave: { results, notes } } });
      return;
    }
    setSave(s => ({ ...s, status: 'saving', error: null }));
    try {
      if (save.analysisId) {
        await axios.patch(`/api/analyses/${save.analysisId}`, { notes });
        setSave(s => ({ ...s, status: 'saved' }));
      } else {
        const { data } = await axios.post('/api/analyses', { results, notes });
        setSave({ status: 'saved', analysisId: data.id, clientId: data.clientId, error: null });
      }
    } catch (error) {
      setSave(s => ({ ...s, status: 'error', error: error?.response?.data?.error || 'Salvataggio non riuscito.' }));
    }
  };

  const showSave = archive.enabled || !archive.checked;
  const saveLabel = save.status === 'saving'
    ? 'Salvataggio…'
    : save.analysisId ? 'Salva le note' : "Salva nell'archivio";

  return (
    <PageWrapper>
      <PrintHeader className="print-only">
        <h1>Solvibly AI — Report di analisi</h1>
        <p>{companyName} · esercizio {fiscalYear} · {new Date().toLocaleDateString('it-IT')}</p>
      </PrintHeader>

      <Toolbar className="no-print">
        {save.status === 'saved' && (
          <SaveStatus>
            Salvato.
            {save.clientId && <Link to={`/clienti/${save.clientId}`}>Apri la scheda cliente</Link>}
          </SaveStatus>
        )}
        {save.status === 'error' && <SaveStatus error>{save.error}</SaveStatus>}
        <ToolbarLink to="/">Nuova analisi</ToolbarLink>
        {showSave && (
          <ToolbarButton type="button" variant="ghost" onClick={handleSave} disabled={save.status === 'saving'}
            title={user ? undefined : "Accedi per salvare l'analisi nell'archivio clienti"}>
            {saveLabel}
          </ToolbarButton>
        )}
        <ToolbarButton type="button" onClick={() => window.print()}>Stampa / Salva PDF</ToolbarButton>
      </Toolbar>

      <ResultsTopSection>
        <InfoBlock>
          <StyledTitleCompany>
            <img src={isItaly ? italyIcon : usaIcon} alt={isItaly ? 'Italia' : 'Stati Uniti'}
              style={{ width: '1.8rem', height: '1.8rem', marginTop: '0.5rem' }} />
            <span style={{ fontWeight: '400', marginRight: '0.2rem', marginLeft: '0.4rem' }}>|</span>
            {companyName}
          </StyledTitleCompany>
          <StyledSubtitle>{sectorLabel(results.industrySector)} — esercizio {fiscalYear}</StyledSubtitle>
        </InfoBlock>
        <RiskScoreLabel>
          Solvibly Score:
          <RiskScoreValue bgColor={risk.color}>{risk.label}</RiskScoreValue>
        </RiskScoreLabel>
      </ResultsTopSection>

      {warnings.length > 0 && (
        <NoticeBlock tone="warning" role="alert">
          <strong>Controlli di coerenza dei dati</strong>
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </NoticeBlock>
      )}

      {isItaly && crisis?.applicable && (
        <>
          <SectionTitle>Verifica crisi d&apos;impresa (CCII)</SectionTitle>
          <CrisisDisplay assessment={crisis} companyName={companyName} fiscalYear={fiscalYear}
            notes={notes} onNotesChange={setNotes} />
        </>
      )}

      {results.yearComparison?.rows?.length > 0 && (
        <>
          <SectionTitle>Confronto con l&apos;esercizio precedente</SectionTitle>
          <YearComparison comparison={results.yearComparison} />
        </>
      )}

      <SectionTitle>Indici di bilancio</SectionTitle>
      {RATIOS.map(config => (
        <RatioDisplay key={config.key} title={config.title} value={results[config.key]} ratioKey={config.key}
          country={results.country} industrySector={results.industrySector} />
      ))}

      {hasValue(results.dscr) && (
        <>
          <SectionTitle>Indicatore normativo (DSCR)</SectionTitle>
          <RatioDisplay title="Debt Service Coverage Ratio (DSCR)" value={results.dscr} ratioKey="dscr"
            dataType="normative" country={results.country} industrySector={results.industrySector} />
        </>
      )}

      <SectionTitle>Modelli di previsione dell&apos;insolvenza</SectionTitle>
      {MODELS.filter(config => hasValue(results[config.key])).map(config => (
        <ModelDisplay key={config.key} title={config.title} value={results[config.key]} modelKey={config.key}
          thresholdsOverride={config.key === 'altmanZScore' ? results.altmanThresholds : undefined}
          subtitle={config.key === 'altmanZScore' ? results.altmanVariantLabel : undefined} />
      ))}

      {showESG && (
        <>
          <SectionTitle>Sostenibilità (ESG)</SectionTitle>
          <EsgDisplay source={esgSource} rating={results.esgRating} scoreE={results.esgScore_E}
            scoreS={results.esgScore_S} scoreG={results.esgScore_G} overall={results.esgOverallScore} />
        </>
      )}

      <NoticeBlock>
        <details>
          <summary>Dati utilizzati per il calcolo</summary>
          {extraction?.mode === 'xbrl' && (
            <p>
              Letti dal file XBRL depositato, senza AI (tassonomia {extraction.taxonomy || 'n.d.'}; esercizio chiuso
              il {extraction.periodEnd}{extraction.ateco ? `; ATECO ${extraction.ateco}` : ''}).
            </p>
          )}
          {extraction && extraction.mode !== 'xbrl' && (
            <p>
              Estratti con AI dal documento ({extraction.mode === 'pdf' ? 'PDF scansionato' : 'testo'}; pagine{' '}
              {extraction.pagesUsed?.join(', ')} su {extraction.pageCount}; {extraction.seconds}s).
              Verifica i valori con il bilancio prima di usarli.
            </p>
          )}
          <table>
            <tbody>
              {[...Object.keys(INPUT_LABELS), ...Object.keys(inputsUsed).filter(k => !INPUT_LABELS[k])]
                .filter(k => k in inputsUsed)
                .map(k => (
                  <tr key={k}>
                    <td>{INPUT_LABELS[k] || k}</td>
                    <td>{inputsUsed[k] === null ? 'n.d. (considerato 0)' : formatAmount(inputsUsed[k])}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </NoticeBlock>
    </PageWrapper>
  );
}

export default ResultsView;
