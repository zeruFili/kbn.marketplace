import { type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles?: string[]
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)] flex items-center justify-center">
        <svg
          className="w-8 h-8 animate-spin text-[var(--brand)]"
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
        </svg>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const status = (user.status || "active").toLowerCase()
  if (status !== "active") {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4 text-2xl font-bold">
          !
        </div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          {status === "pending" ? "Account Pending Approval" : "Account Suspended or Inactive"}
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] max-w-md mb-6">
          {status === "pending"
            ? "Your registration has been submitted and is currently awaiting administrator review."
            : `Your account is currently ${user.status}. Please contact support or your administrator.`}
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors"
        >
          Return to Home
        </a>
      </div>
    )
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.map((r) => r.toLowerCase()).includes(user.role.toLowerCase())
  ) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-4 text-2xl font-bold">
          !
        </div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          Access Restricted
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] max-w-md mb-6">
          Your account role ({user.role}) does not have permission to view this page.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors"
        >
          Return to Home
        </a>
      </div>
    )
  }

  return <>{children}</>
}

