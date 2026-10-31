import { Link } from 'react-router-dom';
import { Card, Page } from '../components/ui.js';

function NotFound() {
  return (
    <Page>
      <h2>Pagina non trovata</h2>
      <Card>
        L&apos;indirizzo non corrisponde a nessuna pagina. Torna alla <Link to="/">pagina iniziale</Link>.
      </Card>
    </Page>
  );
}

export default NotFound;
