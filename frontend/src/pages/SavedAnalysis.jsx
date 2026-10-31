import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/context.js';
import ResultsView from '../components/ResultsView.jsx';
import { Card, ErrorText, Muted, Page } from '../components/ui.js';

// An analysis opened from the archive: same view as a new one, notes editable and saved back.
function SavedAnalysis() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    axios.get(`/api/analyses/${id}`)
      .then(({ data }) => setAnalysis(data))
      .catch(err => setError(err?.response?.data?.error || "Impossibile caricare l'analisi."));
  }, [user, id]);

  if (ready && !user) return <Navigate to="/accedi" replace />;
  if (error) {
    return (
      <Page>
        <ErrorText role="alert">{error}</ErrorText>
        <Muted><Link to="/clienti">← Archivio clienti</Link></Muted>
      </Page>
    );
  }
  if (!analysis) return <Page><Card><Muted>Caricamento…</Muted></Card></Page>;

  return (
    <>
      <Page style={{ marginBottom: 0 }} className="no-print">
        <Muted>
          <Link to={`/clienti/${analysis.clientId}`}>← {analysis.companyName}</Link> · analisi salvata il{' '}
          {new Date(analysis.createdAt).toLocaleDateString('it-IT')}
        </Muted>
      </Page>
      <ResultsView key={analysis.id} results={analysis.results}
        saved={{ id: analysis.id, clientId: analysis.clientId, notes: analysis.notes }} />
    </>
  );
}

export default SavedAnalysis;
