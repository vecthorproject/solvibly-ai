import { Link } from 'react-router-dom';
import { Page } from '../components/ui.js';
import { DraftBanner, LegalText } from './Privacy.jsx';

// DRAFT. To be completed and checked by a lawyer before going live.
function Terms() {
  return (
    <Page>
      <h2>Termini d&apos;uso</h2>
      <DraftBanner role="note">
        <strong>Bozza — da far verificare da un legale.</strong> Le parti tra parentesi quadre vanno completate.
      </DraftBanner>

      <LegalText>
        <p>Ultimo aggiornamento: [data]</p>

        <h3>1. Il servizio</h3>
        <p>
          Solvibly AI, fornito da [ragione sociale / nome e cognome], [indirizzo], P.IVA [numero] (&quot;Solvibly&quot;),
          legge i dati di un bilancio (file XBRL, PDF o inserimento manuale) e calcola indici, modelli di previsione
          dell&apos;insolvenza e le verifiche dei segnali di crisi previsti dal D.Lgs. 14/2019 (Codice della crisi
          d&apos;impresa e dell&apos;insolvenza) e dagli indici elaborati dal CNDCEC. Il servizio è rivolto a
          professionisti (commercialisti, sindaci, revisori, consulenti) e a imprese, non a consumatori.
        </p>
        <p>
          Il servizio è in fase di accesso anticipato: funzioni, limiti e condizioni economiche possono cambiare.
          [Condizioni economiche: gratuito durante la fase di prova / piani a pagamento — da definire.]
        </p>

        <h3>2. Natura dei risultati</h3>
        <ul>
          <li>
            I risultati sono un <strong>supporto</strong> alla valutazione e non la sostituiscono. Non costituiscono
            consulenza legale, fiscale o contabile, né attestazione, parere o giudizio sull&apos;esistenza di uno stato
            di crisi o di insolvenza. La valutazione sull&apos;adeguatezza degli assetti e sulle iniziative da
            assumere resta di competenza degli amministratori, degli organi di controllo e dei loro consulenti.
          </li>
          <li>
            La lettura dei PDF con intelligenza artificiale può contenere errori. Prima di usare i risultati devi
            controllare le voci estratte, riportate nella sezione &quot;Dati utilizzati per il calcolo&quot;.
          </li>
          <li>
            Gli indici e i modelli si basano sui dati del bilancio e sulle informazioni inserite: dati incompleti o
            non aggiornati producono risultati incompleti o non affidabili. Le soglie applicate sono quelle indicate
            nella pagina dei risultati; la normativa e i documenti di prassi possono cambiare e Solvibly li aggiorna
            senza garanzia di tempestività.
          </li>
        </ul>

        <h3>3. Account</h3>
        <p>
          Per usare l&apos;archivio clienti serve un account. Sei responsabile della riservatezza della password e
          delle attività svolte con il tuo account. Puoi cancellare l&apos;account in qualsiasi momento dalla pagina
          Clienti: la cancellazione elimina definitivamente anche i dati salvati.
        </p>

        <h3>4. Dati dei tuoi clienti</h3>
        <p>
          Carichi i dati dei tuoi clienti sotto la tua responsabilità e dichiari di averne titolo, nel rispetto del
          segreto professionale e della normativa sulla protezione dei dati. Per questi dati sei titolare del
          trattamento e nomini Solvibly responsabile del trattamento ai sensi dell&apos;art. 28 GDPR, alle condizioni
          dell&apos;accordo sul trattamento dei dati [allegato / da predisporre], che prevede in sintesi: trattamento
          solo per fornire il servizio; riservatezza; misure di sicurezza adeguate; elenco dei sub-responsabili
          (indicati nell&apos;<Link to="/privacy">informativa privacy</Link>) con preavviso in caso di modifiche;
          assistenza per le richieste degli interessati; cancellazione dei dati alla cessazione del servizio.
        </p>

        <h3>5. Uso consentito</h3>
        <p>
          Non è consentito usare il servizio per scopi illeciti, tentare di accedere ai dati di altri utenti, aggirare
          i limiti tecnici o sovraccaricare il sistema in modo automatizzato.
        </p>

        <h3>6. Disponibilità</h3>
        <p>
          Solvibly si impegna a mantenere il servizio disponibile, ma non garantisce che sia privo di interruzioni o
          errori. Durante la fase di accesso anticipato il primo caricamento dopo un periodo di inattività può
          richiedere fino a un minuto. Ti consigliamo di stampare o salvare in PDF i report che devi conservare.
        </p>

        <h3>7. Responsabilità</h3>
        <p>
          Nei limiti consentiti dalla legge (art. 1229 c.c.), Solvibly non risponde dei danni derivanti dall&apos;uso
          dei risultati senza la verifica indicata al punto 2, da dati inseriti in modo errato o da interruzioni del
          servizio, salvo dolo o colpa grave. [Eventuale limite massimo di responsabilità — da definire con il
          legale.]
        </p>

        <h3>8. Proprietà intellettuale</h3>
        <p>
          Il software e i contenuti del sito appartengono a Solvibly. I dati che carichi e i report che generi
          restano tuoi.
        </p>

        <h3>9. Modifiche e recesso</h3>
        <p>
          Possiamo modificare questi termini dandone comunicazione via email o sul sito con almeno [15] giorni di
          preavviso; se non li accetti puoi cancellare l&apos;account. Puoi smettere di usare il servizio in
          qualsiasi momento.
        </p>

        <h3>10. Legge applicabile e foro</h3>
        <p>
          Si applica la legge italiana. Per le controversie è competente in via esclusiva il Foro di [città].
        </p>
      </LegalText>
    </Page>
  );
}

export default Terms;
