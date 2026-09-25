import { useState, useEffect } from 'react'
import { getAdminCategories, createCategory, updateCategory, deleteCategory, adminSubscribe, type AdminCategory } from '../../data/adminStore'

const EMOJI_OPTIONS = ['🏗️', '🏥', '🏨', '🏡', '👕', '☕', '🪑', '🚗', '❤️', '🎉', '⛪', '👗', '🍽️', '💼', '🔧', '🏠', '📚', '🎵', '🌱', '✈️', '💻', '🛒', '🎨', '📱']

export default function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', icon: '🏗️', status: 'active' as 'active' | 'inactive' })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    function refresh() { setCategories(getAdminCategories()) }
    refresh()
    return adminSubscribe(refresh)
  }, [])

  const filtered = categories.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    }
    return true
  })

  function openCreate() {
    setForm({ name: '', description: '', icon: '🏗️', status: 'active' })
    setEditing(null)
    setCreating(true)
  }

  function openEdit(cat: AdminCategory) {
    setForm({ name: cat.name, description: cat.description, icon: cat.icon, status: cat.status })
    setEditing(cat)
    setCreating(false)
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
  }

  function handleSave() {
    if (!form.name.trim()) return
    if (creating) {
      createCategory(form)
    } else if (editing) {
      updateCategory(editing.id, form)
    }
    closeForm()
  }

  const active = categories.filter(c => c.status === 'active').length
  const inactive = categories.filter(c => c.status === 'inactive').length

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Categories', value: categories.length, color: 'border-l-[var(--brand)]' },
          { label: 'Active', value: active, color: 'border-l-emerald-500' },
          { label: 'Inactive', value: inactive, color: 'border-l-amber-500' },
        ].map(s => (
          <div key={s.label} className={`bg-[var(--surface)] rounded-xl border border-[var(--border-light)] border-l-4 ${s.color} p-4`}>
            <div className="font-serif text-2xl text-[var(--text-primary)] font-bold">{s.value}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 w-fit">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${statusFilter === f ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
          </div>
          <button onClick={openCreate}
            className="bg-[var(--brand)] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[var(--brand-light)] transition-colors flex items-center gap-2 shadow-lg shadow-[var(--brand)]/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Category
          </button>
        </div>
      </div>

      {(creating || editing) && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 mb-6 animate-slide-down">
          <h2 className="font-serif text-lg text-[var(--text-primary)] mb-4">{creating ? 'Create Category' : 'Edit Category'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Category Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Construction"
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setForm({ ...form, icon: e })}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition-all ${form.icon === e ? 'border-[var(--brand)] bg-[var(--brand)]/10 scale-110' : 'border-[var(--border-default)] bg-[var(--surface-alt)]'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe what this category covers..." rows={3}
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Status</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setForm({ ...form, status: 'active' })}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${form.status === 'active' ? 'bg-emerald-600 text-white border-emerald-600' : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:border-emerald-400'}`}>
                  Active
                </button>
                <button onClick={() => setForm({ ...form, status: 'inactive' })}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${form.status === 'inactive' ? 'bg-amber-600 text-white border-amber-600' : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:border-amber-400'}`}>
                  Inactive
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-light)]">
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="bg-[var(--brand)] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[var(--brand-light)] transition-colors disabled:opacity-50">
              {creating ? 'Create Category' : 'Save Changes'}
            </button>
            <button onClick={closeForm}
              className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-4 py-2 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
        {filtered.map(cat => (
          <div key={cat.id} className={`bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 card-hover ${cat.status === 'inactive' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-alt)] flex items-center justify-center text-2xl">{cat.icon}</div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{cat.status}</span>
              </div>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">{cat.name}</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">{cat.description}</p>
            <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] mb-4">
              <span>{cat.companyCount} companies</span>
              <span>Updated {new Date(cat.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-light)]">
              <button onClick={() => openEdit(cat)}
                className="flex-1 text-xs font-medium text-[var(--brand)] bg-[var(--brand)]/5 py-2 rounded-lg hover:bg-[var(--brand)]/10 transition-colors">
                Edit
              </button>
              {confirmDelete === cat.id ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => { deleteCategory(cat.id); setConfirmDelete(null) }}
                    className="text-xs font-medium text-white bg-red-600 px-3 py-2 rounded-lg hover:bg-red-700 transition-colors">Confirm</button>
                  <button onClick={() => setConfirmDelete(null)}
                    className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-2 rounded-lg hover:bg-[var(--surface-alt)]">No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(cat.id)}
                  className="text-xs font-medium text-red-600 bg-red-50 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors">
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <div className="text-3xl mb-3">🏷️</div>
          <p className="text-sm text-[var(--text-tertiary)]">No categories found.</p>
        </div>
      )}
    </div>
  )
}
