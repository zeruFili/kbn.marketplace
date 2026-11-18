import { useState, useEffect, useCallback } from "react"
import {
  fetchCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  updateCategoryStatusApi,
  deleteCategoryApi,
  type CategoryApiItem,
  type CategoryType,
} from "../../api/categoryApi"
import { resolveAssetUrl } from "../../api/baseApi"

const EMOJI_OPTIONS = [
  "🏗️",
  "🏥",
  "🏨",
  "🏡",
  "👕",
  "☕",
  "🪑",
  "🚗",
  "❤️",
  "🎉",
  "⛪",
  "👗",
  "🍽️",
  "💼",
  "🔧",
  "🏠",
  "📚",
  "🎵",
  "🌱",
  "✈️",
  "💻",
  "🛒",
  "🎨",
  "📱",
]

interface CategoryFormState {
  name: string
  type: CategoryType
  description: string
  icon: string
  is_active: boolean
}

const INITIAL_FORM: CategoryFormState = {
  name: "",
  type: "business",
  description: "",
  icon: "💼",
  is_active: true,
}

function isImagePath(value?: string | null): boolean {
  if (!value) return false
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  )
}

export default function AdminCategories() {
  // List & Pagination State
  const [categories, setCategories] = useState<CategoryApiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters & Sorting
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | CategoryType>("all")
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "type">("name")
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
    business: 0,
    company: 0,
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
        type: typeFilter !== "all" ? typeFilter : undefined,
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
        setError(res.message || "Failed to retrieve categories from server.")
      }
    } catch (err: unknown) {
      console.error("Failed to fetch categories:", err)
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while loading categories. Please check your connection."
      )
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, typeFilter, statusFilter, sortBy, sortOrder])

  // Fetch global summary metrics from backend
  const loadStats = useCallback(async () => {
    try {
      const [allRes, activeRes, businessRes, companyRes] = await Promise.all([
        fetchCategoriesApi({ limit: 1 }),
        fetchCategoriesApi({ is_active: true, limit: 1 }),
        fetchCategoriesApi({ type: "business", limit: 1 }),
        fetchCategoriesApi({ type: "company", limit: 1 }),
      ])

      const total = allRes.meta.total
      const active = activeRes.meta.total
      const inactive = Math.max(0, total - active)

      setStats({
        total,
        active,
        inactive,
        business: businessRes.meta.total,
        company: companyRes.meta.total,
      })
    } catch {
      // Non-fatal if summary metrics fail
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

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
      type: cat.type || "business",
      description: cat.description || "",
      icon: cat.icon || "💼",
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
      setFormError("Category name is required.")
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      if (editing) {
        const res = await updateCategoryApi(editing.id, {
          name: form.name.trim(),
          type: form.type,
          description: form.description.trim(),
          icon: form.icon.trim() || undefined,
          is_active: form.is_active,
        })
        if (!res.success) {
          throw new Error(res.message || "Failed to update category.")
        }
        setSuccessMessage(`Category "${form.name.trim()}" updated successfully.`)
      } else {
        const res = await createCategoryApi({
          name: form.name.trim(),
          type: form.type,
          description: form.description.trim(),
          icon: form.icon.trim() || undefined,
          is_active: form.is_active,
        })
        if (!res.success) {
          throw new Error(res.message || "Failed to create category.")
        }
        setSuccessMessage(`Category "${form.name.trim()}" created successfully.`)
      }

      setFormOpen(false)
      setEditing(null)
      await Promise.all([loadCategories(), loadStats()])
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save category."
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
      setSuccessMessage(
        `Category "${cat.name}" is now ${nextActive ? "active" : "inactive"}.`
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
        throw new Error(res.message || "Failed to delete category.")
      }
      setSuccessMessage(`Category "${deleteTarget.name}" deleted successfully.`)
      setDeleteTarget(null)
      await Promise.all([loadCategories(), loadStats()])
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete category."
      )
    } finally {
      setDeleting(false)
    }
  }

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Categories",
            value: stats.total || totalCategories,
            color: "border-l-[var(--brand)]",
          },
          {
            label: "Active Categories",
            value: stats.active,
            color: "border-l-emerald-500",
          },
          {
            label: "Inactive Categories",
            value: stats.inactive,
            color: "border-l-amber-500",
          },
          {
            label: "Business / Company",
            value: `${stats.business} / ${stats.company}`,
            color: "border-l-[var(--accent)]",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-[var(--surface)] rounded-xl border border-[var(--border-light)] border-l-4 ${s.color} p-4 shadow-xs`}
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1">
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
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  statusFilter === f
                    ? "bg-[var(--brand)] text-white shadow-xs"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1">
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] px-2">
              Type:
            </span>
            {(["all", "business", "company"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t)
                  setPage(1)
                }}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  typeFilter === t
                    ? "bg-[var(--brand)] text-white shadow-xs"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Sort Selector */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-")
              setSortBy(sb as "name" | "created_at" | "type")
              setSortOrder(so as "ASC" | "DESC")
              setPage(1)
            }}
            className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
          >
            <option value="name-ASC">Name (A–Z)</option>
            <option value="name-DESC">Name (Z–A)</option>
            <option value="created_at-DESC">Newest First</option>
            <option value="created_at-ASC">Oldest First</option>
            <option value="type-ASC">Type (A–Z)</option>
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
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={openCreate}
            className="bg-[var(--brand)] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[var(--brand-light)] transition-colors flex items-center gap-2 shadow-lg shadow-[var(--brand)]/20 cursor-pointer whitespace-nowrap"
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
            New Category
          </button>
        </div>
      </div>

      {/* Create / Edit Category Form Panel */}
      {formOpen && (
        <form
          onSubmit={handleSave}
          className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 shadow-sm animate-slide-down"
        >
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-light)]">
            <div>
              <h2 className="font-serif text-xl text-[var(--text-primary)]">
                {editing ? "Edit Category" : "Create New Category"}
              </h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {editing
                  ? "Update category details. Changes reflect immediately in member business forms."
                  : "Categories created here are immediately available in the User Dashboard Business dropdown."}
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
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Category Name <span className="text-red-500">*</span>
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
                Category Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "business", label: "Business" },
                    { value: "company", label: "Company" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: opt.value })}
                    className={`text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                      form.type === opt.value
                        ? "bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs"
                        : "bg-[var(--surface-alt)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--brand)]/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Icon
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm({ ...form, icon: emoji })}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition-all cursor-pointer ${
                      form.icon === emoji
                        ? "border-[var(--brand)] bg-[var(--accent-light)] ring-2 ring-[var(--accent)]/40 scale-105"
                        : "border-[var(--border-default)] bg-[var(--surface-alt)] hover:border-[var(--brand)]/40"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
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
                placeholder="Describe what kinds of businesses belong in this category..."
                rows={3}
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] resize-none"
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
                  className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                    form.is_active
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "text-[var(--text-secondary)] border-[var(--border-default)] hover:border-emerald-400"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: false })}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                    !form.is_active
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "text-[var(--text-secondary)] border-[var(--border-default)] hover:border-amber-400"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--border-light)]">
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="bg-[var(--brand)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-sm"
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
                  : "Create Category"}
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
            Loading categories from server...
          </p>
        </div>
      ) : error ? (
        <div className="bg-[var(--surface)] rounded-2xl border border-red-200 dark:border-red-900/40 py-14 px-6 text-center max-w-lg mx-auto">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
            {error}
          </p>
          <button
            onClick={() => void loadCategories()}
            className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 px-6 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-dark)] flex items-center justify-center text-2xl mx-auto mb-4">
            🏷️
          </div>
          <h3 className="font-serif text-xl text-[var(--text-primary)] mb-1.5">
            No categories found
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto mb-5">
            {search || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Create your first business category so members can select it when registering their business."}
          </p>
          {!search && statusFilter === "all" && typeFilter === "all" && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[var(--brand)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer shadow-sm"
            >
              <span>+</span> Create First Category
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
            {categories.map((cat) => {
              const companyCount = cat.company_count ?? 0
              const dateValue = cat.updated_at || cat.created_at
              return (
                <div
                  key={cat.id}
                  className={`bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 card-hover flex flex-col justify-between transition-opacity ${
                    !cat.is_active ? "opacity-75" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]/20 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                        {isImagePath(cat.icon) ? (
                          <img
                            src={resolveAssetUrl(cat.icon || "")}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{cat.icon || "🏷️"}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize bg-[var(--brand)]/10 text-[var(--brand)] dark:bg-blue-950/50 dark:text-blue-300">
                          {cat.type}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                            cat.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {cat.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-1 truncate">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2 min-h-[2.25rem]">
                      {cat.description || "No description provided."}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] mb-4">
                      <span className="font-medium">
                        {companyCount}{" "}
                        {companyCount === 1 ? "business" : "businesses"}
                      </span>
                      <span>
                        {dateValue
                          ? `Updated ${new Date(dateValue).toLocaleDateString()}`
                          : "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-light)]">
                      <button
                        onClick={() => openEdit(cat)}
                        className="flex-1 text-xs font-semibold text-[var(--brand)] dark:text-[var(--accent)] bg-[var(--brand)]/5 dark:bg-white/5 py-2 rounded-lg hover:bg-[var(--brand)]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void handleToggleStatus(cat)}
                        disabled={togglingId === cat.id}
                        className={`text-xs font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                          cat.is_active
                            ? "text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300"
                            : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300"
                        }`}
                      >
                        {togglingId === cat.id
                          ? "..."
                          : cat.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(cat)
                          setDeleteError(null)
                        }}
                        className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 py-2 px-3 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              Delete Category
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
                This category is currently assigned to{" "}
                <strong>{deleteTarget.company_count}</strong>{" "}
                {deleteTarget.company_count === 1 ? "business" : "businesses"}.
                Deactivate it instead of deleting, or reassign those businesses
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
