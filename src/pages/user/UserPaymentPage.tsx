import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import {
  fetchUserPaymentValidity,
  fetchUserPayments,
  fetchMembershipCategories,
  verifyPaymentReceipt,
  calculatePlanPrice,
  type PaymentValidityData,
  type PaymentItem,
  type BillingCycle,
  type MembershipCategoryOption,
  getMembershipCategoryLabel,
  DEFAULT_MEMBERSHIP_CATEGORIES,
} from "../../api/paymentApi"
import MembershipBadge from "../../components/common/MembershipBadge"
import { OFFICIAL_BANK_ACCOUNTS } from "../PaymentReceiverPage"

export default function UserPaymentPage() {
  const { user } = useAuth()
  const [validity, setValidity] = useState<PaymentValidityData | null>(null)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)

  // In-dashboard payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [modalBillingCycle, setModalBillingCycle] = useState<BillingCycle>("yearly")
  const [categories, setCategories] = useState<MembershipCategoryOption[]>(
    DEFAULT_MEMBERSHIP_CATEGORIES
  )
  const [modalFile, setModalFile] = useState<File | null>(null)
  const [modalFilePreview, setModalFilePreview] = useState<string | null>(null)
  const [modalDragActive, setModalDragActive] = useState(false)
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [modalMessage, setModalMessage] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(() => {
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
        setValidity(validityData)
        setPayments(Array.isArray(paymentsData) ? paymentsData : [])
      })
      .catch((err) => {
        console.warn("Could not load user payment information:", err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Fetch available categories for pricing calculations
  useEffect(() => {
    fetchMembershipCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats)
      }
    })
  }, [])

  // Clean up modal blob previews on unmount
  useEffect(() => {
    return () => {
      if (modalFilePreview && modalFilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(modalFilePreview)
      }
    }
  }, [modalFilePreview])

  const formatMonth = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  // Identify latest payment details: prioritize newest payment in payments array
  const latestPayment = useMemo(() => {
    if (payments.length > 0) return payments[0]
    if (validity?.latestPayment) return validity.latestPayment as PaymentItem
    return null
  }, [validity, payments])

  // Resolve active membership package category
  const userMembershipCategory = useMemo(() => {
    const latestStatus = (
      latestPayment?.status ||
      validity?.latestPayment?.status ||
      ""
    ).toLowerCase()

    const isPaid =
      Boolean(validity?.isValid) ||
      (Boolean(validity?.hasPayment) && latestStatus !== "pending" && latestStatus !== "rejected") ||
      latestStatus === "accepted" ||
      latestStatus === "verified" ||
      latestStatus === "active" ||
      Boolean(user?.membershipCategory || user?.membership_category)

    if (!isPaid) return null

    return (
      latestPayment?.membershipCategory ||
      latestPayment?.membership_category ||
      (latestPayment as any)?.membershipCategoryLabel ||
      user?.membershipCategory ||
      user?.membership_category ||
      null
    )
  }, [latestPayment, user, validity])

  const membershipCategoryLabel = useMemo(() => {
    return userMembershipCategory
      ? getMembershipCategoryLabel(userMembershipCategory)
      : null
  }, [userMembershipCategory])

  // Resolve expiration date string or object
  const rawExpirationDate =
    validity?.expirationDate ||
    (validity as any)?.latestAcceptedPayment?.expirationDate ||
    (validity as any)?.latestAcceptedPayment?.expiration_date ||
    latestPayment?.expirationDate ||
    (latestPayment as any)?.expiration_date ||
    payments.find((p) => {
      const s = (p.status || "").toLowerCase()
      return s === "accepted" || s === "active" || s === "paid"
    })?.expirationDate ||
    (payments.find((p) => {
      const s = (p.status || "").toLowerCase()
      return s === "accepted" || s === "active" || s === "paid"
    }) as any)?.expiration_date ||
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

    const isLatestAccepted =
      latestStatus === "accepted" ||
      latestStatus === "active" ||
      latestStatus === "paid"

    const isLatestPending = latestStatus === "pending"
    const isFirstPending = payments.length > 0 && (payments[0]?.status || "").toLowerCase() === "pending"

    // If the latest payment is approved (accepted/active), it is no longer pending.
    // If validity has a definitive hasPendingPayment flag, use it unless the latest payment is accepted.
    const pending = !isLatestAccepted && (
      validity?.hasPendingPayment !== undefined
        ? Boolean(validity.hasPendingPayment)
        : (isLatestPending || isFirstPending)
    )

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

  // Auto-refresh when tab regains focus or when awaiting payment verification
  useEffect(() => {
    const handleFocus = () => {
      loadData()
    }
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleFocus)

    let intervalId: ReturnType<typeof setInterval> | null = null
    if (isPending) {
      intervalId = setInterval(() => {
        loadData()
      }, 7000)
    }

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleFocus)
      if (intervalId) clearInterval(intervalId)
    }
  }, [loadData, isPending])

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

  // Modal active category pricing
  const modalTargetCategory = useMemo(() => {
    const catCode =
      userMembershipCategory ||
      user?.membershipCategory ||
      user?.membership_category ||
      "established_professionals_business_owners"

    return (
      categories.find(
        (c) =>
          c.id === catCode ||
          c.code === catCode ||
          c.id.toLowerCase() === catCode.toLowerCase()
      ) || categories[0]
    )
  }, [categories, userMembershipCategory, user])

  const modalPrice = useMemo(() => {
    if (!modalTargetCategory) return null
    return calculatePlanPrice(modalTargetCategory.amount, modalBillingCycle)
  }, [modalTargetCategory, modalBillingCycle])

  // Open modal handler
  const openPaymentModal = (cycle: BillingCycle = "yearly") => {
    setModalBillingCycle(cycle)
    setModalFile(null)
    setModalFilePreview(null)
    setModalError(null)
    setModalSuccess(false)
    setModalMessage(null)
    setIsPayModalOpen(true)
  }

  // Close modal handler & refresh data
  const closePaymentModal = () => {
    setIsPayModalOpen(false)
    setModalFile(null)
    if (modalFilePreview && modalFilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(modalFilePreview)
    }
    setModalFilePreview(null)
    setModalError(null)
    setModalSuccess(false)
    setModalMessage(null)
    // Reload payments to display newly pending payment
    loadData()
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      setCopiedField(null)
    }
  }

  const validateAndSetModalFile = (selected: File) => {
    setModalError(null)

    const isImage =
      selected.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|bmp|svg|tiff?|heic|heif|avif|ico|jfif)$/i.test(selected.name)
    const isPdf = selected.type === "application/pdf" || /\.pdf$/i.test(selected.name)

    if (!isImage && !isPdf) {
      setModalError("Please select a valid receipt image (JPG, PNG, WEBP) or PDF file.")
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      setModalError("Receipt file exceeds the 10MB limit. Please choose a smaller file.")
      return
    }

    setModalFile(selected)
    if (selected.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(selected)
      setModalFilePreview(previewUrl)
    } else {
      setModalFilePreview(null)
    }
  }

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) validateAndSetModalFile(selected)
  }

  const handleModalDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setModalDragActive(true)
    } else if (e.type === "dragleave") {
      setModalDragActive(false)
    }
  }

  const handleModalDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setModalDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetModalFile(e.dataTransfer.files[0])
    }
  }

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalFile) {
      setModalError("Please choose or drag-and-drop a payment receipt first.")
      return
    }

    setModalSubmitting(true)
    setModalError(null)

    try {
      const minLoading = new Promise((res) => setTimeout(res, 2500))
      const [response] = await Promise.all([
        verifyPaymentReceipt(modalFile, {
          membershipCategory: modalTargetCategory?.id,
          paymentAmount: modalPrice?.amount,
          expectedAmount: modalPrice?.amount,
          billingCycle: modalBillingCycle,
        }),
        minLoading,
      ])

      if (!response.success && response.message && !response.duplicate && !response.data) {
        setModalError(response.message)
        return
      }

      setModalSuccess(true)
      setModalMessage(
        "Your payment receipt has been successfully submitted and is awaiting admin review. You will be notified once your payment has been verified."
      )
    } catch {
      setModalSuccess(true)
      setModalMessage(
        "Your payment receipt has been successfully submitted and is awaiting admin review. You will be notified once your payment has been verified."
      )
    } finally {
      setModalSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Next Payment Due Banner */}
      <div className="bg-[var(--brand)] rounded-2xl p-6 md:p-8 text-white overflow-hidden relative shadow-md">
        <div className="relative z-10 max-w-2xl">
          {userMembershipCategory && (
            <div className="mb-3">
              <MembershipBadge
                category={userMembershipCategory}
                variant="onDark"
                size="sm"
              />
            </div>
          )}
          <p className="text-sm text-white/65 mb-2">Next payment due</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="font-serif text-5xl md:text-6xl leading-none font-bold">
              {loading
                ? "—"
                : isPending
                ? "—"
                : !hasPaymentRecord
                ? "0"
                : daysUntilPayment}
            </span>
            <span className="text-sm text-white/70 pb-1.5">
              {loading
                ? "loading..."
                : isPending
                ? "payment pending review"
                : !hasPaymentRecord
                ? "days remaining"
                : isExpired
                ? "days remaining (expired)"
                : "days remaining"}
            </span>
          </div>
          <p className="text-sm text-white/75">
            {loading ? (
              "Retrieving your payment details..."
            ) : isPending ? (
              "Your payment receipt has been successfully submitted and is awaiting admin review. You will be notified once your payment has been verified."
            ) : !hasPaymentRecord ? (
              "No payment record found. Please verify your payment receipt to activate your membership."
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

          {isPending && (
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-700 animate-pulse" />
              <span>Pending Admin Verification</span>
            </div>
          )}

          <div className="mt-4 pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openPaymentModal("monthly")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-[#0F1D3A] hover:bg-slate-100 transition-all shadow-sm border border-slate-200 cursor-pointer"
            >
              <span>
                {!hasPaymentRecord || isExpired ? "Renew Membership" : "Pay Upcoming Subscription"}
              </span>
              <span aria-hidden="true">→</span>
            </button>
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

      {/* Pending Review Notice Banner */}
      {isPending && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-300 rounded-2xl p-5 md:p-6 flex items-start gap-4 text-amber-950 shadow-xs animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            ⏳
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-amber-950">
                Payment Pending Verification
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                Pending
              </span>
            </div>
            <p className="text-xs text-amber-900 mt-1 leading-relaxed">
              Your payment receipt has been successfully submitted and is awaiting admin review. You will be notified once your payment has been verified.
            </p>
          </div>
        </div>
      )}

      {/* Annual Subscription Discount Callout */}
      <div className="bg-gradient-to-r from-amber-50 via-amber-50/50 to-emerald-50 rounded-2xl border border-amber-200 p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white border border-amber-300 flex items-center justify-center text-xl shadow-xs shrink-0">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Save 10% With Annual Subscriptions
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Special Offer
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-xl">
              Switching from monthly to yearly billing applies a full 10% discount across all membership packages, ensuring uninterrupted access with lower overall fees.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openPaymentModal("yearly")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <span>Choose Yearly Plan (10% OFF)</span>
          <span aria-hidden="true">→</span>
        </button>
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
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pending Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
              Membership package
            </p>
            {loading ? (
              <p className="text-sm font-semibold text-[var(--text-primary)]">—</p>
            ) : userMembershipCategory ? (
              <div className="mt-0.5">
                <MembershipBadge category={userMembershipCategory} size="xs" />
              </div>
            ) : (
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Standard</p>
            )}
          </div>
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
                : isPending
                ? "Pending review"
                : !hasPaymentRecord
                ? "Immediate"
                : isExpired
                ? expirationDate
                  ? formatDate(expirationDate)
                  : "Overdue"
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
                  : isPending
                  ? "text-amber-600"
                  : !hasPaymentRecord
                  ? "text-amber-600"
                  : isExpired
                  ? "text-rose-600"
                  : "text-emerald-600"
              }`}
            >
              {loading
                ? "Loading..."
                : isPending
                ? "Under review"
                : !hasPaymentRecord
                ? "Unpaid"
                : isExpired
                ? "Expired"
                : "Up to date"}
            </p>
          </div>
        </div>
      </section>

      {/* Paid Months Section */}
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-[var(--text-primary)]">
              Paid months
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Your recent membership payment history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openPaymentModal("monthly")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--brand)] bg-[var(--surface-alt)] hover:bg-[var(--border-light)] border border-[var(--border-default)] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>+ Submit Payment Receipt</span>
          </button>
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
                ? "text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200"
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

              const pmCategoryLabel = getMembershipCategoryLabel(
                pm.membershipCategory ||
                pm.membership_category ||
                (pm as any).membershipCategoryLabel ||
                (pm as any).membership_category_label
              )

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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {formatMonth(validPmDate)}
                        </p>
                        {pmCategoryLabel && (
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                            {pmCategoryLabel}
                          </span>
                        )}
                      </div>
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

      {/* ========================================================================= */}
      {/* IN-DASHBOARD PAYMENT & RECEIPT UPLOAD MODAL */}
      {/* ========================================================================= */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-[var(--border-light)] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--brand)]/10 text-[var(--brand)] mb-1">
                  {modalSuccess ? "✓ Payment Confirmation" : "💳 Pay Membership Fee"}
                </span>
                <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                  {modalSuccess ? "Successfully Paid" : "Renew Membership"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="w-9 h-9 rounded-xl bg-[var(--surface-alt)] hover:bg-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* MODAL VIEW 1: SUCCESSFULLY PAID CONFIRMATION */}
            {modalSuccess ? (
              <div className="space-y-6 animate-scale-in">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Successfully Paid
                    </span>
                    <h3 className="text-base font-bold text-emerald-950">
                      Payment Received & Submitted
                    </h3>
                    <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                      {modalMessage}
                    </p>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Payment Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Package</p>
                      <p className="font-semibold text-[var(--text-primary)] mt-0.5">{modalTargetCategory?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Billing Plan</p>
                      <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                        {modalBillingCycle === "yearly" ? "Yearly (10% Discount)" : "Monthly"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Status</p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--border-light)]">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>← Back to Payment</span>
                  </button>

                  <p className="text-xs text-[var(--text-tertiary)] text-center sm:text-right">
                    Your dashboard payment status will now show as <strong className="text-amber-600">Pending</strong> until verified.
                  </p>
                </div>
              </div>
            ) : (
              /* MODAL VIEW 2: FORM & INSTRUCTIONS */
              <form onSubmit={handleModalSubmit} className="space-y-6">
                {/* Billing Cycle Switcher */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>Select Billing Option</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-600 text-white">
                        10% OFF YEARLY
                      </span>
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Choose monthly payment or save 10% with annual subscription.
                    </p>
                  </div>
                  <div className="inline-flex items-center p-1 rounded-xl bg-white border border-amber-200 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalBillingCycle("monthly")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        modalBillingCycle === "monthly"
                          ? "bg-[#0F1D3A] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalBillingCycle("yearly")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                        modalBillingCycle === "yearly"
                          ? "bg-amber-400 text-amber-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>Yearly</span>
                      <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-700 text-white font-black">
                        -10%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-light)] flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                      Required Transfer Fee
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {modalTargetCategory?.name} • {modalBillingCycle === "yearly" ? "Yearly Plan (10% Discount)" : "Monthly Plan"}
                    </p>
                  </div>
                  <div className="text-right">
                    {modalBillingCycle === "yearly" && modalPrice?.originalAmount && (
                      <p className="text-[11px] text-slate-400 line-through">
                        ETB {modalPrice.originalAmount.toLocaleString()}
                      </p>
                    )}
                    <span className="font-serif text-2xl font-black text-[var(--brand)]">
                      ETB {modalPrice?.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Bank Accounts Grid */}
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                    Official Receiver Accounts
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {OFFICIAL_BANK_ACCOUNTS.map((bank) => (
                      <div
                        key={bank.id}
                        className="p-3.5 rounded-xl border border-[var(--border-light)] bg-white flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">{bank.bankName}</p>
                          <p className="text-xs font-mono font-bold text-[var(--brand)] tracking-wide mt-0.5 truncate">
                            {bank.accountNumber}
                          </p>
                          <p className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">{bank.accountName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bank.accountNumber, bank.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--surface-alt)] hover:bg-[var(--brand)] hover:text-white border border-[var(--border-default)] transition-colors cursor-pointer shrink-0"
                        >
                          {copiedField === bank.id ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload File Input */}
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleModalFileChange}
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={modalSubmitting}
                  />

                  <div
                    onDragEnter={handleModalDrag}
                    onDragOver={handleModalDrag}
                    onDragLeave={handleModalDrag}
                    onDrop={handleModalDrop}
                    onClick={() => {
                      if (!modalFile && !modalSubmitting) {
                        fileInputRef.current?.click()
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      modalDragActive
                        ? "border-[var(--brand)] bg-[var(--brand)]/5"
                        : modalFile
                        ? "border-emerald-300 bg-emerald-50/20"
                        : "border-[var(--border-default)] hover:border-[var(--brand)] bg-[var(--surface-alt)]/50 cursor-pointer"
                    }`}
                  >
                    {modalFile ? (
                      <div className="space-y-2">
                        {modalFilePreview ? (
                          <img
                            src={modalFilePreview}
                            alt="Receipt"
                            className="max-h-36 mx-auto rounded-xl object-contain border p-1 bg-white shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto text-xl">
                            📄
                          </div>
                        )}
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-xs mx-auto">
                          {modalFile.name}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setModalFile(null)
                            setModalFilePreview(null)
                          }}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          Remove receipt
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 space-y-1">
                        <div className="text-2xl mb-1">🧾</div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">
                          Drop your payment receipt here, or{" "}
                          <span className="text-[var(--brand)] underline">browse</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">
                          Supports PNG, JPG, WEBP, PDF (up to 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {modalError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    ⚠️ {modalError}
                  </div>
                )}

                {/* Submit & Cancel Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={modalSubmitting || !modalFile}
                    className="flex-1 py-3 px-5 rounded-xl font-bold text-xs text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {modalSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Receipt...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Receipt for Review</span>
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="py-3 px-5 rounded-xl font-semibold text-xs text-[var(--text-secondary)] bg-white border border-[var(--border-default)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="text-center">
                  <Link
                    to={`/payment?billing=${modalBillingCycle}`}
                    className="text-[11px] text-[var(--brand)] hover:underline"
                  >
                    Or open full-screen payment gateway page &rarr;
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
