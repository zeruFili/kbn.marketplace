import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  getApplications,
  getAdminCategories,
  adminSubscribe,
  type CompanyApplication,
} from "../../data/adminStore"
import { fetchAdminUsersApi } from "../../api/userApi"
import { fetchCategoriesApi } from "../../api/categoryApi"
import {
  fetchAdminCompaniesApi,
  resolveFileUrl,
  type CompanyApiResponse,
} from "../../api/companyApi"

interface Counts {
  applications: number
  companies: number
  users: number
  categories: number
}

export default function AdminOverview() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState<Counts>({
    applications: 0,
    companies: 0,
    users: 0,
    categories: 0,
  })
  const [recentCompanies, setRecentCompanies] = useState<CompanyApiResponse[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  useEffect(() => {
    let active = true

    function refresh() {
      const apps = getApplications()
      setCounts((prev) => ({
        ...prev,
        applications: apps.filter((a) => a.status === "pending").length,
      }))
    }
    refresh()

    // Fetch real active businesses count and recent businesses from live backend
    Promise.all([
      fetchAdminCompaniesApi({ is_active: true, limit: 1 }),
      fetchAdminCompaniesApi({ limit: 5, sort_by: "created_at", sort_order: "DESC" }),
    ])
      .then(([activeRes, recentRes]) => {
        if (!active) return
        if (activeRes.success) {
          setCounts((prev) => ({ ...prev, companies: activeRes.meta.total }))
        }
        if (recentRes.success) {
          setRecentCompanies(recentRes.data)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingCompanies(false)
      })

    // Fetch real registered users from live backend
    fetchAdminUsersApi({ limit: 1 })
      .then((res) => {
        if (active && res.success && res.meta?.total !== undefined) {
          setCounts((prev) => ({ ...prev, users: res.meta!.total }))
        }
      })
      .catch(() => {})

    // Fetch real active categories from live backend
    fetchCategoriesApi({ is_active: true, limit: 1 })
      .then((res) => {
        if (active && res.success && res.meta?.total !== undefined) {
          setCounts((prev) => ({ ...prev, categories: res.meta.total }))
        }
      })
      .catch(() => {
        if (!active) return
        const cats = getAdminCategories()
        setCounts((prev) => ({
          ...prev,
          categories: cats.filter((c) => c.status === "active").length,
        }))
      })

    const unsub = adminSubscribe(refresh)
    return () => {
      active = false
      unsub()
    }
  }, [])

  const cards = [
    {
      label: "Pending Applications",
      value: counts.applications,
      color: "bg-amber-500",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      path: undefined as string | undefined,
    },
    {
      label: "Active Businesses",
      value: counts.companies,
      color: "bg-blue-500",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5",
      path: "/admin/companies",
    },
    {
      label: "Registered Users",
      value: counts.users,
      color: "bg-emerald-500",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      path: "/admin/users",
    },
    {
      label: "Active Categories",
      value: counts.categories,
      color: "bg-purple-500",
      icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      path: "/admin/categories",
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Featured Management Spotlight Banner */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-[var(--brand)] via-[#162746] to-[var(--brand-dark)] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-300/30">
            <span>✦</span> Homepage Curation
          </div>
          <h3 className="font-serif text-lg font-bold">Featured Members & Companies</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Select and order the 5–7 members and 5–7 businesses spotlighted on the public landing page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/featured")}
          className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-900 text-xs font-bold hover:bg-amber-300 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          Manage Featured &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            onClick={card.path ? () => navigate(card.path!) : undefined}
            className={`bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 card-hover ${
              card.path ? "cursor-pointer" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl ${card.color} bg-opacity-10 flex items-center justify-center`}
              >
                <svg
                  className={`w-6 h-6 ${card.color.replace("bg-", "text-")}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={card.icon}
                  />
                </svg>
              </div>
            </div>
            <div className="font-serif text-3xl text-[var(--text-primary)] font-bold">
              {card.value}
            </div>
            <div className="text-sm text-[var(--text-tertiary)] mt-1">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentApplications />
        <RecentBusinesses
          companies={recentCompanies}
          loading={loadingCompanies}
          onSelect={(id) => navigate(`/admin/companies/${id}`)}
          onViewAll={() => navigate("/admin/companies")}
        />
      </div>
    </div>
  )
}

function RecentApplications() {
  const [apps, setApps] = useState<CompanyApplication[]>([])

  useEffect(() => {
    function refresh() {
      setApps(getApplications().filter((a) => a.status === "pending"))
    }
    refresh()
    return adminSubscribe(refresh)
  }, [])

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6">
      <h2 className="font-serif text-lg text-[var(--text-primary)] mb-4">
        Recent Applications
      </h2>
      {apps.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">
          No pending applications.
        </p>
      ) : (
        <div className="space-y-3">
          {apps.slice(0, 5).map((app) => (
            <div
              key={app.id}
              className="flex items-center gap-3 p-3 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)]"
            >
              <img
                src={app.logo}
                alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {app.companyName}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {app.category} ·{" "}
                  {new Date(app.submittedAt).toLocaleDateString()}
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Pending
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentBusinesses({
  companies,
  loading,
  onSelect,
  onViewAll,
}: {
  companies: CompanyApiResponse[]
  loading: boolean
  onSelect: (id: string) => void
  onViewAll: () => void
}) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-[var(--text-primary)]">
          Registered Businesses
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-[var(--brand)] dark:text-[var(--accent)] hover:underline cursor-pointer"
        >
          Manage All →
        </button>
      </div>
      {loading ? (
        <div className="py-8 text-center">
          <div className="w-6 h-6 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto" />
        </div>
      ) : companies.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">
          No businesses registered yet.
        </p>
      ) : (
        <div className="space-y-3">
          {companies.map((c) => {
            const logoUrl = resolveFileUrl(c.company_logo)
            const isActive = c.is_active && (c.status || "active") === "active"
            const statusLabel = isActive
              ? "Active"
              : (c.status || "inactive").toLowerCase() === "suspended"
                ? "Suspended"
                : "Inactive"

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className="w-full flex items-center gap-3 p-3 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] hover:border-[var(--brand)]/40 transition-colors text-left cursor-pointer"
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={c.company_name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white border border-[var(--border-light)]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[var(--brand)] text-white font-serif font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {c.company_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {c.company_name}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] truncate">
                    {c.business_category?.name || "Business"}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  }`}
                >
                  {statusLabel}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
