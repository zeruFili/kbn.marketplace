import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { resolveAssetUrl } from "../../api/baseApi"

export interface UserAvatarProps {
  src?: string | null
  alt?: string
  name?: string
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  showInitial?: boolean
  allowEnlarge?: boolean
  onClick?: () => void
}

const AVATAR_SIZE_CLASSES: Record<
  NonNullable<UserAvatarProps["size"]>,
  { box: string; text: string }
> = {
  xs: { box: "w-6 h-6", text: "text-[10px]" },
  sm: { box: "w-8 h-8", text: "text-xs" },
  md: { box: "w-10 h-10", text: "text-sm" },
  lg: { box: "w-16 h-16", text: "text-xl" },
  xl: { box: "w-20 h-20 sm:w-24 sm:h-24", text: "text-2xl sm:text-3xl" },
}

export function getUserInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "KB"
  const cleaned = name
    .replace(/[^\p{L}\p{N}\s&-]/gu, " ")
    .trim()
  if (!cleaned) return "KB"

  const rawWords = cleaned
    .split(/[\s&-]+/)
    .filter((w) => w.length > 0)
  if (rawWords.length === 0) return "KB"

  if (rawWords.length === 1) {
    const single = rawWords[0]
    return single.slice(0, 2).toUpperCase()
  }

  const first = rawWords[0].charAt(0).toUpperCase()
  const second = rawWords[rawWords.length - 1].charAt(0).toUpperCase()
  return `${first}${second}`
}

function isValidUploadedPhoto(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed) return false
  const lower = trimmed.toLowerCase()
  if (lower === "null" || lower === "undefined" || lower === "none") return false
  // Filter out placeholder/random picture generators like pravatar
  if (lower.includes("pravatar.cc")) return false
  return true
}

export default function UserAvatar({
  src,
  alt = "User Avatar",
  name = "",
  className = "",
  size = "md",
  showInitial: _showInitial,
  allowEnlarge,
  onClick,
}: UserAvatarProps) {
  // Allow enlargement by default for all avatars except size === "xs" (which is used in dropdown triggers), unless explicitly set to false
  const shouldEnlarge =
    allowEnlarge !== undefined ? allowEnlarge : size !== "xs"

  const [hasError, setHasError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false)
  }, [src])

  // Manage body scroll and Escape key listener when modal is open
  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isModalOpen])

  const hasPhoto = isValidUploadedPhoto(src)
  const resolvedUrl = hasPhoto && src ? resolveAssetUrl(src) : null
  const dims = AVATAR_SIZE_CLASSES[size] || AVATAR_SIZE_CLASSES.md
  const isCustomRounded = className.includes("rounded-")
  const roundedClass = isCustomRounded ? "" : "rounded-2xl"

  const hasPosition = /\b(absolute|fixed|relative|sticky)\b/.test(className)
  const posClass = hasPosition ? "" : "relative"

  const initials = getUserInitials(name)

  const handleClick = (e: React.MouseEvent) => {
    if (shouldEnlarge) {
      e.stopPropagation()
      setIsModalOpen(true)
    }
    if (onClick) {
      onClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (shouldEnlarge && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault()
      e.stopPropagation()
      setIsModalOpen(true)
    }
  }

  const interactiveAttrs = shouldEnlarge
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        title: "Click photo to view larger",
      }
    : onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: handleClick,
        title: name || alt || undefined,
      }
    : {}

  const interactiveClass = shouldEnlarge
    ? "cursor-pointer group hover:opacity-95 transition-all"
    : onClick
    ? "cursor-pointer"
    : ""

  const modalElement =
    isModalOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
            style={{ zIndex: 99999 }}
            onClick={() => setIsModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${name || "User"} Profile Photo`}
          >
            <div
              className="relative max-w-sm sm:max-w-md w-full bg-[var(--surface)] dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-[var(--border-light)] dark:border-white/10 flex flex-col items-center animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prominent Close X Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsModalOpen(false)
                }}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[var(--surface-alt)] dark:bg-white/10 hover:bg-[var(--border-default)] dark:hover:bg-white/20 text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-white/80 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                aria-label="Close profile photo view"
                title="Close (Esc)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Header */}
              <div className="w-full text-center mb-4 pr-10 pl-10">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] block">
                  Profile Photo
                </span>
                {name && (
                  <h3 className="font-serif text-lg font-bold text-[var(--text-primary)] truncate mt-0.5">
                    {name}
                  </h3>
                )}
              </div>

              {/* Large Profile Photo or Monogram */}
              {resolvedUrl && !hasError ? (
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-[var(--border-light)] dark:border-white/10 shadow-lg flex items-center justify-center">
                  <img
                    src={resolvedUrl}
                    alt={name ? `${name}'s Profile Photo` : "Profile Photo"}
                    onError={() => setHasError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-[#162D50] via-[#10233F] to-[#0A1628] flex items-center justify-center select-none shadow-xl border-2 border-white/20"
                >
                  {/* Ambient gold radial highlight */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at 28% 22%, rgba(212, 168, 83, 0.32), transparent 65%)",
                    }}
                  />
                  {/* Fine hairline border */}
                  <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/10" />
                  <span className="relative font-serif font-bold text-6xl sm:text-7xl tracking-wider text-white">
                    {initials}
                  </span>
                </div>
              )}

              {/* Action: Open in full resolution */}
              {resolvedUrl && !hasError && (
                <div className="mt-4 flex items-center justify-center">
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--brand)] bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Full Resolution
                  </a>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null

  if (resolvedUrl && !hasError) {
    return (
      <>
        <div
          {...interactiveAttrs}
          className={`${dims.box} ${roundedClass} ${posClass} overflow-hidden flex-shrink-0 ${interactiveClass} ${className}`}
        >
          <img
            src={resolvedUrl}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover rounded-[inherit]"
          />
        </div>
        {modalElement}
      </>
    )
  }

  return (
    <>
      <div
        {...interactiveAttrs}
        className={`${dims.box} ${roundedClass} ${posClass} overflow-hidden bg-gradient-to-br from-[#162D50] via-[#10233F] to-[#0A1628] flex items-center justify-center flex-shrink-0 select-none shadow-sm ${interactiveClass} ${className}`}
        aria-label={alt || name || "User monogram"}
        title={shouldEnlarge ? "Click photo to view larger" : name || alt || undefined}
      >
        {/* Ambient gold radial highlight overlay (matching business monogram) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 28% 22%, rgba(212, 168, 83, 0.28), transparent 65%)",
          }}
        />
        {/* Fine inner hairline border */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/10"
        />
        {/* Monogram initials with elegant serif typography */}
        <span
          className={`relative font-serif font-semibold tracking-wider text-white ${dims.text}`}
        >
          {initials}
        </span>
      </div>
      {modalElement}
    </>
  )
}
