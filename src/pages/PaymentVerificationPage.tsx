import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { baseApi } from "../api/baseApi"
import { verifyPaymentReceipt } from "../api/paymentApi"
import { getMe } from "../auth/auth"

const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

interface PaymentValidity {
  isActive: boolean
  expirationDate?: string
  daysRemaining?: number
  lastPaymentDate?: string
  hasPayment?: boolean
  isValid?: boolean
  latestPayment?: {
    status?: string
    amount?: string | number
    reference?: string | null
    provider?: string | null
  } | null
}

const DEFAULT_UNDER_REVIEW_MSG =
  "Your payment has been submitted successfully and is currently under verification. Please wait while the admin reviews your payment."

export default function PaymentVerificationPage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [isUnderVerification, setIsUnderVerification] = useState(false)
  const [underVerificationMessage, setUnderVerificationMessage] = useState(DEFAULT_UNDER_REVIEW_MSG)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validity, setValidity] = useState<PaymentValidity | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect if already active
  useEffect(() => {
    if (user && user.status === "active") {
      navigate("/", { replace: true })
    }
  }, [user, navigate])

  // Load existing validity status if available
  useEffect(() => {
    let active = true
    baseApi
      .get<PaymentValidity>("/payments/status")
      .then((res) => {
        if (active && res.success && res.data) {
          setValidity(res.data)
          const latestStatus = res.data.latestPayment?.status?.toLowerCase()
          if (latestStatus === "pending" || (!res.data.isValid && res.data.hasPayment)) {
            setIsUnderVerification(true)
            setUnderVerificationMessage(
              "Your payment is under verification. Please wait while the admin reviews your payment."
            )
          }
        }
      })
      .catch(() => {
        // Non-blocking
      })

    return () => {
      active = false
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
    const selected = e.target.files?.[0]
    if (!selected) {
      setFile(null)
      setFilePreview(null)
      return
    }

    if (!selected.type.startsWith("image/") && selected.type !== "application/pdf") {
      setErrorMessage("Please select an image file (PNG, JPG, JPEG) or PDF receipt.")
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      setErrorMessage("Receipt image must be smaller than 10MB.")
      return
    }

    setFile(selected)
    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected)
      setFilePreview(url)
    } else {
      setFilePreview(null)
    }
  }

  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setErrorMessage("Please select a payment receipt to submit.")
      return
    }

    setUploading(true)
    setErrorMessage(null)

    try {
      const res = await verifyPaymentReceipt(file)

      // 1. After successful submission: Display under verification message
      // 2. Prevent duplicate submissions: Hide the upload form
      // 3. Handle backend errors correctly: Display under verification message
      setIsUnderVerification(true)
      setUnderVerificationMessage(
        res.message || DEFAULT_UNDER_REVIEW_MSG
      )
      setFile(null)
      setFilePreview(null)

      // Refresh user status from DB
      const freshUser = await getMe()
      if (freshUser) {
        updateUser(freshUser)
        if (freshUser.status === "active") {
          setTimeout(() => {
            navigate("/", { replace: true })
          }, 1200)
          return
        }
      }
    } catch {
      // Backend error fallback: Display under verification message and lock form
      setIsUnderVerification(true)
      setUnderVerificationMessage(DEFAULT_UNDER_REVIEW_MSG)
      setFile(null)
      setFilePreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRefreshStatus = async () => {
    setChecking(true)
    setErrorMessage(null)
    try {
      const freshUser = await getMe()
      if (freshUser) {
        updateUser(freshUser)
        if (freshUser.status === "active") {
          navigate("/", { replace: true })
          return
        }
      }
      setUnderVerificationMessage(
        "Your payment is under verification. Please wait while the admin reviews your payment."
      )
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to check status at this time.")
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  const isPending = (user?.status || "pending") === "pending"

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] flex flex-col justify-between">
      {/* Restricted Header: Logo, User Badge, and Logout only */}
      <header className="bg-white border-b border-[var(--border-light)] px-4 sm:px-8 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={knbLogo}
              alt="KBN Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-sm"
            />
            <span className="font-serif text-lg font-bold text-[var(--text-primary)]">
              KBN Membership
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-secondary)] hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-10 shadow-sm animate-fade-in space-y-8">
          {/* Status Badge & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Account Status: {user?.status || "PENDING"}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)]">
              {isUnderVerification
                ? "Payment Under Verification"
                : isPending
                ? "Payment Verification Required"
                : "Membership Renewal Required"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
              {isUnderVerification
                ? "Your payment submission has been received and is currently under review by our team."
                : isPending
                ? "Welcome to Kingdom Builders Network! Your account is currently pending payment verification. Please submit your payment receipt below to activate your account."
                : "Your KBN membership is currently inactive. Please submit a renewal payment receipt to restore full access."}
            </p>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <span className="font-bold text-base">⚠️</span>
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Under Verification State (Hides the form to prevent duplicate submissions) */}
          {isUnderVerification ? (
            <section className="bg-amber-50/70 rounded-2xl p-6 sm:p-8 border border-amber-200 space-y-5 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center text-xl flex-shrink-0">
                  ⏳
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                    Verification In Progress
                  </h2>
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">
                    {underVerificationMessage}
                  </p>
                </div>
              </div>

              {/* Duplicate Prevention Notice */}
              <div className="p-4 rounded-xl bg-white/80 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-3">
                <span className="text-base">🔒</span>
                <span>
                  The payment submission form is disabled while your current submission is under verification. Duplicate submissions are not allowed while an existing payment is being reviewed.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={checking}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-semibold text-xs text-[var(--text-primary)] bg-white border border-[var(--border-default)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  {checking ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    "↻ Refresh Status"
                  )}
                </button>
              </div>
            </section>
          ) : (
            /* Payment Instructions & Upload Form (Visible only when no payment is pending verification) */
            <section className="bg-[var(--surface-alt)] rounded-2xl p-6 border border-[var(--border-light)] space-y-6">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                  Upload Payment Receipt
                </h2>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Accepted formats: PNG, JPG, JPEG, PDF (max 10MB).
                </p>
              </div>

              <form onSubmit={handleUploadReceipt} className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--brand)] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                    className="hidden"
                    disabled={uploading}
                  />

                  {filePreview ? (
                    <div className="space-y-3">
                      <img
                        src={filePreview}
                        alt="Receipt preview"
                        className="max-h-48 mx-auto rounded-xl object-contain shadow-sm"
                      />
                      <p className="text-xs font-semibold text-[var(--brand)] truncate max-w-xs mx-auto">
                        {file?.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        Click to change file
                      </p>
                    </div>
                  ) : file ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto text-xl font-bold">
                        📄
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {file.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto text-xl font-bold">
                        🧾
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Click to choose receipt file
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        or drag and drop receipt image here
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="flex-1 py-3 px-5 rounded-xl font-semibold text-sm text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting Receipt...
                      </>
                    ) : (
                      "Submit Receipt for Verification"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleRefreshStatus}
                    disabled={checking}
                    className="py-3 px-5 rounded-xl font-semibold text-sm text-[var(--text-primary)] bg-white border border-[var(--border-default)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {checking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
                        Checking...
                      </>
                    ) : (
                      "Refresh Status"
                    )}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Footer note */}
          <div className="pt-2 text-center text-xs text-[var(--text-tertiary)]">
            Need help? Contact support or an administrator to assist with payment verification.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[var(--text-tertiary)] border-t border-[var(--border-light)] bg-white">
        © {new Date().getFullYear()} Kingdom Builders Network. All rights reserved.
      </footer>
    </div>
  )
}
