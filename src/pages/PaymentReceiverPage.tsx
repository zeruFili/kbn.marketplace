import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import {
  verifyPaymentReceipt,
  fetchPaymentValidity,
  type VerifiedPayment,
} from "../api/paymentApi"
import { getMe } from "../auth/auth"
import Navbar from "../components/Navbar"

const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

// Official receiver payment credentials
const OFFICIAL_RECEIVER = {
  accountName: "KINGDOM BUILDERS MINISTRY",
  accountNumber: "0012521619011",
  supportedBanks: [
    { name: "Awash Bank", type: "IPS Transfer / Mobile", badge: "Awash" },
    { name: "Bank of Abyssinia", type: "BoA Mobile / Transfer", badge: "BoA" },
    { name: "Commercial Bank of Ethiopia", type: "CBE / CBE Birr", badge: "CBE" },
    { name: "Telebirr", type: "SuperApp / Mobile Transfer", badge: "Telebirr" },
    { name: "Zemen Bank", type: "Online Banking", badge: "Zemen" },
  ],
}

const DEFAULT_UNDER_REVIEW_MESSAGE =
  "Your payment has been submitted successfully and is currently under verification. Please wait while the admin reviews your payment."

export default function PaymentReceiverPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Under verification / duplicate prevention state
  const [isUnderVerification, setIsUnderVerification] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState<string>(DEFAULT_UNDER_REVIEW_MESSAGE)
  const [submittedPayment, setSubmittedPayment] = useState<VerifiedPayment | null>(null)
  const [statusCheckFeedback, setStatusCheckFeedback] = useState<string | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect if already active
  useEffect(() => {
    if (user && user.status === "active") {
      navigate("/", { replace: true })
    }
  }, [user, navigate])

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

    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ]

    if (!validTypes.includes(selected.type) && !/\.(png|jpe?g|webp|pdf)$/i.test(selected.name)) {
      setClientError("Please select a valid receipt image (PNG, JPG, WEBP) or PDF file.")
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

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setClientError("Please choose or drag-and-drop a payment receipt first.")
      return
    }

    setLoading(true)
    setClientError(null)
    setStatusCheckFeedback(null)

    try {
      const response = await verifyPaymentReceipt(file)

      // 1. After successful submission: Display under verification message
      // 2. Prevent duplicate submissions: Lock and hide form
      // 3. Handle backend errors correctly: Display under verification message
      setIsUnderVerification(true)
      setVerificationMessage(
        response.message || DEFAULT_UNDER_REVIEW_MESSAGE
      )

      if (response.data) {
        setSubmittedPayment(response.data)
      }

      // Check if user account was immediately activated in backend
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
      // Backend error fallback: Always display the "under verification" message
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
          setStatusCheckFeedback("Your account is now active! Redirecting to marketplace...")
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
      {/* Top Navigation */}
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
        <div className="space-y-8 animate-fade-in">
          {/* Page Heading & Status Banner */}
          <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-light)] pb-6 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--brand)]/10 text-[var(--brand)] mb-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
                  Payment Verification Portal
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)]">
                  Payment Receiver & Verification
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
                  Transfer your membership or service fee to the official receiver details below, then upload your transaction receipt for verification via <code className="bg-slate-100 text-[11px] px-1.5 py-0.5 rounded font-mono">api/v1/payments/verify</code>.
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

            {/* Official Receiver Credentials */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Official Receiver Payment Credentials
                </h2>
                <span className="text-xs text-[var(--accent-dark)] font-medium">
                  Verified Platform Beneficiary
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Beneficiary Name */}
                <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-semibold">
                      Receiver / Beneficiary Name
                    </p>
                    <p className="text-base font-bold text-[var(--text-primary)] truncate mt-0.5">
                      {OFFICIAL_RECEIVER.accountName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(OFFICIAL_RECEIVER.accountName, "name")}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[var(--border-default)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedField === "name" ? "✓ Copied" : "Copy Name"}
                  </button>
                </div>

                {/* Account Number */}
                <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-semibold">
                      Receiver Account Number (IPS / Core)
                    </p>
                    <p className="text-base font-mono font-bold text-[var(--text-primary)] tracking-wider mt-0.5">
                      {OFFICIAL_RECEIVER.accountNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(OFFICIAL_RECEIVER.accountNumber, "account")}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[var(--border-default)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedField === "account" ? "✓ Copied" : "Copy Number"}
                  </button>
                </div>
              </div>

             
            </div>
          </div>

          {/* Under Verification Banner (When submitted or existing pending payment) */}
          {isUnderVerification ? (
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

              {/* Status Feedback banner */}
              {statusCheckFeedback && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 animate-fade-in">
                  <span>ℹ️</span>
                  <span>{statusCheckFeedback}</span>
                </div>
              )}

           

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
          ) : (
            /* Upload Form Section (Shown ONLY when no payment is pending verification) */
            <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-[var(--border-light)] pb-4">
                <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                  Upload & Verify Payment Receipt
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Attach your transfer confirmation screenshot or document to run automated bank verification against the receiver account.
                </p>
              </div>

              {/* Error Message Banner */}
              {clientError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-fade-in">
                  <span className="text-lg leading-none">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold text-xs uppercase tracking-wide">Submission Issue</p>
                    <p className="text-xs mt-0.5">{clientError}</p>
                  </div>
                </div>
              )}

              {/* Upload Area & Form */}
              <form onSubmit={handleSubmitVerification} className="space-y-5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
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
                  {/* 1. Loading State */}
                  {loading ? (
                    <div className="py-8 space-y-4">
                      <div className="w-12 h-12 border-3 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Submitting & Verifying Receipt...
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-sm mx-auto">
                          Processing receipt image via <code className="font-mono text-[10px]">api/v1/payments/verify</code>.
                        </p>
                      </div>
                    </div>
                  ) : file ? (
                    /* 2. File Selected State */
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
                    /* 3. Empty State */
                    <div className="py-6 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto text-2xl">
                        🧾
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Drop your payment receipt here, or <span className="text-[var(--brand)] underline underline-offset-2">browse files</span>
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                          Accepts PNG, JPG, JPEG, WEBP, or PDF (up to 10MB)
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] bg-white px-3 py-1 rounded-full border border-[var(--border-light)] shadow-2xs">
                        <span>🔒</span> Authenticated via Bearer Token
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
                        <span>Submitting to api/v1/payments/verify...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Receipt for Verification</span>
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>

                  {file && !loading && (
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="py-3.5 px-5 rounded-2xl font-semibold text-sm text-[var(--text-secondary)] bg-white border border-[var(--border-default)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
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
