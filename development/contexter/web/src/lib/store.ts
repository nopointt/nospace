import { createSignal } from "solid-js"

const STORAGE_KEY = "contexter_auth"

interface AuthState {
  userId: string
  apiToken: string
  mcpUrl: string
  name?: string
  email?: string
}

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveAuth(auth: AuthState | null) {
  if (auth) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

const [auth, setAuthRaw] = createSignal<AuthState | null>(loadAuth())

export function setAuth(state: AuthState | null) {
  saveAuth(state)
  setAuthRaw(state)
}

export function getToken(): string | null {
  return auth()?.apiToken ?? null
}

export function isAuthenticated(): boolean {
  return auth() !== null
}

export { auth }
