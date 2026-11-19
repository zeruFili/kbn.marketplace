import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { type Company } from "../data/companies"
import {
  CompanyCardMedia,
  CompanyCover,
  CompanyLogo,
} from "./common/CompanyMedia"

export function PlatformIcon({ platform }: { platform: string }) {
  const p = (platform || "").toLowerCase()
  if (p.includes("linkedin")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.62 1.62 0 1 0 0-3.24 1.62 1.62 0 0 0 0 3.24m1.4 9.74v-8.37H5.06v8.37h2.8z" />
      </svg>
    )
  }
  if (p.includes("facebook")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" />
      </svg>
    )
  }
  if (p.includes("instagram")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    )
  }
  if (p.includes("twitter") || p.includes("x")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  }
  if (p.includes("youtube")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
  if (p.includes("telegram")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    )
  }
  if (p.includes("whatsapp")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.301-.15-1.782-.88-2.058-.98-.276-.1-.476-.15-.677.15-.2.301-.777.98-.953 1.181-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.1-.2.05-.376-.025-.527-.075-.15-.677-1.631-.928-2.233-.244-.587-.493-.507-.677-.517-.175-.01-.376-.01-.577-.01-.2 0-.527.075-.802.376s-1.054 1.03-1.054 2.511 1.079 2.912 1.23 3.113c.15.2 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.23 1.378.197 1.898.12.58-.087 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.042 21.848h-.008a9.837 9.837 0 0 1-5.01-1.375l-.36-.214-3.725.977.994-3.632-.234-.372a9.839 9.839 0 0 1-1.508-5.205C2.193 6.602 6.612 2.183 12.047 2.183a9.799 9.799 0 0 1 6.963 2.887 9.799 9.799 0 0 1 2.881 6.968c-.004 5.431-4.423 9.81-9.849 9.81zM12.042 0C5.402 0 .01 5.392.01 12.032c0 2.12.553 4.187 1.604 6.009L0 24l6.143-1.611a11.97 11.97 0 0 0 5.899 1.547h.005c6.64 0 12.032-5.393 12.032-12.033C24.079 5.392 18.682 0 12.042 0z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    Automotive: "🚗",
    Cars: "🚗",
    Clothing: "👕",
    "Coffee Shops": "☕",
    Construction: "🏗️",
    Fashion: "👕",
    "Food & Beverage": "☕",
    Furniture: "🪑",
    "Guest Houses": "🏡",
    Healthcare: "🏥",
    Hospitals: "🏥",
    Hospitality: "🏨",
    Hotels: "🏨",
    Ministry: "⛪",
    "Professional Services": "💼",
  }
  const match = Object.keys(icons).find(
    (k) => k.toLowerCase() === (category || "").toLowerCase()
  )
  return <span>{match ? icons[match] : "🏢"}</span>
}

function getCategoryGradient(cat: string): string {
  const g: Record<string, string> = {
    Construction: "from-amber-500/10 to-orange-500/10",
    Hospitals: "from-emerald-500/10 to-teal-500/10",
    Healthcare: "from-emerald-500/10 to-teal-500/10",
    Hotels: "from-violet-500/10 to-purple-500/10",
    Hospitality: "from-violet-500/10 to-purple-500/10",
    "Guest Houses": "from-rose-500/10 to-pink-500/10",
    Clothing: "from-sky-500/10 to-blue-500/10",
    "Coffee Shops": "from-yellow-500/10 to-amber-500/10",
    Furniture: "from-indigo-500/10 to-blue-500/10",
    Cars: "from-red-500/10 to-orange-500/10",
    Ministry: "from-sky-500/10 to-blue-500/10",
    Fashion: "from-rose-500/10 to-pink-500/10",
    "Food & Beverage": "from-yellow-500/10 to-amber-500/10",
    "Professional Services": "from-indigo-500/10 to-blue-500/10",
    Automotive: "from-red-500/10 to-orange-500/10",
  }
  const match = Object.keys(g).find(
    (k) => k.toLowerCase() === (cat || "").toLowerCase()
  )
  return match ? g[match] : "from-indigo-500/10 to-blue-500/10"
}

function getCategoryColor(cat: string): string {
  const c: Record<string, string> = {
    Construction:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    Hospitals:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    Healthcare:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    Hotels:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    Hospitality:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    "Guest Houses":
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    Clothing: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    "Coffee Shops":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    Furniture:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    Cars: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    Ministry: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    Fashion: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    "Food & Beverage":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "Professional Services":
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    Automotive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  }
  const match = Object.keys(c).find(
    (k) => k.toLowerCase() === (cat || "").toLowerCase()
  )
  return (
    (match ? c[match] : null) ||
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
  )
}

function CompanyCard({
  company,
  onClick,
}: {
  company: Company
  onClick: () => void
}) {
  return (
    <article
      onClick={onClick}
      className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden cursor-pointer group flex flex-col h-full"
    >
      <CompanyCardMedia
        name={company.name}
        category={company.category}
        coverSrc={company.banner}
        logoSrc={company.logo}
        featured={company.featured}
        heightClass="h-36"
        logoPosition="top-right"
        logoSize="sm"
        hoverZoom
      />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${getCategoryColor(company.category)}`}
          >
            {company.category}
          </span>
          <span className="text-[10px] font-medium text-[var(--text-tertiary)] flex items-center gap-1 min-w-0 truncate">
            <svg
              className="w-3 h-3 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">
              {(company.address || "Addis Ababa").split(",")[1]?.trim() ||
                (company.address || "Addis Ababa").split(",")[0]}
            </span>
          </span>
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] text-[15px] leading-tight mb-1.5 truncate group-hover:text-[var(--brand)] transition-colors">
          {company.name}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-4 line-clamp-2 min-h-[2.45rem]">
          {company.description}
        </p>
        <div className="mt-auto flex items-center justify-end">
          <span className="text-xs font-medium text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
            View →
          </span>
        </div>
      </div>
    </article>
  )
}

export default function CompanyProfile({
  company,
  onBack,
  fromDashboard,
}: {
  company: Company
  onBack: () => void
  fromDashboard?: boolean
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [company.id])

  // Strict Edit Company Button visibility rule:
  // Only show the Edit Company button when the user is viewing their company profile from the dashboard.
  // Outside the dashboard, the button is never shown, even for the owner or admin.
  const isFromDashboard = Boolean(fromDashboard || location.state?.fromDashboard)
  const canEdit =
    isFromDashboard &&
    !!user &&
    (user.role === "admin" ||
      user.email?.toLowerCase() === company.email?.toLowerCase() ||
      user.name?.toLowerCase() === company.ownerName?.toLowerCase() ||
      user.companyId === company.id ||
      user.id === company.createdBy)

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <div className="relative min-h-[18rem] sm:h-80 lg:h-96 bg-[var(--brand-dark)] overflow-hidden">
        <CompanyCover
          src={company.banner}
          name={company.name}
          category={company.category}
          imageClassName="opacity-50"
          showWatermark
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-dark)]/95 via-[var(--brand-dark)]/40 to-transparent" />

        {/* Top-left Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-white/15 hover:bg-white/20 transition-all z-20 cursor-pointer shadow-md"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>

        {/* Mobile-only logo in top-right corner to prevent collision with Back button */}
        <div className="sm:hidden absolute top-4 right-4 z-20">
          <CompanyLogo
            src={company.logo}
            name={company.name}
            category={company.category}
            size="md"
            fit="contain"
            className="w-14 h-14 border-2 border-white/40 shadow-xl bg-white"
          />
        </div>

        {/* Desktop-only Edit Company button at top-right (only when from dashboard) */}
        {canEdit && (
          <button
            onClick={() =>
              navigate(`/companies/${company.id}/edit`, {
                state: { fromDashboard: true },
              })
            }
            className="hidden sm:flex absolute top-5 right-5 items-center gap-2 bg-white/15 backdrop-blur-md text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/25 transition-all z-20 cursor-pointer shadow-lg"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Edit Company
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
            {/* Desktop logo at bottom-left */}
            <div className="hidden sm:block shrink-0">
              <CompanyLogo
                src={company.logo}
                name={company.name}
                category={company.category}
                size="xl"
                fit="contain"
                className="border-4 border-white/25 shadow-2xl bg-white"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getCategoryColor(company.category)}`}
                >
                  {company.category}
                </span>
                {company.featured && (
                  <span className="text-xs font-semibold text-white bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                    ✦ Featured
                  </span>
                )}
                {/* <span className="text-xs font-medium text-white/70 bg-white/5 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Verified
                </span> */}
              </div>
              <h1 className="font-serif text-2xl md:text-5xl text-white leading-tight break-words">
                {company.name}
              </h1>
              {company.ownerName && (
                <p className="text-white/70 text-sm mt-1">
                  Owned by{" "}
                  <span className="font-medium text-white">
                    {company.ownerName}
                  </span>
                </p>
              )}
              {company.missionStatement && (
                <p className="text-white/50 text-sm italic mt-2 max-w-xl leading-relaxed">
                  "{company.missionStatement}"
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-2 bg-white text-[var(--brand)] text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Call
                </a>
              )}
              {Boolean(company.website && company.website.trim()) && (
                <a
                  href={
                    company.website.startsWith("http")
                      ? company.website
                      : `https://${company.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[var(--brand)] text-white text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-[var(--brand-dark)] transition-colors shadow-lg cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Visit Website
                </a>
              )}
              {canEdit && (
                <button
                  onClick={() =>
                    navigate(`/companies/${company.id}/edit`, {
                      state: { fromDashboard: true },
                    })
                  }
                  className="sm:hidden flex items-center gap-2 bg-white/20 backdrop-blur-md text-white text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/25 hover:bg-white/30 transition-colors shadow-lg cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Edit Company
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in-up">
              <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-5">
                About
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                {company.longDescription}
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {company.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-1.5 rounded-full border border-[var(--border-light)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in-up">
              <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-5">
                Services
              </h2>
              {company.services && company.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {company.services.map((svc, i) => (
                    <div
                      key={svc}
                      className="flex items-center gap-3 p-3.5 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] hover:border-[var(--brand)]/30 hover:bg-[var(--brand)]/5 transition-all group"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--brand)]/20 transition-colors">
                        <svg
                          className="w-4 h-4 text-[var(--brand)]"
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
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {svc}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)] italic">
                  No services listed yet.
                </p>
              )}
            </section>

            {company.gallery.length > 0 && (
              <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in-up">
                <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-5">
                  Gallery
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {company.gallery.map((img, i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] rounded-xl overflow-hidden bg-[var(--border-light)] group"
                    >
                      <img
                        src={img}
                        alt={`${company.name} ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {company.socialMedia && company.socialMedia.length > 0 && (
              <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in-up">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                    Social Media & Links
                  </h2>
                  <span className="text-xs text-[var(--text-tertiary)] font-medium">
                    {company.socialMedia.length} {company.socialMedia.length === 1 ? "Link" : "Links"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {company.socialMedia.map((sm, i) => {
                    const href = sm.link.startsWith("http")
                      ? sm.link
                      : `https://${sm.link}`
                    return (
                      <a
                        key={sm.id || `${sm.platform}-${i}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3.5 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/5 transition-all group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <PlatformIcon platform={sm.platform} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors capitalize truncate">
                            {sm.platform}
                          </p>
                          <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                            {sm.link.replace(/^https?:\/\//, "")}
                          </p>
                        </div>
                        <span className="text-xs text-[var(--brand)] flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                          ↗
                        </span>
                      </a>
                    )
                  })}
                </div>
              </section>
            )}

          </div>

          <div className="space-y-6">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 animate-fade-in-up">
              <h3 className="font-semibold text-[var(--text-primary)] mb-5">
                Contact & Details
              </h3>
              <div className="space-y-4">
                {[
                  ...(company.ownerName
                    ? [
                        {
                          icon: (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          ),
                          label: "Founder / Leadership",
                          value: company.ownerName,
                        },
                      ]
                    : []),
                  ...(company.website && company.website.trim()
                    ? [
                        {
                          icon: (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                            />
                          ),
                          label: "Website",
                          value: company.website.replace(/^https?:\/\//, ""),
                          href: company.website.startsWith("http")
                            ? company.website
                            : `https://${company.website}`,
                        },
                      ]
                    : []),
                  ...(company.phone
                    ? [
                        {
                          icon: (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          ),
                          label: "Phone",
                          value: company.phone,
                          href: `tel:${company.phone}`,
                        },
                      ]
                    : []),
                  ...(company.email
                    ? [
                        {
                          icon: (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          ),
                          label: "Email",
                          value: company.email,
                          href: `mailto:${company.email}`,
                        },
                      ]
                    : []),
                  ...(company.address
                    ? [
                        {
                          icon: (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          ),
                          label: "Location",
                          value: company.address,
                        },
                      ]
                    : []),
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3.5 group">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
                        {item.label}
                      </div>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors break-words line-clamp-1"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-[var(--text-primary)] break-words line-clamp-2">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export { CompanyCard, CategoryIcon, getCategoryColor }
