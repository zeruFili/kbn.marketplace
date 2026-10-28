import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  ApiError,
  resolveAssetUrl,
} from "../api/baseApi"
import { loginApi, registerApi, getMeApi, sendOtpApi } from "../api/authApi"

export type UserRole = "admin" | "user" | "company" | "church" | "ministry"
export type UserStatus = "active" | "pending" | "inactive" | "suspended"

export interface JwtTokenPayload {
  sub: string
  email: string
  role: UserRole
  status: UserStatus
  iat?: number
  exp?: number
}

export interface User {
  id: string
  email: string
  name: string
  avatar: string
  profileImage?: string | null
  role: UserRole
  status: UserStatus
  business?: string
  companyId?: string
  phone?: string
  website?: string
}

export const getStoredToken = getAuthToken
export const saveToken = setAuthToken
export const clearToken = removeAuthToken

/**
 * Parses and decodes payload from a standard JWT token string.
 */
export function parseJwt(token: string): JwtTokenPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Validates token signature structure and expiration time.
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false
  const payload = parseJwt(token)
  if (!payload || !payload.sub || !payload.exp) return false
  const now = Math.floor(Date.now() / 1000)
  return payload.exp > now
}

export function getStoredSession(): User | null {
  if (typeof localStorage === "undefined") return null
  const s = localStorage.getItem("kbn_session")
  if (!s) return null
  try {
    const user = JSON.parse(s) as User
    if (user && user.avatar && user.avatar.includes("pravatar.cc")) {
      user.avatar = user.profileImage || ""
    }
    return user
  } catch {
    return null
  }
}

function saveSession(user: User) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("kbn_session", JSON.stringify(user))
  }
}

export function clearSession() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("kbn_session")
  }
  clearToken()
}

/**
 * Fetch current user from /auth/me to guarantee authorization relies on database records.
 */
export async function getMe(): Promise<User | null> {
  const token = getStoredToken()
  if (!token || !isTokenValid(token)) {
    clearSession()
    return null
  }

  try {
    const res = await getMeApi()
    if (res.success && res.data) {
      const safeUser = res.data
      const rawImg = (safeUser.profileImage || safeUser.profile_image) as
        | string
        | null
        | undefined
      const resolvedProfileImage = rawImg ? resolveAssetUrl(rawImg) : null

      const user: User = {
        id: safeUser.id,
        email: safeUser.email || "",
        name:
          (safeUser.full_name as string) ||
          (safeUser.fullName as string) ||
          safeUser.email?.split("@")[0] ||
          "User",
        avatar: resolvedProfileImage || "",
        profileImage: resolvedProfileImage,
        role: (safeUser.role as UserRole) || "user",
        status: (String(safeUser.status || "pending").toLowerCase() as UserStatus),
        phone: (safeUser.phone as string) || undefined,
        website: (safeUser.website as string) || undefined,
      }

      saveSession(user)
      return user
    }

    clearSession()
    return null
  } catch {
    clearSession()
    return null
  }
}

export async function login(email: string, password: string): Promise<User> {
  try {
    const res = await loginApi({ email, password })

    if (res.success && res.data) {
      const apiData = res.data
      const safeUser = apiData.user
      const token = apiData.accessToken

      if (token) {
        saveToken(token)
      }

      const rawImg = (safeUser.profileImage || safeUser.profile_image) as
        | string
        | null
        | undefined
      const resolvedProfileImage = rawImg ? resolveAssetUrl(rawImg) : null

      const user: User = {
        id: safeUser.id,
        email: safeUser.email || email.trim(),
        name:
          (safeUser.full_name as string) ||
          (safeUser.fullName as string) ||
          email.split("@")[0],
        avatar: resolvedProfileImage || "",
        profileImage: resolvedProfileImage,
        role: (safeUser.role as UserRole) || "user",
        status: (String(safeUser.status || "pending").toLowerCase() as UserStatus),
        phone: (safeUser.phone as string) || undefined,
        website: (safeUser.website as string) || undefined,
      }

      saveSession(user)
      return user
    }

    throw new Error(res.message || "Login failed.")
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      let message = err.message || "Invalid email or password."
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        message = err.errors.join(". ")
      }
      throw new Error(message)
    }
    throw err
  }
}

export interface SignUpData {
  name: string
  email: string
  password: string
  phone?: string
  business?: string
  role?: UserRole
  profileImage?: File | string | null
  otp?: string
  otpMethod?: "sms" | "email"
}

export interface SignUpResult {
  requiresOtp?: boolean
  identifier?: string
  otpMethod?: "sms" | "email"
  expiresAt?: string
  message?: string
  user?: User
  accessToken?: string
}

export async function signUp(data: SignUpData): Promise<SignUpResult> {
  const role: UserRole = data.role || (data.business ? "company" : "user")

  try {
    const res = await registerApi({
      name: data.name,
      email: data.email,
      password: data.password,
      role,
      business: data.business,
      phone: data.phone,
      profileImage: data.profileImage,
      otp: data.otp,
      otpMethod: data.otpMethod,
    })

    if (!res.success) {
      let message = res.message || "Sign up failed."
      if (Array.isArray(res.errors) && res.errors.length > 0) {
        message = res.errors.join(". ")
      }
      throw new Error(message)
    }

    // Step 1: If backend requires OTP verification before user creation
    if (res.requiresOtp || (res.data && (res.data as any).requiresOtp)) {
      const dataObj = (res.data || {}) as any
      const method = (dataObj.otpMethod || (res as any).otpMethod || data.otpMethod || (data.phone ? "sms" : "email")) as "sms" | "email"
      const defaultMessage = method === "email"
        ? "Verification code sent to your email."
        : "Verification code sent to your phone via SMS."
      return {
        requiresOtp: true,
        identifier: dataObj.identifier || (res as any).identifier || (method === "email" ? data.email : (data.phone || "")),
        otpMethod: method,
        expiresAt: dataObj.expiresAt || (res as any).expiresAt || "",
        message: res.message || defaultMessage,
      }
    }

    // Step 3: Registration complete with OTP
    const apiData = (res.data || {}) as any
    const safeUser = apiData.user || apiData
    const token = res.accessToken || apiData.accessToken

    if (token) {
      saveToken(token)
    }

    const rawImg = (safeUser.profileImage || safeUser.profile_image) as
      | string
      | null
      | undefined
    const resolvedProfileImage = rawImg ? resolveAssetUrl(rawImg) : null

    const user: User = {
      id: safeUser.id,
      email: safeUser.email || data.email.trim(),
      name:
        (safeUser.full_name as string) ||
        (safeUser.fullName as string) ||
        data.name.trim(),
      avatar: resolvedProfileImage || "",
      profileImage: resolvedProfileImage,
      role: (safeUser.role as UserRole) || role,
      status: (String(safeUser.status || "pending").toLowerCase() as UserStatus),
      business: data.business?.trim() || undefined,
      phone: safeUser.phone || data.phone?.trim() || undefined,
    }

    saveSession(user)
    return {
      requiresOtp: false,
      user,
      accessToken: token,
      message: res.message || "User created successfully",
    }
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      let message = err.message || "Sign up failed."
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        message = err.errors.join(". ")
      }
      throw new Error(message)
    }
    throw err
  }
}

export async function resendRegistrationOtp(
  identifier: string,
  otpMethod?: "sms" | "email"
): Promise<{ success: boolean; message: string; identifier?: string; expiresAt?: string }> {
  try {
    const res = await sendOtpApi({
      identifier: identifier.trim(),
      purpose: "REGISTER",
      otpMethod,
    })
    const isEmail = otpMethod === "email" || identifier.includes("@")
    return {
      success: true,
      message: res.message || (isEmail ? "A new verification code was sent to your email." : "A new verification code was sent to your phone via SMS."),
      identifier: res.data?.identifier,
      expiresAt: res.data?.expiresAt,
    }
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      let message = err.message || "Failed to resend verification code."
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        message = err.errors.join(". ")
      }
      throw new Error(message)
    }
    throw err
  }
}

export function updateCurrentUserSession(updates: Partial<User>): User | null {
  const current = getStoredSession()
  if (!current) return null
  const updated: User = { ...current, ...updates }
  saveSession(updated)
  return updated
}

export async function logout(): Promise<void> {
  clearSession()
}
