import { useState, useEffect } from "react"
import { resolveAssetUrl } from "../../api/baseApi"

interface UserAvatarProps {
  src?: string | null
  alt?: string
  name?: string
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  showInitial?: boolean
}

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-20 h-20 sm:w-24 sm:h-24 text-2xl",
}

function isValidUploadedPhoto(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed) return false
  // Filter out placeholder/random picture generators like pravatar
  if (trimmed.includes("pravatar.cc")) return false
  return true
}

export default function UserAvatar({
  src,
  alt = "User Avatar",
  name = "",
  className = "",
  size = "md",
  showInitial = false,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false)

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false)
  }, [src])

  const hasPhoto = isValidUploadedPhoto(src)
  const resolvedUrl = hasPhoto && src ? resolveAssetUrl(src) : null
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md
  const isCustomRounded = className.includes("rounded-")
  const roundedClass = isCustomRounded ? "" : "rounded-2xl"

  if (resolvedUrl && !hasError) {
    return (
      <img
        src={resolvedUrl}
        alt={alt}
        onError={() => setHasError(true)}
        className={`${sizeClass} ${roundedClass} object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  // Fallback: Default user icon
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <div
      className={`${sizeClass} ${roundedClass} flex-shrink-0 flex items-center justify-center bg-[var(--surface-alt,#f1f5f9)] text-[var(--text-tertiary,#94a3b8)] border border-[var(--border-light,#e2e8f0)] shadow-xs select-none ${className}`}
      aria-label={alt}
      title={name || alt}
    >
      {showInitial && initial ? (
        <span className="font-semibold text-[var(--brand)]">{initial}</span>
      ) : (
        <svg
          className="w-1/2 h-1/2 text-current"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </div>
  )
}
