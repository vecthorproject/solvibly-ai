import axios from 'axios';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/context.js';
import { Button, Card, ErrorText, Field, Input, Muted, Page } from '../components/ui.js';

// Login and registration. If the user came from "Salva nell'archivio", the analysis is saved right after.
function Login() {
  const { user, ready, archive, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingSave = location.state?.pendingSave;

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [privacyOk, setPrivacyOk] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (ready && user && !pendingSave) return <Navigate to="/clienti" replace />;

  const afterAuth = async () => {
    if (pendingSave) {
      const { data } = await axios.post('/api/analyses', pendingSave);
      navigate(`/analisi/${data.id}`, { replace: true });
    } else {
      navigate('/clienti', { replace: true });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (mode === 'register' && !privacyOk) {
      setError("Per creare l'account devi dichiarare di aver letto l'informativa privacy.");
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      await afterAuth();
    } catch (err) {
      setError(err?.response?.data?.error || 'Operazione non riuscita. Riprova.');
      setBusy(false);
    }
  };

  if (archive.checked && !archive.enabled) {
    return (
      <Page>
        <h2>Accedi</h2>
        <Card>
          L&apos;archivio clienti non è attivo su questo server.
          {archive.reason && <Muted>{archive.reason}</Muted>}
          <Muted>Puoi comunque fare le analisi e stamparle in PDF.</Muted>
        </Card>
      </Page>
    );
  }

  return (
    <Page style={{ maxWidth: 460 }}>
      <h2>{mode === 'login' ? 'Accedi' : 'Crea un account'}</h2>
      {pendingSave && (
        <Muted>Accedi o crea un account: l&apos;analisi di {pendingSave.results?.companyName} verrà salvata subito dopo.</Muted>
      )}
      <Card>
        <form onSubmit={submit}>
          <Field>
            Email
            <Input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field>
            Password {mode === 'register' && <Muted as="span">(almeno 8 caratteri)</Muted>}
            <Input type="password" required minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password} onChange={e => setPassword(e.target.value)} />
          </Field>
          {mode === 'register' && (
            <Field as="div" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input id="privacy" type="checkbox" checked={privacyOk} onChange={e => setPrivacyOk(e.target.checked)}
                style={{ marginTop: '0.25rem' }} />
              <label htmlFor="privacy">
                Ho letto l&apos;<Link to="/privacy" target="_blank">informativa privacy</Link> e i{' '}
                <Link to="/termini" target="_blank">termini d&apos;uso</Link>.
              </label>
            </Field>
          )}
          {error && <ErrorText role="alert">{error}</ErrorText>}
          <Button type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Attendere…' : mode === 'login' ? 'Accedi' : 'Crea account'}
          </Button>
        </form>
      </Card>
      <Muted>
        {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); setError(null); setMode(mode === 'login' ? 'register' : 'login'); }}>
          {mode === 'login' ? 'Creane uno' : 'Accedi'}
        </a>
      </Muted>
    </Page>
  );
}

export default Login;
