import styled from '@emotion/styled';
import { formatEuro, formatNumber, formatPercent } from '../utils/numbers.js';
import { Chip, Table, TableWrap } from './ui.js';

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

  h4 { margin: 0 0 0.9rem 0; font-size: 1.05rem; color: #1a202c; }

  @media (max-width: 720px) {
    margin: 1rem 0.5rem;
    padding: 1rem;
  }
`;

const Change = styled.span`
  font-weight: 600;
  color: ${p => (p.tone === 'good' ? '#2F855A' : p.tone === 'bad' ? '#C53030' : '#4A5568')};
`;

const Note = styled.p`
  font-size: 0.75rem;
  color: #718096;
  font-style: italic;
  margin: 0.6rem 0 0;
`;

// --- HELPERS ---

function formatValue(v, format) {
  if (format === 'eur') return formatEuro(v);
  if (format === 'pct') return formatPercent(v);
  return formatNumber(v);
}

function tone(change, better) {
  if (typeof change !== 'number' || change === 0 || !better) return 'neutral';
  const improved = better === 'up' ? change > 0 : change < 0;
  return improved ? 'good' : 'bad';
}

function formatChange(row) {
  if (typeof row.change !== 'number') return 'n.d.';
  const arrow = row.change > 0 ? '▲' : row.change < 0 ? '▼' : '=';
  if (row.format === 'eur') {
    return typeof row.changePct === 'number'
      ? `${arrow} ${row.changePct.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`
      : `${arrow} ${formatEuro(row.change)}`;
  }
  if (row.format === 'pct') return `${arrow} ${formatNumber(row.change * 100, 1)} p.p.`;
  return `${arrow} ${formatNumber(row.change)}`;
}

function IndexChip({ breached }) {
  if (breached === null || breached === undefined) return <Chip>n.d.</Chip>;
  return breached
    ? <Chip bg="#FAF3B6" fg="#6B5B00">Oltre soglia</Chip>
    : <Chip bg="#B7F0D8" fg="#14532D">Entro soglia</Chip>;
}

// --- MAIN COMPONENT ---

function YearComparison({ comparison }) {
  if (!comparison || !comparison.rows?.length) return null;
  const prevYear = comparison.previousFiscalYear ?? 'Anno prec.';
  const curYear = comparison.currentFiscalYear ?? 'Anno';

  return (
    <>
      <Block>
        <h4>Principali voci e indici</h4>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>Voce</th>
                <th className="num">{prevYear}</th>
                <th className="num">{curYear}</th>
                <th className="num">Variazione</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map(row => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td className="num">{formatValue(row.previous, row.format)}</td>
                  <td className="num">{formatValue(row.current, row.format)}</td>
                  <td className="num"><Change tone={tone(row.change, row.better)}>{formatChange(row)}</Change></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <Note>Verde: variazione favorevole; rosso: sfavorevole. Valori dell&apos;esercizio precedente letti dalla colonna comparativa del bilancio XBRL.</Note>
      </Block>

      {comparison.cndcecIndices?.length > 0 && (
        <Block>
          <h4>Indici di settore CNDCEC nei due esercizi</h4>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Indice</th>
                  <th className="num">{prevYear}</th>
                  <th className="num">{curYear}</th>
                  <th className="num">Segnale se</th>
                  <th>Esito {prevYear} → {curYear}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.cndcecIndices.map(ix => (
                  <tr key={ix.id}>
                    <td>{ix.label}</td>
                    <td className="num">{typeof ix.previous === 'number' ? `${formatNumber(ix.previous)}%` : 'n.d.'}</td>
                    <td className="num">{typeof ix.current === 'number' ? `${formatNumber(ix.current)}%` : 'n.d.'}</td>
                    <td className="num">
                      {typeof ix.threshold === 'number' ? `${ix.direction === '>=' ? '≥' : '≤'} ${formatNumber(ix.threshold, 1)}%` : 'n.d.'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <IndexChip breached={ix.previousBreached} /> → <IndexChip breached={ix.currentBreached} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Block>
      )}
    </>
  );
}

export default YearComparison;
