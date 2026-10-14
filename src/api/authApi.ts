/**
 * Authentication API Endpoints
 * Uses the centralized baseApi for communication with backend auth routes.
 */

import { baseApi } from "./baseApi"
import type { ApiResponse } from "./types"

export interface AuthUserApi {
  id: string
  email: string
  full_name?: string
  fullName?: string
  role: string
  phone?: string
  website?: string
  created_at?: string
  [key: string]: unknown
}

export interface AuthResultData {
  user: AuthUserApi
  accessToken: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role?: string
  business?: string
  phone?: string
  website?: string
}

/**
 * Log in with email and password via backend /auth/login
 */
export async function loginApi(
  payload: LoginPayload
): Promise<ApiResponse<AuthResultData>> {
  return baseApi.post<AuthResultData>("/auth/login", {
    email: payload.email.trim(),
    password: payload.password,
  })
}

/**
 * Register a new user via backend /auth/register
 */
export async function registerApi(
  payload: RegisterPayload
): Promise<ApiResponse<AuthResultData>> {
  return baseApi.post<AuthResultData>("/auth/register", {
    full_name: payload.name.trim(),
    email: payload.email.trim(),
    password: payload.password,
    role: payload.role,
    business: payload.business?.trim() || undefined,
    phone: payload.phone?.trim() || undefined,
    website: payload.website?.trim() || undefined,
  })
}

/**
 * Logout clears the stored auth token
 */
export function logoutApi(): void {
  baseApi.removeToken()
}
