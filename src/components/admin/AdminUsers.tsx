import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  fetchAdminUsersApi,
  updateUserStatusApi,
  updateUserRoleApi,
  deleteUserApi,
  type UserProfileResponse,
} from "../../api/userApi"
import UserAvatar from "../common/UserAvatar"

export default function AdminUsers() {
  const navigate = useNavigate()

  // Data & State
  const [users, setUsers] = useState<UserProfileResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Metrics (counts from live database)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactiveOrSuspended: 0,
    company: 0,
  })

  // Action Modals State
  const [statusModalUser, setStatusModalUser] = useState<UserProfileResponse | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>("active")
  const [roleModalUser, setRoleModalUser] = useState<UserProfileResponse | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("user")
  const [deleteModalUser, setDeleteModalUser] = useState<UserProfileResponse | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Clear toast notifications automatically
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  // Fetch users from backend API
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetchAdminUsersApi({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (res.success) {
        setUsers(res.data)
        const metaTotal = res.meta?.total ?? res.data.length
        setTotalUsers(metaTotal)
        const calculatedPages = Math.ceil(metaTotal / limit) || 1
        setTotalPages(res.meta?.totalPages ?? calculatedPages)
      } else {
        setError("Failed to retrieve users from server.")
      }
    } catch (err: any) {
      console.error("Failed to load admin users:", err)
      setError(
        err?.message || "An error occurred while loading users. Please verify your connection."
      )
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder])

  // Fetch summary counts for the stat badges
  const loadStats = useCallback(async () => {
    try {
      const [allRes, activeRes, pendingRes, compRes] = await Promise.all([
        fetchAdminUsersApi({ limit: 1 }),
        fetchAdminUsersApi({ status: "active", limit: 1 }),
        fetchAdminUsersApi({ status: "pending", limit: 1 }),
        fetchAdminUsersApi({ role: "company", limit: 1 }),
      ])

      const total = allRes.meta?.total ?? 0
      const active = activeRes.meta?.total ?? 0
      const pending = pendingRes.meta?.total ?? 0
      const company = compRes.meta?.total ?? 0
      const inactiveOrSuspended = Math.max(0, total - active - pending)

      setStats({
        total,
        active,
        pending,
        inactiveOrSuspended,
        company,
      })
    } catch {
      // Non-fatal if stats fail
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Action Handlers
  const handleOpenStatusModal = (u: UserProfileResponse) => {
    setStatusModalUser(u)
    setSelectedStatus(u.status?.toLowerCase() || "active")
    setActionError(null)
  }

  const handleUpdateStatus = async () => {
    if (!statusModalUser) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await updateUserStatusApi(statusModalUser.id, selectedStatus)
      if (res.success) {
        setSuccessMessage(`User status updated to ${selectedStatus.toUpperCase()}.`)
        setStatusModalUser(null)
        loadUsers()
        loadStats()
      } else {
        setActionError(res.message || "Failed to update user status.")
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to update user status.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenRoleModal = (u: UserProfileResponse) => {
    setRoleModalUser(u)
    setSelectedRole(u.role?.toLowerCase() || "user")
    setActionError(null)
  }

  const handleUpdateRole = async () => {
    if (!roleModalUser) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await updateUserRoleApi(roleModalUser.id, selectedRole)
      if (res.success) {
        setSuccessMessage(`User role updated to ${selectedRole.toUpperCase()}.`)
        setRoleModalUser(null)
        loadUsers()
        loadStats()
      } else {
        setActionError(res.message || "Failed to update user role.")
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to update user role.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenDeleteModal = (u: UserProfileResponse) => {
    setDeleteModalUser(u)
    setActionError(null)
  }

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await deleteUserApi(deleteModalUser.id)
      if (res.success) {
        setSuccessMessage("User deactivated / removed successfully.")
        setDeleteModalUser(null)
        loadUsers()
        loadStats()
      } else {
        setActionError(res.message || "Failed to delete user.")
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to delete user.")
    } finally {
      setActionLoading(false)
    }
  }

  // Visual Badges
  const roleBadge = (role?: string) => {
    const r = (role || "user").toLowerCase()
    const styles: Record<string, string> = {
      admin: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
      user: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      company: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      church: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      ministry: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    }
    return (
      <span
        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
          styles[r] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
        }`}
      >
        {r}
      </span>
    )
  }

  const statusBadge = (status?: string, isActive?: boolean) => {
    const s = (status || (isActive ? "active" : "inactive")).toLowerCase()
    let style = "bg-gray-100 text-gray-700"
    if (s === "active") {
      style = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    } else if (s === "pending") {
      style = "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
    } else if (s === "suspended") {
      style = "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
    } else if (s === "inactive" || s === "deactivated") {
      style = "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
    }

    return (
      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${style}`}>
        {s}
      </span>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
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
            className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: stats.total || totalUsers,
            color: "border-l-[var(--brand)]",
          },
          { label: "Active Users", value: stats.active, color: "border-l-emerald-500" },
          { label: "Pending Users", value: stats.pending, color: "border-l-amber-500" },
          {
            label: "Company Users",
            value: stats.company,
            color: "border-l-blue-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-[var(--surface)] rounded-xl border border-[var(--border-light)] border-l-4 ${s.color} p-4 shadow-xs`}
          >
            <div className="font-serif text-2xl text-[var(--text-primary)] font-bold">
              {s.value}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Role & Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1">
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] px-2">Role:</span>
            {["all", "user", "company", "church", "ministry", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRoleFilter(r)
                  setPage(1)
                }}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  roleFilter === r
                    ? "bg-[var(--brand)] text-white shadow-xs"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1">
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] px-2">Status:</span>
            {["all", "active", "pending", "inactive", "suspended"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s)
                  setPage(1)
                }}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-[var(--brand)] text-white shadow-xs"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Sort Selector */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-")
              setSortBy(sb)
              setSortOrder(so as "ASC" | "DESC")
              setPage(1)
            }}
            className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
          >
            <option value="created_at-DESC">Newest First</option>
            <option value="created_at-ASC">Oldest First</option>
            <option value="full_name-ASC">Name (A-Z)</option>
            <option value="full_name-DESC">Name (Z-A)</option>
            <option value="role-ASC">Role (A-Z)</option>
            <option value="status-ASC">Status</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
        </div>
      </div>

      {/* Users Table / Content Card */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[var(--text-tertiary)] font-medium">
              Fetching users from database...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center max-w-md mx-auto px-4">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-sm font-semibold text-red-600 mb-2">{error}</p>
            <button
              onClick={loadUsers}
              className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand-light)] transition-colors cursor-pointer mt-2"
            >
              Retry Loading Users
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-light)] bg-[var(--surface-alt)]">
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 sm:px-6 py-3.5">
                      User Profile
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5">
                      Role
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">
                      Contact Info
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">
                      Registered Date
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5">
                      Status
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 sm:px-6 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {users.map((u) => {
                    const userName = u.fullName || u.full_name || u.name || "Unnamed User"
                    const userAvatar = u.profileImage || u.profile_image || u.avatar
                    const regDate = u.created_at || u.createdAt || u.registeredAt

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-[var(--surface-alt)]/60 transition-colors group"
                      >
                        {/* Profile Info */}
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => navigate(`/admin/users/${u.id}`)}
                              className="cursor-pointer shrink-0"
                            >
                              <UserAvatar
                                src={userAvatar}
                                name={userName}
                                size="sm"
                                className="w-10 h-10 rounded-xl ring-2 ring-[var(--border-light)]"
                              />
                            </button>
                            <div className="min-w-0">
                              <button
                                onClick={() => navigate(`/admin/users/${u.id}`)}
                                className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors truncate block text-left cursor-pointer"
                              >
                                {userName}
                              </button>
                              <div className="text-[11px] text-[var(--text-tertiary)] font-mono truncate">
                                ID: {u.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4">{roleBadge(u.role)}</td>

                        {/* Contact Info */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="text-xs text-[var(--text-primary)] truncate font-medium">
                            {u.email}
                          </div>
                          {u.phone && (
                            <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                              📞 {u.phone}
                            </div>
                          )}
                        </td>

                        {/* Registration Date */}
                        <td className="px-4 py-4 text-xs text-[var(--text-tertiary)] hidden lg:table-cell">
                          {regDate
                            ? new Date(regDate).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-4">
                          {statusBadge(u.status, u.is_active)}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Details */}
                            <button
                              onClick={() => navigate(`/admin/users/${u.id}`)}
                              className="text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                              title="View complete user details"
                            >
                              View
                            </button>

                            {/* Edit Profile */}
                            <button
                              onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                              className="text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer hidden sm:inline-block"
                              title="Edit user profile"
                            >
                              Edit
                            </button>

                            {/* Status Quick Toggle */}
                            <button
                              onClick={() => handleOpenStatusModal(u)}
                              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Change user account status"
                            >
                              Status
                            </button>

                            {/* Role Quick Toggle */}
                            <button
                              onClick={() => handleOpenRoleModal(u)}
                              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer hidden md:inline-block"
                              title="Change user role"
                            >
                              Role
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => handleOpenDeleteModal(u)}
                              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Deactivate / Delete user"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {users.length === 0 && (
              <div className="text-center py-20 px-4">
                <div className="text-3xl mb-3">👤</div>
                <h3 className="font-serif text-lg text-[var(--text-primary)] mb-1">
                  No Users Found
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto mb-4">
                  There are no user records matching your current filter criteria in the database.
                </p>
                {(search || roleFilter !== "all" || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearch("")
                      setRoleFilter("all")
                      setStatusFilter("all")
                      setPage(1)
                    }}
                    className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalUsers > 0 && (
              <div className="px-4 sm:px-6 py-4 border-t border-[var(--border-light)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-tertiary)]">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {Math.min((page - 1) * limit + 1, totalUsers)} to{" "}
                    {Math.min(page * limit, totalUsers)} of {totalUsers} users
                  </span>
                  <span className="text-[var(--border-default)]">•</span>
                  <label htmlFor="limit-select" className="sr-only">Rows per page</label>
                  <select
                    id="limit-select"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value))
                      setPage(1)
                    }}
                    className="bg-transparent border border-[var(--border-default)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Change Status Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              Update Account Status
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Change the status of user{" "}
              <strong className="text-[var(--text-primary)]">
                {statusModalUser.fullName || statusModalUser.full_name || statusModalUser.email}
              </strong>
              .
            </p>

            {actionError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {actionError}
              </div>
            )}

            <div className="space-y-2 mb-6">
              {[
                {
                  id: "active",
                  title: "Active",
                  desc: "User can log in and access all authorized features.",
                },
                {
                  id: "pending",
                  title: "Pending",
                  desc: "User registration or payment is awaiting verification.",
                },
                {
                  id: "inactive",
                  title: "Inactive / Deactivated",
                  desc: "User cannot access protected community areas.",
                },
                {
                  id: "suspended",
                  title: "Suspended",
                  desc: "User is temporarily suspended due to review violations.",
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedStatus === opt.id
                      ? "border-[var(--brand)] bg-[var(--brand)]/5"
                      : "border-[var(--border-light)] hover:bg-[var(--surface-alt)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="account-status"
                    value={opt.id}
                    checked={selectedStatus === opt.id}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {opt.title}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {actionLoading ? "Updating..." : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              Update User Role
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Assign a new role to user{" "}
              <strong className="text-[var(--text-primary)]">
                {roleModalUser.fullName || roleModalUser.full_name || roleModalUser.email}
              </strong>
              .
            </p>

            {actionError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {actionError}
              </div>
            )}

            <div className="space-y-2 mb-6">
              {[
                { id: "user", label: "User (Individual Community Member)" },
                { id: "company", label: "Company (Business Owner)" },
                { id: "church", label: "Church" },
                { id: "ministry", label: "Ministry" },
                { id: "admin", label: "Administrator" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === opt.id
                      ? "border-[var(--brand)] bg-[var(--brand)]/5"
                      : "border-[var(--border-light)] hover:bg-[var(--surface-alt)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="user-role"
                    value={opt.id}
                    checked={selectedRole === opt.id}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {actionLoading ? "Updating..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-red-200 dark:border-red-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center text-xl mb-4">
              ⚠️
            </div>
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              Confirm User Removal
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Are you sure you want to delete / deactivate the account for{" "}
              <strong className="text-[var(--text-primary)]">
                {deleteModalUser.fullName || deleteModalUser.full_name || deleteModalUser.email}
              </strong>
              ? This will mark the account as inactive and revoke access.
            </p>

            {actionError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {actionLoading ? "Removing..." : "Yes, Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
