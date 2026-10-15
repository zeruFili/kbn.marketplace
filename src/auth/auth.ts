import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  ApiError,
  resolveAssetUrl,
} from "../api/baseApi"
import { loginApi, registerApi, getMeApi } from "../api/authApi"

export type UserRole = "admin" | "user" | "company" | "church" | "ministry"

export interface User {
  id: string
  email: string
  name: string
  avatar: string
  profileImage?: string | null
  role: UserRole
  status?: string
  business?: string
  companyId?: string
}

export const getStoredToken = getAuthToken
export const saveToken = setAuthToken
export const clearToken = removeAuthToken

export function getStoredSession(): User | null {
  if (typeof localStorage === "undefined") return null
  const s = localStorage.getItem("kbn_session")
  if (!s) return null
  try {
    return JSON.parse(s)
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
  if (!token) {
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
        avatar:
          resolvedProfileImage || `https://i.pravatar.cc/96?u=${safeUser.id}`,
        profileImage: resolvedProfileImage,
        role: (safeUser.role as UserRole) || "user",
        status: (safeUser.status as string) || "active",
      }

      saveSession(user)
      return user
    }

    clearSession()
    return null
  } catch (err) {
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
        avatar:
          resolvedProfileImage || `https://i.pravatar.cc/96?u=${safeUser.id}`,
        profileImage: resolvedProfileImage,
        role: (safeUser.role as UserRole) || "user",
        status: (safeUser.status as string) || "active",
      }

      if (token) {
        saveToken(token)
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

export async function signUp(data: {
  name: string
  email: string
  password: string
  business?: string
  profileImage?: File | string | null
}): Promise<User> {
  const role: UserRole = data.business ? "company" : "user"

  try {
    const res = await registerApi({
      name: data.name,
      email: data.email,
      password: data.password,
      role,
      business: data.business,
      profileImage: data.profileImage,
    })

    if (!res.success || !res.data) {
      let message = res.message || "Sign up failed."
      if (Array.isArray(res.errors) && res.errors.length > 0) {
        message = res.errors.join(". ")
      }
      throw new Error(message)
    }

    const apiData = res.data
    const safeUser = apiData.user
    const token = apiData.accessToken

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
      avatar:
        resolvedProfileImage || `https://i.pravatar.cc/96?u=${safeUser.id}`,
      profileImage: resolvedProfileImage,
      role: (safeUser.role as UserRole) || role,
      status: (safeUser.status as string) || "active",
      business: data.business?.trim() || undefined,
    }

    if (token) {
      saveToken(token)
    }
    saveSession(user)
    return user
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
