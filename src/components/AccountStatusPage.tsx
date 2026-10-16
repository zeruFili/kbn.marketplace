import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { getMe } from "../auth/auth"

const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

export default function AccountStatusPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleRefreshStatus = async () => {
    setChecking(true)
    setMessage(null)
    try {
      const freshUser = await getMe()
      if (freshUser) {
        updateUser(freshUser)
        if (freshUser.status === "active") {
          navigate("/", { replace: true })
          return
        }
        if (freshUser.status === "pending" || freshUser.status === "inactive") {
          navigate("/payment", { replace: true })
          return
        }
      }
      setMessage("Account is still suspended. Please contact an administrator.")
    } catch {
      setMessage("Could not check status. Please try again.")
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  const isSuspended = (user?.status || "").toLowerCase() === "suspended"

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] flex flex-col justify-between">
      <header className="bg-white border-b border-[var(--border-light)] px-4 sm:px-8 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={knbLogo}
              alt="KBN Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-sm"
            />
            <span className="font-serif text-lg font-bold text-[var(--text-primary)]">
              KBN Account Status
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-[var(--border-light)] p-8 sm:p-10 shadow-sm text-center space-y-6 w-full animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold border border-red-200 dark:border-red-900/40">
            ⛔
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
              {user?.status ? user.status.toUpperCase() : "SUSPENDED"}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)]">
              {isSuspended ? "Account Suspended" : "Account Restricted"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {isSuspended
                ? "Your account access has been suspended by an administrator. While your account is suspended, access to all protected application areas and payment verification is disabled."
                : "Your account is currently not active. Please contact support or your administrator for assistance."}
            </p>
          </div>

          {message && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
              {message}
            </div>
          )}

          <div className="p-4 bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] text-xs text-[var(--text-tertiary)] space-y-1">
            <p className="font-semibold text-[var(--text-primary)]">
              Account: {user?.email}
            </p>
            <p>To appeal or inquire about this status, contact KBN Administration.</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRefreshStatus}
              disabled={checking}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Checking Status...
                </>
              ) : (
                "Refresh Status"
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-[var(--text-tertiary)] border-t border-[var(--border-light)] bg-white">
        © {new Date().getFullYear()} Kingdom Builders Network. All rights reserved.
      </footer>
    </div>
  )
}
