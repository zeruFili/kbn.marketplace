import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  fetchAdminCompaniesApi,
  updateCompanyStatusApi,
  resolveFileUrl,
  type CompanyApiResponse,
} from "../../api/companyApi"
import {
  fetchCategoriesApi,
  type CategoryApiItem,
} from "../../api/categoryApi"

type StatusFilter = "all" | "active" | "inactive"
type SortField = "created_at" | "company_name" | "updated_at"

function isBusinessActive(company: CompanyApiResponse): boolean {
  const normalizedStatus = (company.status || "").toLowerCase()
  return (
    company.is_active === true &&
    normalizedStatus !== "inactive" &&
    normalizedStatus !== "suspended"
  )
}

function getBusinessStatusDisplay(company: CompanyApiResponse): {
  label: string
  badgeClass: string
  dotClass: string
} {
  const active = isBusinessActive(company)
  const rawStatus = (company.status || (company.is_active ? "active" : "inactive")).toLowerCase()

  if (active) {
    return {
      label: "Active",
      badgeClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      dotClass: "bg-emerald-500",
    }
  }
  if (rawStatus === "suspended") {
    return {
      label: "Suspended",
      badgeClass:
        "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      dotClass: "bg-orange-500",
    }
  }
  if (rawStatus === "pending") {
    return {
      label: "Pending",
      badgeClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      dotClass: "bg-amber-500",
    }
  }
  return {
    label: "Inactive",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    dotClass: "bg-red-500",
  }
}

export default function AdminCompanies() {
  const navigate = useNavigate()

  // Data & Feedback State
  const [companies, setCompanies] = useState<CompanyApiResponse[]>([])
  const [categories, setCategories] = useState<CategoryApiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters, Sorting & Pagination
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
  const [page, setPage] = useState(1)
  const limit = 15
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Global Summary Metrics (live from backend)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  })

  // Status Toggle Confirmation Modal State
  const [statusTarget, setStatusTarget] = useState<{
    company: CompanyApiResponse
    nextActive: boolean
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Auto-dismiss success banner
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  // Load business categories for filter dropdown
  useEffect(() => {
    let active = true
    fetchCategoriesApi({ limit: 100, sort_by: "name", sort_order: "ASC" })
      .then((res) => {
        if (active && res.success) {
          setCategories(res.data)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Fetch filtered list of businesses from backend
  const loadCompanies = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const res = await fetchAdminCompaniesApi({
          page,
          limit,
          search: debouncedSearch.trim() || undefined,
          business_category_id:
            categoryFilter !== "all" ? categoryFilter : undefined,
          is_active:
            statusFilter === "active"
              ? true
              : statusFilter === "inactive"
                ? false
                : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        })

        if (res.success) {
          setCompanies(res.data)
          setTotalCompanies(res.meta.total)
          setTotalPages(res.meta.totalPages)
        } else {
          setError(
            res.message || "Failed to retrieve registered businesses from server."
          )
        }
      } catch (err: unknown) {
        console.error("Failed to load businesses:", err)
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while loading businesses. Please verify your connection."
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [page, limit, debouncedSearch, statusFilter, categoryFilter, sortBy, sortOrder]
  )

  // Fetch global summary counts from live backend
  const loadStats = useCallback(async () => {
    try {
      const [allRes, activeRes, inactiveRes] = await Promise.all([
        fetchAdminCompaniesApi({ limit: 1 }),
        fetchAdminCompaniesApi({ is_active: true, limit: 1 }),
        fetchAdminCompaniesApi({ is_active: false, limit: 1 }),
      ])

      const total = allRes.meta.total
      const active = activeRes.meta.total
      const inactive = inactiveRes.meta.total

      setStats({ total, active, inactive })
    } catch {
      // Non-fatal if summary metrics fail
    }
  }, [])

  useEffect(() => {
    void loadCompanies()
  }, [loadCompanies])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  // Open status confirmation modal
  const handleOpenStatusModal = (company: CompanyApiResponse) => {
    const currentlyActive = isBusinessActive(company)
    setStatusTarget({ company, nextActive: !currentlyActive })
    setActionError(null)
  }

  // Confirm activate / deactivate via backend API with real-time state update
  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return
    const { company, nextActive } = statusTarget

    setActionLoading(true)
    setActionError(null)

    try {
      const res = await updateCompanyStatusApi(company.id, {
        status: nextActive ? "active" : "inactive",
        is_active: nextActive,
      })

      if (res.success && res.data) {
        const updated = res.data

        // Reflect status change immediately in local state
        setCompanies((prev) => {
          if (
            (statusFilter === "active" && !nextActive) ||
            (statusFilter === "inactive" && nextActive)
          ) {
            return prev.filter((item) => item.id !== updated.id)
          }
          return prev.map((item) => (item.id === updated.id ? updated : item))
        })

        setSuccessMessage(
          `"${company.company_name}" has been ${
            nextActive ? "activated" : "deactivated"
          } successfully.`
        )
        setStatusTarget(null)

        // Synchronize live metrics and pagination with backend
        await Promise.all([loadStats(), loadCompanies(true)])
      } else {
        setActionError(res.message || "Failed to update business status.")
      }
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to update business status. Please try again."
      )
    } finally {
      setActionLoading(false)
    }
  }

  const startItem = totalCompanies === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(page * limit, totalCompanies)

  return (
    <div className="animate-fade-in space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            <svg
              className="w-5 h-5 text-emerald-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer font-bold px-1"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Registered Businesses",
            value: stats.total,
            color: "border-l-[var(--brand)]",
            filter: "all" as StatusFilter,
          },
          {
            label: "Active Businesses",
            value: stats.active,
            color: "border-l-emerald-500",
            filter: "active" as StatusFilter,
          },
          {
            label: "Inactive Businesses",
            value: stats.inactive,
            color: "border-l-red-500",
            filter: "inactive" as StatusFilter,
          },
        ].map((card) => {
          const isSelected = statusFilter === card.filter
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                setStatusFilter(card.filter)
                setPage(1)
              }}
              className={`bg-[var(--surface)] rounded-xl border text-left border-l-4 ${card.color} p-4 shadow-xs transition-all cursor-pointer ${
                isSelected
                  ? "border-[var(--brand)]/40 ring-2 ring-[var(--brand)]/10"
                  : "border-[var(--border-light)] hover:border-[var(--border-default)]"
              }`}
            >
              <div className="font-serif text-2xl text-[var(--text-primary)] font-bold">
                {card.value}
              </div>
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {card.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Filter, Category, Sort & Search Controls Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1">
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] px-2">
              Status:
            </span>
            {(
              [
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "inactive", label: "Inactive" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setStatusFilter(opt.id)
                  setPage(1)
                }}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === opt.id
                    ? "bg-[var(--brand)] text-white shadow-xs"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by business category"
            className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
          {/* Sort Selector */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-")
              setSortBy(sb as SortField)
              setSortOrder(so as "ASC" | "DESC")
              setPage(1)
            }}
            aria-label="Sort businesses"
            className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
          >
            <option value="created_at-DESC">Newest First</option>
            <option value="created_at-ASC">Oldest First</option>
            <option value="company_name-ASC">Name (A-Z)</option>
            <option value="company_name-DESC">Name (Z-A)</option>
            <option value="updated_at-DESC">Recently Updated</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search businesses, owner, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              void loadCompanies(true)
              void loadStats()
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Registered Businesses Table Card */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[var(--text-tertiary)] font-medium">
              Loading registered businesses...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center max-w-md mx-auto px-4">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-4">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadCompanies()}
              className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="text-4xl mb-3">🏢</div>
            <h3 className="font-serif text-lg text-[var(--text-primary)] mb-1">
              No Registered Businesses Found
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
              {debouncedSearch || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria to see more businesses."
                : "Registered businesses will appear here once members create business profiles."}
            </p>
            {(debouncedSearch || statusFilter !== "all" || categoryFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setDebouncedSearch("")
                  setStatusFilter("all")
                  setCategoryFilter("all")
                  setPage(1)
                }}
                className="mt-4 px-4 py-2 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-light)] bg-[var(--surface-alt)]">
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-5 py-3.5">
                      Business
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">
                      Category
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">
                      Owner / Contact
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">
                      Location
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5">
                      Status
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5 hidden xl:table-cell">
                      Registered
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-5 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {companies.map((company) => {
                    const logoUrl = resolveFileUrl(company.company_logo)
                    const active = isBusinessActive(company)
                    const statusDisplay = getBusinessStatusDisplay(company)

                    return (
                      <tr
                        key={company.id}
                        onClick={() => navigate(`/admin/companies/${company.id}`)}
                        className="hover:bg-[var(--surface-alt)]/60 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={company.company_name}
                                className="w-10 h-10 rounded-xl object-cover border border-[var(--border-light)] bg-white flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[var(--brand)] text-white font-serif font-bold text-sm flex items-center justify-center flex-shrink-0">
                                {company.company_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate max-w-[220px]">
                                {company.company_name}
                              </p>
                              <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[220px]">
                                {company.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 hidden sm:table-cell">
                          <span className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--brand)]/8 text-[var(--brand)] dark:bg-[var(--accent)]/15 dark:text-[var(--accent)] whitespace-nowrap">
                            {company.business_category?.name || "Uncategorized"}
                          </span>
                        </td>

                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[180px]">
                            {company.owner_primary_contact || "—"}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {company.phone_number || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-xs text-[var(--text-secondary)] truncate max-w-[180px]">
                            {company.physical_address || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase ${statusDisplay.badgeClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusDisplay.dotClass}`}
                            />
                            {statusDisplay.label}
                          </span>
                        </td>

                        <td className="px-4 py-4 hidden xl:table-cell">
                          <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                            {company.created_at
                              ? new Date(company.created_at).toLocaleDateString()
                              : "—"}
                          </span>
                        </td>

                        <td
                          className="px-5 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/companies/${company.id}`)
                              }
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              View Profile
                            </button>
                            {active ? (
                              <button
                                type="button"
                                onClick={() => handleOpenStatusModal(company)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenStatusModal(company)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3.5 border-t border-[var(--border-light)] bg-[var(--surface-alt)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-[var(--text-tertiary)]">
                Showing{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {startItem}–{endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {totalCompanies}
                </span>{" "}
                {totalCompanies === 1 ? "business" : "businesses"}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  ← Previous
                </button>
                <span className="text-xs font-medium text-[var(--text-secondary)] px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal: Activate / Deactivate Business */}
      {statusTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => {
            if (!actionLoading) setStatusTarget(null)
          }}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  statusTarget.nextActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {statusTarget.nextActive ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  )}
                </svg>
              </div>
              <div>
                <h3 className="font-serif text-xl text-[var(--text-primary)]">
                  {statusTarget.nextActive
                    ? "Activate Business"
                    : "Deactivate Business"}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {statusTarget.nextActive ? (
                    <>
                      Are you sure you want to activate{" "}
                      <strong>{statusTarget.company.company_name}</strong>? This
                      business will immediately become active and visible in the
                      public directory.
                    </>
                  ) : (
                    <>
                      Are you sure you want to deactivate{" "}
                      <strong>{statusTarget.company.company_name}</strong>? This
                      business will immediately be hidden from the public
                      directory until reactivated.
                    </>
                  )}
                </p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-800/40">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setStatusTarget(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleConfirmStatusChange()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2 ${
                  statusTarget.nextActive
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {statusTarget.nextActive
                  ? "Confirm Activation"
                  : "Confirm Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
