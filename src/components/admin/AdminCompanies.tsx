import { useState, useEffect } from 'react'
import { getListedCompanies, rateCompany, deactivateCompany, reactivateCompany, updateCompanyCategories, adminSubscribe, type AdminCompany } from '../../data/adminStore'
import { getAdminCategories } from '../../data/adminStore'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [selected, setSelected] = useState<AdminCompany | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'deactivated'>('all')

  useEffect(() => {
    function refresh() { setCompanies(getListedCompanies()) }
    refresh()
    return adminSubscribe(refresh)
  }, [])

  const filtered = companies.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.some(cat => cat.toLowerCase().includes(q))
    }
    return true
  })

  if (selected) {
    return (
      <div className="animate-scale-in">
        <CompanyDetail
          company={selected}
          onBack={() => setSelected(null)}
          onRate={(r) => { rateCompany(selected.id, r); setSelected(prev => prev ? { ...prev, rating: Math.round(((prev.rating * prev.reviewCount + r) / (prev.reviewCount + 1)) * 10) / 10, reviewCount: prev.reviewCount + 1 } : null) }}
          onDeactivate={() => { deactivateCompany(selected.id); setSelected(null) }}
          onReactivate={() => { reactivateCompany(selected.id); setSelected(null) }}
          onUpdateCategories={(cats) => { updateCompanyCategories(selected.id, cats); setSelected(null) }}
        />
      </div>
    )
  }

  const active = companies.filter(c => c.status === 'active').length
  const deactivated = companies.filter(c => c.status === 'deactivated').length

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Listed', value: companies.length, color: 'border-l-[var(--brand)]' },
          { label: 'Active', value: active, color: 'border-l-emerald-500' },
          { label: 'Deactivated', value: deactivated, color: 'border-l-red-500' },
        ].map(s => (
          <div key={s.label} className={`bg-[var(--surface)] rounded-xl border border-[var(--border-light)] border-l-4 ${s.color} p-4`}>
            <div className="font-serif text-2xl text-[var(--text-primary)] font-bold">{s.value}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 w-fit">
          {(['all', 'active', 'deactivated'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${filterStatus === f ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <div className="text-3xl mb-3">🏢</div>
          <p className="text-sm text-[var(--text-tertiary)]">No companies found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 text-left card-hover w-full">
              <div className="flex items-start gap-3 mb-3">
                <img src={c.logo} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-[var(--border-light)]" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{c.category.join(', ')}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                <span>{'★'.repeat(Math.round(c.rating))} {c.rating.toFixed(1)} ({c.reviewCount})</span>
                <span>{new Date(c.listedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CompanyDetail({ company, onBack, onRate, onDeactivate, onReactivate, onUpdateCategories }: {
  company: AdminCompany
  onBack: () => void
  onRate: (r: number) => void
  onDeactivate: () => void
  onReactivate: () => void
  onUpdateCategories: (cats: string[]) => void
}) {
  const [rating, setRating] = useState(0)
  const [rated, setRated] = useState(false)
  const [showCategoryEditor, setShowCategoryEditor] = useState(false)
  const [editCats, setEditCats] = useState<string[]>([...company.category])
  const allCategories = getAdminCategories().filter(c => c.status === 'active').map(c => c.name)

  const deactivatedDuration = company.deactivatedAt ? (() => {
    const diff = Date.now() - new Date(company.deactivatedAt).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 1) return 'Today'
    if (days === 1) return '1 day'
    if (days < 30) return `${days} days`
    const months = Math.floor(days / 30)
    return months === 1 ? '1 month' : `${months} months`
  })() : null

  function handleRate() {
    if (rating === 0) return
    onRate(rating)
    setRated(true)
  }

  function toggleCategory(cat: string) {
    setEditCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  return (
    <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
      <div className="relative h-40 bg-[var(--border-light)] overflow-hidden">
        <img src={company.banner} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium px-4 py-2 rounded-xl border border-white/15 hover:bg-white/20 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="absolute bottom-4 left-6 flex items-end gap-4">
          <img src={company.logo} alt="" className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white" />
          <div>
            <h1 className="font-serif text-2xl text-white">{company.name}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${company.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{company.status}</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 grid md:grid-cols-5 gap-6 md:gap-8">
        <div className="md:col-span-3 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{company.longDescription}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Services</h3>
            <div className="flex flex-wrap gap-2">
              {company.services.map(s => (
                <span key={s} className="text-xs text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-1.5 rounded-lg border border-[var(--border-light)]">{s}</span>
              ))}
            </div>
          </div>

          {company.missionStatement && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Mission Statement</h3>
              <p className="text-sm text-[var(--text-secondary)] italic">"{company.missionStatement}"</p>
            </div>
          )}

          {company.status === 'deactivated' && company.deactivatedAt && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-700 mb-1">Deactivated</h3>
              <p className="text-xs text-red-600">
                Deactivated on {new Date(company.deactivatedAt).toLocaleDateString()} · Duration: {deactivatedDuration}
              </p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-5">
          <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">Rating</h3>
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => !rated && setRating(s)}
                  className={`text-2xl transition-all ${!rated ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${s <= (rated ? company.rating : rating) ? 'text-[var(--accent)]' : 'text-[var(--border-default)]'}`}>
                  ★
                </button>
              ))}
              <span className="text-sm text-[var(--text-tertiary)] ml-2">{company.rating.toFixed(1)} ({company.reviewCount})</span>
            </div>
            {!rated && rating > 0 && (
              <button onClick={handleRate} className="w-full bg-[var(--accent)] text-[var(--brand-dark)] text-sm font-bold py-2 rounded-xl hover:bg-[var(--accent-dark)] transition-colors">
                Submit Rating
              </button>
            )}
            {rated && <p className="text-xs text-emerald-600 font-medium">Rating submitted!</p>}
          </div>

          <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">Contact</h3>
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <div>{company.ownerName}</div>
              <div>{company.email}</div>
              <div>{company.phone}</div>
              <div className="text-xs leading-relaxed">{company.address}</div>
            </div>
          </div>

          <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--text-primary)]">Categories</h3>
              <button onClick={() => setShowCategoryEditor(!showCategoryEditor)}
                className="text-xs font-medium text-[var(--brand)] hover:underline">
                {showCategoryEditor ? 'Done' : 'Edit'}
              </button>
            </div>
            {showCategoryEditor ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {allCategories.map(cat => (
                    <button key={cat} onClick={() => toggleCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${editCats.includes(cat) ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--brand)]/50'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <button onClick={() => { onUpdateCategories(editCats) }}
                  className="w-full bg-[var(--brand)] text-white text-xs font-semibold py-2 rounded-xl hover:bg-[var(--brand-light)] transition-colors mt-2">
                  Save Categories
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {company.category.map(cat => (
                  <span key={cat} className="text-[10px] font-medium text-[var(--brand)] bg-[var(--brand)]/5 px-2.5 py-1 rounded-full">{cat}</span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {company.status === 'active' ? (
              <button onClick={onDeactivate}
                className="w-full border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors">
                Deactivate Company
              </button>
            ) : (
              <button onClick={onReactivate}
                className="w-full bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors">
                Reactivate Company
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
