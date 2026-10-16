import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { forgotPasswordApi, resetPasswordWithOtpApi } from "../api/authApi"

const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Steps: "request" -> "verify" -> "success"
  const [step, setStep] = useState<"request" | "verify" | "success">("request")

  // Form State
  const [identifier, setIdentifier] = useState("")
  const [maskedDestination, setMaskedDestination] = useState("")
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Feedback State
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [loading, setLoading] = useState(false)

  // OTP Countdown & Cooldown
  const [countdown, setCountdown] = useState(60)
  const [isResending, setIsResending] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // If identifier passed from navigation state (e.g. from LoginPage)
  useEffect(() => {
    const passedEmail = (location.state as { email?: string })?.email
    if (passedEmail) {
      setIdentifier(passedEmail)
    }
  }, [location.state])

  // Cooldown timer
  useEffect(() => {
    if (step !== "verify" || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [step, countdown])

  // Auto-focus first OTP input on transition to verify step
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 100)
    }
  }, [step])

  // Handle Step 1: Send OTP
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccessMsg("")

    const cleanIdentifier = identifier.trim()
    if (!cleanIdentifier) {
      setError("Please enter your registered email address or phone number.")
      return
    }

    setLoading(true)
    try {
      const res = await forgotPasswordApi({ identifier: cleanIdentifier })
      if (res.success) {
        const masked = res.data?.maskedDestination || cleanIdentifier
        setMaskedDestination(masked)
        setSuccessMsg(
          res.message || "A 6-digit verification code has been dispatched."
        )
        setStep("verify")
        setCountdown(60)
        setOtp(["", "", "", "", "", ""])
      } else {
        setError(res.message || "Failed to send verification code.")
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send verification code. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  // OTP Box Handlers
  const handleOtpChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, "")
    const newOtp = [...otp]

    if (!cleanDigit) {
      newOtp[index] = ""
      setOtp(newOtp)
      return
    }

    newOtp[index] = cleanDigit.slice(-1)
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

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "")
    if (!pastedData) return

    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || ""
    }
    setOtp(newOtp)

    const focusIdx = Math.min(pastedData.length, 5)
    otpInputRefs.current[focusIdx]?.focus()
  }

  // Handle Resend OTP
  async function handleResendOtp() {
    if (countdown > 0 || isResending) return
    setError("")
    setSuccessMsg("")
    setIsResending(true)

    try {
      const res = await forgotPasswordApi({ identifier: identifier.trim() })
      if (res.success) {
        setCountdown(60)
        setOtp(["", "", "", "", "", ""])
        setSuccessMsg("A new verification code has been sent via SMS.")
        otpInputRefs.current[0]?.focus()
      } else {
        setError(res.message || "Failed to resend code.")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend verification code.")
    } finally {
      setIsResending(false)
    }
  }

  // Password validation checks
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[^\da-zA-Z]/.test(password)
  const isPasswordStrong = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial

  // Handle Step 2: Verify OTP & Reset Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const plainOtp = otp.join("").trim()
    if (plainOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.")
      return
    }

    if (!isPasswordStrong) {
      setError("Please create a password that meets all strength requirements.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both password fields.")
      return
    }

    setLoading(true)
    try {
      const res = await resetPasswordWithOtpApi({
        identifier: identifier.trim(),
        otp: plainOtp,
        password,
        confirmPassword,
      })

      if (res.success) {
        setStep("success")
      } else {
        setError(res.message || "Failed to reset password.")
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please check your verification code."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <button
          onClick={() => navigate("/login")}
          type="button"
          className="flex items-center gap-2.5 justify-center mb-10 group mx-auto cursor-pointer"
        >
          <img
            src={knbLogo}
            alt="KBN Logo"
            className="w-10 h-10 rounded-xl object-cover group-hover:scale-105 transition-transform shadow-lg shadow-[var(--brand)]/20"
          />
          <span className="font-serif text-xl text-[var(--text-primary)]">
            KBN
          </span>
        </button>

        <div className="bg-white rounded-2xl border border-[var(--accent)]/20 p-5 sm:p-8 shadow-[0_18px_45px_rgba(15,29,58,0.08)]">
          {/* STEP 1: Request Code */}
          {step === "request" && (
            <>
              <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-1">
                Forgot Password
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] mb-8">
                Enter your registered email address or phone number. We'll send an OTP code via SMS to your phone to reset your password.
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

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or 0911223344"
                    autoComplete="username"
                    autoFocus
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
                    If you enter your email, the code will be delivered to the phone number registered to your account via SMS.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full bg-[var(--brand)] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-lg shadow-[var(--brand)]/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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
                      </svg>
                      Sending verification code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === "verify" && (
            <>
              <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-1">
                Enter Code & New Password
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">
                We sent a 6-digit verification code to:
              </p>

              {/* Destination badge */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3.5 py-2.5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    {maskedDestination ? `SMS: ${maskedDestination}` : identifier}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("request")
                    setError("")
                  }}
                  className="text-xs text-[var(--brand)] hover:underline font-medium cursor-pointer"
                >
                  Change
                </button>
              </div>

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

              {successMsg && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-6 animate-scale-in">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-800">{successMsg}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* 6 Digit OTP input */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 text-center">
                    6-Digit Verification Code
                  </label>
                  <div
                    className="flex items-center justify-center gap-2 sm:gap-2.5"
                    onPaste={handleOtpPaste}
                  >
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
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all shadow-xs"
                      />
                    ))}
                  </div>

                  {/* Resend Cooldown Section */}
                  <div className="text-center text-xs text-[var(--text-tertiary)] mt-2.5">
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
                        Didn't receive the SMS?{" "}
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
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 pr-12 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Strength Checklist */}
                {password && (
                  <div className="bg-[var(--surface-alt)] p-3 rounded-xl border border-[var(--border-default)] text-xs space-y-1">
                    <p className="font-medium text-[var(--text-secondary)] mb-1">Password Requirements:</p>
                    <div className="grid grid-cols-2 gap-1 text-[var(--text-tertiary)]">
                      <span className={hasMinLength ? "text-green-600 font-medium" : ""}>
                        {hasMinLength ? "✓" : "•"} 8+ characters
                      </span>
                      <span className={hasUpper ? "text-green-600 font-medium" : ""}>
                        {hasUpper ? "✓" : "•"} 1 uppercase letter
                      </span>
                      <span className={hasLower ? "text-green-600 font-medium" : ""}>
                        {hasLower ? "✓" : "•"} 1 lowercase letter
                      </span>
                      <span className={hasNumber ? "text-green-600 font-medium" : ""}>
                        {hasNumber ? "✓" : "•"} 1 number
                      </span>
                      <span className={hasSpecial ? "text-green-600 font-medium col-span-2" : "col-span-2"}>
                        {hasSpecial ? "✓" : "•"} 1 special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 pr-12 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join("").length < 6 || !password || !confirmPassword}
                  className="w-full bg-[var(--brand)] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-lg shadow-[var(--brand)]/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  ← Request a different verification code
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-green-600 shadow-md shadow-green-600/10">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
                Password Reset Successfully!
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] mb-8 max-w-sm mx-auto">
                Your password has been securely updated. You can now log in to your account with your new credentials.
              </p>

              <button
                type="button"
                onClick={() => navigate("/login", { state: { email: identifier } })}
                className="w-full bg-[var(--brand)] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-lg shadow-[var(--brand)]/20 cursor-pointer"
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
