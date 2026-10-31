import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { type UserRole } from "../auth/auth"
import GoogleSignInButton from "./common/GoogleSignInButton"
const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`


export default function LoginPage({
  onBack,
  onSwitch,
  onSuccess,
  onForgotPassword,
}: {
  onBack?: () => void
  onSwitch?: () => void
  onSuccess?: (role: UserRole) => void
  onForgotPassword?: () => void
} = {}) {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      const status = (user.status || "pending").toLowerCase()
      if (status === "suspended") {
        navigate("/account-status", { replace: true })
      } else if (status === "pending" || status === "inactive") {
        navigate("/payment", { replace: true })
      } else if (status === "active") {
        navigate("/", { replace: true })
      }
    }
  }, [user, navigate])

  const handleBack = () => {
    if (onBack) onBack()
    else navigate("/")
  }

  const handleSwitch = () => {
    if (onSwitch) onSwitch()
    else navigate("/signup")
  }

  const handleForgotPassword = () => {
    if (onForgotPassword) onForgotPassword()
    else navigate("/forgot-password", { state: { email: email.trim() } })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }
    if (!password) {
      setError("Please enter your password.")
      return
    }
    setLoading(true)
    try {
      const loggedUser = await login(email, password)
      const userStatus = (loggedUser.status || "pending").toLowerCase()

      // Redirect based on account status
      if (userStatus === "suspended") {
        navigate("/account-status", { replace: true })
        return
      }

      if (userStatus === "pending" || userStatus === "inactive") {
        navigate("/payment", { replace: true })
        return
      }

      // If active:
      if (onSuccess) {
        onSuccess(loggedUser.role)
      } else {
        const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname
        if (
          fromPath &&
          fromPath !== "/login" &&
          fromPath !== "/payment" &&
          fromPath !== "/account-status"
        ) {
          navigate(fromPath, { replace: true })
        } else {
          const role = loggedUser.role?.toLowerCase()
          if (role === "admin") navigate("/admin/overview", { replace: true })
          else if (role === "company") navigate("/dashboard/company", { replace: true })
          else navigate("/", { replace: true })
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        <button
          onClick={handleBack}
          type="button"
          className="flex items-center gap-2.5 justify-center mb-10 group mx-auto cursor-pointer"
        >
          <img
            src={knbLogo}
            alt="KBN Logo"
            className="w-10 h-10 rounded-xl object-cover group-hover:scale-105 transition-transform shadow-lg shadow-[var(--brand)]/20"
          />
          <span className="font-serif text-xl text-[var(--text-primary)]">
            KBN
          </span>
        </button>


        <div className="bg-white rounded-2xl border border-[var(--accent)]/20 p-5 sm:p-8 shadow-[0_18px_45px_rgba(15,29,58,0.08)]">
          <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-8">
            Sign in to your Kingdom Builders Network account
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 animate-scale-in">
              <div className="flex items-start gap-2.5">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  {error.includes("does not have a local password") && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password", { state: { email: email.trim() } })}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors shadow-xs cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Set / Create Password Now
                      </button>
                      <span className="text-xs text-[var(--text-tertiary)]">or use Google Sign-In below</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 pr-12 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand)] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-lg shadow-[var(--brand)]/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>{" "}
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-center sm:text-left">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--brand)] transition-colors cursor-pointer"
              >
                Forgot your password?
              </button>
              <button
                type="button"
                onClick={() => navigate("/forgot-password", { state: { email: email.trim() } })}
                className="text-xs text-[var(--brand)] font-medium hover:underline transition-colors cursor-pointer"
              >
                Set password for Google account
              </button>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-default)]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[var(--text-tertiary)]">
                Or continue with
              </span>
            </div>
          </div>

          <GoogleSignInButton
            text="signin_with"
            onSuccess={(loggedUser) => {
              const userStatus = (loggedUser.status || "pending").toLowerCase()
              if (userStatus === "suspended") {
                navigate("/account-status", { replace: true })
                return
              }
              if (userStatus === "pending" || userStatus === "inactive") {
                navigate("/payment", { replace: true })
                return
              }
              if (onSuccess) {
                onSuccess(loggedUser.role)
              } else {
                const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname
                if (
                  fromPath &&
                  fromPath !== "/login" &&
                  fromPath !== "/payment" &&
                  fromPath !== "/account-status"
                ) {
                  navigate(fromPath, { replace: true })
                } else {
                  const role = loggedUser.role?.toLowerCase()
                  if (role === "admin") navigate("/admin/overview", { replace: true })
                  else if (role === "company") navigate("/dashboard/company", { replace: true })
                  else navigate("/", { replace: true })
                }
              }
            }}
          />

          <p className="text-sm text-center text-[var(--text-tertiary)] mt-6">
            Don't have an account?{" "}
            <button
              onClick={handleSwitch}
              className="font-semibold text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors cursor-pointer"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
