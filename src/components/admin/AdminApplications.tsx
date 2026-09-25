import { useState, useEffect } from 'react'
import { getApplications, approveApplication, rejectApplication, adminSubscribe, type CompanyApplication } from '../../data/adminStore'
import { useAuth } from '../../auth/AuthContext'

export default function AdminApplications() {
  const { user } = useAuth()
  const [apps, setApps] = useState<CompanyApplication[]>([])
  const [selected, setSelected] = useState<CompanyApplication | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    function refresh() { setApps(getApplications()) }
    refresh()
    return adminSubscribe(refresh)
  }, [])

  const filtered = apps.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return a.companyName.toLowerCase().includes(q) || a.ownerName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    }
    return true
  })

  if (selected) {
    return (
      <div className="animate-scale-in">
        <ApplicationDetail
          app={selected}
          onBack={() => setSelected(null)}
          onApprove={() => { approveApplication(selected.id, user?.name ?? 'Admin'); setSelected(null) }}
          onReject={() => { rejectApplication(selected.id, user?.name ?? 'Admin'); setSelected(null) }}
        />
      </div>
    )
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' }
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[status]}`}>{status}</span>
  }

  const stats = {
    total: apps.length,
    pending: apps.filter(a => a.status === 'pending').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'border-l-[var(--brand)]' },
          { label: 'Pending', value: stats.pending, color: 'border-l-amber-500' },
          { label: 'Approved', value: stats.approved, color: 'border-l-emerald-500' },
          { label: 'Rejected', value: stats.rejected, color: 'border-l-red-500' },
        ].map(s => (
          <div key={s.label} className={`bg-[var(--surface)] rounded-xl border border-[var(--border-light)] border-l-4 ${s.color} p-4`}>
            <div className="font-serif text-2xl text-[var(--text-primary)] font-bold">{s.value}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 w-fit">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${filter === f ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search applications..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <div className="text-3xl mb-3">📋</div>
          <p className="text-sm text-[var(--text-tertiary)]">No applications found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
          {filtered.map(app => (
            <button key={app.id} onClick={() => setSelected(app)}
              className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 text-left card-hover w-full">
              <div className="flex items-start gap-3 mb-3">
                <img src={app.logo} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-[var(--border-light)]" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{app.companyName}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{app.category}</div>
                </div>
                {statusBadge(app.status)}
              </div>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{app.description}</p>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                <span>{app.ownerName}</span>
                <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicationDetail({ app, onBack, onApprove, onReject }: { app: CompanyApplication; onBack: () => void; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
      <div className="bg-[var(--brand-dark)] px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to applications
        </button>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${app.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : app.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{app.status}</span>
      </div>

      <div className="p-4 sm:p-6 md:p-8 grid md:grid-cols-5 gap-6 md:gap-8">
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={app.logo} alt="" className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-[var(--border-light)]" />
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] truncate">{app.companyName}</h1>
              <div className="text-xs sm:text-sm text-[var(--text-tertiary)]">{app.category} · Submitted {new Date(app.submittedAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{app.longDescription}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Services</h3>
            <div className="flex flex-wrap gap-2">
              {app.services.map(s => (
                <span key={s} className="text-xs text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-1.5 rounded-lg border border-[var(--border-light)]">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {app.tags.map(t => (
                <span key={t} className="text-[10px] font-medium text-[var(--brand)] bg-[var(--brand)]/5 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Government License Document</h3>
            <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] overflow-hidden">
              <img src={app.licenseDoc} alt="License document" className="w-full object-cover max-h-80" />
              <div className="p-3 flex items-center justify-between border-t border-[var(--border-light)]">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="text-xs text-[var(--text-tertiary)]">Business License</span>
                </div>
                <a href={app.licenseDoc} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--brand)] hover:underline">View Full Document</a>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {app.ownerName}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {app.email}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {app.phone}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                {app.website}
              </div>
              <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                <svg className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="leading-relaxed">{app.address}</span>
              </div>
            </div>

            {app.status === 'pending' && (
              <div className="pt-4 space-y-3 border-t border-[var(--border-light)]">
                <button onClick={onApprove}
                  className="w-full bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Approve Application
                </button>
                <button onClick={onReject}
                  className="w-full bg-[var(--surface)] border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Reject Application
                </button>
              </div>
            )}

            {app.reviewedAt && (
              <div className="pt-4 border-t border-[var(--border-light)]">
                <p className="text-xs text-[var(--text-tertiary)]">Reviewed by <strong>{app.reviewedBy}</strong> on {new Date(app.reviewedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
