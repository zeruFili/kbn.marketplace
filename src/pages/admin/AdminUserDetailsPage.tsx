import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  fetchAdminUserById,
  updateUserStatusApi,
  updateUserRoleApi,
  deleteUserApi,
  type UserProfileResponse,
} from "../../api/userApi"
import { fetchUserPayments, type PaymentItem } from "../../api/paymentApi"
import { fetchCompanies, type Company } from "../../api/companyApi"
import UserAvatar from "../../components/common/UserAvatar"
import { resolveAssetUrl } from "../../api/baseApi"

export default function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // User state
  const [user, setUser] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Payments & Companies state
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [userCompanies, setUserCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // Modals & Action states
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState<string>("active")
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [targetRole, setTargetRole] = useState<string>("user")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Clear toast
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  // Fetch complete user details
  const loadUserDetails = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    try {
      const data = await fetchAdminUserById(id)
      if (data) {
        setUser(data)
        setTargetStatus(data.status?.toLowerCase() || "active")
        setTargetRole(data.role?.toLowerCase() || "user")
      } else {
        setError(`User with ID "${id}" could not be found.`)
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load user details from server.")
    } finally {
      setLoading(false)
    }
  }, [id])

  // Fetch payment history
  const loadUserPayments = useCallback(async () => {
    if (!id) return
    setLoadingPayments(true)
    try {
      const pms = await fetchUserPayments(id)
      setPayments(Array.isArray(pms) ? pms : [])
    } catch {
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }, [id])

  // Fetch associated companies
  const loadUserCompanies = useCallback(async () => {
    if (!id) return
    setLoadingCompanies(true)
    try {
      const allCompanies = await fetchCompanies()
      // Filter companies owned or created by this user
      const filtered = (allCompanies || []).filter(
        (c: any) =>
          c.created_by === id ||
          c.ownerId === id ||
          c.userId === id ||
          (user?.email && c.email?.toLowerCase() === user.email.toLowerCase())
      )
      setUserCompanies(filtered)
    } catch {
      setUserCompanies([])
    } finally {
      setLoadingCompanies(false)
    }
  }, [id, user?.email])

  useEffect(() => {
    loadUserDetails()
    loadUserPayments()
  }, [loadUserDetails, loadUserPayments])

  useEffect(() => {
    if (user) {
      loadUserCompanies()
    }
  }, [user, loadUserCompanies])

  // Copy ID Helper
  const handleCopyId = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  // Action: Update Status
  const handleUpdateStatus = async (status: string) => {
    if (!user?.id) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await updateUserStatusApi(user.id, status)
      if (res.success) {
        setSuccessMessage(`Account status successfully updated to ${status.toUpperCase()}.`)
        setShowStatusModal(false)
        await loadUserDetails()
      } else {
        setActionError(res.message || "Failed to update account status.")
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to update account status.")
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Update Role
  const handleUpdateRole = async () => {
    if (!user?.id) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await updateUserRoleApi(user.id, targetRole)
      if (res.success) {
        setSuccessMessage(`User role successfully changed to ${targetRole.toUpperCase()}.`)
        setShowRoleModal(false)
        await loadUserDetails()
      } else {
        setActionError(res.message || "Failed to update user role.")
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to update user role.")
    } finally {
      setActionLoading(false)
    }
  }

  // Action: Delete User
  const handleDeleteUser = async () => {
    if (!user?.id) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await deleteUserApi(user.id)
      if (res.success) {
        setSuccessMessage("User account has been deactivated / removed successfully.")
        setShowDeleteModal(false)
        await loadUserDetails()
      } else {
        setActionError(res.message || "Failed to delete user.")
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to delete user.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center animate-fade-in">
        <div className="w-12 h-12 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-[var(--text-tertiary)]">
          Retrieving user details from database...
        </p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8 text-center animate-fade-in">
        <div className="text-4xl mb-3">👤</div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          User Record Not Found
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          {error || `No user found in the database with ID "${id}".`}
        </p>
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer shadow-xs"
        >
          ← Back to Users List
        </button>
      </div>
    )
  }

  const userName = user.fullName || user.full_name || user.name || "Unnamed User"
  const userAvatar = user.profileImage || user.profile_image || user.avatar
  const regDate = user.created_at || user.createdAt || user.registeredAt
  const updateDate = user.updated_at || user.updatedAt
  const userStatus = (user.status || (user.is_active ? "active" : "inactive")).toLowerCase()

  const achievementsList = user.achievement
    ? user.achievement
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navigation & Action Banner */}
      <div className="bg-[var(--brand-dark)] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center gap-2 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider mb-4 transition-colors cursor-pointer"
          >
            <span aria-hidden="true">←</span> Back to Users List
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-bold">
              {userName}
            </h1>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
                userStatus === "active"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : userStatus === "pending"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  : "bg-red-500/20 text-red-300 border border-red-400/30"
              }`}
            >
              {userStatus}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white capitalize border border-white/10">
              Role: {user.role || "user"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-white/60 font-mono">
            <span>ID: {user.id}</span>
            <button
              onClick={handleCopyId}
              className="text-white/80 hover:text-white transition-colors cursor-pointer text-[10px] underline"
            >
              {copiedId ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit User
          </button>

          <button
            onClick={() => {
              setTargetStatus(userStatus)
              setShowStatusModal(true)
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 transition-all cursor-pointer shadow-xs"
          >
            Change Status
          </button>

          <button
            onClick={() => {
              setTargetRole(user.role?.toLowerCase() || "user")
              setShowRoleModal(true)
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 transition-all cursor-pointer shadow-xs"
          >
            Change Role
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 transition-all cursor-pointer shadow-xs"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Profile & Contact Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Account Metadata */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 space-y-6 shadow-xs">
          <div className="text-center">
            <UserAvatar
              src={userAvatar}
              name={userName}
              size="xl"
              className="w-24 h-24 rounded-2xl mx-auto ring-4 ring-[var(--border-light)] mb-4"
            />
            <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">
              {userName}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{user.email}</p>
          </div>

          <div className="border-t border-[var(--border-light)] pt-5 space-y-4 text-xs">
            <div>
              <span className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Account Status
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    userStatus === "active" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span className="font-medium text-[var(--text-primary)] capitalize">
                  {userStatus} ({user.is_active ? "Active" : "Disabled"})
                </span>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Registration Date
              </span>
              <span className="font-medium text-[var(--text-primary)]">
                {regDate ? new Date(regDate).toLocaleString() : "Not recorded"}
              </span>
            </div>

            {updateDate && (
              <div>
                <span className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Last Updated
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {new Date(updateDate).toLocaleString()}
                </span>
              </div>
            )}

            {user.last_login_at && (
              <div>
                <span className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Last Login
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {new Date(user.last_login_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact Details, Education, Achievements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details Card */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 shadow-xs">
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
              Contact & Web Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold mb-1">
                  Email Address
                </div>
                <a
                  href={`mailto:${user.email}`}
                  className="text-sm font-semibold text-[var(--brand)] hover:underline truncate block"
                >
                  {user.email}
                </a>
              </div>

              <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold mb-1">
                  Phone Number
                </div>
                {user.phone ? (
                  <a
                    href={`tel:${user.phone}`}
                    className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors block"
                  >
                    📞 {user.phone}
                  </a>
                ) : (
                  <span className="text-sm text-[var(--text-tertiary)]">Not provided</span>
                )}
              </div>

              <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)] sm:col-span-2">
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold mb-1">
                  Website / Portfolio
                </div>
                {user.website ? (
                  <a
                    href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[var(--brand)] hover:underline truncate block"
                  >
                    🌐 {user.website}
                  </a>
                ) : (
                  <span className="text-sm text-[var(--text-tertiary)]">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Professional Background Card */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 shadow-xs space-y-5">
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Professional Background & Education
            </h3>

            <div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold mb-1">
                Professional Experience
              </div>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                {user.professional_experience ||
                  user.professionalExperience ||
                  "No professional experience details recorded."}
              </p>
            </div>

            <div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold mb-1">
                Education
              </div>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                {user.education || "No education information provided."}
              </p>
            </div>

            {achievementsList.length > 0 && (
              <div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold mb-2">
                  Key Achievements
                </div>
                <div className="flex flex-wrap gap-2">
                  {achievementsList.map((ach, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--surface-alt)] border border-[var(--border-light)] text-[var(--text-primary)]"
                    >
                      🏆 {ach}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Relevant Payment History Section */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">
              Payment History
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Live transaction records and membership receipts from database
            </p>
          </div>
          <button
            onClick={loadUserPayments}
            className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
          >
            Refresh Payments
          </button>
        </div>

        {loadingPayments ? (
          <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
            Loading payment records...
          </div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-light)] bg-[var(--surface-alt)]">
                  <th className="py-2.5 px-4 font-semibold text-[var(--text-tertiary)] uppercase text-[10px]">
                    Date / Time
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[var(--text-tertiary)] uppercase text-[10px]">
                    Amount
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[var(--text-tertiary)] uppercase text-[10px]">
                    Gateway / Provider
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[var(--text-tertiary)] uppercase text-[10px]">
                    Reference
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[var(--text-tertiary)] uppercase text-[10px]">
                    Status
                  </th>
                  <th className="py-2.5 px-4 font-semibold text-[var(--text-tertiary)] uppercase text-[10px] text-right">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {payments.map((p) => {
                  const pStatus = (p.status || "pending").toLowerCase()
                  const statusColor =
                    pStatus === "accepted"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : pStatus === "rejected"
                      ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"

                  const receiptUrl = p.image || p.url

                  return (
                    <tr key={p.id} className="hover:bg-[var(--surface-alt)]/50 transition-colors">
                      <td className="py-3 px-4 text-[var(--text-primary)]">
                        {p.date ? new Date(p.date).toLocaleDateString() : p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A"}
                        {p.time && <span className="text-[var(--text-tertiary)] ml-1">({p.time})</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                        {p.amount ? `$${Number(p.amount).toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-4 capitalize text-[var(--text-secondary)]">
                        {p.provider || "Standard"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-tertiary)]">
                        {p.reference || p.id.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${statusColor}`}>
                          {pStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {receiptUrl ? (
                          <a
                            href={resolveAssetUrl(receiptUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[var(--brand)] hover:underline"
                          >
                            View Receipt ↗
                          </a>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[var(--text-tertiary)] bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)]">
            💳 No payment history records found for this user in the database.
          </div>
        )}
      </div>

      {/* Associated Companies Section (if applicable) */}
      {userCompanies.length > 0 && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-[var(--text-primary)]">
            Associated Businesses / Companies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userCompanies.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/admin/companies/${c.id}`)}
                className="p-4 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-light)] hover:border-[var(--brand)] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                    {c.name || (c as any).company_name}
                  </h4>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {(c as any).phone_number || c.phone || c.email}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--brand)]">
                  View Company →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Change Status */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              Update Account Status
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Select a new status for <strong>{userName}</strong>.
            </p>

            {actionError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {actionError}
              </div>
            )}

            <div className="space-y-2 mb-6">
              {[
                { id: "active", label: "Active", desc: "Full access to platform." },
                { id: "pending", label: "Pending", desc: "Awaiting admin or payment verification." },
                { id: "inactive", label: "Inactive / Deactivated", desc: "Suspended or deactivated." },
                { id: "suspended", label: "Suspended", desc: "Access revoked due to policy violation." },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    targetStatus === opt.id
                      ? "border-[var(--brand)] bg-[var(--brand)]/5"
                      : "border-[var(--border-light)] hover:bg-[var(--surface-alt)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="modal-status"
                    value={opt.id}
                    checked={targetStatus === opt.id}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{opt.label}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(targetStatus)}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {actionLoading ? "Updating..." : "Confirm Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Role */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              Update User Role
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Change the account permissions and role for <strong>{userName}</strong>.
            </p>

            {actionError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {actionError}
              </div>
            )}

            <div className="space-y-2 mb-6">
              {[
                { id: "user", label: "User (Individual Member)" },
                { id: "company", label: "Company (Business Owner)" },
                { id: "church", label: "Church" },
                { id: "ministry", label: "Ministry" },
                { id: "admin", label: "Administrator" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    targetRole === opt.id
                      ? "border-[var(--brand)] bg-[var(--brand)]/5"
                      : "border-[var(--border-light)] hover:bg-[var(--surface-alt)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="modal-role"
                    value={opt.id}
                    checked={targetRole === opt.id}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {actionLoading ? "Updating..." : "Confirm Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-red-200 dark:border-red-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center text-xl mb-4">
              ⚠️
            </div>
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Are you sure you want to deactivate and remove <strong>{userName}</strong>? This user will no longer be able to log in or access protected membership services.
            </p>

            {actionError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {actionLoading ? "Deleting..." : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
