import { create } from 'zustand'
import type { LoginResponse, User } from '../types/api'

const STORAGE_KEY = 'mini-bank.auth'

export interface AuthSession {
  token: string | null
  user: User | null
}

export interface AuthState extends AuthSession {
  /** Set when the API rejects the stored token, so the sign-in page can explain it. */
  sessionExpired: boolean
  signIn: (response: LoginResponse) => void
  signOut: () => void
  expireSession: () => void
  dismissExpiredNotice: () => void
}

export function loadStoredAuth(): AuthSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null }

    const parsed = JSON.parse(raw) as Partial<AuthSession>
    const user = parsed.user
    if (
      typeof parsed.token === 'string' &&
      user &&
      typeof user.username === 'string' &&
      typeof user.email === 'string'
    ) {
      return { token: parsed.token, user }
    }
  } catch {
    // Corrupted storage should not prevent the app from starting.
  }

  return { token: null, user: null }
}

export const useAuthStore = create<AuthState>()((set) => ({
  ...loadStoredAuth(),
  sessionExpired: false,
  signIn: ({ accessToken, user }) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: accessToken, user }),
    )
    set({ token: accessToken, user, sessionExpired: false })
  },
  signOut: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null })
  },
  expireSession: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null, sessionExpired: true })
  },
  dismissExpiredNotice: () => set({ sessionExpired: false }),
}))
