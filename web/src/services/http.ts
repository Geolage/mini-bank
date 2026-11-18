import { useAuthStore } from '../app/authStore'
import type { ApiErrorBody } from '../types/api'

const baseUrl = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  readonly body?: ApiErrorBody

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function signOutIfUnauthorized(status: number) {
  if (status !== 401) return

  const { token, expireSession } = useAuthStore.getState()
  if (token) expireSession()
}

function readErrorMessage(body: ApiErrorBody | undefined, status: number) {
  if (typeof body?.message === 'string') return body.message
  if (Array.isArray(body?.message) && body.message.length > 0) {
    return body.message.join(', ')
  }
  return `Request failed with status ${status}.`
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = useAuthStore.getState().token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(
      0,
      'Cannot reach the API. Make sure the backend is running.',
    )
  }

  if (!response.ok) {
    let body: ApiErrorBody | undefined
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      // Non-JSON error responses fall back to the status message.
    }

    signOutIfUnauthorized(response.status)
    throw new ApiError(
      response.status,
      readErrorMessage(body, response.status),
      body,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(
      response.status,
      'The API returned an unexpected response.',
    )
  }
}
