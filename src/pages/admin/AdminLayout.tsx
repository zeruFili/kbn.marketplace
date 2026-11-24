import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import UserAvatar from "../../components/common/UserAvatar"

const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

interface NavItem {
  id: string
  path: string
  matchPaths?: string[]
  label: string
  icon: string
  hidden?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    path: "/",
    label: "Home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "overview",
    path: "/admin/overview",
    label: "Overview",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    hidden: true,
  },
  {
    id: "companies",
    path: "/admin/companies",
    matchPaths: ["/admin/companies", "/admin/businesses"],
    label: "Business Management",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    id: "users",
    path: "/admin/users",
    label: "User Management",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    id: "payments",
    path: "/admin/payments",
    label: "Payment Management",
    icon: "M2 7h20M5 11h2m-2 4h5m10-8v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2h14a3 3 0 013 3z",
  },
  {
    id: "love-gifts",
    path: "/admin/love-gifts",
    label: "Love Gifts",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
  {
    id: "categories",
    path: "/admin/categories",
    label: "Business Category",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  },
  {
    id: "events",
    path: "/admin/events",
    label: "Events",
    icon: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  },
  {
    id: "articles",
    path: "/admin/articles",
    label: "Articles",
    icon: "M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zm3 4h6m-6 4h6m-6 4h4",
  },
  {
    id: "featured",
    path: "/admin/featured",
    label: "Featured Members & Companies",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  },
]

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.path === "/") {
    return pathname === "/"
  }
  const paths = item.matchPaths ?? [item.path]
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeItem =
    NAV_ITEMS.find((item) => !item.hidden && item.path !== "/" && isNavItemActive(item, location.pathname)) ||
    NAV_ITEMS.find((item) => item.path !== "/" && isNavItemActive(item, location.pathname)) ||
    NAV_ITEMS.find((item) => !item.hidden && item.path !== "/") ||
    NAV_ITEMS[0]

  const sidebar = (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } bg-[var(--brand-dark)] text-white flex flex-col transition-all duration-300 flex-shrink-0 h-full`}
    >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <img
            src={knbLogo}
            alt="KBN"
            className="w-9 h-9 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
          />
          {!collapsed && (
            <span className="font-serif text-lg text-white">Admin</span>
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.filter((item) => !item.hidden).map((item) => {
          const isActive = isNavItemActive(item, location.pathname)
          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={item.icon}
                />
              </svg>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          onClick={async () => {
            await logout()
            setMobileOpen(false)
            navigate("/")
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all cursor-pointer"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3"
            />
          </svg>
          {!collapsed && "Log out"}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all cursor-pointer"
        >
          <svg
            className={`w-5 h-5 flex-shrink-0 transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] flex">
      <div className="hidden lg:flex">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 z-50">{sidebar}</div>
        </div>
      )}

      <main className="flex-1 overflow-auto min-w-0">
        <header className="h-16 bg-[var(--surface)] border-b border-[var(--border-light)] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] transition-colors flex-shrink-0 cursor-pointer"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="font-serif text-base sm:text-lg text-[var(--text-primary)] truncate">
              {activeItem.label}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <UserAvatar
              src={user?.profileImage || user?.avatar}
              name={user?.name}
              size="sm"
              className="w-8 h-8 rounded-lg ring-2 ring-[var(--border-light)]"
            />
            <span className="text-sm font-medium text-[var(--text-secondary)] hidden sm:inline">
              {user?.name}
            </span>
          </div>
        </header>
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
