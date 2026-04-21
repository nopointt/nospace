import { createSignal } from "solid-js";

const TOKEN_KEY = "nomos_auth_token";

const [token, setTokenSignal] = createSignal<string | null>(
  typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
);

export const getToken = token;

export function setToken(value: string | null): void {
  if (value === null) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, value);
  }
  setTokenSignal(value);
}

export function isAuthenticated(): boolean {
  return !!token();
}
