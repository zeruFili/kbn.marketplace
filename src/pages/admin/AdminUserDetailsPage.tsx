import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  getAdminUserById,
  deactivateUser,
  reactivateUser,
  adminSubscribe,
  type AdminUser,
} from "../../data/adminStore"
import UserAvatar from "../../components/common/UserAvatar"

export default function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | undefined>(() =>
    id ? getAdminUserById(id) : undefined,
  )
  const [reason, setReason] = useState("")
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false)

  useEffect(() => {
    if (!id) return
    const refresh = () => {
      setUser(getAdminUserById(id))
    }
    refresh()
    return adminSubscribe(refresh)
  }, [id])

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8 text-center animate-fade-in">
        <div className="text-3xl mb-3">👤</div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          User Not Found
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          Could not find a user with ID "{id}".
        </p>
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
        >
          ← Back to Users
        </button>
      </div>
    )
  }

  const deactivatedDuration = user.deactivatedAt
    ? (() => {
        const diff = Date.now() - new Date(user.deactivatedAt).getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        if (days < 1) return "Today"
        if (days === 1) return "1 day"
        if (days < 30) return `${days} days`
        const months = Math.floor(days / 30)
        return months === 1 ? "1 month" : `${months} months`
      })()
    : null

  const handleDeactivate = (deactivationReason: string) => {
    deactivateUser(user.id, deactivationReason)
    setShowConfirmDeactivate(false)
    setReason("")
  }

  const handleReactivate = () => {
    reactivateUser(user.id)
  }

  return (
    <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden animate-scale-in">
      <div className="bg-[var(--brand-dark)] px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to users
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit User
          </button>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              user.status === "active"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {user.status}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex items-center gap-4 sm:gap-5 mb-8">
          <UserAvatar
            src={user.profileImage || user.avatar}
            name={user.name}
            size="lg"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-3 ring-[var(--border-light)]"
          />
          <div>
            <h1 className="font-serif text-2xl text-[var(--text-primary)]">
              {user.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  user.role === "admin"
                    ? "bg-red-100 text-red-700"
                    : user.role === "company"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {user.role}
              </span>
              {user.business && (
                <span className="text-sm text-[var(--text-tertiary)]">
                  {user.business}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Email
            </label>
            <p className="text-sm text-[var(--text-primary)]">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Registered
            </label>
            <p className="text-sm text-[var(--text-primary)]">
              {new Date(user.registeredAt).toLocaleDateString()}
            </p>
          </div>
          {user.deactivatedAt && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Deactivated
                </label>
                <p className="text-sm text-red-600">
                  {new Date(user.deactivatedAt).toLocaleDateString()} (
                  {deactivatedDuration})
                </p>
              </div>
              {user.deactivationReason && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    Reason
                  </label>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {user.deactivationReason}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {user.status === "active" ? (
          <div className="border-t border-[var(--border-light)] pt-6">
            {!showConfirmDeactivate ? (
              <button
                onClick={() => setShowConfirmDeactivate(true)}
                className="border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              >
                Deactivate User
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-red-700">
                  Confirm Deactivation
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for deactivation (e.g., posting inappropriate or misleading reviews)"
                  rows={3}
                  className="w-full bg-white border border-red-200 rounded-xl py-2 px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleDeactivate(
                        reason || "Violation of community guidelines",
                      )
                    }
                    disabled={!reason.trim()}
                    className="bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Confirm Deactivate
                  </button>
                  <button
                    onClick={() => setShowConfirmDeactivate(false)}
                    className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-[var(--border-light)] pt-6">
            <button
              onClick={handleReactivate}
              className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Reactivate User
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
