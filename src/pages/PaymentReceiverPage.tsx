import { useState, useRef, useEffect, useMemo } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import {
  verifyPaymentReceipt,
  fetchPaymentValidity,
  fetchMembershipCategories,
  selectMembershipCategoryApi,
  getMembershipCategoryLabel,
  DEFAULT_MEMBERSHIP_CATEGORIES,
  type VerifiedPayment,
  type MembershipCategoryOption,
} from "../api/paymentApi"
import { getMe } from "../auth/auth"
import Navbar from "../components/Navbar"
import MembershipBadge from "../components/common/MembershipBadge"

const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

// Official receiver payment credentials
const OFFICIAL_RECEIVER = {
  accountName: "KINGDOM BUILDERS MINISTRY",
  accountNumber: "0012521619011",
  bankName: "Dashen Bank",
}

const DEFAULT_UNDER_REVIEW_MESSAGE =
  "Your payment has been submitted successfully and is currently under verification. Please wait while the admin reviews your payment."

export default function PaymentReceiverPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Membership package selection state
  const [categories, setCategories] = useState<MembershipCategoryOption[]>(
    DEFAULT_MEMBERSHIP_CATEGORIES
  )

  // Retrieve category from URL search params or sessionStorage
  const categoryQuery = searchParams.get("category")
  const storedCategory =
    typeof window !== "undefined"
      ? sessionStorage.getItem("kbn_selected_category")
      : null

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    () =>
      categoryQuery ||
      storedCategory ||
      user?.membershipCategory ||
      user?.membership_category ||
      null
  )

  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)

  // Under verification / duplicate prevention state
  const [isUnderVerification, setIsUnderVerification] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState<string>(
    DEFAULT_UNDER_REVIEW_MESSAGE
  )
  const [submittedPayment, setSubmittedPayment] = useState<VerifiedPayment | null>(null)
  const [statusCheckFeedback, setStatusCheckFeedback] = useState<string | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Synchronize category ID if query param updates or from user's registered category
  useEffect(() => {
    if (categoryQuery && categoryQuery !== selectedCategoryId) {
      setSelectedCategoryId(categoryQuery)
      sessionStorage.setItem("kbn_selected_category", categoryQuery)
    } else if (!selectedCategoryId && (user?.membershipCategory || user?.membership_category)) {
      const userCat = user.membershipCategory || user.membership_category
      if (userCat) {
        setSelectedCategoryId(userCat)
      }
    }
  }, [categoryQuery, selectedCategoryId, user])

  // Resolve matching category object (matches by id or code)
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null
    return (
      categories.find(
        (c) =>
          c.id === selectedCategoryId ||
          c.code === selectedCategoryId ||
          c.id.toLowerCase() === selectedCategoryId.toLowerCase() ||
          (c.code && c.code.toLowerCase() === selectedCategoryId.toLowerCase())
      ) || null
    )
  }, [categories, selectedCategoryId])

  // Determine active flow step
  // Step 1: Category selection (/payment)
  // Step 2: Payment credentials & receipt upload (/payment/verify or /payment/receiver)
  const isPaymentStep = Boolean(
    selectedCategory &&
      (location.pathname === "/payment/verify" ||
        location.pathname === "/payment/receiver")
  )

  // Fetch dynamic categories on mount
  useEffect(() => {
    fetchMembershipCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats)
      }
    })
  }, [])

  // Clean up object URL previews on unmount
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview)
      }
    }
  }, [filePreview])

  // Check on load if the user already has a payment under verification
  useEffect(() => {
    let active = true

    fetchPaymentValidity()
      .then((validity) => {
        if (!active || !validity) return

        const latestStatus = validity.latestPayment?.status?.toLowerCase()
        if (latestStatus === "pending" || (!validity.isValid && validity.hasPayment)) {
          setIsUnderVerification(true)
          setVerificationMessage(
            "Your payment is under verification. Please wait while the admin reviews your payment."
          )
          if (validity.latestPayment) {
            setSubmittedPayment(validity.latestPayment)
          }
        }
      })
      .catch(() => {
        // Non-blocking initial check
      })

    return () => {
      active = false
    }
  }, [])

  // CONDITIONAL ACCESS GUARD:
  // If user tries to access /payment/verify or /payment/receiver without a valid category,
  // redirect them to /payment to select a category first.
  useEffect(() => {
    if (isUnderVerification) return

    const isDirectPaymentPath =
      location.pathname === "/payment/verify" ||
      location.pathname === "/payment/receiver"

    if (isDirectPaymentPath && !selectedCategory) {
      navigate("/payment", { replace: true })
    }
  }, [location.pathname, selectedCategory, isUnderVerification, navigate])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      setCopiedField(null)
    }
  }

  const validateAndSetFile = (selected: File) => {
    setClientError(null)

    const isImage =
      selected.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|bmp|svg|tiff?|heic|heif|avif|ico|jfif|pjpeg|pjp|raw|cr2|nef|dng)$/i.test(
        selected.name
      )
    const isPdf =
      selected.type === "application/pdf" ||
      /\.pdf$/i.test(selected.name)

    if (!isImage && !isPdf) {
      setClientError("Please select a valid receipt image (JPG, PNG, WEBP, GIF, BMP, HEIC, TIFF, AVIF, SVG, etc.) or PDF file.")
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      setClientError("Receipt file exceeds the 10MB size limit. Please choose a smaller file.")
      return
    }

    setFile(selected)
    if (selected.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(selected)
      setFilePreview(previewUrl)
    } else {
      setFilePreview(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      validateAndSetFile(selected)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleClearFile = () => {
    setFile(null)
    if (filePreview && filePreview.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview)
    }
    setFilePreview(null)
    setClientError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // STEP NAVIGATION:
  // Persist selected membership category to backend and redirect to payment credentials and upload page
  const handleProceedToPayment = async (catId?: string) => {
    const targetId = catId || selectedCategoryId
    if (!targetId) {
      setClientError("Please select a membership category first.")
      return
    }
    const cat = categories.find((c) => c.id === targetId || c.code === targetId)
    if (!cat) {
      setClientError("Selected category could not be found. Please pick a category from the list.")
      return
    }

    const resolvedId = cat.id || cat.code || targetId
    setSelectedCategoryId(resolvedId)
    sessionStorage.setItem("kbn_selected_category", resolvedId)
    setClientError(null)
    setSavingCategory(true)

    try {
      // Persist chosen category to backend for this user
      const res = await selectMembershipCategoryApi(resolvedId)
      if (res && res.success && res.data?.user) {
        updateUser(res.data.user)
      }
    } catch (err) {
      console.warn("Could not persist category selection to backend:", err)
      // Non-blocking: allow user to continue to payment credentials
    } finally {
      setSavingCategory(false)
      navigate(`/payment/verify?category=${encodeURIComponent(resolvedId)}`)
    }
  }

  // Back to category selection (Step 1)
  const handleBackToCategories = () => {
    setClientError(null)
    navigate("/payment")
  }

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) {
      setClientError("Please select a membership category first.")
      navigate("/payment", { replace: true })
      return
    }

    if (!file) {
      setClientError("Please choose or drag-and-drop a payment receipt first.")
      return
    }

    setLoading(true)
    setClientError(null)
    setStatusCheckFeedback(null)

    try {
      // Simulate submission process for approximately 7 seconds
      const minLoadingDuration = new Promise((resolve) => setTimeout(resolve, 7000))
      const [response] = await Promise.all([
        verifyPaymentReceipt(file, {
          membershipCategory: selectedCategory.id,
          paymentAmount: selectedCategory.amount,
        }),
        minLoadingDuration,
      ])

      if (!response.success && response.message && !response.duplicate && !response.data) {
        setClientError(response.message)
        return
      }

      setIsUnderVerification(true)
      setVerificationMessage(
        response.message || DEFAULT_UNDER_REVIEW_MESSAGE
      )

      if (response.data) {
        setSubmittedPayment(response.data)
      } else {
        setSubmittedPayment({
          amount: selectedCategory.amount,
          membershipCategory: selectedCategory.id,
          membershipCategoryLabel: selectedCategory.name,
          status: "pending",
        })
      }

      // Check if user account was immediately activated
      try {
        const freshUser = await getMe()
        if (freshUser) {
          updateUser(freshUser)
          if (freshUser.status === "active") {
            setTimeout(() => {
              navigate("/", { replace: true })
            }, 1200)
          }
        }
      } catch {
        // Non-blocking
      }
    } catch {
      setIsUnderVerification(true)
      setVerificationMessage(DEFAULT_UNDER_REVIEW_MESSAGE)
    } finally {
      setLoading(false)
      handleClearFile()
    }
  }

  const handleRefreshStatus = async () => {
    setCheckingStatus(true)
    setStatusCheckFeedback(null)

    try {
      const freshUser = await getMe()
      if (freshUser) {
        updateUser(freshUser)
        if (freshUser.status === "active") {
          setStatusCheckFeedback("Your account is now active! Redirecting to home...")
          setTimeout(() => {
            navigate("/", { replace: true })
          }, 800)
          return
        }
      }

      const validity = await fetchPaymentValidity()
      if (validity?.latestPayment) {
        setSubmittedPayment(validity.latestPayment)
      }

      setStatusCheckFeedback(
        "Payment is still currently under verification. Please wait while the admin reviews your payment."
      )
    } catch {
      setStatusCheckFeedback("Unable to check status right now. Please try again in a few moments.")
    } finally {
      setCheckingStatus(false)
    }
  }

  const isPendingUser = (user?.status || "pending").toLowerCase() === "pending"
  const isInactiveUser = (user?.status || "").toLowerCase() === "inactive"
  const isRestricted = isPendingUser || isInactiveUser

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] flex flex-col justify-between">
      {/* Top Header Navigation */}
      {isRestricted ? (
        <header className="bg-white border-b border-[var(--border-light)] px-4 sm:px-8 py-3.5 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={knbLogo}
                alt="KBN Logo"
                className="w-9 h-9 rounded-xl object-cover shadow-sm"
              />
              <div>
                <span className="font-serif text-lg font-bold text-[var(--text-primary)]">
                  Kingdom Builders Network
                </span>
                <p className="text-[11px] text-[var(--text-tertiary)] -mt-0.5">
                  Payment Verification Gateway
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] hidden sm:inline font-medium">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  navigate("/login", { replace: true })
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </header>
      ) : (
        <Navbar
          onPublicPage={(page) => navigate(`/${page}`)}
          onHome={() => navigate("/")}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
          {/* Page Heading & Status Banner */}
          <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-light)] pb-6 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--brand)]/10 text-[var(--brand)] mb-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
                  {isPaymentStep && isUnderVerification
                    ? "Payment Verification Status"
                    : isPaymentStep
                    ? "Step 2 of 2 • Upload & Verify Payment Receipt"
                    : "Step 1 of 2 • Category Selection"}
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)]">
                  {isPaymentStep && isUnderVerification
                    ? "Submission Under Review"
                    : isPaymentStep
                    ? "Upload & Verify Payment Receipt"
                    : "Choose Your Membership Package"}
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
                  {isPaymentStep && isUnderVerification
                    ? "Your payment details have been submitted and are currently being reviewed by the administrative team."
                    : isPaymentStep && selectedCategory
                    ? `Transfer your membership fee for ${selectedCategory.name} (${selectedCategory.formattedPrice}) to the official receiver details below, then upload your receipt.`
                    : "Select one of the 4 membership categories below. Once chosen, you will be redirected to the official payment credentials and receipt upload page."}
                </p>
              </div>

              {user && (
                <div className="flex items-center gap-3 bg-[var(--surface-alt)] border border-[var(--border-light)] px-4 py-2.5 rounded-2xl flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                      Account Status
                    </p>
                    <p className="text-xs font-semibold text-[var(--text-primary)] capitalize">
                      {user.status || "Pending"}
                    </p>
                  </div>
                  <span
                    className={`w-3 h-3 rounded-full ${
                      user.status === "active"
                        ? "bg-emerald-500 ring-4 ring-emerald-100"
                        : "bg-amber-500 ring-4 ring-amber-100 animate-pulse"
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Step Progress Breadcrumb */}
            {(!isPaymentStep || !isUnderVerification) && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={isPaymentStep ? handleBackToCategories : undefined}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                      !isPaymentStep
                        ? "bg-[var(--brand)] text-white shadow-xs"
                        : "bg-[var(--surface-alt)] text-[var(--text-primary)] hover:bg-[var(--border-light)] cursor-pointer border border-[var(--border-default)]"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        !isPaymentStep
                          ? "bg-white text-[var(--brand)]"
                          : "bg-emerald-500 text-white"
                      }`}
                    >
                      {isPaymentStep ? "✓" : "1"}
                    </span>
                    <span>1. Select Category</span>
                  </button>

                  <span className="text-[var(--border-default)] font-bold">→</span>

                  <div
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                      isPaymentStep
                        ? "bg-[var(--brand)] text-white shadow-xs"
                        : "bg-[var(--surface-alt)] text-[var(--text-tertiary)] border border-[var(--border-light)]"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isPaymentStep
                          ? "bg-white text-[var(--brand)]"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      2
                    </span>
                    <span>2. Upload & Verify Payment Receipt</span>
                  </div>
                </div>

                {isPaymentStep && (
                  <button
                    type="button"
                    onClick={handleBackToCategories}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                  >
                    ← Change Category
                  </button>
                )}
              </div>
            )}
          </div>

          {/* VIEW MODE 1: UNDER VERIFICATION (When on verify step and submission is pending) */}
          {isPaymentStep && isUnderVerification ? (
            <div className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-10 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-light)] pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
                    ⏳
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 mb-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Payment Under Verification
                    </div>
                    <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                      Submission Under Review
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={checkingStatus}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-[var(--text-primary)] bg-white border border-[var(--border-default)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {checkingStatus ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
                      <span>Checking Status...</span>
                    </>
                  ) : (
                    <>
                      <span>↻ Check Verification Status</span>
                    </>
                  )}
                </button>
              </div>

              {/* Primary Under Verification Alert */}
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2">
                <p className="font-semibold text-sm leading-relaxed">
                  {verificationMessage}
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Our administrative team has received your payment details and is reviewing them. Your account will automatically activate as soon as review is completed.
                </p>
              </div>

              {statusCheckFeedback && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                  {statusCheckFeedback}
                </div>
              )}

              {/* Submission Summary Details */}
              <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                  Submission Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-semibold">
                      Membership Package
                    </p>
                    <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                      {submittedPayment?.membershipCategoryLabel ||
                        getMembershipCategoryLabel(submittedPayment?.membershipCategory) ||
                        selectedCategory?.name ||
                        "Standard Membership"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-semibold">
                      Payment Amount
                    </p>
                    <p className="text-sm font-bold text-[var(--brand)] mt-0.5">
                      {submittedPayment?.amount && Number(submittedPayment.amount) > 0
                        ? `ETB ${Number(submittedPayment.amount).toLocaleString()}`
                        : selectedCategory
                        ? selectedCategory.formattedPrice
                        : "Under Review"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-semibold">
                      Status
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Under Verification
                    </span>
                  </div>
                </div>
              </div>

              {/* Duplicate Prevention Notice: Form is hidden and locked */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[var(--text-secondary)] flex items-start gap-3">
                <span className="text-base leading-none">🔒</span>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    Duplicate Submissions Prevented
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
                    The payment upload form has been disabled while your current submission is under verification. You will be notified once the administrator completes verification.
                  </p>
                </div>
              </div>
            </div>
          ) : isPaymentStep && selectedCategory ? (
            /* VIEW MODE 2: STEP 2 - PAYMENT CREDENTIALS & RECEIPT UPLOAD (SEPARATE PAGE) */
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              {/* Selected Category Summary Card */}
              <div className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-amber-300 mb-2">
                    Tier {selectedCategory.tier} • Selected Package
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-white">
                    {selectedCategory.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    {selectedCategory.description}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-white/15 pt-3 sm:pt-0 sm:pl-6 shrink-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold block">
                    Required Transfer Fee
                  </span>
                  <span className="text-2xl font-serif font-black text-amber-400">
                    ETB {selectedCategory.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={handleBackToCategories}
                    className="mt-2 text-xs font-semibold text-white/80 hover:text-white underline underline-offset-2 cursor-pointer"
                  >
                    Change Package
                  </button>
                </div>
              </div>

              {/* Official Receiver Payment Credentials */}
              <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-light)] pb-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Official Receiver Payment Credentials
                    </h2>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                      Please make your bank or mobile transfer to this verified account:
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[var(--accent-dark)] font-semibold bg-amber-50 border border-amber-200 self-start sm:self-auto">
                    <span>✓</span> Verified Beneficiary
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Beneficiary Name */}
                  <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-4 flex flex-col justify-center">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-semibold">
                      Receiver / Beneficiary Name
                    </p>
                    <p className="text-base font-bold text-[var(--text-primary)] truncate mt-0.5">
                      {OFFICIAL_RECEIVER.accountName}
                    </p>
                  </div>

                  {/* Account Number */}
                  <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-semibold">
                        Receiver Account Number ({OFFICIAL_RECEIVER.bankName})
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-base font-mono font-bold text-[var(--text-primary)] tracking-wider">
                          {OFFICIAL_RECEIVER.accountNumber}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/15">
                          {OFFICIAL_RECEIVER.bankName}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(OFFICIAL_RECEIVER.accountNumber, "account")}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[var(--border-default)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer shadow-xs"
                    >
                      {copiedField === "account" ? "✓ Copied" : "Copy Number"}
                    </button>
                  </div>

                  {/* Required Transfer Amount */}
                  <div className="rounded-2xl border p-4 flex items-center justify-between gap-3 bg-amber-50/70 border-[var(--accent)] shadow-xs">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-semibold">
                        Required Transfer Amount
                      </p>
                      <div className="mt-0.5">
                        <p className="text-lg font-serif font-black text-[var(--brand)]">
                          ETB {selectedCategory.amount.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-[var(--accent-dark)] font-medium truncate">
                          {selectedCategory.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(selectedCategory.amount), "amount")}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[var(--border-default)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer shadow-xs"
                    >
                      {copiedField === "amount" ? "✓ Copied" : "Copy Amount"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload & Verify Payment Receipt Section */}
              <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-[var(--border-light)] pb-4">
                  <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                    Upload & Verify Payment Receipt
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Attach your bank or mobile payment confirmation receipt for{" "}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {selectedCategory.name} (ETB {selectedCategory.amount.toLocaleString()})
                    </span>
                    .
                  </p>
                </div>

                {/* Error Banner */}
                {clientError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-fade-in">
                    <span className="text-lg leading-none">⚠️</span>
                    <div className="flex-1">
                      <p className="font-semibold text-xs uppercase tracking-wide">Submission Issue</p>
                      <p className="text-xs mt-0.5">{clientError}</p>
                    </div>
                  </div>
                )}

                {/* Upload Form */}
                <form onSubmit={handleSubmitVerification} className="space-y-5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={loading}
                  />

                  {/* Dropzone Container */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (!file && !loading) {
                        fileInputRef.current?.click()
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
                      dragActive
                        ? "border-[var(--brand)] bg-[var(--brand)]/5 scale-[1.01]"
                        : file
                        ? "border-emerald-300 bg-emerald-50/20"
                        : "border-[var(--border-default)] hover:border-[var(--brand)] bg-[var(--surface-alt)]/50 cursor-pointer"
                    }`}
                  >
                    {/* Loading State */}
                    {loading ? (
                      <div className="py-8 space-y-4">
                        <div className="w-12 h-12 border-3 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin mx-auto" />
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            Submitting Payment Receipt...
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-sm mx-auto">
                            Your receipt is being submitted and will be reviewed by our administration team. Please wait a moment...
                          </p>
                        </div>
                      </div>
                    ) : file ? (
                      /* File Selected State */
                      <div className="space-y-4">
                        {filePreview ? (
                          <div className="relative inline-block">
                            <img
                              src={filePreview}
                              alt="Receipt Preview"
                              className="max-h-56 mx-auto rounded-2xl object-contain shadow-sm border border-[var(--border-light)] bg-white p-1"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto text-2xl font-bold">
                            📄
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-md mx-auto">
                            {file.name}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || "Document"}
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              fileInputRef.current?.click()
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[var(--border-default)] hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                          >
                            Change Receipt
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClearFile()
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Empty State */
                      <div className="py-6 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto text-2xl">
                          🧾
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            Drop your payment receipt here, or{" "}
                            <span className="text-[var(--brand)] underline underline-offset-2">
                              browse files
                            </span>
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            Accepts all image formats (PNG, JPG, WEBP, HEIC, GIF, BMP, SVG, TIFF, AVIF) or PDF (up to 10MB) • For {selectedCategory.formattedPrice}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] bg-white px-3 py-1 rounded-full border border-[var(--border-light)] shadow-2xs">
                          <span>🔒</span> Secure & Encrypted Upload
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading || !file}
                      className="flex-1 py-3.5 px-6 rounded-2xl font-semibold text-sm text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting Receipt for Review...</span>
                        </>
                      ) : !file ? (
                        <span>Attach Receipt to Submit ({selectedCategory.formattedPrice})</span>
                      ) : (
                        <>
                          <span>Submit Receipt for Review ({selectedCategory.formattedPrice})</span>
                          <span aria-hidden="true">→</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleBackToCategories}
                      className="py-3.5 px-5 rounded-2xl font-semibold text-sm text-[var(--text-secondary)] bg-white border border-[var(--border-default)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* VIEW MODE 3: STEP 1 - MEMBERSHIP CATEGORY SELECTION (FIRST PAGE ACROSS ALL DEVICES) */
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-light)] pb-4">
                  <div>
                    <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                      Choose Your Membership Package
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
                      Select one of the 4 membership categories below. Once chosen, you will be redirected to the official payment credentials and receipt upload page.
                    </p>
                  </div>

                  {selectedCategory && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold self-start sm:self-auto">
                      <span>✓ Selected:</span>
                      <span className="font-bold">{selectedCategory.formattedPrice}</span>
                    </div>
                  )}
                </div>

                {/* Under Review Notice Banner if user already submitted a payment */}
                {isUnderVerification && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0">
                        ⏳
                      </div>
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wide text-amber-900">
                          Current Payment Under Review
                        </p>
                        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                          {verificationMessage} You can still re-select a membership package below if needed.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={handleRefreshStatus}
                        disabled={checkingStatus}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        {checkingStatus ? "Checking..." : "↻ Check Status"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/payment/verify")}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-2xs cursor-pointer"
                      >
                        View Submission Details →
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {clientError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-fade-in">
                    <span className="text-lg leading-none">⚠️</span>
                    <div className="flex-1">
                      <p className="font-semibold text-xs uppercase tracking-wide">Selection Required</p>
                      <p className="text-xs mt-0.5">{clientError}</p>
                    </div>
                  </div>
                )}

                {/* 4 Category Selection Cards */}
                <div
                  role="radiogroup"
                  aria-label="Membership Category Selection"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id
                    return (
                      <div
                        key={cat.id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => {
                          setSelectedCategoryId(cat.id)
                          setClientError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault()
                            setSelectedCategoryId(cat.id)
                            setClientError(null)
                          }
                        }}
                        className={`relative rounded-2xl p-5 flex flex-col justify-between text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-2 border-[var(--accent)] bg-amber-50/40 shadow-md ring-2 ring-[var(--accent)]/30 -translate-y-0.5"
                            : "border border-[var(--border-light)] bg-white hover:border-[var(--brand)]/40 hover:shadow-sm"
                        }`}
                      >
                        {/* Top Badges & Custom Radio Indicator */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                cat.tier === 1
                                  ? "bg-slate-100 text-slate-700"
                                  : cat.tier === 2
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : cat.tier === 3
                                  ? "bg-blue-50 text-[var(--brand)] border border-blue-100"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              Tier {cat.tier}
                            </span>

                            {cat.popular && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[var(--accent)] text-white shadow-2xs">
                                Popular
                              </span>
                            )}

                            {/* Radio Circle */}
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="font-serif text-base font-bold text-[var(--text-primary)] leading-snug">
                            {cat.name}
                          </h3>

                          {/* Description */}
                          <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed line-clamp-3">
                            {cat.description}
                          </p>
                        </div>

                        {/* Price & Action Section */}
                        <div className="pt-5 mt-4 border-t border-[var(--border-light)]/60 space-y-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                              Price (ETB)
                            </p>
                            <p className="text-2xl font-serif font-black text-[var(--brand)]">
                              ETB {cat.amount.toLocaleString()}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={savingCategory}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProceedToPayment(cat.id)
                            }}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                              isSelected
                                ? "bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white shadow-xs"
                                : "bg-[var(--brand)] hover:bg-[var(--brand-light)] text-white"
                            } ${savingCategory ? "opacity-70 cursor-not-allowed" : ""}`}
                          >
                            {savingCategory && selectedCategoryId === cat.id ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <span>Select & Continue</span>
                                <span aria-hidden="true">→</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Primary Proceed Action Bar */}
                <div className="pt-4 border-t border-[var(--border-light)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {selectedCategory
                      ? `Selected: ${selectedCategory.name} (${selectedCategory.formattedPrice})`
                      : "Please select a membership category above to continue to the payment instructions."}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleProceedToPayment()}
                    disabled={!selectedCategory || savingCategory}
                    className="py-3.5 px-7 rounded-2xl font-semibold text-sm text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {savingCategory ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Selection...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {selectedCategory
                            ? `Proceed to Payment (${selectedCategory.formattedPrice})`
                            : "Select a Category to Proceed"}
                        </span>
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[var(--text-tertiary)] border-t border-[var(--border-light)] bg-white">
        © {new Date().getFullYear()} Kingdom Builders Network. Official Payment Gateway.
      </footer>
    </div>
  )
}
