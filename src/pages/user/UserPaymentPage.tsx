import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import {
  fetchUserPaymentValidity,
  fetchUserPayments,
  type PaymentValidityData,
  type PaymentItem,
} from "../../api/paymentApi"

export default function UserPaymentPage() {
  const { user } = useAuth()
  const [validity, setValidity] = useState<PaymentValidityData | null>(null)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)

    Promise.all([
      fetchUserPaymentValidity(user.id),
      fetchUserPayments(user.id),
    ])
      .then(([validityData, paymentsData]) => {
        if (!active) return
        setValidity(validityData)
        setPayments(Array.isArray(paymentsData) ? paymentsData : [])
      })
      .catch((err) => {
        if (!active) return
        console.warn("Could not load user payment information:", err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

  return () => {
      active = false
    }
  }, [user?.id])

  const formatMonth = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  // Identify latest payment details
  const latestPayment = useMemo(() => {
    if (validity?.latestPayment) return validity.latestPayment as PaymentItem
    if (payments.length > 0) return payments[0]
    return null
  }, [validity, payments])

  // Resolve expiration date string or object
  const rawExpirationDate =
    validity?.expirationDate ||
    latestPayment?.expirationDate ||
    (latestPayment as any)?.expiration_date ||
    null

  const expirationDate = useMemo(() => {
    if (!rawExpirationDate) return null
    const parsed = new Date(rawExpirationDate)
    return isNaN(parsed.getTime()) ? null : parsed
  }, [rawExpirationDate])

  // Dynamic calculations for days remaining and payment states
  const { daysUntilPayment, isExpired, isPending, hasPaymentRecord } = useMemo(() => {
    const hasRecord = Boolean(
      validity?.hasPayment ||
      validity?.latestPayment ||
      payments.length > 0
    )

    const latestStatus = (
      latestPayment?.status ||
      validity?.latestPayment?.status ||
      ""
    ).toLowerCase()

    const pending = latestStatus === "pending"

    if (!expirationDate) {
      const expiredByValidity = validity?.isExpired === true
      return {
        daysUntilPayment: 0,
        isExpired: expiredByValidity,
        isPending: pending,
        hasPaymentRecord: hasRecord,
      }
    }

    const now = new Date()
    const diffTime = expirationDate.getTime() - now.getTime()
    const expired = diffTime <= 0 || validity?.isExpired === true

    const days = expired
      ? 0
      : Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    return {
      daysUntilPayment: days,
      isExpired: expired,
      isPending: pending,
      hasPaymentRecord: hasRecord,
    }
  }, [expirationDate, validity, latestPayment, payments])

  // Derive billing period month
  const currentMonthDate = useMemo(() => {
    if (latestPayment?.date) {
      const d = new Date(latestPayment.date)
      if (!isNaN(d.getTime())) return d
    }
    if (latestPayment?.created_at) {
      const d = new Date(latestPayment.created_at)
      if (!isNaN(d.getTime())) return d
    }
    return new Date()
  }, [latestPayment])

  // Render combined payment list for "Paid months"
  const displayPayments = useMemo(() => {
    if (payments.length > 0) return payments
    if (validity?.latestPayment) return [validity.latestPayment as PaymentItem]
    return []
  }, [payments, validity])

  return (
    <div className="animate-fade-in space-y-6">
      {/* Next Payment Due Banner */}
      <div className="bg-[var(--brand)] rounded-2xl p-6 md:p-8 text-white overflow-hidden relative shadow-md">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm text-white/65 mb-2">Next payment due</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="font-serif text-5xl md:text-6xl leading-none font-bold">
              {loading
                ? "—"
                : !hasPaymentRecord
                ? "0"
                : isPending && !expirationDate
                ? "—"
                : daysUntilPayment}
            </span>
            <span className="text-sm text-white/70 pb-1.5">
              {loading
                ? "loading..."
                : !hasPaymentRecord
                ? "days remaining"
                : isPending && !expirationDate
                ? "under review"
                : isExpired
                ? "days remaining (expired)"
                : "days remaining"}
            </span>
          </div>
          <p className="text-sm text-white/75">
            {loading ? (
              "Retrieving your payment details..."
            ) : !hasPaymentRecord ? (
              "No payment record found. Please verify your payment receipt to activate your membership."
            ) : isPending && !expirationDate ? (
              "Your payment receipt has been submitted and is currently under verification."
            ) : isExpired ? (
              expirationDate ? (
                `Your membership payment expired on ${formatDate(expirationDate)}. Please renew your payment.`
              ) : (
                "Your membership payment has expired. Please renew your payment."
              )
            ) : expirationDate ? (
              `Your next membership payment is due on ${formatDate(expirationDate)}.`
            ) : (
              "Your membership is active with no expiration date set."
            )}
          </p>
          <div className="mt-4 pt-2">
            <Link
              to="/payment/receiver"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-[var(--brand)] hover:bg-white/90 transition-colors shadow-sm"
            >
              <span>
                {!hasPaymentRecord || isExpired ? "Renew Membership" : "Verify Payment Receipt"}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-white/10 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-[var(--accent)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.4}
              d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* Current Billing Period */}
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="font-serif text-2xl text-[var(--text-primary)]">
              Current billing period
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Your active membership billing cycle.
            </p>
          </div>
          {loading ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              Checking...
            </span>
          ) : !hasPaymentRecord ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              No Payment
            </span>
          ) : isExpired ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Expired
            </span>
          ) : isPending ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Pending Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
              Billing period
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {loading
                ? "—"
                : !hasPaymentRecord
                ? "—"
                : formatMonth(currentMonthDate)}
            </p>
          </div>
          <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
              Next payment
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {loading
                ? "—"
                : !hasPaymentRecord
                ? "Immediate"
                : isExpired
                ? expirationDate
                  ? formatDate(expirationDate)
                  : "Overdue"
                : isPending
                ? "Pending review"
                : expirationDate
                ? formatDate(expirationDate)
                : "None set"}
            </p>
          </div>
          <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
              Payment status
            </p>
            <p
              className={`text-sm font-semibold ${
                loading
                  ? "text-[var(--text-tertiary)]"
                  : !hasPaymentRecord
                  ? "text-amber-600"
                  : isExpired
                  ? "text-rose-600"
                  : isPending
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {loading
                ? "Loading..."
                : !hasPaymentRecord
                ? "Unpaid"
                : isExpired
                ? "Expired"
                : isPending
                ? "Under review"
                : "Up to date"}
            </p>
          </div>
        </div>
      </section>

      {/* Paid Months Section */}
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8">
        <div className="mb-6">
          <h2 className="font-serif text-2xl text-[var(--text-primary)]">
            Paid months
          </h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Your recent membership payment history.
          </p>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-sm text-[var(--text-tertiary)] bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)]">
              Loading payment history...
            </div>
          ) : displayPayments.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-tertiary)] bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)]">
              No payment records found.
            </div>
          ) : (
            displayPayments.map((pm, idx) => {
              const pmDate = pm.date
                ? new Date(pm.date)
                : pm.created_at
                ? new Date(pm.created_at)
                : new Date()
              const validPmDate = isNaN(pmDate.getTime()) ? new Date() : pmDate

              const statusLower = (pm.status || "accepted").toLowerCase()
              const isAccepted = statusLower === "accepted"
              const isPmPending = statusLower === "pending"

              const badgeColor = isAccepted
                ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                : isPmPending
                ? "text-amber-700 bg-amber-50 dark:bg-amber-950/40"
                : "text-rose-700 bg-rose-50 dark:bg-rose-950/40"

              const iconBoxColor = isAccepted
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
                : isPmPending
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600"

              const statusText = isAccepted
                ? "Paid"
                : isPmPending
                ? "Pending"
                : "Rejected"

              return (
                <div
                  key={pm.id || idx}
                  className="flex items-center justify-between gap-4 p-4 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid place-items-center w-9 h-9 rounded-lg flex-shrink-0 ${iconBoxColor}`}
                    >
                      {isAccepted ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : isPmPending ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {formatMonth(validPmDate)}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                        {pm.provider ? `${pm.provider.toUpperCase()} • ` : ""}
                        {pm.amount ? `ETB ${Number(pm.amount).toLocaleString()} • ` : ""}
                        {pm.reference ? `Ref: ${pm.reference}` : "Membership payment"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap capitalize ${badgeColor}`}
                  >
                    {statusText}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
