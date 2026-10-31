import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { Page } from '../components/ui.js';

// DRAFT. Describes the data flows the code actually implements; the placeholders in [brackets]
// and the legal wording must be completed and checked by a lawyer before going live.

export const DraftBanner = styled.div`
  background: #fffaf0;
  border: 1px solid #f6ad55;
  color: #7b341e;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
`;

export const LegalText = styled.div`
  h3 { margin-top: 1.8rem; }
  p, li { font-size: 0.95rem; }
  ul { padding-left: 1.2rem; }
  li { margin-bottom: 0.35rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.88rem; margin: 0.6rem 0; }
  th, td { border: 1px solid #e2e8f0; padding: 0.45rem 0.55rem; text-align: left; vertical-align: top; }
  th { background: #f7fafc; }
  .wrap { overflow-x: auto; }
`;

function Privacy() {
  return (
    <Page>
      <h2>Informativa privacy</h2>
      <DraftBanner role="note">
        <strong>Bozza — da far verificare da un legale.</strong> Le parti tra parentesi quadre vanno completate.
        Il testo descrive come il software tratta i dati oggi; non è ancora un&apos;informativa valida.
      </DraftBanner>

      <LegalText>
        <p>Ultimo aggiornamento: [data]</p>

        <h3>1. Chi siamo e a chi si applica questa informativa</h3>
        <p>
          Solvibly AI (&quot;Solvibly&quot;, &quot;noi&quot;) è un servizio di [ragione sociale / nome e cognome del
          titolare], [indirizzo], P.IVA [numero], email [indirizzo email privacy]. Il servizio aiuta commercialisti,
          sindaci, revisori e imprese a leggere un bilancio e a verificare i segnali di crisi previsti dal Codice
          della crisi d&apos;impresa (D.Lgs. 14/2019).
        </p>
        <p>Nel servizio ci sono due tipi di dati, con ruoli diversi ai sensi del GDPR (Reg. UE 2016/679):</p>
        <ul>
          <li>
            <strong>Dati del tuo account</strong> (email e password): per questi Solvibly è <em>titolare del
            trattamento</em> e questa informativa si applica direttamente a te.
          </li>
          <li>
            <strong>Dati delle imprese che analizzi</strong> (bilanci, dati inseriti, note): li carichi tu, per i tuoi
            clienti o per la tua impresa. Per questi dati il titolare sei tu (o il tuo studio) e Solvibly agisce come
            <em> responsabile del trattamento</em> ai sensi dell&apos;art. 28 GDPR, secondo l&apos;accordo previsto nei{' '}
            <Link to="/termini">termini d&apos;uso</Link>. I bilanci di società riguardano in genere persone
            giuridiche, ma possono contenere dati personali (ad esempio nel caso di ditte individuali o nelle note che
            scrivi).
          </li>
        </ul>

        <h3>2. Quali dati trattiamo e perché</h3>
        <div className="wrap">
          <table>
            <thead>
              <tr><th>Dati</th><th>Finalità</th><th>Base giuridica</th><th>Conservazione</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Email e password (salvata solo in forma cifrata con hash, non leggibile)</td>
                <td>Creare l&apos;account e farti accedere all&apos;archivio</td>
                <td>Esecuzione del contratto (art. 6.1.b GDPR)</td>
                <td>Fino alla cancellazione dell&apos;account</td>
              </tr>
              <tr>
                <td>Documenti caricati (PDF, XBRL)</td>
                <td>Estrarre le voci di bilancio e calcolare l&apos;analisi</td>
                <td>Esecuzione del contratto; per i dati dei clienti, istruzioni del titolare</td>
                <td>
                  <strong>Non vengono conservati</strong>: restano sul server solo per il tempo dell&apos;elaborazione
                  (pochi secondi, per i PDF in un file temporaneo) e vengono cancellati subito dopo
                </td>
              </tr>
              <tr>
                <td>Risultati dell&apos;analisi (voci di bilancio, indici, esiti, denominazione e codice fiscale
                  dell&apos;impresa) e note</td>
                <td>Archivio clienti, solo se premi &quot;Salva nell&apos;archivio&quot;</td>
                <td>Esecuzione del contratto; per i dati dei clienti, istruzioni del titolare</td>
                <td>Fino a quando li elimini tu o cancelli l&apos;account</td>
              </tr>
              <tr>
                <td>Dati tecnici di connessione (indirizzo IP, data e ora, pagina richiesta)</td>
                <td>Sicurezza del servizio, prevenzione degli abusi (ad esempio i tentativi di accesso ripetuti),
                  diagnosi dei malfunzionamenti</td>
                <td>Legittimo interesse (art. 6.1.f GDPR)</td>
                <td>[periodo dei log del fornitore di hosting]</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Non usiamo i dati per pubblicità, non li vendiamo e non facciamo profilazione. Il servizio non usa cookie di
          profilazione né strumenti di analisi del traffico. Dopo l&apos;accesso, il browser conserva un token di
          sessione (nella memoria locale del browser, valido 30 giorni) che serve solo a tenerti collegato; viene
          rimosso quando premi &quot;Esci&quot;.
        </p>

        <h3>3. Uso dell&apos;intelligenza artificiale</h3>
        <p>
          Se carichi un bilancio in <strong>PDF</strong>, le pagine con gli schemi di bilancio vengono inviate a
          Anthropic PBC (modello Claude) per estrarre le voci numeriche. Secondo le condizioni di Anthropic, i dati
          inviati tramite API vengono cancellati dai suoi sistemi entro 30 giorni e non vengono usati per addestrare i
          modelli [verificare le condizioni in vigore e l&apos;eventuale accordo di zero data retention].
        </p>
        <p>
          Se carichi il <strong>file XBRL</strong> depositato al Registro Imprese, oppure inserisci i dati a mano,
          nessun dato viene inviato a servizi di intelligenza artificiale: la lettura avviene sui nostri server.
        </p>
        <p>
          L&apos;AI serve solo a leggere i numeri: i calcoli e le verifiche sono fatti da regole fisse e verificabili.
          Il servizio non prende decisioni automatizzate che producono effetti giuridici nei tuoi confronti (art. 22
          GDPR); gli esiti sono un supporto alla valutazione del professionista.
        </p>

        <h3>4. A chi vengono comunicati i dati</h3>
        <p>I dati sono trattati da fornitori che agiscono come nostri sub-responsabili:</p>
        <ul>
          <li><strong>Render Services, Inc.</strong> — hosting dell&apos;applicazione [regione del server: verificare].</li>
          <li><strong>Neon, Inc.</strong> (o altro fornitore del database) — conservazione dell&apos;archivio
            [regione: verificare, preferibilmente UE].</li>
          <li><strong>Anthropic PBC</strong> — lettura dei bilanci in PDF (vedi punto 3).</li>
          <li><strong>Google LLC</strong> — il sito carica i caratteri tipografici da Google Fonts, che riceve
            l&apos;indirizzo IP del visitatore [valutare se ospitare i caratteri sui nostri server].</li>
        </ul>
        <p>
          Alcuni di questi fornitori hanno sede negli Stati Uniti. I trasferimenti avvengono sulla base del Data Privacy
          Framework UE-USA, ove il fornitore vi aderisca, o delle clausole contrattuali standard della Commissione
          europea [verificare per ciascun fornitore].
        </p>

        <h3>5. Sicurezza</h3>
        <p>
          Le comunicazioni sono cifrate (HTTPS). Le password sono salvate con un algoritmo di hash (scrypt) e non sono
          leggibili nemmeno da noi. Ogni utente vede solo i propri clienti e le proprie analisi. I documenti caricati
          vengono cancellati al termine dell&apos;elaborazione.
        </p>

        <h3>6. I tuoi diritti</h3>
        <p>
          Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti al trattamento basato sul
          legittimo interesse (artt. 15–21 GDPR) scrivendo a [indirizzo email privacy]. Puoi eliminare in autonomia
          singole analisi, clienti o l&apos;intero account dalla pagina <Link to="/clienti">Clienti</Link>: la
          cancellazione dell&apos;account elimina subito anche tutti i clienti e le analisi salvate. Hai inoltre il
          diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).
        </p>
        <p>
          Se sei il cliente di un professionista che usa Solvibly, per i dati della tua impresa rivolgiti al
          professionista, che è il titolare del trattamento.
        </p>

        <h3>7. Modifiche</h3>
        <p>
          Se cambiamo il modo in cui trattiamo i dati aggiorneremo questa pagina e, per le modifiche rilevanti, lo
          comunicheremo via email agli utenti registrati.
        </p>
      </LegalText>
    </Page>
  );
}

export default Privacy;
