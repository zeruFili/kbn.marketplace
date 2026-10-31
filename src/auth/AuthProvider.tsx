import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import {
  type User,
  getStoredSession,
  getMe,
  login as doLogin,
  googleLogin as doGoogleLogin,
  linkGoogleAccount as doLinkGoogleAccount,
  setPassword as doSetPassword,
  signUp as doSignUp,
  logout as doLogout,
  updateCurrentUserSession,
  type SignUpData,
  type SignUpResult,
} from "./auth"
import type { SetPasswordPayload } from "../api/authApi"
import { AuthContext } from "./AuthContext"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function initAuth() {
      // First populate with cached session for immediate responsiveness
      const cached = getStoredSession()
      if (cached) {
        setUser(cached)
      }

      // Then verify against live database record
      try {
        const freshUser = await getMe()
        if (!cancelled) {
          if (freshUser) {
            setUser(freshUser)
          } else {
            setUser(null)
          }
        }
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const u = await doLogin(email, password)
      setUser(u)
      return u
    },
    [],
  )

  const googleLogin = useCallback(
    async (idToken: string): Promise<User> => {
      const u = await doGoogleLogin(idToken)
      setUser(u)
      return u
    },
    [],
  )

  const linkGoogleAccount = useCallback(
    async (idToken: string, password: string): Promise<User> => {
      const u = await doLinkGoogleAccount(idToken, password)
      setUser(u)
      return u
    },
    [],
  )

  const setPassword = useCallback(
    async (payload: SetPasswordPayload): Promise<{ message: string; hasPassword: boolean }> => {
      const res = await doSetPassword(payload)
      setUser((prev) => (prev ? { ...prev, hasPassword: true } : null))
      return res
    },
    [],
  )

  const signUp = useCallback(
    async (data: SignUpData): Promise<SignUpResult> => {
      const res = await doSignUp(data)
      if (res.user) {
        setUser(res.user)
      }
      return res
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
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        linkGoogleAccount,
        setPassword,
        signUp,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
