import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/context.js';
import { sourceLabels } from '../data/crisisConfig.js';
import { formatDate, formatEuro, formatNumber } from '../utils/numbers.js';
import { Button, ButtonLink, Card, ErrorText, Muted, Page, Table, TableWrap } from '../components/ui.js';
import { LevelChip } from './Clients.jsx';

function ClientDetail() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    axios.get(`/api/clients/${id}`)
      .then(({ data: d }) => setData(d))
      .catch(err => setError(err?.response?.data?.error || 'Impossibile caricare il cliente.'));
  }, [user, id]);

  if (ready && !user) return <Navigate to="/accedi" replace />;

  const removeAnalysis = async (analysisId) => {
    if (!window.confirm("Eliminare questa analisi dall'archivio?")) return;
    try {
      await axios.delete(`/api/analyses/${analysisId}`);
      setData(d => ({ ...d, analyses: d.analyses.filter(a => a.id !== analysisId) }));
    } catch (err) {
      setError(err?.response?.data?.error || 'Eliminazione non riuscita.');
    }
  };

  const removeClient = async () => {
    if (!window.confirm('Eliminare il cliente e tutte le sue analisi?')) return;
    try {
      await axios.delete(`/api/clients/${id}`);
      navigate('/clienti', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Eliminazione non riuscita.');
    }
  };

  const analyses = data?.analyses || [];

  return (
    <Page>
      <Muted><Link to="/clienti">← Archivio clienti</Link></Muted>
      <h2>{data?.client?.name || 'Cliente'}</h2>
      {data?.client?.taxCode && <Muted>Codice fiscale {data.client.taxCode}</Muted>}
      {error && <ErrorText role="alert">{error}</ErrorText>}

      <h3>Analisi salvate</h3>
      <Card>
        {!data && !error && <Muted>Caricamento…</Muted>}
        {data && analyses.length === 0 && <Muted>Nessuna analisi per questo cliente.</Muted>}
        {analyses.length > 0 && (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Esercizio</th>
                  <th>Esito CCII</th>
                  <th>Fonte</th>
                  <th>Salvata il</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {analyses.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.fiscalYear ?? '—'}</strong></td>
                    <td><LevelChip level={a.crisisLevel} /></td>
                    <td>{sourceLabels[a.source] || '—'}</td>
                    <td>{formatDate(a.createdAt)}</td>
                    <td className="num">
                      <Link to={`/analisi/${a.id}`}>Apri</Link>
                      {' · '}
                      <a href="#" onClick={(e) => { e.preventDefault(); removeAnalysis(a.id); }}>Elimina</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      {analyses.length > 1 && (
        <>
          <h3>Andamento</h3>
          <Card>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>Esercizio</th>
                    <th className="num">Ricavi</th>
                    <th className="num">Utile (perdita)</th>
                    <th className="num">Patrimonio netto</th>
                    <th className="num">Debiti totali</th>
                    <th className="num">DSCR</th>
                    <th className="num">Indici CNDCEC oltre soglia</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map(a => (
                    <tr key={a.id}>
                      <td>{a.fiscalYear ?? '—'}</td>
                      <td className="num">{formatEuro(a.keyFigures?.revenue)}</td>
                      <td className="num">{formatEuro(a.keyFigures?.netIncome)}</td>
                      <td className="num">{formatEuro(a.keyFigures?.totalEquity)}</td>
                      <td className="num">{formatEuro(a.keyFigures?.totalDebts)}</td>
                      <td className="num">{typeof a.keyFigures?.dscr === 'number' ? formatNumber(a.keyFigures.dscr) : 'n.d.'}</td>
                      <td className="num">{a.keyFigures?.cndcecBreached ?? 'n.d.'} / 5</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <ButtonLink to="/upload-docs">Nuova analisi</ButtonLink>
        {data && <Button type="button" variant="danger" onClick={removeClient}>Elimina cliente</Button>}
      </div>
    </Page>
  );
}

export default ClientDetail;
