import { useEffect, useMemo, useState } from 'react'
import { getPublicUserDashboardData, type UserArticleData, type UserEventData } from '../../data/userDataStore'

type ContentKind = 'events' | 'articles' | 'blogs'
type ContentItem = UserArticleData | UserEventData

export default function AdminContent({ kind }: { kind: ContentKind }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'Published' | 'Draft'>('all')
  const [adding, setAdding] = useState(false)

  const initialItems = useMemo<ContentItem[]>(() => {
    const members = getPublicUserDashboardData()
    return members.flatMap(member => kind === 'events' ? member.events : kind === 'articles' ? member.articles : member.blogs)
  }, [kind])
  const [items, setItems] = useState<ContentItem[]>(initialItems)

  useEffect(() => {
    setItems(initialItems)
    setAdding(false)
  }, [initialItems])

  function addItem(item: ContentItem) {
    setItems(current => [item, ...current])
    setAdding(false)
  }

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

  if (adding) {
    return <div className="animate-fade-in"><AdminContentForm kind={kind} onCancel={() => setAdding(false)} onSubmit={addItem} /></div>
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl text-[var(--text-primary)]">{title}</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Manage community {kind}.</p>
        </div>
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-light)] transition-colors"><span aria-hidden="true">+</span>Add {kind === 'events' ? 'Event' : title.slice(0, -1)}</button>
      </div>
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
                  <span>{'eventType' in item ? item.startDate : item.publishedDate}</span>
                  {'eventType' in item && <span>{item.location}</span>}
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

function AdminContentForm({ kind, onCancel, onSubmit }: { kind: ContentKind; onCancel: () => void; onSubmit: (item: ContentItem) => void }) {
  const [form, setForm] = useState({ title: '', topic: '', image: '', description: '', author: '', date: '', location: '', eventType: '', status: 'Draft' as 'Published' | 'Draft' })
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))
  const isEvent = kind === 'events'

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.title.trim() || !form.image.trim()) return
    if (isEvent) {
      onSubmit({ id: `admin-event-${Date.now()}`, eventImage: form.image, title: form.title, description: form.description, eventType: form.eventType, startDate: form.date, endDate: form.date, location: form.location, online: false, eventUrl: '', status: form.status })
    } else {
      onSubmit({ id: `admin-${kind.slice(0, -1)}-${Date.now()}`, featuredImage: form.image, title: form.title, topic: form.topic, excerpt: form.description, content: form.description, author: form.author, publishedDate: form.date, status: form.status, visibility: 'Public' })
    }
  }

  return <form onSubmit={submit} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 mb-6"><div className="flex items-center justify-between gap-4 mb-5"><h3 className="font-serif text-xl text-[var(--text-primary)]">Add {isEvent ? 'Event' : kind === 'blogs' ? 'Blog' : 'Article'}</h3><button type="button" onClick={onCancel} className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Cancel</button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><AdminField label={isEvent ? 'Event title' : 'Title'} value={form.title} onChange={value => update('title', value)} required /><AdminField label={isEvent ? 'Event type' : 'Topic'} value={isEvent ? form.eventType : form.topic} onChange={value => update(isEvent ? 'eventType' : 'topic', value)} /><AdminField label={isEvent ? 'Event image URL' : 'Featured image URL'} value={form.image} onChange={value => update('image', value)} required /><AdminField label={isEvent ? 'Start date' : 'Publication date'} value={form.date} onChange={value => update('date', value)} /><AdminField label="Status" value={form.status} onChange={value => update('status', value)} select options={['Draft', 'Published']} />{isEvent ? <AdminField label="Location" value={form.location} onChange={value => update('location', value)} /> : <AdminField label="Author" value={form.author} onChange={value => update('author', value)} />}<div className="sm:col-span-2"><AdminField label={isEvent ? 'Description' : 'Excerpt'} value={form.description} onChange={value => update('description', value)} multiline required /></div></div><div className="flex justify-end gap-2 pt-6 mt-6 border-t border-[var(--border-light)]"><button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)]">Save</button></div></form>
}

function AdminField({ label, value, onChange, multiline = false, select = false, options = [], required = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; select?: boolean; options?: string[]; required?: boolean }) {
  const className = "w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
  const icon = label.toLowerCase().includes('title') || label === 'Topic' ? 'M4 5h16M4 12h10M4 19h7' : label.toLowerCase().includes('image') ? 'M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 11l3-3 2 2 2-2 3 3M8 8h.01' : label.toLowerCase().includes('date') ? 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z' : label.toLowerCase().includes('location') ? 'M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11zm0-8a3 3 0 100-6 3 3 0 000 6z' : label.toLowerCase().includes('author') ? 'M16 21v-2a4 4 0 00-8 0v2m4-11a4 4 0 100-8 4 4 0 000 8z' : label.toLowerCase().includes('status') ? 'M5 12l4 4L19 6' : 'M4 6h16M4 12h16M4 18h16'
  return <label className="block"><span className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</span><span className="relative block"><svg className="absolute left-3 top-3 w-4 h-4 text-[var(--brand)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={icon} /></svg>{multiline ? <textarea value={value} onChange={event => onChange(event.target.value)} rows={4} className={`${className} resize-y`} required={required} /> : select ? <select value={value} onChange={event => onChange(event.target.value)} className={className}>{options.map(option => <option key={option}>{option}</option>)}</select> : <input value={value} onChange={event => onChange(event.target.value)} className={className} required={required} />}</span></label>
}
