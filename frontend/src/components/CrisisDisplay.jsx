import styled from '@emotion/styled';
import { useState } from 'react';
import { overallMeta, statusMeta } from '../data/crisisConfig.js';

// --- STYLED COMPONENTS ---

const Block = styled.section`
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  margin: 1.5rem 2.5rem;
  padding: 1.5rem 2rem;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: left;
  font-family: system-ui, sans-serif;

  @media (max-width: 720px) {
    margin: 1rem 0.5rem;
    padding: 1rem;
  }
`;

const Banner = styled(Block)`
  background-color: ${p => p.bg};
  border: 2px solid ${p => p.border};
`;

const Headline = styled.h3`
  margin: 0 0 0.4rem 0;
  font-size: 1.3rem;
  color: #1a202c;
`;

const Muted = styled.p`
  margin: 0.2rem 0;
  font-size: 0.85rem;
  color: #4a5568;
  line-height: 1.5;
`;

const List = styled.ul`
  margin: 0.6rem 0 0 1.1rem;
  padding: 0;
  list-style: disc;
  font-size: 0.9rem;
  color: #2d3748;
  line-height: 1.5;
`;

const BlockTitle = styled.h4`
  margin: 0 0 0.9rem 0;
  font-size: 1.05rem;
  color: #1a202c;
`;

const Chip = styled.span`
  display: inline-block;
  white-space: nowrap;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${p => p.bg};
  color: ${p => p.fg};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
`;

const TwoCols = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border: 1px solid #edf2f7;
  border-radius: 10px;
  padding: 1rem;
  break-inside: avoid;
`;

const CardHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.95rem;
`;

const Law = styled.div`
  margin-top: 0.4rem;
  font-size: 0.72rem;
  color: #718096;
  font-style: italic;
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th, td {
    padding: 0.55rem 0.5rem;
    border-bottom: 1px solid #edf2f7;
    vertical-align: top;
    text-align: left;
  }
  th {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #718096;
    font-weight: 600;
  }
  td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  tr { break-inside: avoid; }
`;

const NotesArea = styled.textarea`
  width: 100%;
  min-height: 7rem;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  padding: 0.7rem;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
  box-sizing: border-box;
  resize: vertical;
  background: white;
  color: black;

  &:focus { outline: none; border-color: #15a497; }
`;

const PrintedNotes = styled.div`
  white-space: pre-wrap;
  font-size: 0.9rem;
  min-height: 3rem;
`;

// --- HELPERS ---

function StatusChip({ status, label }) {
  const meta = statusMeta[status] || statusMeta.not_evaluated;
  return <Chip bg={meta.color} fg={meta.text}>{label || meta.label}</Chip>;
}

function formatPct(v) {
  return typeof v === 'number' && Number.isFinite(v) ? `${v.toLocaleString('it-IT', { maximumFractionDigits: 2 })}%` : 'n.d.';
}

function CheckCard({ check }) {
  if (!check) return null;
  return (
    <Card>
      <CardHead>
        <span>{check.title}</span>
        <StatusChip status={check.status} />
      </CardHead>
      <Muted>{check.detail}</Muted>
      {check.source && check.status === 'not_evaluated' && <Muted>Fonte del dato: {check.source}</Muted>}
      <Law>{check.law}</Law>
    </Card>
  );
}

// --- MAIN COMPONENT ---

function CrisisDisplay({ assessment, companyName, fiscalYear }) {
  const [notes, setNotes] = useState('');
  if (!assessment || !assessment.applicable) return null;

  const { overall, equity, dscr, cndcec, signals, practicalTest, missingData, references, disclaimer } = assessment;
  const meta = overallMeta[overall.level] || overallMeta.grey;
  const today = new Date().toLocaleDateString('it-IT');

  return (
    <div>
      <Banner as="section" bg={meta.color} border={meta.border} aria-live="polite">
        <Headline>{overall.headline}</Headline>
        <Muted>
          {companyName} — esercizio {fiscalYear} — verifica del {today}. Segnali art. 3 e 25-novies valutati:{' '}
          {overall.signalsEvaluated} su {overall.signalsTotal}.
        </Muted>
        {overall.alerts.length > 0 && (
          <List>{overall.alerts.map((a, i) => <li key={`a${i}`}><strong>{a}</strong></li>)}</List>
        )}
        {overall.warnings.length > 0 && (
          <List>{overall.warnings.map((w, i) => <li key={`w${i}`}>{w}</li>)}</List>
        )}
      </Banner>

      <Block>
        <BlockTitle>Patrimonio netto e sostenibilità del debito</BlockTitle>
        <TwoCols>
          <CheckCard check={equity} />
          <CheckCard check={dscr} />
        </TwoCols>
      </Block>

      <Block>
        <BlockTitle>Segnali di allarme (art. 3, c. 4 e art. 25-novies CCII)</BlockTitle>
        <TableWrap>
          <Table>
            <thead>
              <tr><th>Verifica</th><th>Esito</th><th>Dettaglio</th></tr>
            </thead>
            <tbody>
              {signals.map(s => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.title}</strong>
                    <Law>{s.law}</Law>
                  </td>
                  <td><StatusChip status={s.status} /></td>
                  <td>
                    {s.detail}
                    {s.status === 'not_evaluated' && s.source && <Law>Fonte: {s.source}</Law>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Block>

      <Block>
        <BlockTitle>Indici di settore CNDCEC</BlockTitle>
        <Muted>
          {cndcec.sectorLabel ? `Settore: ${cndcec.sectorLabel}.` : 'Settore CNDCEC non selezionato.'} {cndcec.detail}
        </Muted>
        <TableWrap style={{ marginTop: '0.8rem' }}>
          <Table>
            <thead>
              <tr><th>Indice</th><th style={{ textAlign: 'right' }}>Valore</th><th style={{ textAlign: 'right' }}>Soglia</th><th>Esito</th></tr>
            </thead>
            <tbody>
              {cndcec.indices.map(ix => (
                <tr key={ix.id}>
                  <td>
                    <strong>{ix.label}</strong>
                    <Law>{ix.formula} — segnale se {ix.direction === '>=' ? '≥' : '≤'} soglia</Law>
                  </td>
                  <td className="num">{formatPct(ix.value)}</td>
                  <td className="num">{formatPct(ix.threshold)}</td>
                  <td>
                    {ix.breached === null
                      ? <StatusChip status="not_evaluated" label="n.d." />
                      : ix.breached
                        ? <StatusChip status="warning" label="Oltre soglia" />
                        : <StatusChip status="ok" label="Entro soglia" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        {cndcec.notes.map((n, i) => <Muted key={i}>{n}</Muted>)}
        <Law>{cndcec.law}</Law>
      </Block>

      {practicalTest && practicalTest.status !== 'not_evaluated' && (
        <Block>
          <BlockTitle>Test pratico di risanamento</BlockTitle>
          <CheckCard check={practicalTest} />
        </Block>
      )}

      {missingData.length > 0 && (
        <Block className="no-print">
          <BlockTitle>Per completare la verifica</BlockTitle>
          <TableWrap>
            <Table>
              <thead><tr><th>Verifica</th><th>Dove trovare il dato</th></tr></thead>
              <tbody>
                {missingData.map(m => (
                  <tr key={m.id}><td>{m.title}</td><td>{m.source}</td></tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Block>
      )}

      <Block>
        <BlockTitle>Note del professionista</BlockTitle>
        <NotesArea
          className="no-print"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Valutazioni, azioni proposte, documenti esaminati… (vengono incluse nella stampa)"
          aria-label="Note del professionista"
        />
        <PrintedNotes className="print-only">{notes || '—'}</PrintedNotes>
      </Block>

      <Block>
        <BlockTitle>Riferimenti</BlockTitle>
        <List>{references.map(r => <li key={r}>{r}</li>)}</List>
        <Muted style={{ marginTop: '0.8rem' }}>{disclaimer}</Muted>
      </Block>
    </div>
  );
}

export default CrisisDisplay;
