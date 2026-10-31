import { createContext, useContext } from 'react';

export const AuthContext = createContext({
  user: null,
  ready: false,
  archive: { enabled: false, reason: null, checked: false },
  login: async () => {},
  register: async () => {},
  logout: () => {},
  deleteAccount: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const TOKEN_KEY = 'solvibly.token';

export function readToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode): the session lasts until the page is closed.
  }
}
