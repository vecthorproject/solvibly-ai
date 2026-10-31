import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/context.js';
import { levelLabels, overallMeta } from '../data/crisisConfig.js';
import { formatDate } from '../utils/numbers.js';
import { Button, ButtonLink, Card, Chip, ErrorText, Muted, Page, Table, TableWrap } from '../components/ui.js';

export function LevelChip({ level }) {
  if (!level) return <Chip>—</Chip>;
  const meta = overallMeta[level] || overallMeta.grey;
  return <Chip bg={meta.color}>{levelLabels[level] || level}</Chip>;
}

function Clients() {
  const { user, ready, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState(null);
  const [error, setError] = useState(null);
  // Set when the user logs out or deletes the account from this page, so that the
  // "not logged in → /accedi" redirect below does not win over the navigation to the home page.
  const leaving = useRef(false);

  useEffect(() => {
    if (!user) return;
    axios.get('/api/clients')
      .then(({ data }) => setClients(data.clients))
      .catch(err => setError(err?.response?.data?.error || 'Impossibile caricare i clienti.'));
  }, [user]);

  if (ready && !user) return leaving.current ? null : <Navigate to="/accedi" replace />;

  const handleLogout = () => {
    leaving.current = true;
    navigate('/');
    logout();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Eliminare l'account con tutti i clienti e le analisi salvate? L'operazione non si può annullare.")) return;
    leaving.current = true;
    try {
      await deleteAccount();
      navigate('/', { replace: true });
    } catch (err) {
      leaving.current = false;
      setError(err?.response?.data?.error || "Eliminazione dell'account non riuscita.");
    }
  };

  return (
    <Page>
      <h2>Archivio clienti</h2>
      <Muted>
        Ogni analisi salvata viene associata al cliente (per codice fiscale se il bilancio è in XBRL, altrimenti per
        denominazione). Ripeti la verifica nel tempo per documentare il monitoraggio degli adeguati assetti.
      </Muted>
      <div style={{ margin: '1rem 0', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <ButtonLink to="/upload-docs">Nuova analisi da bilancio</ButtonLink>
        <ButtonLink to="/insert-data">Nuova analisi manuale</ButtonLink>
      </div>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      <Card>
        {clients === null && !error && <Muted>Caricamento…</Muted>}
        {clients?.length === 0 && (
          <Muted>Nessun cliente ancora: fai un&apos;analisi e premi &quot;Salva nell&apos;archivio&quot;.</Muted>
        )}
        {clients?.length > 0 && (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Ultimo esercizio</th>
                  <th>Esito CCII</th>
                  <th className="num">Analisi</th>
                  <th>Aggiornato</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/clienti/${c.id}`}><strong>{c.name}</strong></Link>
                      {c.taxCode && <Muted as="div">C.F. {c.taxCode}</Muted>}
                    </td>
                    <td>{c.lastAnalysis?.fiscalYear ?? '—'}</td>
                    <td><LevelChip level={c.lastAnalysis?.crisisLevel} /></td>
                    <td className="num">{c.analysesCount}</td>
                    <td>{formatDate(c.lastAnalysis?.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <h3>Account</h3>
      <Card>
        <Muted>Accesso con {user?.email}</Muted>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
          <Button type="button" variant="ghost" onClick={handleLogout}>Esci</Button>
          <Button type="button" variant="danger" onClick={handleDeleteAccount}>Elimina account e dati</Button>
        </div>
      </Card>
    </Page>
  );
}

export default Clients;
