import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import UserAvatar from "./common/UserAvatar"

const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

export type PublicPage = "companies" | "people" | "blogs" | "events" | "articles"

const NAV_ITEMS: { id: PublicPage; label: string; path: string }[] = [
  { id: "companies", label: "Companies", path: "/companies" },
  { id: "people", label: "People", path: "/people" },
  { id: "blogs", label: "Blogs", path: "/blogs" },
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
} = {}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const currentStatus = user ? (user.status || "pending").toLowerCase() : null
  const isActiveUser = currentStatus === "active"

  const handleHome = () => {
    if (onHome) onHome()
    else {
      if (!user) navigate("/login")
      else if (currentStatus === "suspended") navigate("/account-status")
      else if (currentStatus === "pending" || currentStatus === "inactive") navigate("/payment")
      else navigate("/")
    }
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
      if (role === "admin") navigate("/admin/overview")
      else if (role === "company") navigate("/dashboard/company")
      else navigate("/dashboard/profile")
    }
  }

  const handleCreateBusiness = () => {
    if (onCreateBusiness) onCreateBusiness()
    else navigate("/companies/new")
  }

  const handleNavigatePage = (item: (typeof NAV_ITEMS)[0]) => {
    if (!isActiveUser) {
      navigate(currentStatus === "suspended" ? "/account-status" : "/payment")
      return
    }
    if (onPublicPage) onPublicPage(item.id)
    else navigate(item.path)
  }

  const handleSignOut = async () => {
    await logout()
    setUserMenuOpen(false)
    setMenuOpen(false)
    navigate("/login")
  }

  return (
    <header className="glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <button
          onClick={handleHome}
          className="flex items-center gap-2.5 flex-shrink-0 group cursor-pointer"
        >
          <img
            src={knbLogo}
            alt="KBN Logo"
            className="w-9 h-9 rounded-xl object-cover group-hover:scale-105 transition-transform shadow-lg shadow-[var(--brand)]/20"
          />
          <span className="font-serif text-lg sm:text-xl text-[var(--text-primary)] tracking-tight">
            KBN
          </span>
        </button>

        {/* Navigation links only for ACTIVE users */}
        {isActiveUser && (
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" &&
                  location.pathname.startsWith(item.path + "/"))
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigatePage(item)}
                  className={`text-sm font-medium px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "text-[var(--brand)] bg-[var(--surface-alt)] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)]"
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>
        )}

        {/* If pending or inactive, show Payment Verification badge */}
        {user && !isActiveUser && (
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to={currentStatus === "suspended" ? "/account-status" : "/payment"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {currentStatus === "suspended" ? "Account Suspended" : "Payment Verification Required"}
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isActiveUser && (
            <button
              onClick={handleCreateBusiness}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Register Business</span>
              <span className="sm:hidden">Register</span>
            </button>
          )}

          {user ? (
            <>
              <button
                onClick={handleDashboard}
                className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] border border-[var(--brand)] px-3 py-2 rounded-xl hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1.5 rounded-xl hover:bg-[var(--surface-alt)] transition-all cursor-pointer"
                >
                  <UserAvatar
                    src={user.profileImage || user.avatar}
                    name={user.name}
                    size="xs"
                    className="w-7 h-7 rounded-lg ring-2 ring-[var(--border-light)]"
                  />
                  <span className="hidden sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : user.role === "company"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}
                  >
                    {user.role}
                  </span>
                  <svg
                    className="w-4 h-4 hidden sm:block"
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
                  <div className="absolute right-0 top-12 z-50 w-56 bg-[var(--surface)] rounded-xl border border-[var(--border-light)] shadow-xl p-2 animate-slide-down">
                    <div className="px-3 py-2.5 border-b border-[var(--border-light)] mb-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {user.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">
                        {user.email}
                      </p>
                      {user.business && (
                        <p className="text-xs text-[var(--accent-dark)] mt-0.5">
                          {user.business}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        handleDashboard()
                      }}
                      className="w-full text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] px-3 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
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
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      Dashboard
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] px-3 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleLogin}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 sm:px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={handleSignUp}
                className="text-sm font-semibold text-white bg-[var(--brand)] px-3 sm:px-4 py-2 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-lg shadow-[var(--brand)]/20 flex items-center gap-2 cursor-pointer"
              >
                <span className="hidden xs:inline">Sign Up</span>
                <svg
                  className="w-4 h-4 xs:hidden"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </button>
            </>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden w-10 h-10 rounded-xl border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
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
                d={
                  menuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-[var(--border-light)] bg-[var(--surface)] px-4 py-4 space-y-2 animate-slide-down">
          {isActiveUser && (
            <>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path + "/"))
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavigatePage(item)
                      setMenuOpen(false)
                    }}
                    className={`block w-full text-left text-sm font-medium px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                      isActive
                        ? "text-[var(--brand)] bg-[var(--surface-alt)] font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)]"
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
              <button
                onClick={() => {
                  handleCreateBusiness()
                  setMenuOpen(false)
                }}
                className="block w-full text-left text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer"
              >
                + Register Business
              </button>
            </>
          )}

          {user && !isActiveUser && (
            <Link
              to={currentStatus === "suspended" ? "/account-status" : "/payment"}
              onClick={() => setMenuOpen(false)}
              className="block w-full text-left text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-2.5 rounded-xl hover:bg-amber-100 transition-colors"
            >
              {currentStatus === "suspended" ? "⚠️ Account Suspended" : "🧾 Payment Verification"}
            </Link>
          )}
          <div className="pt-2 border-t border-[var(--border-light)] space-y-2">
            {user ? (
              <>
                <button
                  onClick={() => {
                    handleDashboard()
                    setMenuOpen(false)
                  }}
                  className="block w-full text-center text-sm font-semibold text-[var(--brand)] border border-[var(--brand)] px-3 py-2.5 rounded-xl hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2.5 rounded-xl hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    handleLogin()
                    setMenuOpen(false)
                  }}
                  className="block w-full text-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2.5 rounded-xl hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    handleSignUp()
                    setMenuOpen(false)
                  }}
                  className="block w-full text-center text-sm font-semibold text-white bg-[var(--brand)] py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
