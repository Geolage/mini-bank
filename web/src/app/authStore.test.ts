import { beforeEach, describe, expect, it } from 'vitest'
import type { User } from '../types/api'
import { loadStoredAuth, useAuthStore } from './authStore'

const STORAGE_KEY = 'mini-bank.auth'

const user: User = {
  id: 'user-1',
  username: 'admin',
  name: 'Admin',
  email: 'admin@minibank.dev',
  role: 'OPERATOR',
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ token: null, user: null, sessionExpired: false })
})

describe('loadStoredAuth', () => {
  it('returns an empty session when storage is missing or corrupt', () => {
    expect(loadStoredAuth()).toEqual({ token: null, user: null })

    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadStoredAuth()).toEqual({ token: null, user: null })

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 42 }))
    expect(loadStoredAuth()).toEqual({ token: null, user: null })
  })

  it('restores a session from the stored shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 'jwt', user }))

    expect(loadStoredAuth()).toEqual({ token: 'jwt', user })
  })

  it('rejects a session stored before the username field existed', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: 'jwt',
        user: { id: 'u', name: 'Admin', email: 'admin@minibank.dev', role: 'OPERATOR' },
      }),
    )

    expect(loadStoredAuth()).toEqual({ token: null, user: null })
  })
})

describe('useAuthStore', () => {
  it('persists credentials on sign in', () => {
    useAuthStore.getState().signIn({ accessToken: 'jwt', user })

    expect(useAuthStore.getState()).toMatchObject({ token: 'jwt', user })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      token: 'jwt',
      user,
    })
  })

  it('clears state and storage on sign out', () => {
    useAuthStore.getState().signIn({ accessToken: 'jwt', user })
    useAuthStore.getState().signOut()

    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('leaves no expiry notice after a manual sign out', () => {
    useAuthStore.getState().signIn({ accessToken: 'jwt', user })
    useAuthStore.getState().signOut()

    expect(useAuthStore.getState().sessionExpired).toBe(false)
  })

  it('flags the session as expired when the API rejects the token', () => {
    useAuthStore.getState().signIn({ accessToken: 'expired', user })
    useAuthStore.getState().expireSession()

    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      user: null,
      sessionExpired: true,
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('drops the notice once the user signs in again or dismisses it', () => {
    useAuthStore.getState().expireSession()
    expect(useAuthStore.getState().sessionExpired).toBe(true)

    useAuthStore.getState().dismissExpiredNotice()
    expect(useAuthStore.getState().sessionExpired).toBe(false)

    useAuthStore.getState().expireSession()
    useAuthStore.getState().signIn({ accessToken: 'jwt', user })
    expect(useAuthStore.getState().sessionExpired).toBe(false)
  })
})
