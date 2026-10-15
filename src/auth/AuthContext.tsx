import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import {
  type User,
  type UserRole,
  getStoredSession,
  login as doLogin,
  signUp as doSignUp,
  logout as doLogout,
  updateCurrentUserSession,
} from "./auth"

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<UserRole>
  signUp: (data: {
    name: string
    email: string
    password: string
    business?: string
    profileImage?: File | string | null
  }) => Promise<void>
  updateUser: (updates: Partial<User>) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getStoredSession())
    setLoading(false)
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<UserRole> => {
      const u = await doLogin(email, password)
      setUser(u)
      return u.role
    },
    [],
  )

  const signUp = useCallback(
    async (data: {
      name: string
      email: string
      password: string
      business?: string
      profileImage?: File | string | null
    }) => {
      const u = await doSignUp(data)
      setUser(u)
    },
    [],
  )

  const updateUser = useCallback((updates: Partial<User>) => {
    const updated = updateCurrentUserSession(updates)
    if (updated) {
      setUser(updated)
    }
  }, [])

  const logout = useCallback(async () => {
    await doLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
