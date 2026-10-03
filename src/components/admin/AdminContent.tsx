import { useMemo, useState } from 'react'
import { getPublicUserDashboardData, type UserArticleData, type UserEventData } from '../../data/userDataStore'

type ContentKind = 'events' | 'articles' | 'blogs'
type ContentItem = UserArticleData | UserEventData

export default function AdminContent({ kind }: { kind: ContentKind }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'Published' | 'Draft'>('all')

  const items = useMemo<ContentItem[]>(() => {
    const members = getPublicUserDashboardData()
    return members.flatMap(member => kind === 'events' ? member.events : kind === 'articles' ? member.articles : member.blogs)
  }, [kind])

  const filtered = items.filter(item => {
    if (status !== 'all' && item.status !== status) return false
    if (!search) return true
    const query = search.toLowerCase()
    const text = 'eventType' in item
      ? `${item.title} ${item.description} ${item.eventType} ${item.location}`
      : `${item.title} ${item.topic} ${item.excerpt} ${item.author}`
    return text.toLowerCase().includes(query)
  })

  const published = items.filter(item => item.status === 'Published').length
  const drafts = items.filter(item => item.status === 'Draft').length
  const title = kind[0].toUpperCase() + kind.slice(1)

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: items.length, color: 'border-l-[var(--brand)]' },
          { label: 'Published', value: published, color: 'border-l-emerald-500' },
          { label: 'Drafts', value: drafts, color: 'border-l-amber-500' },
        ].map(stat => (
          <div key={stat.label} className={`bg-[var(--surface)] rounded-xl border border-[var(--border-light)] border-l-4 ${stat.color} p-4`}>
            <div className="font-serif text-2xl text-[var(--text-primary)] font-bold">{stat.value}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 w-fit">
          {(['all', 'Published', 'Draft'] as const).map(option => (
            <button key={option} onClick={() => setStatus(option)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${status === option ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
              {option === 'all' ? 'All' : option}
            </button>
          ))}
        </div>
        <input type="search" placeholder={`Search ${kind}...`} value={search} onChange={event => setSearch(event.target.value)} className="w-full sm:w-64 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <p className="text-sm text-[var(--text-tertiary)]">No {kind} found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-stagger">
          {filtered.map(item => (
            <article key={item.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden card-hover">
              <img src={'eventImage' in item ? item.eventImage : item.featuredImage} alt="" className="w-full h-40 object-cover" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-dark)]">{'eventType' in item ? item.eventType : item.topic}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                </div>
                <h2 className="font-serif text-xl text-[var(--text-primary)] leading-tight">{item.title}</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3 line-clamp-3">{'eventType' in item ? item.description : item.excerpt}</p>
                <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[var(--border-light)] text-xs text-[var(--text-tertiary)]">
                  <span>{'eventType' in item ? item.startDate : item.author}</span>
                  <span>{'eventType' in item ? item.location : item.publishedDate}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="text-xs text-[var(--text-tertiary)] mt-5">Managing {filtered.length} of {items.length} {title.toLowerCase()}.</p>
    </div>
  )
}
