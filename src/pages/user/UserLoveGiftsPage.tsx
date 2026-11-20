import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { fetchUserLoveGiftSummary, type UserLoveGiftSummary, type LoveGiftItem } from "../../api/loveGiftApi"
import { resolveAssetUrl } from "../../api/baseApi"

export default function UserLoveGiftsPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<UserLoveGiftSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUserLoveGiftSummary()
      setSummary(data)
    } catch (err: any) {
      setError(err?.message || "Failed to load love gifts history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--brand)]/10 text-[var(--brand)] mb-2">
            <span>❤️</span> Philanthropy & Giving
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            My Love Gifts
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl">
            Track your voluntary financial contributions and verification statuses supporting the Kingdom Builders community.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/love-gift")}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0"
        >
          <span>❤️</span>
          <span>Send a Love Gift</span>
          <span>&rarr;</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contributed (Approved only) */}
        <div className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-xs border-l-4 border-l-emerald-500">
          <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-tertiary)]">
            Total Contributed (Approved)
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            ETB {(summary?.totalContributed || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            Calculated from approved gifts only
          </p>
        </div>

        {/* Total Gifts Count */}
        <div className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-xs border-l-4 border-l-[var(--brand)]">
          <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-tertiary)]">
            Total Gifts Submitted
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-1">
            {summary?.totalGiftsCount || 0}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            All submitted contributions
          </p>
        </div>

        {/* Approved Count */}
        <div className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-xs border-l-4 border-l-emerald-400">
          <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-tertiary)]">
            Approved Gifts
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-1">
            {summary?.approvedGiftsCount || 0}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Verified by administration
          </p>
        </div>

        {/* Pending Count */}
        <div className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-xs border-l-4 border-l-amber-400">
          <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-tertiary)]">
            Pending Review
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            {summary?.pendingGiftsCount || 0}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            Under admin verification
          </p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-[var(--text-primary)]">
              Love Gift Transactions
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              History of all your submitted voluntary love gifts.
            </p>
          </div>
          <span className="text-xs text-[var(--text-tertiary)] font-medium">
            {summary?.gifts.length || 0} total records
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[var(--text-tertiary)]">Loading transaction history...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-600 bg-red-50 rounded-2xl p-4">
            {error}
          </div>
        ) : !summary || summary.gifts.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-alt)] text-2xl flex items-center justify-center mx-auto text-[var(--brand)]">
              ❤️
            </div>
            <h4 className="font-serif text-lg font-bold text-[var(--text-primary)]">
              No Love Gifts Submitted Yet
            </h4>
            <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto">
              You haven't submitted any voluntary love gifts yet. Support the community whenever you're ready!
            </p>
            <button
              type="button"
              onClick={() => navigate("/love-gift")}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] transition-colors cursor-pointer"
            >
              Send Your First Gift &rarr;
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-light)] text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Reference / Bank</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Receipt</th>
                  <th className="py-3 px-3 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]/60">
                {summary.gifts.map((gift) => {
                  const statusNormalized = (gift.status || "pending").toLowerCase()
                  return (
                    <tr key={gift.id} className="hover:bg-[var(--surface-alt)]/50 transition-colors">
                      <td className="py-3.5 px-3 font-medium text-[var(--text-primary)]">
                        <div>{formatDate(gift.date)}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">{gift.time}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-serif font-black text-sm text-[var(--text-primary)]">
                          ETB {Number(gift.amount).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-mono text-xs font-medium text-[var(--text-primary)] truncate max-w-[150px]">
                          {gift.reference || "—"}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          {gift.provider || "Dashen Bank"}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            statusNormalized === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : statusNormalized === "rejected"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              statusNormalized === "accepted"
                                ? "bg-emerald-500"
                                : statusNormalized === "rejected"
                                ? "bg-red-500"
                                : "bg-amber-500 animate-pulse"
                            }`}
                          />
                          <span className="capitalize">
                            {statusNormalized === "accepted"
                              ? "Approved"
                              : statusNormalized}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {gift.image ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(resolveAssetUrl(gift.image))}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                          >
                            <span>🔍 View</span>
                          </button>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        {gift.adminNotes ? (
                          <span className="text-[11px] text-[var(--text-secondary)] italic max-w-[180px] inline-block truncate" title={gift.adminNotes}>
                            {gift.adminNotes}
                          </span>
                        ) : gift.note ? (
                          <span className="text-[11px] text-[var(--text-tertiary)] italic max-w-[180px] inline-block truncate" title={gift.note}>
                            "{gift.note}"
                          </span>
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
        )}
      </div>

      {/* Modal for Receipt Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-xl w-full max-h-[90vh] overflow-auto space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-serif text-sm font-bold text-[var(--text-primary)]">
                Payment Receipt
              </h4>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img
              src={previewImage}
              alt="Receipt preview"
              className="w-full h-auto object-contain rounded-xl max-h-[70vh]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
