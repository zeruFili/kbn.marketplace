import { useMemo, useState, useEffect } from "react"
import UserAvatar from "../common/UserAvatar"
import { resolveAssetUrl } from "../../api/baseApi"
import {
  fetchAdminPayments,
  updateAdminPaymentStatus,
  type PaymentItem,
} from "../../api/paymentApi"

function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return String(dateStr)
  }
}

function formatDateOnly(dateStr?: string | Date | null): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return String(dateStr)
  }
}

export default function AdminPayments() {
  const [viewDate, setViewDate] = useState<Date>(() => new Date())
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PaymentItem | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "accepted" | "pending" | "rejected"
  >("all")

  // Current real-world date to enforce the boundary
  const now = useMemo(() => new Date(), [])
  const isCurrentMonth =
    viewDate.getFullYear() === now.getFullYear() &&
    viewDate.getMonth() === now.getMonth()

  const monthLabel = viewDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })

  function goToPreviousMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    if (isCurrentMonth) return
    setViewDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      if (
        next.getFullYear() > now.getFullYear() ||
        (next.getFullYear() === now.getFullYear() &&
          next.getMonth() > now.getMonth())
      ) {
        return prev
      }
      return next
    })
  }

  function goToCurrentMonth() {
    setViewDate(new Date())
  }

  // Fetch payments whenever viewDate changes
  useEffect(() => {
    let active = true
    async function loadPayments() {
      setLoading(true)
      setError(null)
      try {
        const month = viewDate.getMonth() + 1
        const year = viewDate.getFullYear()
        const res = await fetchAdminPayments({ month, year, limit: 100 })
        if (active) {
          if (res && Array.isArray(res.data)) {
            setPayments(res.data)
          } else {
            setPayments([])
          }
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load payments for this month",
          )
          setPayments([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadPayments()
    return () => {
      active = false
    }
  }, [viewDate])

  const filtered = useMemo(() => {
    return payments.filter((item) => {
      if (statusFilter !== "all") {
        const itemStatus = (item.status || "").toLowerCase()
        if (itemStatus !== statusFilter) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const userName = (
          item.user?.full_name ||
          item.user?.name ||
          ""
        ).toLowerCase()
        const ref = (item.reference || "").toLowerCase()
        const provider = (item.provider || "").toLowerCase()
        return userName.includes(q) || ref.includes(q) || provider.includes(q)
      }
      return true
    })
  }, [payments, statusFilter, search])

  // Statistics for the currently viewed month
  const totalCount = payments.length
  const acceptedCount = payments.filter(
    (p) => (p.status || "").toLowerCase() === "accepted",
  ).length
  const pendingCount = payments.filter(
    (p) => (p.status || "").toLowerCase() === "pending",
  ).length
  const rejectedCount = payments.filter(
    (p) => (p.status || "").toLowerCase() === "rejected",
  ).length

  function handleStatusUpdate(updated: PaymentItem) {
    setPayments((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    )
    setSelected(updated)
  }

  if (selected) {
    return (
      <div className="animate-scale-in">
        <PaymentDetail
          payment={selected}
          onBack={() => setSelected(null)}
          onStatusChange={handleStatusUpdate}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Month Navigation Banner */}
      <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)]">
                {monthLabel}
              </h2>
              {isCurrentMonth && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                  Current Month
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Browsing payments created in {monthLabel}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={goToPreviousMonth}
              title="Navigate to previous month"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Previous</span>
            </button>

            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                title="Jump directly to current month"
                className="px-3 py-2 rounded-xl bg-[var(--surface-alt)] hover:bg-[var(--brand)]/10 text-xs font-medium text-[var(--brand)] transition-colors cursor-pointer"
              >
                Current Month
              </button>
            )}

            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              title={
                isCurrentMonth
                  ? "Future months beyond the current month cannot be viewed"
                  : "Navigate to next month"
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                isCurrentMonth
                  ? "border-[var(--border-light)] text-[var(--text-tertiary)] opacity-40 cursor-not-allowed bg-[var(--surface-alt)]"
                  : "border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] cursor-pointer"
              }`}
            >
              <span>Next</span>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: `Total in ${viewDate.toLocaleString("en-US", { month: "short" })}`,
            value: totalCount,
            color: "border-l-[var(--brand)]",
          },
          {
            label: "Accepted",
            value: acceptedCount,
            color: "border-l-emerald-500",
          },
          {
            label: "Pending Review",
            value: pendingCount,
            color: "border-l-amber-500",
          },
          {
            label: "Rejected",
            value: rejectedCount,
            color: "border-l-red-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-[var(--surface)] rounded-xl border border-[var(--border-light)] border-l-4 ${stat.color} p-4`}
          >
            <div className="font-serif text-2xl text-[var(--text-primary)] font-bold">
              {stat.value}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase px-2">
              Status
            </span>
            {(["all", "accepted", "pending", "rejected"] as const).map(
              (opt) => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    statusFilter === opt
                      ? "bg-[var(--brand)] text-white shadow-xs"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {opt}
                </button>
              ),
            )}
          </div>

          <span className="text-xs text-[var(--text-tertiary)] ml-1">
            {filtered.length} {filtered.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="relative w-full sm:w-72">
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
            type="search"
            placeholder="Search by user name or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
        </div>
      </div>

      {/* Payments Table / List */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">
              Loading payments for {monthLabel}...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Failed to load payments
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={() => setViewDate(new Date(viewDate.getTime()))}
              className="mt-4 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--surface-alt)] text-[var(--text-tertiary)] flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="font-serif text-base text-[var(--text-primary)] font-semibold">
              {payments.length === 0
                ? `No payments recorded for ${monthLabel}`
                : "No matching payments found"}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-sm mx-auto">
              {payments.length === 0
                ? "There are no payment submissions or transactions recorded for this month."
                : "Try adjusting your search query or status filter."}
            </p>
            {!isCurrentMonth && payments.length === 0 && (
              <button
                onClick={goToCurrentMonth}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>Jump to Current Month</span>
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-light)] bg-[var(--surface-alt)]">
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 sm:px-5 py-3">
                    User Name
                  </th>
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 sm:px-5 py-3">
                    Payment Status
                  </th>
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 sm:px-5 py-3">
                    Payment Creation Date
                  </th>
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 sm:px-5 py-3 hidden sm:table-cell">
                    Amount
                  </th>
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 sm:px-5 py-3 hidden md:table-cell">
                    Reference / Method
                  </th>
                  <th className="text-right text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 sm:px-5 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {filtered.map((item) => {
                  const userName =
                    item.user?.full_name || item.user?.name || "Unknown User"
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className="hover:bg-[var(--surface-alt)] transition-colors cursor-pointer group"
                    >
                      {/* Per user requirements: Display ONLY the user's name on the main table */}
                      <td className="px-4 sm:px-5 py-3.5">
                        <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
                          {userName}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-xs text-[var(--text-secondary)]">
                        {formatDateTime(item.created_at)}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-sm font-semibold text-[var(--text-primary)] hidden sm:table-cell">
                        {item.amount ? `${item.amount} ETB` : "—"}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-xs text-[var(--text-tertiary)] hidden md:table-cell">
                        {item.provider || item.reference ? (
                          <span className="truncate max-w-xs block">
                            {item.provider ? `${item.provider}` : ""}
                            {item.reference ? ` • ${item.reference}` : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(item)
                          }}
                          className="text-xs font-semibold text-[var(--brand)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>View</span>
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const norm = (status || "").toLowerCase()
  let color = "bg-amber-100 text-amber-700"
  let label = "Pending"

  if (norm === "accepted" || norm === "paid" || norm === "active") {
    color = "bg-emerald-100 text-emerald-700"
    label = "Accepted"
  } else if (
    norm === "rejected" ||
    norm === "declined" ||
    norm === "deactivated"
  ) {
    color = "bg-red-100 text-red-700"
    label = "Rejected"
  } else if (norm === "pending") {
    color = "bg-amber-100 text-amber-700"
    label = "Pending"
  }

  return (
    <span
      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap capitalize inline-flex items-center gap-1.5 ${color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          norm === "accepted" || norm === "paid" || norm === "active"
            ? "bg-emerald-500"
            : norm === "rejected"
              ? "bg-red-500"
              : "bg-amber-500"
        }`}
      />
      {label}
    </span>
  )
}

/**
 * Payment Details Component
 * Displays full user profile details (avatar, name, email, phone, role, status),
 * complete payment metadata, and payment receipt / photo with lightbox zoom.
 */
function PaymentDetail({
  payment,
  onBack,
  onStatusChange,
}: {
  payment: PaymentItem
  onBack: () => void
  onStatusChange: (updated: PaymentItem) => void
}) {
  const [updating, setUpdating] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const user = payment.user
  const userName = user?.full_name || user?.name || "Unknown User"
  const userPhoto = user?.profileImage || user?.avatar
  const receiptUrl = payment.image ? resolveAssetUrl(payment.image) : payment.url

  async function handleSetStatus(newStatus: "accepted" | "pending" | "rejected") {
    setUpdating(true)
    setUpdateError(null)
    try {
      const res = await updateAdminPaymentStatus(payment.id, newStatus)
      if (res) {
        onStatusChange({ ...payment, ...res, status: newStatus })
      } else {
        // Fallback optimistic update
        onStatusChange({ ...payment, status: newStatus })
      }
    } catch (err: unknown) {
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update payment status",
      )
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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
          <span>Back to payments</span>
        </button>

        <StatusBadge status={payment.status} />
      </div>

      {updateError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>{updateError}</span>
          <button
            onClick={() => setUpdateError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* User Profile Card (Shown ONLY when payment is clicked) */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-6 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
          User Profile
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 pb-5 border-b border-[var(--border-light)]">
          <UserAvatar
            src={userPhoto}
            name={userName}
            size="xl"
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl ring-4 ring-[var(--border-light)] shadow-xs flex-shrink-0"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] font-bold truncate">
                {userName}
              </h1>
              {user?.role && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                  {user.role}
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">
              {user?.email || "No email registered"}
            </p>
            {user?.phone && (
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Phone: {user.phone}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <span className="text-[var(--text-tertiary)] block mb-0.5">
              Account Status
            </span>
            <span
              className={`font-semibold ${
                user?.status === "active" || user?.is_active
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {user?.status || (user?.is_active ? "Active" : "Inactive")}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)] block mb-0.5">
              User ID
            </span>
            <span className="font-mono text-[11px] text-[var(--text-secondary)] truncate block" title={payment.user_id}>
              {payment.user_id || "—"}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)] block mb-0.5">
              Role
            </span>
            <span className="capitalize font-medium text-[var(--text-primary)]">
              {user?.role || "Standard User"}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Details Card */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-6 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
          Payment Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoItem label="Payment Status" value={<StatusBadge status={payment.status} />} />
          <InfoItem
            label="Payment Creation Date"
            value={formatDateTime(payment.created_at)}
          />
          <InfoItem
            label="Transaction Date & Time"
            value={
              payment.date || payment.time
                ? `${formatDateOnly(payment.date)} ${payment.time ? `• ${payment.time}` : ""}`
                : "—"
            }
          />
          <InfoItem
            label="Amount"
            value={
              payment.amount ? (
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {payment.amount} ETB
                </span>
              ) : (
                "—"
              )
            }
          />
          <InfoItem
            label="Provider / Gateway"
            value={payment.provider || "Manual / Bank Transfer"}
          />
          <InfoItem
            label="Transaction Reference"
            value={
              payment.reference ? (
                <span className="font-mono text-xs bg-[var(--surface-alt)] px-2 py-1 rounded-md border border-[var(--border-light)]">
                  {payment.reference}
                </span>
              ) : (
                "—"
              )
            }
          />
          <InfoItem
            label="Expiration Date"
            value={formatDateOnly(payment.expirationDate || payment.expiration_date)}
          />
          <InfoItem
            label="Subscription Validity"
            value={
              payment.isExpired
                ? "Expired"
                : payment.isValid
                  ? "Active & Valid"
                  : "Pending Approval"
            }
          />
          <div className="sm:col-span-2">
            <InfoItem
              label="Payment ID"
              value={
                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                  {payment.id}
                </span>
              }
            />
          </div>
        </div>
      </div>

      {/* Uploaded Payment Receipt / Photo Card */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Payment Receipt / Uploaded Photo
          </h2>
          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--brand)] hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Open in new tab</span>
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>

        {receiptUrl ? (
          <div className="space-y-3">
            <div
              onClick={() => setLightboxOpen(true)}
              className="relative group rounded-xl border border-[var(--border-light)] overflow-hidden bg-[var(--surface-alt)] cursor-pointer max-w-md mx-auto aspect-4/3 flex items-center justify-center shadow-xs"
            >
              <img
                src={receiptUrl}
                alt="Payment receipt"
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-medium text-xs">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
                <span>Click to expand receipt</span>
              </div>
            </div>
            <p className="text-center text-xs text-[var(--text-tertiary)]">
              Click receipt image to inspect full size
            </p>
          </div>
        ) : (
          <div className="py-10 text-center rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--surface-alt)]">
            <svg
              className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              No receipt image uploaded
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              This payment transaction was recorded without an uploaded attachment.
            </p>
          </div>
        )}
      </div>

      {/* Admin Status Actions */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-6 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
          Update Payment Status
        </h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Approving this payment will mark the user&apos;s subscription as valid and activate their account.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleSetStatus("accepted")}
            disabled={updating || (payment.status || "").toLowerCase() === "accepted"}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              (payment.status || "").toLowerCase() === "accepted"
                ? "bg-emerald-600 text-white opacity-80 cursor-default"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
            }`}
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{(payment.status || "").toLowerCase() === "accepted" ? "Accepted" : "Mark as Accepted"}</span>
          </button>

          <button
            onClick={() => handleSetStatus("pending")}
            disabled={updating || (payment.status || "").toLowerCase() === "pending"}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              (payment.status || "").toLowerCase() === "pending"
                ? "bg-amber-500 text-white opacity-80 cursor-default"
                : "border border-amber-300 text-amber-700 hover:bg-amber-50"
            }`}
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Set Pending</span>
          </button>

          <button
            onClick={() => handleSetStatus("rejected")}
            disabled={updating || (payment.status || "").toLowerCase() === "rejected"}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              (payment.status || "").toLowerCase() === "rejected"
                ? "bg-red-600 text-white opacity-80 cursor-default"
                : "border border-red-300 text-red-600 hover:bg-red-50"
            }`}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Reject Payment</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Receipt Full View */}
      {lightboxOpen && receiptUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 flex items-center gap-3">
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/80 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                Open in new tab
              </a>
              <button
                onClick={() => setLightboxOpen(false)}
                className="text-white/80 hover:text-white w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg font-bold transition-colors cursor-pointer"
                title="Close receipt preview"
              >
                ✕
              </button>
            </div>
            <img
              src={receiptUrl}
              alt="Payment receipt enlarged"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <span className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
        {label}
      </span>
      <div className="text-sm font-medium text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  )
}
