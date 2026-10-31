import { Link, useLocation } from 'react-router-dom';
import ResultsView from '../components/ResultsView.jsx';
import { Card, Page } from '../components/ui.js';

// Results of a new analysis, passed by the forms through the router state.
function Results() {
  const location = useLocation();
  const results = location.state?.results;

  if (!results) {
    return (
      <Page>
        <Card>
          Nessuna analisi da mostrare. Iniziane una nuova dalla <Link to="/">pagina iniziale</Link> oppure apri
          un&apos;analisi salvata dall&apos;<Link to="/clienti">archivio clienti</Link>.
        </Card>
      </Page>
    );
  }
  return <ResultsView results={results} />;
}

export default Results;
