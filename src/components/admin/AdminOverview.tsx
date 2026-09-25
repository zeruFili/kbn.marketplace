import { useState, useEffect } from 'react'
import { getApplications, getListedCompanies, getAdminUsers, getAdminCategories, adminSubscribe, type CompanyApplication, type AdminCompany, type AdminUser, type AdminCategory } from '../../data/adminStore'

interface Counts { applications: number; companies: number; users: number; categories: number }

export default function AdminOverview() {
  const [counts, setCounts] = useState<Counts>({ applications: 0, companies: 0, users: 0, categories: 0 })

  useEffect(() => {
    function refresh() {
      const apps = getApplications()
      const companies = getListedCompanies()
      const users = getAdminUsers()
      const cats = getAdminCategories()
      setCounts({
        applications: apps.filter(a => a.status === 'pending').length,
        companies: companies.filter(c => c.status === 'active').length,
        users: users.filter(u => u.status === 'active').length,
        categories: cats.filter(c => c.status === 'active').length,
      })
    }
    refresh()
    return adminSubscribe(refresh)
  }, [])

  const cards = [
    { label: 'Pending Applications', value: counts.applications, color: 'bg-amber-500', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Active Companies', value: counts.companies, color: 'bg-blue-500', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5' },
    { label: 'Registered Users', value: counts.users, color: 'bg-emerald-500', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: 'Active Categories', value: counts.categories, color: 'bg-purple-500', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${card.color} bg-opacity-10 flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} /></svg>
              </div>
            </div>
            <div className="font-serif text-3xl text-[var(--text-primary)] font-bold">{card.value}</div>
            <div className="text-sm text-[var(--text-tertiary)] mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentApplications />
        <RecentActivity />
      </div>
    </div>
  )
}

function RecentApplications() {
  const [apps, setApps] = useState<CompanyApplication[]>([])

  useEffect(() => {
    function refresh() { setApps(getApplications().filter(a => a.status === 'pending')) }
    refresh()
    return adminSubscribe(refresh)
  }, [])

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6">
      <h2 className="font-serif text-lg text-[var(--text-primary)] mb-4">Recent Applications</h2>
      {apps.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">No pending applications.</p>
      ) : (
        <div className="space-y-3">
          {apps.slice(0, 5).map(app => (
            <div key={app.id} className="flex items-center gap-3 p-3 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)]">
              <img src={app.logo} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{app.companyName}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{app.category} · {new Date(app.submittedAt).toLocaleDateString()}</div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentActivity() {
  const [companies, setCompanies] = useState<AdminCompany[]>([])

  useEffect(() => {
    function refresh() { setCompanies(getListedCompanies()) }
    refresh()
    return adminSubscribe(refresh)
  }, [])

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6">
      <h2 className="font-serif text-lg text-[var(--text-primary)] mb-4">Company Status</h2>
      {companies.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">No companies listed yet.</p>
      ) : (
        <div className="space-y-3">
          {companies.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)]">
              <img src={c.logo} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{c.name}</div>
                <div className="text-xs text-[var(--text-tertiary)]">Rating: {c.rating.toFixed(1)} · {c.reviewCount} reviews</div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
