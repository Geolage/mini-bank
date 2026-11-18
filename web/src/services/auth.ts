import type { LoginRequest, LoginResponse } from '../types/api'
import { apiFetch } from './http'

export function login(input: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
