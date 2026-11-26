import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import UserAvatar from "./common/UserAvatar"

const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

export type PublicPage = "home" | "people" | "companies" | "events" | "articles"
export type PublicNavId = "home" | "people" | "companies" | "events" | "articles"

export interface NavItemType {
  id: PublicNavId
  label: string
  path: string
}

export const NAV_ITEMS: NavItemType[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "people", label: "People", path: "/people" },
  { id: "companies", label: "Companies", path: "/companies" },
  { id: "events", label: "Events", path: "/events" },
  { id: "articles", label: "Articles", path: "/articles" },
]

export default function Navbar({
  onLogin,
  onSignUp,
  onHome,
  onPublicPage,
  onDashboard,
  onCreateBusiness,
}: {
  onLogin?: () => void
  onSignUp?: () => void
  onHome?: () => void
  onPublicPage?: (page: PublicPage) => void
  onDashboard?: () => void
  onCreateBusiness?: () => void
  showRegisterButton?: boolean
} = {}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isLandingPage = location.pathname === "/"
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false)

  const isDashboardPage =
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/dashboard/") ||
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/") ||
    location.pathname === "/companies/new" ||
    location.pathname === "/companies/add"

  if (isDashboardPage) {
    return null
  }

  const currentStatus = user ? (user.status || "pending").toLowerCase() : null
  const isActiveUser = currentStatus === "active"
  const isAdmin = user?.role === "admin" || user?.role?.toLowerCase() === "admin"

  const handleHome = () => {
    if (onHome) onHome()
    else navigate("/")
  }

  const handleLogin = () => {
    if (onLogin) onLogin()
    else navigate("/login")
  }

  const handleSignUp = () => {
    if (onSignUp) onSignUp()
    else navigate("/signup")
  }

  const handleDashboard = () => {
    if (onDashboard) onDashboard()
    else {
      if (!isActiveUser) {
        navigate(currentStatus === "suspended" ? "/account-status" : "/payment")
        return
      }
      const role = user?.role?.toLowerCase()
      if (role === "admin") navigate("/admin/companies")
      else if (role === "company") navigate("/dashboard/company")
      else navigate("/dashboard/profile")
    }
  }

  const handleRegisterBusiness = () => {
    setMobileAuthOpen(false)
    setUserMenuOpen(false)
    if (onCreateBusiness) {
      onCreateBusiness()
    } else {
      navigate("/companies/new")
    }
  }

  const handleNavigatePage = (item: NavItemType) => {
    if (item.path === "/") {
      handleHome()
      return
    }
    if (!user) {
      navigate("/login")
      return
    }
    if (!isActiveUser) {
      navigate(currentStatus === "suspended" ? "/account-status" : "/payment")
      return
    }
    if (onPublicPage && item.id !== "home") onPublicPage(item.id as PublicPage)
    else navigate(item.path)
  }

  const handleSignOut = async () => {
    await logout()
    setUserMenuOpen(false)
    setMobileAuthOpen(false)
    navigate("/login")
  }

  const isItemActive = (item: NavItemType) => {
    if (item.path === "/") {
      return location.pathname === "/"
    }
    return (
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/")
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#0A1628] border-b border-[var(--border-default)] dark:border-[#1A335C] shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5">
        {/* Top Row: Logo on the left, controls (desktop auth + mobile hamburger) on the right */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo on the left (always) */}
          <button
            onClick={handleHome}
            className="flex items-center gap-2.5 flex-shrink-0 group cursor-pointer"
            title="KBN Home"
          >
            <img
              src={knbLogo}
              alt="KBN Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover group-hover:scale-105 transition-transform shadow-xs ring-1 ring-[var(--border-default)] dark:ring-white/10"
            />
            <span className="font-serif text-lg sm:text-xl font-bold text-[#0F1D3A] dark:text-white tracking-tight">
              KBN
            </span>
          </button>

          {/* Right Section: Auth / Dashboard / User Dropdown + Mobile Hamburger */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* If pending or inactive, show Payment Verification badge */}
            {user && !isActiveUser && (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to={
                    currentStatus === "suspended"
                      ? "/account-status"
                      : "/payment"
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {currentStatus === "suspended"
                    ? "Account Suspended"
                    : "Payment Verification Required"}
                </Link>
              </div>
            )}

            {/* Desktop Auth Controls */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-[#0F1D3A] dark:text-slate-200 hover:text-black dark:hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <UserAvatar
                      src={user.profileImage || user.avatar}
                      name={user.name}
                      size="xs"
                      className="w-7 h-7 rounded-lg ring-2 ring-[var(--border-light)]"
                    />
                    <span>{user.name.split(" ")[0]}</span>
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-11 z-50 w-56 bg-white dark:bg-[#0A1628] rounded-xl border border-[var(--border-default)] dark:border-[#1A335C] shadow-xl p-2 animate-slide-down">
                      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/5 mb-1">
                        <p className="text-sm font-semibold text-[#0F1D3A] dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                        {user.business && (
                          <p className="text-xs text-[var(--accent)] font-medium mt-0.5">
                            {user.business}
                          </p>
                        )}
                      </div>
                      {!isAdmin && (
                        <button
                          onClick={handleRegisterBusiness}
                          className="w-full text-left text-sm text-[var(--brand)] font-semibold hover:bg-slate-100 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          Register Your Business
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleDashboard()
                        }}
                        className="w-full text-left text-sm text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={handleLogin}
                  className="text-sm font-medium text-[#0F1D3A] dark:text-slate-200 hover:text-black dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={handleSignUp}
                  className="text-sm font-semibold text-white bg-[var(--brand)] px-4 py-1.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile hamburger / sidebar toggle (always on the right) */}
            <button
              onClick={() => setMobileAuthOpen(!mobileAuthOpen)}
              className={`${
                isLandingPage ? "flex" : "sm:hidden flex"
              } w-8 h-8 rounded-xl border border-[var(--border-default)] dark:border-[#1A335C] items-center justify-center text-[#0F1D3A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer`}
              aria-label={
                mobileAuthOpen
                  ? "Close menu"
                  : isLandingPage
                  ? "Open navigation sidebar"
                  : "Open user options"
              }
              aria-expanded={mobileAuthOpen}
              title="Toggle menu"
            >
              {mobileAuthOpen ? (
                // X icon when menu is open
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                // Hamburger icon when menu is closed
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ✅ Mobile dropdown — no horizontal line, rendered ABOVE the nav bar */}
        {mobileAuthOpen && (
          <div className={`${isLandingPage ? "" : "sm:hidden"} bg-white dark:bg-[#0A1628] px-4 py-3 space-y-2 animate-slide-down border-b border-[var(--border-default)] dark:border-[#1A335C]`}>
            {user ? (
              <>
                <div className="px-2 py-1.5 border-b border-slate-100 dark:border-white/5">
                  <p className="text-sm font-semibold text-[#0F1D3A] dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
                {!isAdmin && (
                  <button
                    onClick={handleRegisterBusiness}
                    className="w-full text-left text-sm font-semibold text-[var(--brand)] px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    Register Your Business
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileAuthOpen(false)
                    handleDashboard()
                  }}
                  className="w-full text-left text-sm font-medium text-[#0F1D3A] dark:text-white px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left text-sm font-medium text-red-600 px-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleRegisterBusiness}
                  className="w-full text-left text-sm font-semibold text-[var(--brand)] px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Register Your Business
                </button>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                  <button
                    onClick={() => {
                      setMobileAuthOpen(false)
                      handleLogin()
                    }}
                    className="w-full text-center text-sm font-medium text-[#0F1D3A] border border-[var(--border-default)] py-2 rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setMobileAuthOpen(false)
                      handleSignUp()
                    }}
                    className="w-full text-center text-sm font-semibold text-white bg-[var(--brand)] py-2 rounded-xl hover:bg-[var(--brand-light)] cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Directly below the logo on the left side: Home, People, Companies, Events, Articles on the same line, NOT scrollable, all displayed at once */}
        <div className="pt-4 flex items-center">
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = isItemActive(item)
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigatePage(item)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#FDF6E8] text-[#0F1D3A] font-bold border border-[var(--accent)]/40 shadow-xs dark:bg-[#D4A853]/15 dark:text-[var(--accent)]"
                      : "text-[#0F1D3A] hover:text-black hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}