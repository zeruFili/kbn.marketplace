import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../auth/AuthContext"
import { type User, AccountConflictError } from "../../auth/auth"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (parent: HTMLElement, options: any) => void
          prompt: (momentListener?: (notification: any) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

interface GoogleSignInButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with"
  onSuccess?: (user: User) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export default function GoogleSignInButton({
  text = "continue_with",
  onSuccess,
  onError,
  disabled = false,
  className = "",
}: GoogleSignInButtonProps) {
  const { googleLogin, linkGoogleAccount } = useAuth()
  const googleBtnContainerRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Account Linking Modal State
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [pendingIdToken, setPendingIdToken] = useState("")
  const [linkPassword, setLinkPassword] = useState("")
  const [showLinkPassword, setShowLinkPassword] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState("")

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === "undefined") return

    const existingScript = document.getElementById("google-gsi-client")
    if (!existingScript) {
      const script = document.createElement("script")
      script.id = "google-gsi-client"
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = () => initGoogleGsi()
      document.head.appendChild(script)
    } else if (window.google?.accounts?.id) {
      initGoogleGsi()
    }

    function initGoogleGsi() {
      if (!window.google?.accounts?.id || !clientId) return

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        const renderBtn = () => {
          if (!googleBtnContainerRef.current || !window.google?.accounts?.id) return
          googleBtnContainerRef.current.innerHTML = ""
          const containerWidth = googleBtnContainerRef.current.offsetWidth || 380
          const buttonWidth = Math.min(Math.max(containerWidth, 240), 400)
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: "outline",
            size: "large",
            width: buttonWidth,
            text,
            shape: "rectangular",
            logo_alignment: "left",
          })
        }

        renderBtn()
        // Re-render after brief delay to guarantee container width is measured correctly
        setTimeout(renderBtn, 150)
      } catch (err: any) {
        console.warn("[GoogleSignIn] GIS init notice:", err?.message);
      }
    }
  }, [clientId, text])

  async function handleCredentialResponse(response: { credential?: string }) {
    if (!response.credential) {
      const msg = "No Google credential received."
      setErrorMessage(msg)
      if (onError) onError(msg)
      return
    }

    await executeGoogleAuth(response.credential)
  }

  async function executeGoogleAuth(idToken: string) {
    setLoading(true)
    setErrorMessage("")

    try {
      const user = await googleLogin(idToken)
      if (onSuccess) {
        onSuccess(user)
      }
    } catch (err: unknown) {
      if (err instanceof AccountConflictError) {
        // Trigger secure account linking modal
        setPendingIdToken(idToken)
        setLinkPassword("")
        setLinkError("")
        setShowLinkModal(true)
      } else {
        const msg = err instanceof Error ? err.message : "Google authentication failed."
        setErrorMessage(msg)
        if (onError) onError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmLink(e: React.FormEvent) {
    e.preventDefault()
    if (!linkPassword) {
      setLinkError("Please enter your existing account password.")
      return
    }

    setLinkLoading(true)
    setLinkError("")

    try {
      const user = await linkGoogleAccount(pendingIdToken, linkPassword)
      setShowLinkModal(false)
      setPendingIdToken("")
      setLinkPassword("")
      if (onSuccess) {
        onSuccess(user)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Account linking failed."
      setLinkError(msg)
    } finally {
      setLinkLoading(false)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {errorMessage && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-3 text-xs text-red-700 dark:text-red-300">
          <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {/* Single, Official Working Google Identity Services Button */}
      {clientId ? (
        <div
          ref={googleBtnContainerRef}
          className={`w-full flex justify-center min-h-[44px] ${loading ? "opacity-50 pointer-events-none" : ""}`}
        />
      ) : (
        <div className="text-center p-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900">
          Google Sign-In requires VITE_GOOGLE_CLIENT_ID to be configured.
        </div>
      )}

      {/* Secure Account Linking Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border-default)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                  Link Your Existing Account
                </h3>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Account Conflict Verification
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-5">
              An account with your Google email already exists in Kingdom Builders Network. To prevent unauthorized access, please verify your existing account password to securely link your Google account.
            </p>

            {linkError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 text-xs text-red-700 dark:text-red-300">
                <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{linkError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmLink} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Existing Account Password
                </label>
                <div className="relative">
                  <input
                    type={showLinkPassword ? "text" : "password"}
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3.5 pr-10 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowLinkPassword(!showLinkPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showLinkPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  disabled={linkLoading}
                  className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="px-4 py-2 bg-[var(--brand)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {linkLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Linking...</span>
                    </>
                  ) : (
                    "Verify & Link Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
