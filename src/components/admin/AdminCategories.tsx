import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  fetchCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  updateCategoryStatusApi,
  deleteCategoryApi,
  type CategoryApiItem,
} from "../../api/categoryApi"
import {
  fetchCompanies,
  resolveFileUrl,
  type CompanyApiResponse,
} from "../../api/companyApi"

interface CategoryFormState {
  name: string
  description: string
  is_active: boolean
}

const INITIAL_FORM: CategoryFormState = {
  name: "",
  description: "",
  is_active: true,
}

export default function AdminCategories() {
  const navigate = useNavigate()

  // List & Pagination State
  const [categories, setCategories] = useState<CategoryApiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters & Sorting
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [sortBy, setSortBy] = useState<"name" | "created_at">("name")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCategories, setTotalCategories] = useState(0)
  const limit = 18

  // Live Global Metrics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  })

  // Create / Edit Form State
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryApiItem | null>(null)
  const [form, setForm] = useState<CategoryFormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Status Toggle & Delete Modal State
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryApiItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Selected Category Drill-Down (Companies belonging to category)
  const [selectedCategory, setSelectedCategory] = useState<CategoryApiItem | null>(null)
  const [categoryCompanies, setCategoryCompanies] = useState<CompanyApiResponse[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [companiesError, setCompaniesError] = useState<string | null>(null)
  const [companySearch, setCompanySearch] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  // Fetch filtered categories from backend
  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchCategoriesApi({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
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
        setCategories(res.data)
        setTotalCategories(res.meta.total)
        setTotalPages(res.meta.totalPages)
      } else {
        setError(res.message || "Failed to retrieve business categories from server.")
      }
    } catch (err: unknown) {
      console.error("Failed to fetch categories:", err)
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while loading business categories. Please check your connection."
      )
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, sortBy, sortOrder])

  // Fetch global summary metrics from backend
  const loadStats = useCallback(async () => {
    try {
      const [allRes, activeRes] = await Promise.all([
        fetchCategoriesApi({ limit: 1 }),
        fetchCategoriesApi({ is_active: true, limit: 1 }),
      ])

      const total = allRes.meta.total
      const active = activeRes.meta.total
      const inactive = Math.max(0, total - active)

      setStats({ total, active, inactive })
    } catch {
      // Non-fatal if summary metrics fail
    }
  }, [])

  // Fetch companies belonging to the selected category
  const loadCategoryCompanies = useCallback(async (categoryId: string) => {
    setLoadingCompanies(true)
    setCompaniesError(null)
    try {
      const res = await fetchCompanies({
        business_category_id: categoryId,
        limit: 100,
        sort_by: "created_at",
        sort_order: "DESC",
      })
      setCategoryCompanies(res.raw)
    } catch (err: unknown) {
      console.error("Failed to fetch companies for category:", err)
      setCategoryCompanies([])
      setCompaniesError(
        err instanceof Error
          ? err.message
          : "Failed to load companies for this category."
      )
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    if (!selectedCategory) return
    void loadCategoryCompanies(selectedCategory.id)
  }, [selectedCategory, loadCategoryCompanies])

  function openCategoryCompanies(cat: CategoryApiItem) {
    setSelectedCategory(cat)
    setCompanySearch("")
  }

  function openCreate() {
    setEditing(null)
    setForm(INITIAL_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(cat: CategoryApiItem) {
    setEditing(cat)
    setForm({
      name: cat.name,
      description: cat.description || "",
      is_active: cat.is_active,
    })
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    if (saving) return
    setFormOpen(false)
    setEditing(null)
    setFormError(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError("Business category name is required.")
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      if (editing) {
        const res = await updateCategoryApi(editing.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          is_active: form.is_active,
        })
        if (!res.success) {
          throw new Error(res.message || "Failed to update business category.")
        }
        if (selectedCategory && selectedCategory.id === editing.id && res.data) {
          setSelectedCategory(res.data)
        }
        setSuccessMessage(
          `Business category "${form.name.trim()}" updated successfully.`
        )
      } else {
        const res = await createCategoryApi({
          name: form.name.trim(),
          type: "company",
          description: form.description.trim(),
          is_active: form.is_active,
        })
        if (!res.success) {
          throw new Error(res.message || "Failed to create business category.")
        }
        setSuccessMessage(
          `Business category "${form.name.trim()}" created successfully.`
        )
      }

      setFormOpen(false)
      setEditing(null)
      await Promise.all([loadCategories(), loadStats()])
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save business category."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(cat: CategoryApiItem) {
    setTogglingId(cat.id)
    setError(null)
    try {
      const nextActive = !cat.is_active
      const res = await updateCategoryStatusApi(cat.id, nextActive)
      if (!res.success) {
        throw new Error(res.message || "Failed to update category status.")
      }
      if (selectedCategory && selectedCategory.id === cat.id && res.data) {
        setSelectedCategory(res.data)
      }
      setSuccessMessage(
        `Business category "${cat.name}" is now ${nextActive ? "active" : "inactive"}.`
      )
      await Promise.all([loadCategories(), loadStats()])
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update category status."
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await deleteCategoryApi(deleteTarget.id)
      if (!res.success) {
        throw new Error(res.message || "Failed to delete business category.")
      }
      if (selectedCategory && selectedCategory.id === deleteTarget.id) {
        setSelectedCategory(null)
      }
      setSuccessMessage(
        `Business category "${deleteTarget.name}" deleted successfully.`
      )
      setDeleteTarget(null)
      await Promise.all([loadCategories(), loadStats()])
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete business category."
      )
    } finally {
      setDeleting(false)
    }
  }

  const filteredCategoryCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase()
    if (!q) return categoryCompanies
    return categoryCompanies.filter((c) =>
      `${c.company_name} ${c.owner_primary_contact} ${c.email} ${c.phone_number} ${c.physical_address}`
        .toLowerCase()
        .includes(q)
    )
  }, [categoryCompanies, companySearch])

  // ─── Selected Category Companies View ──────────────────────────────────────
  if (selectedCategory) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] dark:text-[var(--accent)] hover:opacity-80 transition-opacity cursor-pointer w-fit"
          >
            <span aria-hidden="true">←</span> Back to Business Categories
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadCategoryCompanies(selectedCategory.id)}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Category Summary Banner */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] border-l-4 border-l-[var(--accent)] p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-dark)] mb-1">
                Business Category
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-bold">
                  {selectedCategory.name}
                </h2>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                    selectedCategory.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {selectedCategory.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-2xl leading-relaxed">
                {selectedCategory.description || "No description provided for this category."}
              </p>
            </div>
            <div className="bg-[var(--surface-alt)] border border-[var(--border-light)] rounded-xl px-4 py-3 text-center flex-shrink-0 min-w-[120px]">
              <div className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                {loadingCompanies ? "…" : categoryCompanies.length}
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)]">
                {categoryCompanies.length === 1 ? "Company" : "Companies"}
              </div>
            </div>
          </div>
        </div>

        {/* Companies Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg text-[var(--text-primary)]">
              Companies in {selectedCategory.name}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Showing {filteredCategoryCompanies.length} of {categoryCompanies.length}{" "}
              {categoryCompanies.length === 1 ? "company" : "companies"}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
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
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
        </div>

        {/* Companies List Card */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden shadow-xs">
          {loadingCompanies ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-[var(--text-tertiary)] font-medium">
                Loading companies in {selectedCategory.name}...
              </p>
            </div>
          ) : companiesError ? (
            <div className="py-16 px-6 text-center max-w-md mx-auto">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
                {companiesError}
              </p>
              <button
                type="button"
                onClick={() => void loadCategoryCompanies(selectedCategory.id)}
                className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredCategoryCompanies.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <h4 className="font-serif text-lg text-[var(--text-primary)] mb-1">
                {categoryCompanies.length === 0
                  ? "No companies in this category yet"
                  : "No matching companies"}
              </h4>
              <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
                {categoryCompanies.length === 0
                  ? `Companies that register under "${selectedCategory.name}" will appear here automatically.`
                  : "Try adjusting your search query."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-light)] bg-[var(--surface-alt)]">
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-5 py-3.5">
                      Company
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">
                      Owner / Contact
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">
                      Location
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5">
                      Verification
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-4 py-3.5">
                      Status
                    </th>
                    <th className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-5 py-3.5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {filteredCategoryCompanies.map((company) => {
                    const logoUrl = resolveFileUrl(company.company_logo)
                    const vStatus = (company.verification_status || "pending").toLowerCase()
                    const cStatus = (company.status || (company.is_active ? "active" : "inactive")).toLowerCase()

                    return (
                      <tr
                        key={company.id}
                        className="hover:bg-[var(--surface-alt)]/60 transition-colors"
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
                              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                {company.company_name}
                              </p>
                              <p className="text-xs text-[var(--text-tertiary)] truncate">
                                {company.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-sm text-[var(--text-primary)] font-medium">
                            {company.owner_primary_contact || "—"}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {company.phone_number || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-xs text-[var(--text-secondary)] max-w-[200px] truncate">
                            {company.physical_address || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                              vStatus === "verified"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : vStatus === "rejected"
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {vStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                              cStatus === "active"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : cStatus === "suspended"
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {cStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/companies/${company.id}`)}
                            className="text-xs font-semibold text-[var(--brand)] dark:text-[var(--accent)] hover:underline cursor-pointer whitespace-nowrap"
                          >
                            View Profile →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Business Categories List View ─────────────────────────────────────────
  return (
    <div className="animate-fade-in space-y-6">
      {/* Success Toast Banner */}
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
            label: "Total Business Categories",
            value: stats.total || totalCategories,
            color: "border-l-[var(--brand)]",
          },
          {
            label: "Active",
            value: stats.active,
            color: "border-l-emerald-500",
          },
          {
            label: "Inactive",
            value: stats.inactive,
            color: "border-l-amber-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-[var(--surface)] rounded-xl border border-[var(--border-default)] border-l-4 ${s.color} p-4 shadow-xs`}
          >
            <div className="font-serif text-2xl text-[var(--text-primary)] font-bold">
              {s.value}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters, Search & Create Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 w-fit">
          <span className="text-[11px] font-semibold text-[var(--text-tertiary)] px-2">
            Status:
          </span>
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setStatusFilter(f)
                setPage(1)
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                statusFilter === f
                  ? "bg-[var(--brand)] text-white shadow-xs"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Sort Selector */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-")
              setSortBy(sb as "name" | "created_at")
              setSortOrder(so as "ASC" | "DESC")
              setPage(1)
            }}
            className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
          >
            <option value="name-ASC">Name (A–Z)</option>
            <option value="name-DESC">Name (Z–A)</option>
            <option value="created_at-DESC">Newest First</option>
            <option value="created_at-ASC">Oldest First</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
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
              placeholder="Search business categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={openCreate}
            className="bg-[var(--brand-dark)] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[var(--brand)] transition-colors flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
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
            New Business Category
          </button>
        </div>
      </div>

      {/* Create / Edit Business Category Form Panel */}
      {formOpen && (
        <form
          onSubmit={handleSave}
          className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 shadow-sm animate-slide-down"
        >
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-light)]">
            <div>
              <h2 className="font-serif text-xl text-[var(--text-primary)]">
                {editing ? "Edit Business Category" : "Create Business Category"}
              </h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {editing
                  ? "Update this business category. Changes reflect immediately in member business forms."
                  : "Business categories created here are immediately available in the User Dashboard Business dropdown."}
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="w-8 h-8 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] flex items-center justify-center cursor-pointer"
              aria-label="Close form"
            >
              ✕
            </button>
          </div>

          {formError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
              <span>{formError}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Business Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Construction, Hospitality, Healthcare"
                maxLength={255}
                required
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Visibility Status
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: true })}
                  className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer text-white ${
                    form.is_active
                      ? "bg-[var(--brand-dark)] border-[var(--brand-dark)] ring-2 ring-[var(--accent)] shadow-xs"
                      : "bg-[var(--brand-dark)]/55 border-transparent hover:bg-[var(--brand-dark)]/80"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: false })}
                  className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer text-white ${
                    !form.is_active
                      ? "bg-[var(--brand-dark)] border-[var(--brand-dark)] ring-2 ring-[var(--accent)] shadow-xs"
                      : "bg-[var(--brand-dark)]/55 border-transparent hover:bg-[var(--brand-dark)]/80"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe what kinds of companies belong in this business category..."
                rows={3}
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--border-light)]">
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="bg-[var(--brand-dark)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[var(--brand)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-sm"
            >
              {saving && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {saving
                ? editing
                  ? "Saving Changes..."
                  : "Creating..."
                : editing
                  ? "Save Changes"
                  : "Create Business Category"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-4 py-2.5 rounded-xl hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Content Area: Loading / Error / Grid / Empty */}
      {loading ? (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] py-20 text-center">
          <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--text-tertiary)] font-medium">
            Loading business categories from server...
          </p>
        </div>
      ) : error ? (
        <div className="bg-[var(--surface)] rounded-2xl border border-red-200 dark:border-red-900/40 py-14 px-6 text-center max-w-lg mx-auto">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
            {error}
          </p>
          <button
            onClick={() => void loadCategories()}
            className="px-4 py-2 rounded-xl bg-[var(--brand-dark)] text-white text-xs font-semibold hover:bg-[var(--brand)] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 px-6 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <h3 className="font-serif text-xl text-[var(--text-primary)] mb-1.5">
            No business categories found
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto mb-5">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Create your first business category so members can select it when registering their company."}
          </p>
          {!search && statusFilter === "all" && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[var(--brand-dark)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[var(--brand)] transition-colors cursor-pointer shadow-sm"
            >
              <span>+</span> Create First Business Category
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const companyCount = cat.company_count ?? 0
              const dateValue = cat.updated_at || cat.created_at
              return (
                <div
                  key={cat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openCategoryCompanies(cat)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openCategoryCompanies(cat)
                    }
                  }}
                  className="group bg-[var(--surface)] rounded-2xl border border-[var(--border-default)] hover:border-[var(--brand)]/40 p-5 shadow-xs hover:shadow-md flex flex-col justify-between transition-colors transition-shadow duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] dark:group-hover:text-[var(--accent)] transition-colors truncate">
                        {cat.name}
                      </h3>
                      <span
                        className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                          cat.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2 min-h-[2.25rem]">
                      {cat.description || "No description provided."}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] mb-4">
                      <span className="font-semibold text-[var(--accent-dark)] group-hover:underline">
                        {companyCount}{" "}
                        {companyCount === 1 ? "company" : "companies"} →
                      </span>
                      <span>
                        {dateValue
                          ? `Updated ${new Date(dateValue).toLocaleDateString()}`
                          : "—"}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2 pt-3 border-t border-[var(--border-light)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="flex-1 text-xs font-semibold text-[var(--brand-dark)] dark:text-white border border-[var(--border-default)] bg-[var(--surface-alt)] py-2 rounded-lg hover:border-[var(--brand-dark)] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(cat)}
                        disabled={togglingId === cat.id}
                        className="text-xs font-semibold text-white bg-[var(--brand-dark)] hover:bg-[var(--brand)] py-2 px-3 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {togglingId === cat.id
                          ? "..."
                          : cat.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(cat)
                          setDeleteError(null)
                        }}
                        className="text-xs font-semibold text-white bg-[var(--brand-dark)] hover:bg-red-700 py-2 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-light)]">
              <p className="text-xs text-[var(--text-tertiary)]">
                Page {page} of {totalPages} ({totalCategories} total categories)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface)] disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface)] disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              Delete Business Category
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[var(--text-primary)]">
                {deleteTarget.name}
              </strong>
              ? This action cannot be undone.
            </p>

            {(deleteTarget.company_count ?? 0) > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                This business category is currently assigned to{" "}
                <strong>{deleteTarget.company_count}</strong>{" "}
                {deleteTarget.company_count === 1 ? "company" : "companies"}.
                Deactivate it instead of deleting, or reassign those companies
                first.
              </div>
            )}

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-light)]">
              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setDeleteTarget(null)
                    setDeleteError(null)
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {deleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
