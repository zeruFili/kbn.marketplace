/**
 * Centralized API Type Definitions
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  errors?: string[]
  [key: string]: unknown
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>
  body?: BodyInit | Record<string, unknown> | unknown[] | null
  skipAuth?: boolean
  timeout?: number
}
