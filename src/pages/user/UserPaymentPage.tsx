import { Link } from "react-router-dom"

export default function UserPaymentPage() {
  const today = new Date()
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const daysUntilPayment = Math.max(
    0,
    Math.ceil(
      (nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    ),
  )
  const paidMonths = [1, 2, 3].map(
    (offset) => new Date(today.getFullYear(), today.getMonth() - offset, 1),
  )
  const formatMonth = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-[var(--brand)] rounded-2xl p-6 md:p-8 text-white overflow-hidden relative shadow-md">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm text-white/65 mb-2">Next payment due</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="font-serif text-5xl md:text-6xl leading-none font-bold">
              {daysUntilPayment}
            </span>
            <span className="text-sm text-white/70 pb-1.5">days remaining</span>
          </div>
          <p className="text-sm text-white/75">
            Your next membership payment is due on {formatDate(nextPaymentDate)}.
          </p>
          <div className="mt-4 pt-2">
            <Link
              to="/payment/receiver"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-[var(--brand)] hover:bg-white/90 transition-colors shadow-sm"
            >
              <span>Verify Payment Receipt</span>
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
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
              Billing period
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {formatMonth(currentMonth)}
            </p>
          </div>
          <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
              Next payment
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {formatDate(nextPaymentDate)}
            </p>
          </div>
          <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
              Payment status
            </p>
            <p className="text-sm font-semibold text-emerald-600">
              Up to date
            </p>
          </div>
        </div>
      </section>

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
          {paidMonths.map((month) => (
            <div
              key={month.toISOString()}
              className="flex items-center justify-between gap-4 p-4 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid place-items-center w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex-shrink-0">
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
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {formatMonth(month)}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Membership payment
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full whitespace-nowrap">
                Paid
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
