import styled from '@emotion/styled';
import { Link } from 'react-router-dom';

// --- STYLED COMPONENTS ---

const Page = styled.div`
  max-width: 820px;
  margin: 3rem auto;
  padding: 0 1.5rem;
  text-align: left;
  font-family: system-ui, sans-serif;
  color: #2d3748;
  line-height: 1.6;

  h2 { font-family: "Cascadia Mono", system-ui, sans-serif; color: #15a497; font-size: 1.6rem; }
  h3 { margin-top: 2rem; font-size: 1.1rem; color: #1a202c; }
  li { margin-bottom: 0.4rem; }
  a { color: #15a497; }
`;

// --- MAIN COMPONENT ---

function Help() {
  return (
    <Page>
      <h2>Come funziona</h2>
      <p>
        Solvibly AI calcola indici, modelli di previsione dell&apos;insolvenza e, per le imprese italiane, la verifica dei
        segnali di crisi previsti dal Codice della crisi d&apos;impresa e dell&apos;insolvenza (D.Lgs. 14/2019).
      </p>

      <h3>1. Inserisci i dati</h3>
      <ul>
        <li><Link to="/upload-docs">Carica il file XBRL del bilancio</Link> (.xbrl, anche firmato .p7m o in .zip): lettura istantanea e senza AI, con l&apos;anno precedente, il codice ATECO e la forma giuridica, da cui viene proposto il settore CNDCEC.</li>
        <li><Link to="/upload-docs">Oppure carica il bilancio in PDF</Link>: le voci vengono lette con AI (anche da PDF scansionati) e mostrate nei risultati per il controllo.</li>
        <li><Link to="/insert-data">Inserisci i dati a mano</Link>: puoi incollare importi copiati dal bilancio o da Excel (es. 1.234.567 o (12.500)).</li>
      </ul>

      <h3>2. Completa la verifica CCII (facoltativo)</h3>
      <ul>
        <li>Scadenzario fornitori: debiti scaduti da almeno 90 giorni e debiti non scaduti.</li>
        <li>Centrale Rischi Banca d&apos;Italia: esposizioni scadute o sconfinate da oltre 60 giorni.</li>
        <li>Cassetto previdenziale e fiscale, estratto di ruolo: debiti verso INPS, INAIL, IVA e Agenzia Entrate-Riscossione.</li>
        <li>Budget di tesoreria: flussi attesi e debito in scadenza per il DSCR a 6 o 12 mesi.</li>
      </ul>

      <h3>3. Leggi e stampa il report</h3>
      <p>
        Il risultato riporta per ogni verifica l&apos;esito, la soglia di legge applicata e cosa manca per completarla.
        Aggiungi le tue note e usa &quot;Stampa / Salva PDF&quot; per allegarlo alla documentazione degli adeguati assetti.
      </p>

      <h3>Limiti</h3>
      <p>
        Lo strumento supporta la valutazione del professionista e dell&apos;organo di controllo, non la sostituisce.
        I modelli di previsione dell&apos;insolvenza sono stati sviluppati su campioni esteri: vanno letti insieme
        alle verifiche CCII e alla conoscenza diretta dell&apos;impresa.
      </p>
    </Page>
  );
}

export default Help;
