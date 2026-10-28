/**
 * Centralized Base API Client
 * Manages base URL, request headers, authentication tokens, timeout, and unified error handling.
 */

import type { ApiResponse, RequestOptions } from "./types"

export const TOKEN_STORAGE_KEY = "kbn_token"

/**
 * Centralized Backend Base URL
 * Reads from VITE_API_URL if configured, otherwise defaults appropriately.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.port === "3001"
    ? "/api/v1"
    : `${typeof window !== "undefined" && window.location.protocol === "https:" ? "https:" : "http:"}//back.kbnep.com/api/v1`)

// Alias for backward compatibility
export const API_BASE = API_BASE_URL

/**
 * Standard API Error Class
 */
export class ApiError extends Error {
  public status: number
  public statusText: string
  public data?: unknown
  public errors?: string[]
  public isNetworkError: boolean

  constructor(params: {
    message: string
    status?: number
    statusText?: string
    data?: unknown
    errors?: string[]
    isNetworkError?: boolean
  }) {
    super(params.message)
    this.name = "ApiError"
    this.status = params.status ?? 0
    this.statusText = params.statusText ?? ""
    this.data = params.data
    this.errors = params.errors
    this.isNetworkError = params.isNetworkError ?? false
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * Token management helpers
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

// Aliases matching existing project conventions
export const getStoredToken = getAuthToken
export const saveToken = setAuthToken
export const clearToken = removeAuthToken

/**
 * Resolves static or uploaded asset URLs returned by backend (e.g. /uploads/companys/...)
 */
export function resolveAssetUrl(filePath?: string): string {
  if (!filePath) return ""
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("blob:") ||
    filePath.startsWith("data:")
  ) {
    return filePath
  }
  const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`
  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "")
    return `${base}${cleanPath}`
  }
  return `http://localhost:3001${cleanPath}`
}

export const resolveFileUrl = resolveAssetUrl

/**
 * Builds the full URL with query parameters
 */
function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  let fullUrl: string
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    fullUrl = endpoint
  } else {
    const cleanBase = API_BASE_URL.replace(/\/+$/, "")
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    fullUrl = `${cleanBase}${cleanEndpoint}`
  }

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      fullUrl += (fullUrl.includes("?") ? "&" : "?") + queryString
    }
  }

  return fullUrl
}

/**
 * Main HTTP request runner
 */
export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    params,
    body,
    headers: customHeaders = {},
    skipAuth = false,
    timeout = 30000,
    signal: userSignal,
    ...fetchInit
  } = options

  const url = buildUrl(endpoint, params)
  const headers = new Headers(customHeaders)

  // Inject Bearer token if present and not skipped
  if (!skipAuth && !headers.has("Authorization")) {
    const token = getAuthToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  // Handle request body
  let formattedBody: BodyInit | undefined = undefined
  if (body !== undefined && body !== null) {
    if (
      body instanceof FormData ||
      body instanceof Blob ||
      body instanceof URLSearchParams
    ) {
      // Allow browser to calculate boundary for FormData
      formattedBody = body
    } else if (typeof body === "string") {
      formattedBody = body
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
      }
    } else {
      formattedBody = JSON.stringify(body)
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
      }
    }
  }

  // Setup timeout abort controller
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  // Connect caller signal if provided
  if (userSignal) {
    if (userSignal.aborted) {
      controller.abort()
    } else {
      userSignal.addEventListener("abort", () => controller.abort(), { once: true })
    }
  }

  try {
    const res = await fetch(url, {
      ...fetchInit,
      headers,
      body: formattedBody,
      signal: controller.signal,
    })

    clearTimeout(timer)

    let parsedData: any = null
    const contentType = res.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      try {
        parsedData = await res.json()
      } catch {
        parsedData = null
      }
    } else {
      try {
        parsedData = await res.text()
      } catch {
        parsedData = null
      }
    }

    if (!res.ok) {
      let errorMessage = res.statusText || `Request failed with status ${res.status}`
      let errors: string[] | undefined = undefined

      if (parsedData && typeof parsedData === "object") {
        if (parsedData.message) {
          errorMessage = parsedData.message
        }
        if (Array.isArray(parsedData.errors) && parsedData.errors.length > 0) {
          errors = parsedData.errors
          if (!parsedData.message) {
            errorMessage = parsedData.errors.join(", ")
          }
        }
      }

      throw new ApiError({
        message: errorMessage,
        status: res.status,
        statusText: res.statusText,
        data: parsedData,
        errors,
      })
    }

    // Backend standardized responses typically have { success: boolean, data?: T, message?: string }
    if (parsedData && typeof parsedData === "object" && "success" in parsedData) {
      return parsedData as ApiResponse<T>
    }

    // Otherwise wrap parsedData as successful ApiResponse
    return {
      success: true,
      data: parsedData as T,
    }
  } catch (err: unknown) {
    clearTimeout(timer)

    if (err instanceof ApiError) {
      throw err
    }

    if ((err as Error)?.name === "AbortError") {
      throw new ApiError({
        message: "Request timed out. Please try again.",
        isNetworkError: true,
      })
    }

    throw new ApiError({
      message:
        (err as Error)?.message ||
        "A network error occurred. Please check your connection.",
      isNetworkError: true,
    })
  }
}

/**
 * Base API client object with method conveniences
 */
export const baseApi = {
  request,
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T = unknown>(
    endpoint: string,
    body?: RequestOptions["body"],
    options?: RequestOptions
  ) => request<T>(endpoint, { ...options, method: "POST", body }),
  put: <T = unknown>(
    endpoint: string,
    body?: RequestOptions["body"],
    options?: RequestOptions
  ) => request<T>(endpoint, { ...options, method: "PUT", body }),
  patch: <T = unknown>(
    endpoint: string,
    body?: RequestOptions["body"],
    options?: RequestOptions
  ) => request<T>(endpoint, { ...options, method: "PATCH", body }),
  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
  // Configuration and helper utilities
  baseUrl: API_BASE_URL,
  resolveAssetUrl,
  resolveFileUrl,
  getToken: getAuthToken,
  setToken: setAuthToken,
  removeToken: removeAuthToken,
}

export default baseApi
