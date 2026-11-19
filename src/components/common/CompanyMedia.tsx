import { useEffect, useId, useState } from "react"
import { resolveAssetUrl } from "../../api/baseApi"

export interface CategoryBannerTheme {
  gradientClass: string
  glowColor: string
  secondaryGlowColor: string
  badgeBgClass: string
}

const DEFAULT_THEME: CategoryBannerTheme = {
  gradientClass: "from-[#081324] via-[#0F1D3A] to-[#1A335C]",
  glowColor: "rgba(212, 168, 83, 0.24)",
  secondaryGlowColor: "rgba(59, 130, 246, 0.14)",
  badgeBgClass: "from-[#14274A] to-[#0A162B]",
}

const CATEGORY_THEMES: Record<string, CategoryBannerTheme> = {
  construction: {
    gradientClass: "from-[#0B172B] via-[#152540] to-[#2A2319]",
    glowColor: "rgba(217, 159, 67, 0.28)",
    secondaryGlowColor: "rgba(234, 179, 8, 0.12)",
    badgeBgClass: "from-[#1B2B45] to-[#0E182B]",
  },
  hospitals: {
    gradientClass: "from-[#081928] via-[#0F2A3A] to-[#10393E]",
    glowColor: "rgba(45, 212, 191, 0.22)",
    secondaryGlowColor: "rgba(212, 168, 83, 0.14)",
    badgeBgClass: "from-[#113344] to-[#091D29]",
  },
  healthcare: {
    gradientClass: "from-[#081928] via-[#0F2A3A] to-[#10393E]",
    glowColor: "rgba(45, 212, 191, 0.22)",
    secondaryGlowColor: "rgba(212, 168, 83, 0.14)",
    badgeBgClass: "from-[#113344] to-[#091D29]",
  },
  hotels: {
    gradientClass: "from-[#0E1630] via-[#1A2148] to-[#28204B]",
    glowColor: "rgba(167, 139, 250, 0.24)",
    secondaryGlowColor: "rgba(212, 168, 83, 0.16)",
    badgeBgClass: "from-[#212452] to-[#0F1530]",
  },
  hospitality: {
    gradientClass: "from-[#0E1630] via-[#1A2148] to-[#28204B]",
    glowColor: "rgba(167, 139, 250, 0.24)",
    secondaryGlowColor: "rgba(212, 168, 83, 0.16)",
    badgeBgClass: "from-[#212452] to-[#0F1530]",
  },
  "guest houses": {
    gradientClass: "from-[#12162D] via-[#221D3C] to-[#322038]",
    glowColor: "rgba(244, 114, 182, 0.2)",
    secondaryGlowColor: "rgba(212, 168, 83, 0.16)",
    badgeBgClass: "from-[#292044] to-[#14142B]",
  },
  fashion: {
    gradientClass: "from-[#12162D] via-[#221D3C] to-[#322038]",
    glowColor: "rgba(244, 114, 182, 0.2)",
    secondaryGlowColor: "rgba(212, 168, 83, 0.16)",
    badgeBgClass: "from-[#292044] to-[#14142B]",
  },
  clothing: {
    gradientClass: "from-[#0A182E] via-[#13294B] to-[#18385E]",
    glowColor: "rgba(56, 189, 248, 0.22)",
    secondaryGlowColor: "rgba(212, 168, 83, 0.14)",
    badgeBgClass: "from-[#163156] to-[#0B1A33]",
  },
  "coffee shops": {
    gradientClass: "from-[#121628] via-[#241E26] to-[#33241A]",
    glowColor: "rgba(212, 168, 83, 0.28)",
    secondaryGlowColor: "rgba(180, 120, 60, 0.16)",
    badgeBgClass: "from-[#2C2220] to-[#141420]",
  },
  "food & beverage": {
    gradientClass: "from-[#121628] via-[#241E26] to-[#33241A]",
    glowColor: "rgba(212, 168, 83, 0.28)",
    secondaryGlowColor: "rgba(180, 120, 60, 0.16)",
    badgeBgClass: "from-[#2C2220] to-[#141420]",
  },
  furniture: {
    gradientClass: "from-[#0D172B] via-[#1A243D] to-[#2A2324]",
    glowColor: "rgba(212, 168, 83, 0.24)",
    secondaryGlowColor: "rgba(129, 140, 248, 0.15)",
    badgeBgClass: "from-[#212A45] to-[#0F172A]",
  },
  cars: {
    gradientClass: "from-[#0B1426] via-[#172137] to-[#2E1B27]",
    glowColor: "rgba(248, 113, 113, 0.2)",
    secondaryGlowColor: "rgba(212, 168, 83, 0.15)",
    badgeBgClass: "from-[#252038] to-[#0E1526]",
  },
  automotive: {
    gradientClass: "from-[#0B1426] via-[#172137] to-[#2E1B27]",
    glowColor: "rgba(248, 113, 113, 0.2)",
    secondaryGlowColor: "rgba(212, 168, 83, 0.15)",
    badgeBgClass: "from-[#252038] to-[#0E1526]",
  },
  ministry: {
    gradientClass: "from-[#09162E] via-[#132B54] to-[#1C3B6E]",
    glowColor: "rgba(212, 168, 83, 0.28)",
    secondaryGlowColor: "rgba(96, 165, 250, 0.16)",
    badgeBgClass: "from-[#183566] to-[#0B1B38]",
  },
  "professional services": DEFAULT_THEME,
}

export function getCategoryBannerTheme(category?: string | null): CategoryBannerTheme {
  if (!category) return DEFAULT_THEME
  const key = category.trim().toLowerCase()
  return CATEGORY_THEMES[key] || DEFAULT_THEME
}

export function getCompanyInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "KB"
  const cleaned = name
    .replace(/[^\p{L}\p{N}\s&-]/gu, " ")
    .trim()
  if (!cleaned) return "KB"

  const rawWords = cleaned
    .split(/[\s&-]+/)
    .filter((w) => w.length > 0)

  if (rawWords.length === 0) return "KB"

  // Skip leading "The" when multiple words are present (e.g. "The Addis Hotel" -> "AH")
  const words =
    rawWords.length > 1 && rawWords[0].toLowerCase() === "the"
      ? rawWords.slice(1)
      : rawWords

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }

  return words[0].slice(0, 2).toUpperCase()
}

export function isValidCompanyImage(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed) return false
  const lower = trimmed.toLowerCase()
  if (lower === "null" || lower === "undefined" || lower === "none") return false
  return true
}

export function resolveCompanyImageUrl(url?: string | null): string | null {
  if (!isValidCompanyImage(url)) return null
  const resolved = resolveAssetUrl(url)
  return resolved || null
}

function DefaultCoverBackdrop({
  name,
  category,
  hoverZoom = false,
  showWatermark = true,
}: {
  name?: string
  category?: string
  hoverZoom?: boolean
  showWatermark?: boolean
}) {
  const patternId = useId().replace(/:/g, "")
  const theme = getCategoryBannerTheme(category)
  const initials = getCompanyInitials(name)

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br ${theme.gradientClass} overflow-hidden select-none`}
      aria-hidden="true"
    >
      {/* Ambient radial highlights */}
      <div
        className={`absolute inset-0 ${
          hoverZoom
            ? "transition-transform duration-700 ease-out group-hover:scale-105"
            : ""
        }`}
        style={{
          backgroundImage: `radial-gradient(circle at 82% 18%, ${theme.glowColor}, transparent 52%), radial-gradient(circle at 14% 88%, ${theme.secondaryGlowColor}, transparent 55%)`,
        }}
      />

      {/* Fine architectural grid & geometric accent lines */}
      <svg
        className={`absolute inset-0 w-full h-full opacity-90 ${
          hoverZoom
            ? "transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            : ""
        }`}
        preserveAspectRatio="none"
        viewBox="0 0 400 160"
        fill="none"
      >
        <defs>
          <pattern
            id={`grid-${patternId}`}
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="rgba(255, 255, 255, 0.055)"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect width="400" height="160" fill={`url(#grid-${patternId})`} />
        <circle
          cx="355"
          cy="20"
          r="78"
          stroke="rgba(212, 168, 83, 0.14)"
          strokeWidth="1"
        />
        <circle
          cx="355"
          cy="20"
          r="112"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="0.75"
        />
        <line
          x1="-10"
          y1="145"
          x2="135"
          y2="-10"
          stroke="rgba(212, 168, 83, 0.12)"
          strokeWidth="1"
        />
        <line
          x1="12"
          y1="165"
          x2="157"
          y2="10"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="0.75"
        />
      </svg>

      {/* Subtle oversized ghost monogram watermark */}
      {showWatermark && (
        <span className="pointer-events-none absolute -bottom-5 right-3 font-serif font-bold text-[88px] leading-none tracking-tight text-white/[0.045]">
          {initials}
        </span>
      )}

      {/* Refined gold bottom hairline */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.45) 50%, transparent 100%)",
        }}
      />
    </div>
  )
}

export interface CompanyCoverProps {
  src?: string | null
  name?: string
  category?: string
  className?: string
  imageClassName?: string
  hoverZoom?: boolean
  showWatermark?: boolean
  alt?: string
}

/**
 * Displays a company's cover image with an automatic architectural gradient +
 * geometric fallback whenever no cover image was uploaded or loading fails.
 */
export function CompanyCover({
  src,
  name,
  category,
  className = "",
  imageClassName = "",
  hoverZoom = false,
  showWatermark = true,
  alt = "",
}: CompanyCoverProps) {
  const [hasError, setHasError] = useState(false)
  const resolvedUrl = resolveCompanyImageUrl(src)

  useEffect(() => {
    setHasError(false)
  }, [src])

  if (resolvedUrl && !hasError) {
    return (
      <img
        src={resolvedUrl}
        alt={alt}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover ${
          hoverZoom
            ? "transition-transform duration-700 group-hover:scale-110"
            : ""
        } ${imageClassName} ${className}`}
      />
    )
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <DefaultCoverBackdrop
        name={name}
        category={category}
        hoverZoom={hoverZoom}
        showWatermark={showWatermark}
      />
    </div>
  )
}

export interface CompanyLogoProps {
  src?: string | null
  name?: string
  category?: string
  size?: "sm" | "md" | "lg" | "xl"
  fit?: "contain" | "cover"
  className?: string
  imageClassName?: string
}

const LOGO_SIZE_CLASSES: Record<
  NonNullable<CompanyLogoProps["size"]>,
  { box: string; text: string }
> = {
  sm: { box: "w-10 h-10 rounded-xl", text: "text-sm" },
  md: { box: "w-14 h-14 rounded-xl", text: "text-lg" },
  lg: { box: "w-20 h-20 rounded-2xl", text: "text-2xl" },
  xl: { box: "w-20 h-20 md:w-28 md:h-28 rounded-2xl", text: "text-2xl md:text-4xl" },
}

/**
 * Displays a company's uploaded logo with an automatic navy-and-gold serif
 * monogram fallback whenever no logo was uploaded or loading fails.
 */
export function CompanyLogo({
  src,
  name = "",
  category,
  size = "sm",
  fit = "contain",
  className = "",
  imageClassName = "",
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false)
  const resolvedUrl = resolveCompanyImageUrl(src)
  const theme = getCategoryBannerTheme(category)
  const initials = getCompanyInitials(name)
  const dims = LOGO_SIZE_CLASSES[size]

  useEffect(() => {
    setHasError(false)
  }, [src])

  const hasPosition = /\b(absolute|fixed|relative|sticky)\b/.test(className)
  const posClass = hasPosition ? "" : "relative"

  if (resolvedUrl && !hasError) {
    return (
      <div
        className={`${dims.box} ${posClass} overflow-hidden bg-white flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <img
          src={resolvedUrl}
          alt={name || "Company logo"}
          onError={() => setHasError(true)}
          className={`w-full h-full ${
            fit === "cover" ? "object-cover" : "object-contain p-1"
          } ${imageClassName}`}
        />
      </div>
    )
  }

  return (
    <div
      className={`${dims.box} ${posClass} overflow-hidden bg-gradient-to-br ${theme.badgeBgClass} flex items-center justify-center flex-shrink-0 select-none ${className}`}
      aria-label={name || "Company monogram"}
      title={name || undefined}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 25% 20%, rgba(212, 168, 83, 0.24), transparent 65%)",
        }}
      />
      <span
        className={`relative font-serif font-semibold tracking-wide text-white ${dims.text}`}
      >
        {initials}
      </span>
    </div>
  )
}

export interface CompanyCardMediaProps {
  name: string
  category?: string
  coverSrc?: string | null
  logoSrc?: string | null
  featured?: boolean
  heightClass?: string
  logoPosition?: "top-right" | "bottom-left"
  logoSize?: "sm" | "md"
  hoverZoom?: boolean
}

/**
 * Unified media header for company cards. Intelligently handles all 4 states:
 * 1. Cover + Logo: full-bleed cover with corner logo badge
 * 2. Cover only: full-bleed cover with corner monogram badge
 * 3. Logo only: architectural brand cover with centered elevated logo pedestal
 * 4. Neither: architectural brand cover with centered monogram crest
 */
export function CompanyCardMedia({
  name,
  category,
  coverSrc,
  logoSrc,
  featured = false,
  heightClass = "h-36",
  logoPosition = "top-right",
  logoSize = "sm",
  hoverZoom = true,
}: CompanyCardMediaProps) {
  const [coverFailed, setCoverFailed] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    setCoverFailed(false)
  }, [coverSrc])

  useEffect(() => {
    setLogoFailed(false)
  }, [logoSrc])

  const resolvedCover = resolveCompanyImageUrl(coverSrc)
  const resolvedLogo = resolveCompanyImageUrl(logoSrc)
  const hasCover = Boolean(resolvedCover && !coverFailed)
  const hasLogo = Boolean(resolvedLogo && !logoFailed)
  const initials = getCompanyInitials(name)
  const theme = getCategoryBannerTheme(category)

  const cornerPositionClass =
    logoPosition === "bottom-left"
      ? "absolute bottom-4 left-5"
      : "absolute top-3 right-3"

  const cornerSizeClass =
    logoSize === "md" ? "w-14 h-14 rounded-xl" : "w-10 h-10 rounded-xl"

  return (
    <div
      className={`relative ${heightClass} bg-[var(--brand-dark)] overflow-hidden`}
    >
      {hasCover ? (
        <>
          <img
            src={resolvedCover!}
            alt=""
            onError={() => setCoverFailed(true)}
            className={`w-full h-full object-cover ${
              hoverZoom
                ? "transition-transform duration-700 group-hover:scale-110"
                : ""
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

          {/* Corner logo or monogram badge */}
          <div className={cornerPositionClass}>
            {hasLogo ? (
              <div
                className={`${cornerSizeClass} overflow-hidden border-2 border-white/80 bg-white shadow-lg`}
              >
                <img
                  src={resolvedLogo!}
                  alt={name}
                  onError={() => setLogoFailed(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className={`${cornerSizeClass} relative overflow-hidden bg-gradient-to-br ${theme.badgeBgClass} border-2 border-[#D4A853]/60 shadow-lg flex items-center justify-center select-none`}
                aria-label={name}
              >
                <span
                  className={`font-serif font-semibold text-white tracking-wide ${
                    logoSize === "md" ? "text-lg" : "text-xs"
                  }`}
                >
                  {initials}
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Rich architectural brand default cover */}
          <DefaultCoverBackdrop
            name={name}
            category={category}
            hoverZoom={hoverZoom}
            showWatermark
          />

          {/* Centered focal emblem when no cover photo exists */}
          <div className="absolute inset-0 flex items-center justify-center px-5">
            {hasLogo ? (
              <div className="flex items-center gap-3">
                <span className="hidden xs:block w-8 h-px bg-gradient-to-r from-transparent to-[#D4A853]/45" />
                <div
                  className={`w-16 h-16 rounded-2xl bg-white/95 p-1.5 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/40 flex items-center justify-center overflow-hidden ${
                    hoverZoom
                      ? "transition-transform duration-500 group-hover:scale-105"
                      : ""
                  }`}
                >
                  <img
                    src={resolvedLogo!}
                    alt={name}
                    onError={() => setLogoFailed(true)}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <span className="hidden xs:block w-8 h-px bg-gradient-to-l from-transparent to-[#D4A853]/45" />
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#D4A853]/50" />
                <div
                  className={`relative w-14 h-14 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-[#D4A853]/45 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)] flex items-center justify-center select-none ${
                    hoverZoom
                      ? "transition-transform duration-500 group-hover:scale-105"
                      : ""
                  }`}
                >
                  <div className="pointer-events-none absolute inset-[3px] rounded-[12px] border border-white/10" />
                  <span className="font-serif font-semibold text-xl tracking-wide text-white drop-shadow-xs">
                    {initials}
                  </span>
                </div>
                <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#D4A853]/50" />
              </div>
            )}
          </div>
        </>
      )}

      {featured && (
        <span className="absolute top-3 left-3 text-[10px] font-semibold text-white bg-black/35 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/15 z-10">
          ✦ Featured
        </span>
      )}
    </div>
  )
}
