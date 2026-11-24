import React from "react"
import {
  getMembershipCategoryInfo,
  getMembershipCategoryLabel,
  type MembershipCategoryOption,
} from "../../api/paymentApi"

export interface MembershipBadgeProps {
  category?: string | null
  variant?: "default" | "onDark" | "outline"
  size?: "xs" | "sm" | "md" | "lg"
  showTier?: boolean
  showIcon?: boolean
  className?: string
}

interface TierVisuals {
  renderIcon: (className?: string) => React.ReactNode
  lightClasses: string
  onDarkClasses: string
  iconColor: string
  iconColorDark: string
  tierLabel: string
  microPillLight: string
  microPillDark: string
}

const TIER_VISUALS: Record<number, TierVisuals> = {
  1: {
    // Tier 1: Emerging Foundation & Budding Enterprise Seal
    renderIcon: (cls = "w-3.5 h-3.5") => (
      <svg className={cls} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
        <path
          d="M8 12.2V7.5M8 7.5C8 5.2 9.8 3.5 12 3.5C12 5.8 10.2 7.5 8 7.5ZM8 7.5C8 5.8 6.5 4.5 4.5 4.5C4.5 6.8 6.2 7.5 8 7.5Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.18"
        />
      </svg>
    ),
    lightClasses:
      "bg-sky-50/90 text-sky-950 border border-sky-200/90 shadow-2xs",
    onDarkClasses:
      "bg-sky-500/15 text-sky-100 border border-sky-400/30 backdrop-blur-xs",
    iconColor: "text-sky-600",
    iconColorDark: "text-sky-300",
    tierLabel: "Tier 1",
    microPillLight: "bg-sky-100 text-sky-850",
    microPillDark: "bg-sky-500/25 text-sky-200",
  },
  2: {
    // Tier 2: Scaling Enterprise Upward Trajectory Seal
    renderIcon: (cls = "w-3.5 h-3.5") => (
      <svg className={cls} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
        <path
          d="M4 10.5L7 7.5L9.5 9.8L12.5 5.5M12.5 5.5H9.5M12.5 5.5V8.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 10.5L7 7.5L9.5 9.8L12.5 5.5V12.2H4V10.5Z"
          fill="currentColor"
          fillOpacity="0.14"
        />
      </svg>
    ),
    lightClasses:
      "bg-amber-50/90 text-amber-950 border border-amber-200/90 shadow-2xs",
    onDarkClasses:
      "bg-amber-500/15 text-amber-100 border border-amber-400/30 backdrop-blur-xs",
    iconColor: "text-amber-600",
    iconColorDark: "text-amber-300",
    tierLabel: "Tier 2",
    microPillLight: "bg-amber-100 text-amber-900",
    microPillDark: "bg-amber-500/25 text-amber-200",
  },
  3: {
    // Tier 3: Established Executive Compass & Star Seal
    renderIcon: (cls = "w-3.5 h-3.5") => (
      <svg className={cls} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
        <path
          d="M8 2.6L9.3 6.1L13 6.5L10.3 8.9L11.1 12.6L8 10.7L4.9 12.6L5.7 8.9L3 6.5L6.7 6.1L8 2.6Z"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.20"
        />
      </svg>
    ),
    lightClasses:
      "bg-[#162D50]/6 text-[#162D50] border border-[#162D50]/20 shadow-2xs",
    onDarkClasses:
      "bg-white/10 text-white border border-white/20 backdrop-blur-xs",
    iconColor: "text-[var(--brand)]",
    iconColorDark: "text-amber-300",
    tierLabel: "Tier 3",
    microPillLight: "bg-[#162D50]/10 text-[#162D50]",
    microPillDark: "bg-white/15 text-white",
  },
  4: {
    // Tier 4: Senior Executive & Enterprise Builder Seal
    renderIcon: (cls = "w-3.5 h-3.5") => (
      <svg className={cls} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
        <path
          d="M8 2.5L10 6L14 6.8L11 9.8L11.8 13.8L8 11.8L4.2 13.8L5 9.8L2 6.8L6 6L8 2.5Z"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.20"
        />
      </svg>
    ),
    lightClasses:
      "bg-purple-50/90 text-purple-950 border border-purple-200/90 shadow-2xs",
    onDarkClasses:
      "bg-purple-500/15 text-purple-100 border border-purple-400/30 backdrop-blur-xs",
    iconColor: "text-purple-600",
    iconColorDark: "text-purple-300",
    tierLabel: "Tier 4",
    microPillLight: "bg-purple-100 text-purple-900",
    microPillDark: "bg-purple-500/25 text-purple-200",
  },
  5: {
    // Tier 5: Sovereign Capital Partner Faceted Diamond Seal
    renderIcon: (cls = "w-3.5 h-3.5") => (
      <svg className={cls} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
        <path
          d="M4.5 4.2H11.5L13.2 7.2L8 12.5L2.8 7.2L4.5 4.2Z"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.18"
        />
        <path
          d="M2.8 7.2H13.2M8 12.5L6 7.2L8 4.2L10 7.2L8 12.5Z"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    ),
    lightClasses:
      "bg-emerald-50/90 text-emerald-950 border border-emerald-300/80 shadow-2xs",
    onDarkClasses:
      "bg-emerald-500/15 text-emerald-100 border border-emerald-400/30 backdrop-blur-xs",
    iconColor: "text-emerald-700",
    iconColorDark: "text-emerald-300",
    tierLabel: "Tier 5",
    microPillLight: "bg-emerald-100 text-emerald-900",
    microPillDark: "bg-emerald-500/25 text-emerald-200",
  },
}

const DEFAULT_TIER_VISUAL: TierVisuals = {
  renderIcon: (cls = "w-3.5 h-3.5") => (
    <svg className={cls} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
      <path
        d="M8 3.5L12 5.2V8.2C12 10.6 10.3 12.2 8 13C5.7 12.2 4 10.6 4 8.2V5.2L8 3.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path
        d="M6.5 8.2L7.5 9.2L9.5 7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  lightClasses:
    "bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs",
  onDarkClasses:
    "bg-white/10 text-white border border-white/20 backdrop-blur-xs",
  iconColor: "text-[var(--brand)]",
  iconColorDark: "text-amber-300",
  tierLabel: "Verified Member",
  microPillLight: "bg-slate-200 text-slate-800",
  microPillDark: "bg-white/15 text-white",
}

export default function MembershipBadge({
  category,
  variant = "default",
  size = "sm",
  showTier = false,
  showIcon = true,
  className = "",
}: MembershipBadgeProps) {
  // If no category was selected/paid, do not display a badge
  if (!category || !category.trim()) {
    return null
  }

  const catInfo: MembershipCategoryOption | null = getMembershipCategoryInfo(category.trim())
  if (!catInfo) {
    return null
  }

  const label = catInfo.name || getMembershipCategoryLabel(category) || category.trim()
  const tier = catInfo.tier ?? 1
  const visuals = TIER_VISUALS[tier] || DEFAULT_TIER_VISUAL

  const iconColorClass = variant === "onDark" ? visuals.iconColorDark : visuals.iconColor
  const microPillClass = variant === "onDark" ? visuals.microPillDark : visuals.microPillLight

  const sizeClasses = {
    xs: "text-[10px] px-2 py-0.5 gap-1.5",
    sm: "text-[11px] px-2.5 py-0.5 gap-1.5",
    md: "text-xs px-3 py-1 gap-2",
    lg: "text-sm px-3.5 py-1.5 gap-2",
  }[size]

  const iconSizes = {
    xs: "w-3 h-3 shrink-0",
    sm: "w-3.5 h-3.5 shrink-0",
    md: "w-3.5 h-3.5 shrink-0",
    lg: "w-4 h-4 shrink-0",
  }[size]

  const styleClasses =
    variant === "onDark" ? visuals.onDarkClasses : visuals.lightClasses

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full transition-all select-none max-w-full ${sizeClasses} ${styleClasses} ${className}`}
      title={`${label}${catInfo?.tier ? ` • Tier ${catInfo.tier}` : ""} Verified KBN Member`}
    >
      {showIcon && (
        <span className={`inline-flex items-center justify-center ${iconColorClass}`}>
          {visuals.renderIcon(iconSizes)}
        </span>
      )}

      {showTier && (
        <span
          className={`font-mono font-bold text-[9px] uppercase px-1 py-0.2 rounded tracking-wider ${microPillClass}`}
        >
          {visuals.tierLabel}
        </span>
      )}

      <span className="truncate font-semibold tracking-tight">{label}</span>
    </span>
  )
}
