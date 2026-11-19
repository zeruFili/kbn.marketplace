import { useState, useEffect } from "react"
import { resolveAssetUrl } from "../../api/baseApi"

export interface UserAvatarProps {
  src?: string | null
  alt?: string
  name?: string
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  showInitial?: boolean
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
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false)

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false)
  }, [src])

  const hasPhoto = isValidUploadedPhoto(src)
  const resolvedUrl = hasPhoto && src ? resolveAssetUrl(src) : null
  const dims = AVATAR_SIZE_CLASSES[size] || AVATAR_SIZE_CLASSES.md
  const isCustomRounded = className.includes("rounded-")
  const roundedClass = isCustomRounded ? "" : "rounded-2xl"

  const hasPosition = /\b(absolute|fixed|relative|sticky)\b/.test(className)
  const posClass = hasPosition ? "" : "relative"

  if (resolvedUrl && !hasError) {
    return (
      <img
        src={resolvedUrl}
        alt={alt}
        onError={() => setHasError(true)}
        className={`${dims.box} ${roundedClass} ${posClass} object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  const initials = getUserInitials(name)

  return (
    <div
      className={`${dims.box} ${roundedClass} ${posClass} overflow-hidden bg-gradient-to-br from-[#162D50] via-[#10233F] to-[#0A1628] flex items-center justify-center flex-shrink-0 select-none shadow-sm ${className}`}
      aria-label={alt || name || "User monogram"}
      title={name || alt || undefined}
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
  )
}
