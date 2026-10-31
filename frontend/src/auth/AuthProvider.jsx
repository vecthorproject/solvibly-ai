import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext, readToken, writeToken } from './context.js';

// Keeps the logged-in user, attaches the token to every API call and checks
// whether the archive (accounts, clients, saved analyses) is enabled on the server.
export default function AuthProvider({ children }) {
  const tokenRef = useRef(readToken());
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [archive, setArchive] = useState({ enabled: false, reason: null, checked: false });

  useEffect(() => {
    const id = axios.interceptors.request.use((config) => {
      if (tokenRef.current && typeof config.url === 'string' && config.url.startsWith('/api/')) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, []);

  const setToken = useCallback((token) => {
    tokenRef.current = token;
    writeToken(token);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get('/api/archive/status');
        if (!cancelled) setArchive({ enabled: !!data.enabled, reason: data.reason || null, checked: true });
        if (data.enabled && tokenRef.current) {
          try {
            const me = await axios.get('/api/auth/me');
            if (!cancelled) setUser(me.data.user);
          } catch {
            setToken(null);
          }
        }
      } catch {
        if (!cancelled) setArchive({ enabled: false, reason: 'Archivio non raggiungibile.', checked: true });
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [setToken]);

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, [setToken]);

  const register = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/register', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, [setToken]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  const deleteAccount = useCallback(async () => {
    await axios.delete('/api/auth/account');
    setToken(null);
    setUser(null);
  }, [setToken]);

  const value = useMemo(
    () => ({ user, ready, archive, login, register, logout, deleteAccount }),
    [user, ready, archive, login, register, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
