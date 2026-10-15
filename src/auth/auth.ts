import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  ApiError,
  resolveAssetUrl,
} from "../api/baseApi"
import { loginApi, registerApi } from "../api/authApi"

export type UserRole = "admin" | "user" | "company" | "church" | "ministry"

export interface User {
  id: string
  email: string
  name: string
  avatar: string
  profileImage?: string | null
  role: UserRole
  business?: string
  companyId?: string
}

interface StoredUser extends User {
  password: string
}

const MOCK_USERS: StoredUser[] = [
  {
    id: "u1",
    email: "henok@kidusbuilders.com",
    name: "Henok Kebede",
    avatar: "https://i.pravatar.cc/96?img=11",
    password: "password123",
    role: "company",
    business: "Kidus Builders Group",
    companyId: "covenant-builders",
  },
  {
    id: "u2",
    email: "meron@tsionwellness.org",
    name: "Meron Tadesse",
    avatar: "https://i.pravatar.cc/96?img=47",
    password: "password123",
    role: "company",
    business: "Tsion Wellness Center",
    companyId: "refuge-wellness",
  },
  {
    id: "u3",
    email: "dawit@betesharetreat.org",
    name: "Dawit Alemu",
    avatar: "https://i.pravatar.cc/96?img=8",
    password: "password123",
    role: "company",
    business: "Betesha Retreat & Conference Center",
    companyId: "bethany-retreat",
  },
  {
    id: "u4",
    email: "bethlehem@bereketapparel.co",
    name: "Bethlehem Haile",
    avatar: "https://i.pravatar.cc/96?img=5",
    password: "password123",
    role: "company",
    business: "Bereket Apparel",
    companyId: "generations-of-grace",
  },
  {
    id: "u5",
    email: "yohannes@stewardshipwealth.org",
    name: "Yohannes Assefa",
    avatar: "https://i.pravatar.cc/96?img=6",
    password: "password123",
    role: "company",
    business: "Stewardship Wealth Management",
    companyId: "stewardship-wealth",
  },
  {
    id: "admin1",
    email: "admin@kbn.org",
    name: "Admin KBN",
    avatar: "https://i.pravatar.cc/96?img=68",
    password: "password123",
    role: "admin",
  },
  {
    id: "regular1",
    email: "abel@example.com",
    name: "Abel Tesfaye",
    avatar: "https://i.pravatar.cc/96?img=3",
    password: "password123",
    role: "user",
  },
  {
    id: "regular2",
    email: "tigist@example.com",
    name: "Tigist Lemma",
    avatar: "https://i.pravatar.cc/96?img=9",
    password: "password123",
    role: "user",
  },
]

function getStoredUsers(): StoredUser[] {
  const stored = localStorage.getItem("kbn_users")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return MOCK_USERS
    }
  }
  localStorage.setItem("kbn_users", JSON.stringify(MOCK_USERS))
  return MOCK_USERS
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem("kbn_users", JSON.stringify(users))
}

export const getStoredToken = getAuthToken
export const saveToken = setAuthToken
export const clearToken = removeAuthToken

export function getStoredSession(): User | null {
  const s = localStorage.getItem("kbn_session")
  if (!s) return null
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

function saveSession(user: User) {
  localStorage.setItem("kbn_session", JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem("kbn_session")
  clearToken()
}

export async function login(email: string, password: string): Promise<User> {
  try {
    const res = await loginApi({ email, password })

    if (res.success && res.data) {
      const apiData = res.data
      const safeUser = apiData.user
      const token = apiData.accessToken

      const rawImg = (safeUser.profileImage || safeUser.profile_image) as string | null | undefined
      const resolvedProfileImage = rawImg ? resolveAssetUrl(rawImg) : null

      const user: User = {
        id: safeUser.id,
        email: safeUser.email || email.trim(),
        name:
          (safeUser.full_name as string) ||
          (safeUser.fullName as string) ||
          email.split("@")[0],
        avatar: resolvedProfileImage || `https://i.pravatar.cc/96?u=${safeUser.id}`,
        profileImage: resolvedProfileImage,
        role: (safeUser.role as UserRole) || "user",
      }

      if (token) {
        saveToken(token)
      }
      saveSession(user)
      return user
    }

    throw new Error(res.message || "Login failed.")
  } catch (err: unknown) {
    // If backend returns 401/403/400 or network error, check if it's one of the built-in demo credentials
    if (err instanceof ApiError) {
      if (
        err.status === 401 ||
        err.status === 403 ||
        err.status === 400 ||
        err.isNetworkError
      ) {
        const mockUser = getStoredUsers().find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
        )
        if (mockUser) {
          const { password: _, ...safeMock } = mockUser
          saveSession(safeMock)
          return safeMock
        }
      }
      throw new Error(err.message || "Invalid email or password.")
    }

    // Fall back to demo accounts on unexpected error
    const mockUser = getStoredUsers().find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    )
    if (mockUser) {
      const { password: _, ...safeMock } = mockUser
      saveSession(safeMock)
      return safeMock
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

    const rawImg = (safeUser.profileImage || safeUser.profile_image) as string | null | undefined
    const resolvedProfileImage = rawImg ? resolveAssetUrl(rawImg) : null

    const user: User = {
      id: safeUser.id,
      email: safeUser.email || data.email.trim(),
      name:
        (safeUser.full_name as string) ||
        (safeUser.fullName as string) ||
        data.name.trim(),
      avatar: resolvedProfileImage || `https://i.pravatar.cc/96?u=${safeUser.id}`,
      profileImage: resolvedProfileImage,
      role: (safeUser.role as UserRole) || role,
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
  await new Promise((r) => setTimeout(r, 200))
  clearSession()
}

