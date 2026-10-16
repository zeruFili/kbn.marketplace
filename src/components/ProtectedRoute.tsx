import { type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { type UserStatus } from "../auth/auth"

export interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
  allowStatus?: UserStatus[]
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  allowStatus,
}: ProtectedRouteProps) {
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

  // 1. Unauthenticated users are redirected to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const currentStatus = (user.status || "pending").toLowerCase() as UserStatus

  // 2. Suspended users are completely blocked from application & payment; can only view suspension status/logout
  if (currentStatus === "suspended") {
    if (allowStatus?.includes("suspended")) {
      return <>{children}</>
    }
    return <Navigate to="/account-status" replace />
  }

  // 3. PENDING and INACTIVE users can ONLY access logout and payment verification routes
  if (currentStatus === "pending" || currentStatus === "inactive") {
    if (allowStatus && allowStatus.includes(currentStatus)) {
      return <>{children}</>
    }
    return <Navigate to="/payment" replace />
  }

  // 4. ACTIVE users: if on account-status or payment view without explicitly needing it, allow or route to home
  if (allowStatus && !allowStatus.includes("active")) {
    // If route was strictly for pending/suspended and user is now active, redirect home
    return <Navigate to="/" replace />
  }

  // 5. Role-based authorization for ACTIVE users
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
