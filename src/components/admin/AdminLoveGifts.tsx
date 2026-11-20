import { useState, useEffect, useMemo } from "react"
import UserAvatar from "../common/UserAvatar"
import { resolveAssetUrl } from "../../api/baseApi"
import {
  fetchAdminLoveGifts,
  updateAdminLoveGiftStatus,
  type LoveGiftItem,
  type AdminLoveGiftResponse,
} from "../../api/loveGiftApi"

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

export default function AdminLoveGifts() {
  const [gifts, setGifts] = useState<LoveGiftItem[]>([])
  const [stats, setStats] = useState<AdminLoveGiftResponse["statistics"]>({
    totalApprovedAmount: 0,
    totalCount: 0,
    acceptedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "accepted" | "pending" | "rejected">("all")
  const [search, setSearch] = useState("")
  const [selectedGift, setSelectedGift] = useState<LoveGiftItem | null>(null)
  const [updating, setUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadGifts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminLoveGifts({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.trim() || undefined,
        limit: 100,
      })
      setGifts(res.data || [])
      if (res.statistics) {
        setStats(res.statistics)
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load love gifts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGifts()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadGifts()
  }

  const handleOpenReview = (gift: LoveGiftItem) => {
    setSelectedGift(gift)
    setAdminNotes(gift.adminNotes || "")
    setFeedback(null)
  }

  const handleUpdateStatus = async (newStatus: "accepted" | "rejected") => {
    if (!selectedGift) return
    setUpdating(true)
    setFeedback(null)
    try {
      const updated = await updateAdminLoveGiftStatus(selectedGift.id, newStatus, adminNotes)
      setGifts((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
      setSelectedGift(updated)
      setFeedback(`Love Gift successfully marked as ${newStatus === "accepted" ? "Approved" : "Rejected"}`)

      // Refresh overall stats
      fetchAdminLoveGifts({ limit: 1 }).then((res) => {
        if (res.statistics) setStats(res.statistics)
      })
    } catch (err: any) {
      setFeedback(err?.message || "Failed to update gift status")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-light)] pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--brand)]/10 text-[var(--brand)] mb-2">
              <span>❤️</span> Voluntary Contributions
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Love Gifts Management
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Review and verify voluntary love gifts submitted by visitors and community members.
            </p>
          </div>

          <button
            type="button"
            onClick={loadGifts}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-alt)] hover:bg-[var(--border-light)] text-[var(--text-primary)] transition-colors cursor-pointer border border-[var(--border-default)] self-start sm:self-auto"
          >
            <span>↻ Refresh</span>
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Approved Amount */}
          <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] border-l-4 border-l-emerald-500 p-5">
            <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
              Total Received (Approved)
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              ETB {(stats.totalApprovedAmount || 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-[var(--text-tertiary)] mt-1 block">
              From {stats.acceptedCount || 0} approved gifts
            </span>
          </div>

          {/* Total Submissions */}
          <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] border-l-4 border-l-[var(--brand)] p-5">
            <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
              Total Submissions
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-1">
              {stats.totalCount || 0}
            </div>
            <span className="text-[11px] text-[var(--text-tertiary)] mt-1 block">
              All gifts received
            </span>
          </div>

          {/* Pending Review */}
          <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] border-l-4 border-l-amber-500 p-5">
            <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
              Pending Review
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-black text-amber-600 mt-1">
              {stats.pendingCount || 0}
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-1 block">
              Requires administrative review
            </span>
          </div>

          {/* Rejected */}
          <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] border-l-4 border-l-red-500 p-5">
            <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
              Rejected
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-black text-red-600 mt-1">
              {stats.rejectedCount || 0}
            </div>
            <span className="text-[11px] text-red-600 font-medium mt-1 block">
              Mismatch or duplicate receipts
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[var(--border-light)] shadow-xs overflow-x-auto">
          {(
            [
              { id: "all", label: "All Gifts" },
              { id: "pending", label: "Pending" },
              { id: "accepted", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[var(--brand)] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donor, email, ref..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
          <svg
            className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>
      </div>

      {/* Gifts Data Table */}
      <div className="bg-white rounded-3xl border border-[var(--border-light)] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[var(--text-tertiary)]">Loading gifts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-600 bg-red-50">{error}</div>
        ) : gifts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center text-xl mx-auto text-[var(--text-tertiary)]">
              ❤️
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">No Love Gifts Found</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              No voluntary gifts match your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-alt)] border-b border-[var(--border-light)] text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Donor Information</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Reference / Bank</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]/60">
                {gifts.map((item) => {
                  const statusNormalized = (item.status || "pending").toLowerCase()
                  const isAccepted = statusNormalized === "accepted"
                  const isRejected = statusNormalized === "rejected"

                  return (
                    <tr key={item.id} className="hover:bg-[var(--surface-alt)]/50 transition-colors">
                      {/* Donor Information */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={item.user?.avatar}
                            name={item.isAnonymous ? "A" : item.donorName || item.user?.name || "Guest"}
                            size="sm"
                            className="w-9 h-9 rounded-xl flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
                              {item.isAnonymous
                                ? "Anonymous Donor"
                                : item.donorName || item.user?.name || "Visitor"}
                            </p>
                            <p className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[180px]">
                              {item.isAnonymous
                                ? "Identity Hidden"
                                : item.donorEmail || item.user?.email || "No email provided"}
                            </p>
                          </div>
                          {item.user_id && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-[var(--brand)]/10 text-[var(--brand)]">
                              Member
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gift Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-serif font-black text-sm text-[var(--brand)]">
                          ETB {Number(item.amount).toLocaleString()}
                        </span>
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[var(--text-primary)]">
                          {formatDateTime(item.date || item.created_at)}
                        </div>
                      </td>

                      {/* Reference & Provider */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-semibold text-[var(--text-primary)] truncate max-w-[140px]">
                          {item.reference || "—"}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          {item.provider || "Dashen Bank"}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isAccepted
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : isRejected
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAccepted
                                ? "bg-emerald-500"
                                : isRejected
                                ? "bg-red-500"
                                : "bg-amber-500 animate-pulse"
                            }`}
                          />
                          <span className="capitalize">{isAccepted ? "Approved" : item.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(item)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface-alt)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--border-default)]"
                        >
                          Review & Verify
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

      {/* Review & Status Update Modal */}
      {selectedGift && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedGift(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--accent-dark)] tracking-wider">
                  Review Submission
                </span>
                <h3 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                  Love Gift Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGift(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                {feedback}
              </div>
            )}

            {/* Donor & Amount Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--surface-alt)] p-4 rounded-2xl border border-[var(--border-light)]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                  Donor
                </span>
                <p className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">
                  {selectedGift.isAnonymous
                    ? "Anonymous Donor"
                    : selectedGift.donorName || selectedGift.user?.name || "Visitor"}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedGift.isAnonymous
                    ? "Donor requested anonymity"
                    : selectedGift.donorEmail || selectedGift.user?.email || "No email"}
                </p>
                {selectedGift.donorPhone && (
                  <p className="text-xs text-[var(--text-tertiary)]">{selectedGift.donorPhone}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                  Gift Amount
                </span>
                <p className="font-serif text-3xl font-black text-[var(--brand)] mt-0.5">
                  ETB {Number(selectedGift.amount).toLocaleString()}
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                    selectedGift.status === "accepted"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedGift.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  Status: {selectedGift.status === "accepted" ? "Approved" : selectedGift.status}
                </span>
              </div>
            </div>

            {/* Note from Donor if present */}
            {selectedGift.note && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
                <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-700">
                  Donor Message / Word of Encouragement
                </span>
                <p className="mt-1 italic">"{selectedGift.note}"</p>
              </div>
            )}

            {/* Uploaded Receipt Image Review */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] block mb-2">
                Uploaded Payment Receipt Image
              </span>
              {selectedGift.image ? (
                <div className="border border-[var(--border-default)] rounded-2xl p-2 bg-slate-50 text-center">
                  <img
                    src={resolveAssetUrl(selectedGift.image)}
                    alt="Uploaded receipt"
                    className="max-h-72 mx-auto rounded-xl object-contain shadow-xs bg-white"
                  />
                  <div className="pt-2">
                    <a
                      href={resolveAssetUrl(selectedGift.image)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[var(--brand)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open full image in new tab ↗</span>
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] italic">No receipt file attached.</p>
              )}
            </div>

            {/* Admin Notes Field */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] block mb-1">
                Admin Verification Notes / Reason
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Optional notes or rejection reason..."
                className="w-full px-3.5 py-2.5 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              />
            </div>

            {/* Approval / Rejection Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
              <button
                type="button"
                onClick={() => setSelectedGift(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus("rejected")}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Reject Submission
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus("accepted")}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {updating ? "Updating..." : "✓ Approve Love Gift"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
