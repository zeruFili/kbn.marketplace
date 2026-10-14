import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  getAdminCompanyById,
  deactivateCompany,
  reactivateCompany,
  updateCompanyCategories,
  getAdminCategories,
  adminSubscribe,
  type AdminCompany,
} from "../../data/adminStore"

export default function AdminCompanyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [company, setCompany] = useState<AdminCompany | undefined>(() =>
    id ? getAdminCompanyById(id) : undefined,
  )
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const allCategories = getAdminCategories()

  useEffect(() => {
    if (!id) return
    const refresh = () => {
      const c = getAdminCompanyById(id)
      setCompany(c)
      if (c) setSelectedCats([...c.category])
    }
    refresh()
    return adminSubscribe(refresh)
  }, [id])

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8 text-center animate-fade-in">
        <div className="text-3xl mb-3">🏢</div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          Company Not Found
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          Could not find listed company with ID "{id}".
        </p>
        <button
          onClick={() => navigate("/admin/companies")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
        >
          ← Back to Listed Companies
        </button>
      </div>
    )
  }

  const handleDeactivate = () => {
    deactivateCompany(company.id)
  }

  const handleReactivate = () => {
    reactivateCompany(company.id)
  }

  const toggleCategory = (cat: string) => {
    const updated = selectedCats.includes(cat)
      ? selectedCats.filter((c) => c !== cat)
      : [...selectedCats, cat]
    setSelectedCats(updated)
    updateCompanyCategories(company.id, updated)
  }

  return (
    <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden animate-scale-in">
      <div className="bg-[var(--brand-dark)] px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/companies")}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors cursor-pointer"
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
          Back to companies
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/companies/${company.id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            View Public Page
          </button>
          <button
            onClick={() => navigate(`/companies/${company.id}/edit`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-dark)] bg-[var(--accent)] hover:brightness-105 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Edit Company
          </button>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              company.status === "active"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {company.status}
          </span>
        </div>
      </div>

      <div className="relative h-44 sm:h-56 bg-slate-800">
        <img
          src={company.banner}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-6 flex items-end gap-4">
          <img
            src={company.logo}
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/20 bg-white"
          />
          <div className="text-white pb-1">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">
              {company.name}
            </h1>
            <p className="text-xs sm:text-sm text-white/80">
              {company.category.join(", ")} · Listed{" "}
              {new Date(company.listedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {company.longDescription || company.description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Email
            </p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {company.email}
            </p>
          </div>
          <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Phone
            </p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {company.phone}
            </p>
          </div>
          <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Location
            </p>
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {company.address}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
            Assigned Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((c) => {
              const active = selectedCats.includes(c.name)
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCategory(c.name)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                      : "bg-[var(--surface-alt)] text-[var(--text-secondary)] border-[var(--border-light)] hover:border-[var(--brand)]/30"
                  }`}
                >
                  {c.name} {active && "✓"}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border-light)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">
            ID: <code className="bg-[var(--surface-alt)] px-1.5 py-0.5 rounded text-[11px]">{company.id}</code>
          </p>
          {company.status === "active" ? (
            <button
              onClick={handleDeactivate}
              className="border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              Deactivate Company
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Reactivate Company
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
