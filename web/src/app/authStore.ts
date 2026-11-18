import { create } from 'zustand'
import type { LoginResponse, User } from '../types/api'

const STORAGE_KEY = 'mini-bank.auth'

export interface AuthSession {
  token: string | null
  user: User | null
}

export interface AuthState extends AuthSession {
  signIn: (response: LoginResponse) => void
  signOut: () => void
}

export function loadStoredAuth(): AuthSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, user: null }

    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (typeof parsed.token === 'string' && parsed.user) {
      return { token: parsed.token, user: parsed.user }
    }
  } catch {
    // Corrupted storage should not prevent the app from starting.
  }

  return { token: null, user: null }
}

export const useAuthStore = create<AuthState>()((set) => ({
  ...loadStoredAuth(),
  signIn: ({ accessToken, user }) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: accessToken, user }),
    )
    set({ token: accessToken, user })
  },
  signOut: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null })
  },
}))
