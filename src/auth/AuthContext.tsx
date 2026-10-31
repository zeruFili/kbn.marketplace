import { createContext, useContext } from "react"
import type {
  User,
  SignUpData,
  SignUpResult,
} from "./auth"
import type { SetPasswordPayload } from "../api/authApi"

export interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  googleLogin: (idToken: string) => Promise<User>
  linkGoogleAccount: (idToken: string, password: string) => Promise<User>
  setPassword: (payload: SetPasswordPayload) => Promise<{ message: string; hasPassword: boolean }>
  signUp: (data: SignUpData) => Promise<SignUpResult>
  updateUser: (updates: Partial<User>) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
