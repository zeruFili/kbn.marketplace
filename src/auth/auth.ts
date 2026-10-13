export type UserRole = "admin" | "user" | "company"

export interface User {
  id: string
  email: string
  name: string
  avatar: string
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

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.port === "3001"
    ? "/api/v1"
    : "http://localhost:3001/api/v1")

export function getStoredToken(): string | null {
  return localStorage.getItem("kbn_token")
}

export function saveToken(token: string) {
  localStorage.setItem("kbn_token", token)
}

export function clearToken() {
  localStorage.removeItem("kbn_token")
}

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
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password }),
    })

    const json = await res.json()

    if (res.ok && json.success) {
      const apiData = json.data
      const safeUser = apiData.user
      const token = apiData.accessToken

      const user: User = {
        id: safeUser.id,
        email: safeUser.email || email.trim(),
        name: safeUser.full_name || safeUser.fullName || email.split("@")[0],
        avatar: `https://i.pravatar.cc/96?u=${safeUser.id}`,
        role: (safeUser.role as UserRole) || "user",
      }

      if (token) {
        saveToken(token)
      }
      saveSession(user)
      return user
    } else if (res.status === 401 || res.status === 403 || res.status === 400) {
      // Check if it's one of the built-in demo credentials before failing
      const mockUser = getStoredUsers().find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      )
      if (mockUser) {
        const { password: _, ...safeMock } = mockUser
        saveSession(safeMock)
        return safeMock
      }
      throw new Error(json.message || "Invalid email or password.")
    } else {
      throw new Error(json.message || "Login failed.")
    }
  } catch (err: unknown) {
    // If backend request fails (e.g. offline/network), fall back to demo accounts
    const mockUser = getStoredUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
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
}): Promise<User> {
  const role: UserRole = data.business ? "company" : "user"

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        role,
        business: data.business?.trim() || undefined,
      }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      let message = json.message || "Sign up failed."
      if (Array.isArray(json.errors) && json.errors.length > 0) {
        message = json.errors.join(". ")
      }
      throw new Error(message)
    }

    const apiData = json.data
    const safeUser = apiData.user
    const token = apiData.accessToken

    const user: User = {
      id: safeUser.id,
      email: safeUser.email || data.email.trim(),
      name: safeUser.full_name || safeUser.fullName || data.name.trim(),
      avatar: `https://i.pravatar.cc/96?u=${safeUser.id}`,
      role: (safeUser.role as UserRole) || role,
      business: data.business?.trim() || undefined,
    }

    if (token) {
      saveToken(token)
    }
    saveSession(user)
    return user
  } catch (err: unknown) {
    throw err
  }
}

export async function logout(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200))
  clearSession()
}

