import { useState, useEffect } from 'react'
import { getAdminUsers, deactivateUser, reactivateUser, adminSubscribe, type AdminUser } from '../../data/adminStore'

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'company'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all')

  useEffect(() => {
    function refresh() { setUsers(getAdminUsers()) }
    refresh()
    return adminSubscribe(refresh)
  }, [])

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.business ?? '').toLowerCase().includes(q)
    }
    return true
  })

  if (selected) {
    return (
      <div className="animate-scale-in">
        <UserDetail
          user={selected}
          onBack={() => setSelected(null)}
          onDeactivate={(reason) => { deactivateUser(selected.id, reason); setSelected(null) }}
          onReactivate={() => { reactivateUser(selected.id); setSelected(null) }}
        />
      </div>
    )
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = { admin: 'bg-red-100 text-red-700', user: 'bg-emerald-100 text-emerald-700', company: 'bg-blue-100 text-blue-700' }
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[role]}`}>{role}</span>
  }

  const active = users.filter(u => u.status === 'active').length
  const deactivated = users.filter(u => u.status === 'deactivated').length

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length, color: 'border-l-[var(--brand)]' },
          { label: 'Active', value: active, color: 'border-l-emerald-500' },
          { label: 'Deactivated', value: deactivated, color: 'border-l-red-500' },
          { label: 'Company Users', value: users.filter(u => u.role === 'company').length, color: 'border-l-blue-500' },
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
            {(['all', 'admin', 'user', 'company'] as const).map(f => (
              <button key={f} onClick={() => setRoleFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${roleFilter === f ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 w-fit">
            {(['all', 'active', 'deactivated'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${statusFilter === f ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full sm:w-56">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-light)] bg-[var(--surface-alt)]">
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3">User</th>
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3 hidden xs:table-cell">Role</th>
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3 hidden md:table-cell">Registered</th>
                  <th className="text-left text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3">Status</th>
                  <th className="text-right text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 sm:px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-[var(--surface-alt)] transition-colors">
                  <td className="px-3 sm:px-5 py-3">
                    <button onClick={() => setSelected(u)} className="flex items-center gap-2 sm:gap-3 text-left">
                      <img src={u.avatar} alt="" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover ring-2 ring-[var(--border-light)]" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">{u.name}</div>
                        {u.business && <div className="text-[10px] text-[var(--text-tertiary)] truncate">{u.business}</div>}
                      </div>
                    </button>
                  </td>
                  <td className="px-3 sm:px-5 py-3">{roleBadge(u.role)}</td>
                  <td className="px-3 sm:px-5 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">{u.email}</td>
                  <td className="px-3 sm:px-5 py-3 text-xs text-[var(--text-tertiary)] hidden md:table-cell">{new Date(u.registeredAt).toLocaleDateString()}</td>
                  <td className="px-3 sm:px-5 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
                  </td>
                  <td className="px-3 sm:px-5 py-3 text-right">
                    <button onClick={() => setSelected(u)} className="text-xs font-medium text-[var(--brand)] hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-2xl mb-2">👤</div>
            <p className="text-sm text-[var(--text-tertiary)]">No users found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function UserDetail({ user, onBack, onDeactivate, onReactivate }: {
  user: AdminUser
  onBack: () => void
  onDeactivate: (reason: string) => void
  onReactivate: () => void
}) {
  const [reason, setReason] = useState('')
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false)

  const deactivatedDuration = user.deactivatedAt ? (() => {
    const diff = Date.now() - new Date(user.deactivatedAt).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 1) return 'Today'
    if (days === 1) return '1 day'
    if (days < 30) return `${days} days`
    const months = Math.floor(days / 30)
    return months === 1 ? '1 month' : `${months} months`
  })() : null

  return (
    <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
      <div className="bg-[var(--brand-dark)] px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to users
        </button>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${user.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{user.status}</span>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex items-center gap-4 sm:gap-5 mb-8">
          <img src={user.avatar} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-3 ring-[var(--border-light)]" />
          <div>
            <h1 className="font-serif text-2xl text-[var(--text-primary)]">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-700' : user.role === 'company' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.role}</span>
              {user.business && <span className="text-sm text-[var(--text-tertiary)]">{user.business}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Email</label>
            <p className="text-sm text-[var(--text-primary)]">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Registered</label>
            <p className="text-sm text-[var(--text-primary)]">{new Date(user.registeredAt).toLocaleDateString()}</p>
          </div>
          {user.deactivatedAt && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Deactivated</label>
                <p className="text-sm text-red-600">{new Date(user.deactivatedAt).toLocaleDateString()} ({deactivatedDuration})</p>
              </div>
              {user.deactivationReason && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Reason</label>
                  <p className="text-sm text-[var(--text-secondary)]">{user.deactivationReason}</p>
                </div>
              )}
            </>
          )}
        </div>

        {user.status === 'active' ? (
          <div className="border-t border-[var(--border-light)] pt-6">
            {!showConfirmDeactivate ? (
              <button onClick={() => setShowConfirmDeactivate(true)}
                className="border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors">
                Deactivate User
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-red-700">Confirm Deactivation</p>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for deactivation (e.g., posting inappropriate or misleading reviews)" rows={3}
                  className="w-full bg-white border border-red-200 rounded-xl py-2 px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none resize-none" />
                <div className="flex items-center gap-2">
                  <button onClick={() => onDeactivate(reason || 'Violation of community guidelines')} disabled={!reason.trim()}
                    className="bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                    Confirm Deactivate
                  </button>
                  <button onClick={() => setShowConfirmDeactivate(false)}
                    className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-[var(--border-light)] pt-6">
            <button onClick={onReactivate}
              className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors">
              Reactivate User
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
