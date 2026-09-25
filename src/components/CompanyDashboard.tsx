import { useState, useEffect, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getCompanyById, updateCompany, subscribe, type Company as CompanyData } from '../data/companyStore'
import { type Category } from '../data/companies'

const ALL_CATEGORIES: Category[] = [
  'Construction', 'Hospitals', 'Hotels', 'Guest Houses', 'Clothing', 'Coffee Shops', 'Furniture', 'Cars',
  'Healthcare', 'Hospitality', 'Ministry', 'Fashion', 'Food & Beverage', 'Professional Services', 'Automotive',
]

type EditableFields = Pick<CompanyData, 'name' | 'description' | 'longDescription' | 'phone' | 'email' | 'website' | 'address' | 'category' | 'services' | 'tags' | 'missionStatement' | 'ownerName'>

export default function CompanyDashboard({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [form, setForm] = useState<EditableFields | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'tags'>('profile')

  useEffect(() => {
    if (!user?.companyId) return
    const c = getCompanyById(user.companyId)
    if (c) {
      setCompany(c)
      setForm({
        name: c.name, description: c.description, longDescription: c.longDescription,
        phone: c.phone, email: c.email, website: c.website, address: c.address,
        category: c.category, services: [...c.services], tags: [...c.tags],
        missionStatement: c.missionStatement, ownerName: c.ownerName,
      })
    }
    const unsub = subscribe(() => {
      const currentId = user.companyId
      if (currentId) {
        const fresh = getCompanyById(currentId)
        if (fresh) setCompany(fresh)
      }
    })
    return unsub
  }, [user])

  function update<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    if (!form) return
    setForm({ ...form, [key]: value })
  }

  function saveField<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    if (!user?.companyId || !form) return
    const body: Partial<CompanyData> = { [key]: value }
    updateCompany(user.companyId, body)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function addServiceItem() {
    if (!form) return
    const svc = prompt('New service name:')
    if (svc?.trim()) { const s = [...form.services, svc.trim()]; setForm({ ...form, services: s }); saveField('services', s) }
  }
  function removeServiceItem(idx: number) {
    if (!form) return
    const s = form.services.filter((_svc: string, i: number) => i !== idx)
    setForm({ ...form, services: s }); saveField('services', s)
  }
  function addTagItem() {
    if (!form) return
    const tag = prompt('New tag:')
    if (tag?.trim()) { const t = [...form.tags, tag.trim()]; setForm({ ...form, tags: t }); saveField('tags', t) }
  }
  function removeTagItem(idx: number) {
    if (!form) return
    const t = form.tags.filter((_tag: string, i: number) => i !== idx)
    setForm({ ...form, tags: t }); saveField('tags', t)
  }

  if (!user || user.role !== 'company') {
    return <div className="min-h-screen bg-[var(--surface-alt)] flex items-center justify-center text-[var(--text-tertiary)]">Access denied.</div>
  }

  if (!company || !form) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)] flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-[var(--brand)]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <header className="bg-[var(--brand-dark)] py-5 md:py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0">
              <img src={company.logo} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-white truncate">{company.name}</h1>
              <p className="text-[#94A3B8] text-sm">Company Dashboard</p>
            </div>
          </div>
          <button onClick={onBack} className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/15 hover:bg-white/20 transition-all self-start sm:self-auto flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {saved && (
          <div className="fixed top-20 right-4 z-50 bg-[var(--success)] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-slide-down flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Changes saved
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-6">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex gap-1 mb-8 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 w-fit">
          {(['profile', 'services', 'tags'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <Section title="Basic Information">
              <Field label="Company Name" value={form.name} onChange={v => update('name', v)} onBlur={() => saveField('name', form.name)} />
              <Field label="Category" as="select" value={form.category}
                onChange={v => { update('category', v as Category); saveField('category', v as Category) }}
                options={ALL_CATEGORIES.map(c => ({ value: c, label: c }))} />
              <Field label="Short Description" value={form.description} onChange={v => update('description', v)} onBlur={() => saveField('description', form.description)} />
              <Field label="Long Description" as="textarea" value={form.longDescription} onChange={v => update('longDescription', v)} onBlur={() => saveField('longDescription', form.longDescription)} />
              <Field label="Owner Name" value={form.ownerName ?? ''} onChange={v => update('ownerName', v)} onBlur={() => saveField('ownerName', form.ownerName)} />
              <Field label="Mission Statement" as="textarea" value={form.missionStatement ?? ''} onChange={v => update('missionStatement', v)} onBlur={() => saveField('missionStatement', form.missionStatement)} />
            </Section>
            <Section title="Contact Information">
              <Field label="Phone" value={form.phone} onChange={v => update('phone', v)} onBlur={() => saveField('phone', form.phone)} />
              <Field label="Email" value={form.email} onChange={v => update('email', v)} onBlur={() => saveField('email', form.email)} />
              <Field label="Website" value={form.website} onChange={v => update('website', v)} onBlur={() => saveField('website', form.website)} />
              <Field label="Address" value={form.address} onChange={v => update('address', v)} onBlur={() => saveField('address', form.address)} />
            </Section>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6 animate-fade-in">
            <Section title="Services & Products">
              <div className="space-y-2">
                {form.services.map((s: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-xl border border-[var(--border-light)]">
                    <span className="flex-1 text-sm text-[var(--text-primary)]">{s}</span>
                    <button onClick={() => removeServiceItem(i)} className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors px-2 py-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addServiceItem} className="mt-3 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Service
              </button>
            </Section>
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="space-y-6 animate-fade-in">
            <Section title="Tags">
              <div className="flex flex-wrap gap-2">
                {form.tags.map((t: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--border-light)]">
                    {t}
                    <button onClick={() => removeTagItem(i)} className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors ml-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
              <button onClick={addTagItem} className="mt-3 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Tag
              </button>
            </Section>
          </div>
        )}

        <div className="mt-10 p-6 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] animate-fade-in">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Preview Your Card</h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">Your changes appear live on your public profile and directory card.</p>
          <div className="max-w-sm">
            <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] overflow-hidden">
              <div className="relative h-28 bg-[var(--border-light)] overflow-hidden">
                <img src={company.banner} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/30 bg-white shadow-lg">
                    <img src={company.logo} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full">{form.category}</span>
                <h4 className="font-semibold text-[var(--text-primary)] text-sm mt-1.5">{form.name}</h4>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">{form.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-[var(--accent)]">
                  {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                  <span className="text-[var(--text-tertiary)] ml-1">{company.rating.toFixed(1)} ({company.reviewCount})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8">
      <h2 className="font-serif text-xl text-[var(--text-primary)] mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, onBlur, as, options }: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  as?: 'textarea' | 'select'; options?: { value: string; label: string }[];
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      {as === 'select' && options ? (
        <select id={id} value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : as === 'textarea' ? (
        <textarea id={id} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} rows={4}
          className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all resize-none" />
      ) : (
        <input id={id} type="text" value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
          className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all" />
      )}
    </div>
  )
}
