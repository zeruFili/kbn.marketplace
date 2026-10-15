import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import UserAvatar from "../../components/common/UserAvatar"

const USER_NAV_ITEMS = [
  {
    id: "profile",
    path: "/dashboard/profile",
    label: "Profile",
    icon: "M20 21a8 8 0 00-16 0m12-11a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    id: "business",
    path: "/dashboard/business",
    label: "Business",
    icon: "M3 21h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14M9 9h2m-2 4h2m4-4h2m-2 4h2M9 21v-4h6v4",
  },
  {
    id: "payment",
    path: "/dashboard/payment",
    label: "Payment",
    icon: "M2 7h20M5 11h2m-2 4h5m10-8v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2h14a3 3 0 013 3z",
  },
]

export default function UserLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeItem = USER_NAV_ITEMS.find(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/"),
  ) || USER_NAV_ITEMS[0]

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={user?.profileImage || user?.avatar}
            name={user?.name}
            className="w-11 h-11 rounded-xl ring-2 ring-white/20"
          />
          <div className="min-w-0">
            <p className="font-semibold truncate text-white">{user?.name}</p>
            <p className="text-xs text-[#94A3B8] truncate capitalize">
              {user?.role} account
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {USER_NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/")
          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
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
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10 space-y-1">
        <button
          onClick={async () => {
            await logout()
            setMobileOpen(false)
            navigate("/")
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all text-left cursor-pointer"
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
              strokeWidth={1.5}
              d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3"
            />
          </svg>
          Log out
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all text-left cursor-pointer"
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
              strokeWidth={1.5}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Site
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] flex">
      <aside className="hidden md:flex w-64 bg-[var(--brand-dark)] text-white flex-col flex-shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            aria-label="Close dashboard navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[min(20rem,88vw)] bg-[var(--brand-dark)] text-white flex flex-col shadow-2xl animate-slide-down">
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <header className="bg-[var(--brand-dark)] text-white px-4 py-5 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white cursor-pointer"
              aria-label="Open menu"
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
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
                Member Portal
              </p>
              <h1 className="font-serif text-2xl md:text-3xl font-bold mt-1">
                {activeItem.label}
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate("/companies/new")}
            className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-[var(--brand-dark)] bg-[var(--accent)] hover:brightness-105 px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            + Register Business
          </button>
        </header>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
