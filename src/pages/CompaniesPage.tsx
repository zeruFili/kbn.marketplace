import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { CompanyCard } from "../components/CompanyProfile"
import { getCompanies, subscribe, type Company } from "../data/companyStore"
import { CATEGORIES, type Category } from "../data/companies"

export default function CompaniesPage({
  title = "All Members",
  onBack,
  onSelectCompany,
}: {
  title?: string
  onBack?: () => void
  onSelectCompany?: (c: Company) => void
} = {}) {
  const navigate = useNavigate()
  const [dirCategory, setDirCategory] = useState<Category | null>(null)
  const [dirSearch, setDirSearch] = useState("")
  const [dirSort, setDirSort] = useState<"rating" | "reviews" | "name">("rating")
  const [allCompanies, setAllCompanies] = useState<Company[]>(getCompanies())

  useEffect(() => {
    setAllCompanies(getCompanies())
    const unsub = subscribe(() => setAllCompanies(getCompanies()))
    return unsub
  }, [])

  const dirFiltered = useMemo(() => {
    let result = dirCategory
      ? allCompanies.filter((c) => c.category === dirCategory)
      : allCompanies
    if (dirSearch) {
      const q = dirSearch.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q),
      )
    }
    if (dirSort === "rating") result.sort((a, b) => b.rating - a.rating)
    else if (dirSort === "reviews")
      result.sort((a, b) => b.reviewCount - a.reviewCount)
    else result.sort((a, b) => a.name.localeCompare(b.name))
    return result
  }, [allCompanies, dirCategory, dirSearch, dirSort])

  const handleBack = () => {
    if (onBack) onBack()
    else navigate("/")
  }

  const handleCardClick = (company: Company) => {
    if (onSelectCompany) onSelectCompany(company)
    else navigate(`/companies/${company.id}`)
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <Navbar />

      <div className="bg-[var(--brand-dark)] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/20 transition-all mb-6 cursor-pointer"
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
            Back to Home
          </button>
          <h1 className="font-serif text-3xl md:text-5xl text-white mb-3">
            {title}
          </h1>
          <p className="text-[#94A3B8] text-lg">
            Browse all {allCompanies.length} businesses in our network
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
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
              value={dirSearch}
              onChange={(e) => setDirSearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl p-1">
            {(["rating", "reviews", "name"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setDirSort(opt)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dirSort === opt
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {opt === "rating"
                  ? "Top Rated"
                  : opt === "reviews"
                    ? "Most Reviews"
                    : "A-Z"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          <button
            onClick={() => setDirCategory(null)}
            className={`flex-shrink-0 text-xs font-medium px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              !dirCategory
                ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                : "text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--text-primary)]"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setDirCategory(cat)}
              className={`flex-shrink-0 text-xs font-medium px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                dirCategory === cat
                  ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                  : "text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--text-primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
          {dirFiltered.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              onClick={() => handleCardClick(c)}
            />
          ))}
        </div>

        {dirFiltered.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] flex items-center justify-center mx-auto mb-5 text-3xl">
              🔍
            </div>
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              No results found
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-6">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
