import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { resendRegistrationOtp } from "../auth/auth"
const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

export default function SignUpPage({
  onBack,
  onSwitch,
  onSuccess,
}: {
  onBack?: () => void
  onSwitch?: () => void
  onSuccess?: () => void
} = {}) {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  // Form State
  const [step, setStep] = useState<"form" | "otp">("form")
  const [otpMethod, setOtpMethod] = useState<"sms" | "email">("sms")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [business, setBusiness] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Status and Error State
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // OTP State (Step 2 & 3)
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [identifier, setIdentifier] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState("")
  const [otpError, setOtpError] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [step, countdown])

  const handleBack = () => {
    if (step === "otp") {
      setStep("form")
      return
    }
    if (onBack) onBack()
    else navigate("/login")
  }

  const handleSwitch = () => {
    if (onSwitch) onSwitch()
    else navigate("/login")
  }

  // Step 1: Submit Registration Form (Without OTP)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Please enter your full name.")
      return
    }
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.")
      return
    }
    if (otpMethod === "sms") {
      if (!phone.trim()) {
        setError("Please enter your phone number to receive your OTP via SMS.")
        return
      }
      const cleanPhone = phone.trim().replace(/[\s\-]/g, "")
      const phoneRegex = /^(\+?[1-9]\d{7,14}|0[79]\d{8})$/
      if (!phoneRegex.test(cleanPhone)) {
        setError("Please enter a valid phone number (e.g., 0911002233 or +251911002233).")
        return
      }
    } else {
      if (phone.trim()) {
        const cleanPhone = phone.trim().replace(/[\s\-]/g, "")
        const phoneRegex = /^(\+?[1-9]\d{7,14}|0[79]\d{8})$/
        if (!phoneRegex.test(cleanPhone)) {
          setError("Please enter a valid phone number format or leave it blank.")
          return
        }
      }
    }
    if (!password) {
      setError("Please enter a password.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.")
      return
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.")
      return
    }
    if (!/\d/.test(password)) {
      setError("Password must contain at least one number.")
      return
    }
    if (!/[^\da-zA-Z]/.test(password)) {
      setError("Password must contain at least one special character (!@#$%^&* etc.).")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        setError("Profile image must be less than 5MB.")
        return
      }
      if (!imageFile.type.startsWith("image/")) {
        setError("Please select a valid image file.")
        return
      }
    }

    setLoading(true)
    try {
      const res = await signUp({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        business: business.trim() || undefined,
        profileImage: imageFile,
        otpMethod,
      })

      // Backend returns requiresOtp: true
      if (res.requiresOtp) {
        const targetId = res.identifier || (otpMethod === "email" ? email.trim() : phone.trim())
        setIdentifier(targetId)
        if (res.otpMethod) {
          setOtpMethod(res.otpMethod)
        }
        setStep("otp")
        setCountdown(60)
        setOtp(["", "", "", "", "", ""])
        setOtpError("")
        setResendSuccess("")
        setTimeout(() => {
          otpInputRefs.current[0]?.focus()
        }, 100)
        return
      }

      // In case server created user directly
      if (res.user) {
        handlePostRegistrationSuccess(res.user)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed.")
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Complete Registration (With OTP)
  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault()
    setOtpError("")
    const code = otp.join("").trim()
    if (code.length !== 6) {
      setOtpError("Please enter all 6 digits of the verification code.")
      return
    }

    setOtpLoading(true)
    try {
      const res = await signUp({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        business: business.trim() || undefined,
        profileImage: imageFile,
        otp: code,
        otpMethod,
      })

      if (res.user) {
        handlePostRegistrationSuccess(res.user)
      } else {
        throw new Error(res.message || "Failed to complete registration.")
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Verification failed.")
    } finally {
      setOtpLoading(false)
    }
  }

  // Step 4: Resend OTP
  async function handleResendOtp() {
    if (countdown > 0 || isResending) return
    setIsResending(true)
    setOtpError("")
    setResendSuccess("")

    const target = identifier || (otpMethod === "email" ? email.trim() : phone.trim())
    try {
      const res = await resendRegistrationOtp(target, otpMethod)
      setResendSuccess(
        res.message || (otpMethod === "email"
          ? "A new verification code was sent to your email."
          : "A new verification code was sent to your phone via SMS.")
      )
      setCountdown(60)
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Failed to resend verification code.")
    } finally {
      setIsResending(false)
    }
  }

  function handlePostRegistrationSuccess(user: any) {
    if (onSuccess) {
      onSuccess()
    } else {
      const userStatus = (user?.status || "pending").toLowerCase()
      if (userStatus === "pending" || userStatus === "inactive") {
        navigate("/payment", { replace: true })
      } else if (userStatus === "suspended") {
        navigate("/account-status", { replace: true })
      } else {
        navigate("/", { replace: true })
      }
    }
  }

  // OTP Input handlers
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (!cleaned) {
      const newOtp = [...otp]
      newOtp[index] = ""
      setOtp(newOtp)
      return
    }

    const digit = cleaned.slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || ""
    }
    setOtp(newOtp)
    const focusIndex = Math.min(pasted.length, 5)
    otpInputRefs.current[focusIndex]?.focus()
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        

        <a
          href={import.meta.env.BASE_URL}
          className="flex items-center gap-2.5 justify-center mb-10 group"
        >
          <img
            src={knbLogo}
            alt="KBN Logo"
            className="w-10 h-10 rounded-xl object-cover group-hover:scale-105 transition-transform shadow-lg shadow-[var(--brand)]/20"
          />
          <span className="font-serif text-xl text-[var(--text-primary)]">
            KBN
          </span>
        </a>

        {step === "otp" ? (
          /* Step 2: Prompt for OTP on Frontend */
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-8 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto mb-4">
              {otpMethod === "email" ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>

            <h1 className="font-serif text-2xl text-[var(--text-primary)] text-center mb-1">
              {otpMethod === "email" ? "Verify your email" : "Verify your phone"}
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] text-center mb-6">
              Enter the 6-digit verification code sent {otpMethod === "email" ? "via email to" : "via SMS to"}{" "}
              <strong className="text-[var(--text-primary)] font-semibold">
                {identifier || (otpMethod === "email" ? email : phone)}
              </strong>
            </p>
            {otpMethod === "email" && (
              <div className="text-xs text-center text-[var(--text-tertiary)] -mt-3 mb-5 bg-[var(--surface-alt)] p-2.5 rounded-xl border border-[var(--border-default)]">
                📧 Please check your Google (Gmail) inbox and spam folder.
              </div>
            )}

            {resendSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 mb-6 animate-scale-in">
                <svg
                  className="w-5 h-5 text-emerald-500 flex-shrink-0"
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
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {resendSuccess}
                </p>
              </div>
            )}

            {otpError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-6 animate-scale-in">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{otpError}</p>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              {/* 6 Digit OTP Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all shadow-xs"
                  />
                ))}
              </div>

              {/* Resend Cooldown Section */}
              <div className="text-center text-xs text-[var(--text-tertiary)]">
                {countdown > 0 ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5 animate-spin text-[var(--brand)]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Resend code in <strong className="text-[var(--brand)]">{countdown}s</strong>
                  </span>
                ) : (
                  <span>
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="font-semibold text-[var(--brand)] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isResending ? "Sending..." : "Resend Code"}
                    </button>
                  </span>
                )}
              </div>

              {/* Verify & Register Button */}
              <button
                type="submit"
                disabled={otpLoading || otp.join("").length < 6}
                className="w-full bg-[var(--accent)] text-[var(--brand-dark)] text-sm font-bold py-3 rounded-xl hover:bg-[var(--accent-dark)] transition-colors shadow-lg shadow-[var(--accent)]/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {otpLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying & Registering...
                  </>
                ) : (
                  "Verify & Register"
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-full text-center text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {otpMethod === "email"
                  ? "Incorrect email or want to change method? Edit details"
                  : "Incorrect phone number or want to change method? Edit details"}
              </button>
            </form>
          </div>
        ) : (
          /* Step 1: Initial Registration Form */
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-8 shadow-sm">
            <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-1">
              Create your account
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] mb-8">
              Join the Kingdom Builders Network community
            </p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-6 animate-scale-in">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl">
                <div className="relative w-14 h-14 rounded-xl bg-[var(--surface)] border border-[var(--border-light)] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-7 h-7 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Profile Photo <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium text-[var(--brand)] bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {imageFile ? "Change" : "Upload Photo"}
                    </button>
                    {imageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                        className="text-xs text-red-500 hover:text-red-600 px-2 py-1.5 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setError("Profile image must be less than 5MB.")
                          return
                        }
                        setError("")
                        setImageFile(file)
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
                />
              </div>

              {/* Verification Method Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Receive Verification Code Via <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOtpMethod("sms")}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      otpMethod === "sms"
                        ? "border-[var(--brand)] bg-[var(--brand)]/10 ring-1 ring-[var(--brand)] shadow-xs"
                        : "border-[var(--border-default)] bg-[var(--surface-alt)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${otpMethod === "sms" ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--text-tertiary)]"}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className={`block text-xs font-bold ${otpMethod === "sms" ? "text-[var(--brand)]" : "text-[var(--text-primary)]"}`}>
                        SMS OTP
                      </span>
                      <span className="text-[11px] text-[var(--text-tertiary)] leading-tight block">
                        Via phone text
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpMethod("email")}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      otpMethod === "email"
                        ? "border-[var(--brand)] bg-[var(--brand)]/10 ring-1 ring-[var(--brand)] shadow-xs"
                        : "border-[var(--border-default)] bg-[var(--surface-alt)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${otpMethod === "email" ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--text-tertiary)]"}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className={`block text-xs font-bold ${otpMethod === "email" ? "text-[var(--brand)]" : "text-[var(--text-primary)]"}`}>
                        Email OTP
                      </span>
                      <span className="text-[11px] text-[var(--text-tertiary)] leading-tight block">
                        Via Google / Gmail
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
                />
                {otpMethod === "email" && (
                  <p className="text-xs text-[var(--brand)] mt-1 font-medium flex items-center gap-1">
                    <span>✓</span> Verification code will be sent to this email address.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Phone Number {otpMethod === "sms" ? <span className="text-red-500">*</span> : <span className="text-xs text-[var(--text-tertiary)] font-normal">(optional)</span>}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0911002233"
                  autoComplete="tel"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {otpMethod === "sms"
                    ? "We'll send a 6-digit SMS verification code to this phone number."
                    : "Your contact phone number (optional when verifying via email)."}
                </p>
              </div>

              

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 chars (upper, lower, digit, symbol)"
                    autoComplete="new-password"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 pr-12 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {showPassword ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
                  Must include 8+ characters, uppercase, lowercase, number, and special symbol.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--accent)] text-[var(--brand-dark)] text-sm font-bold py-3 rounded-xl hover:bg-[var(--accent-dark)] transition-colors shadow-lg shadow-[var(--accent)]/30 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>{" "}
                    Sending verification code...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-xs text-[var(--text-tertiary)] text-center mt-5">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>

            <p className="text-sm text-center text-[var(--text-tertiary)] mt-5 pt-5 border-t border-[var(--border-light)]">
              Already have an account?{" "}
              <button
                onClick={handleSwitch}
                className="font-semibold text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
