import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getUserReviews, updateUserReview, deleteUserReview, submitApplication, userSubscribe, getUserDashboardData, updateUserContent, createUserContent, deleteUserContent, updateUserProfile, type UserReview, type UserDashboardData, type UserProfileData, type UserBusinessData, type UserArticleData, type UserEventData, type UserContentType } from '../data/userDataStore'
import { getListedCompanies, adminSubscribe, type AdminCompany } from '../data/adminStore'
import { type Category } from '../data/companies'

type Tab = 'companies' | 'reviews' | 'apply'

type UserPage = 'profile' | 'business' | 'articles' | 'blogs' | 'events'
type SelectedContent = { type: UserContentType; id: string } | null

const USER_NAV_ITEMS: { id: UserPage; label: string; icon: string }[] = [
  { id: 'profile', label: 'Profile', icon: 'M20 21a8 8 0 00-16 0m12-11a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'business', label: 'Business', icon: 'M3 21h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14M9 9h2m-2 4h2m4-4h2m-2 4h2M9 21v-4h6v4' },
  { id: 'articles', label: 'Articles', icon: 'M4 5a2 2 0 012-2h11a2 2 0 012 2v15a1 1 0 01-1 1H6a2 2 0 01-2-2V5zm3 2h8m-8 4h8m-8 4h5' },
  { id: 'blogs', label: 'Blogs', icon: 'M4 5a2 2 0 012-2h12a2 2 0 012 2v14a1 1 0 01-1 1H6a2 2 0 01-2-2V5zm4 3h8m-8 4h8m-8 4h5' },
  { id: 'events', label: 'Events', icon: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zm3 8h3m-3 4h3m2-4h3m-3 4h3' },
]

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'companies', label: 'My Companies', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'reviews', label: 'My Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { id: 'apply', label: 'Register Company', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function UserDashboard({ onBack }: { onBack: () => void }) {
  const { user, logout } = useAuth()
  const [activePage, setActivePage] = useState<UserPage>('profile')
  const [tab, setTab] = useState<Tab>('companies')
  const [selectedContent, setSelectedContent] = useState<SelectedContent>(null)
  const [addingContent, setAddingContent] = useState<UserContentType | null>(null)

  function navigateToPage(page: UserPage) {
    setActivePage(page)
    setSelectedContent(null)
    setAddingContent(null)
  }

  if (!user || user.role !== 'user') {
    return <div className="min-h-screen bg-[var(--surface-alt)] flex items-center justify-center text-[var(--text-tertiary)]">Access denied.</div>
  }

  const pageTitle = USER_NAV_ITEMS.find(item => item.id === activePage)?.label
  const dashboardData = getUserDashboardData(user.email, user)

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] flex">
      <aside className="hidden md:flex w-64 bg-[var(--brand-dark)] text-white flex-col flex-shrink-0 min-h-screen">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt="" className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/20" />
            <div className="min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-xs text-[#94A3B8] truncate">Member account</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {USER_NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => navigateToPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left ${activePage === item.id ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[#94A3B8] hover:bg-white/5 hover:text-white'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={() => { void logout() }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all text-left">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3" /></svg>
            Log out
          </button>
          <button onClick={onBack} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all text-left">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Site
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-[var(--brand-dark)] text-white px-4 py-5 md:px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[#94A3B8] text-sm mb-1">Member Dashboard</p>
              <h1 className="font-serif text-2xl sm:text-3xl">{pageTitle}</h1>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <button onClick={() => { void logout() }} className="flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-3 py-2 rounded-xl border border-white/15">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3" /></svg>
                Log out
              </button>
              <button onClick={onBack} className="flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-3 py-2 rounded-xl border border-white/15">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back
              </button>
            </div>
          </div>
          <nav className="md:hidden max-w-5xl mx-auto mt-5 flex gap-2 overflow-x-auto hide-scrollbar">
            {USER_NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => navigateToPage(item.id)} className={`flex-shrink-0 text-sm font-medium px-3 py-2 rounded-lg ${activePage === item.id ? 'bg-[var(--accent)] text-[var(--brand-dark)]' : 'bg-white/10 text-white/75'}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          {addingContent ? (
            <AddContentForm type={addingContent} email={user.email} user={user} onCancel={() => setAddingContent(null)} onCreated={() => setAddingContent(null)} />
          ) : selectedContent ? (
            <UserContentDetail key={`${selectedContent.type}-${selectedContent.id}`} data={dashboardData} email={user.email} selected={selectedContent} onBack={() => setSelectedContent(null)} />
          ) : (
            <>
              {activePage === 'profile' && <UserProfile data={dashboardData} email={user.email} />}
              {activePage === 'business' && <BusinessPage data={dashboardData} email={user.email} tab={tab} setTab={setTab} user={user} onOpen={(id) => setSelectedContent({ type: 'businesses', id })} onAdd={() => setAddingContent('businesses')} />}
              {activePage === 'articles' && <ArticlePage title="Articles" description="Practical insights and faith-centered guidance from your member profile." items={dashboardData.articles} type="articles" onOpen={(id) => setSelectedContent({ type: 'articles', id })} onAdd={() => setAddingContent('articles')} />}
              {activePage === 'blogs' && <ArticlePage title="Blogs" description="Stories, reflections, and experiences shared from your member profile." items={dashboardData.blogs} type="blogs" onOpen={(id) => setSelectedContent({ type: 'blogs', id })} onAdd={() => setAddingContent('blogs')} />}
              {activePage === 'events' && <EventsPage items={dashboardData.events} onOpen={(id) => setSelectedContent({ type: 'events', id })} onAdd={() => setAddingContent('events')} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function UserProfile({ data, email }: { data: UserDashboardData; email: string }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<UserProfileData>(data.profile)
  const { profile } = editing ? { profile: form } : data

  function update<K extends keyof UserProfileData>(key: K, value: UserProfileData[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function save() {
    updateUserProfile(email, form)
    setEditing(false)
  }

  function cancel() {
    setForm(data.profile)
    setEditing(false)
  }

  return (
    <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
        <div className="flex items-center gap-5">
          <img src={profile.profilePhoto} alt={profile.fullName} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[var(--brand)]/10" />
          <div>
            <h2 className="font-serif text-2xl text-[var(--text-primary)]">{profile.fullName}</h2>
            <p className="text-sm text-[var(--accent-dark)] mt-1">{profile.professionalTitle}</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">{profile.city}, {profile.country}</p>
          </div>
        </div>
        {editing ? <div className="flex items-center gap-2"><button onClick={cancel} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]">Cancel</button><button onClick={save} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)]">Save changes</button></div> : <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)]">Edit</button>}
      </div>
      {editing ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><ProfileEditField label="Full name" value={form.fullName} onChange={value => update('fullName', value)} /><ProfileEditField label="Phone number" value={form.phone} onChange={value => update('phone', value)} /><ProfileEditField label="Professional title" value={form.professionalTitle} onChange={value => update('professionalTitle', value)} /><ProfileEditField label="Profile photo URL" value={form.profilePhoto} onChange={value => update('profilePhoto', value)} /><ProfileEditField label="City" value={form.city} onChange={value => update('city', value)} /><ProfileEditField label="Country" value={form.country} onChange={value => update('country', value)} /><ProfileEditField label="Website" value={form.website} onChange={value => update('website', value)} /><ProfileEditField label="Social media" value={form.socialMedia} onChange={value => update('socialMedia', value)} /><ProfileEditField label="Digital slug" value={form.digitalSlug} onChange={value => update('digitalSlug', value)} /><div className="sm:col-span-2"><ProfileEditField label="Short bio" value={form.shortBio} onChange={value => update('shortBio', value)} multiline /></div><ProfileEditField label="Professional experience" value={form.professionalExperience} onChange={value => update('professionalExperience', value)} multiline /><ProfileEditField label="Education" value={form.education} onChange={value => update('education', value)} multiline /><div className="sm:col-span-2"><ProfileEditField label="Achievements (one per line)" value={form.achievements.join('\n')} onChange={value => update('achievements', value.split('\n').map(item => item.trim()).filter(Boolean))} multiline /></div></div> : <><p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 max-w-3xl">{profile.shortBio}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><ProfileDetail label="Phone number" value={profile.phone} /><ProfileDetail label="Professional experience" value={profile.professionalExperience} /><ProfileDetail label="Education" value={profile.education} /><ProfileDetail label="Achievements" value={profile.achievements.join(' • ') || 'Not provided'} /><ProfileDetail label="Website" value={profile.website} /><ProfileDetail label="Social media" value={profile.socialMedia} /><ProfileDetail label="Digital slug" value={`/${profile.digitalSlug}`} /></div></>}
    </section>
  )
}

function ProfileEditField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const className = "w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
  return <label className="block"><span className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</span>{multiline ? <textarea value={value} onChange={event => onChange(event.target.value)} rows={4} className={`${className} resize-y`} /> : <input value={value} onChange={event => onChange(event.target.value)} className={className} />}</label>
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  const iconPaths: Record<string, string> = {
    'Phone number': 'M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.33 1.78.62 2.63a2 2 0 01-.45 2.11L8 9.73a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0122 16.92z',
    'Professional experience': 'M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-10-2h4v2h-4V5z',
    Education: 'M22 10l-10-5-10 5 10 5 10-5zm-16 3v4l6 3 6-3v-4',
    City: 'M3 21h18M5 21V7a2 2 0 017-2h0a2 2 0 012 2v14M9 9h2m-2 4h2m4-4h2m-2 4h2',
    Country: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.21-2.49 3.5-5.53 3.5-9S14.21 5.49 12 3m0 18c-2.21-2.49-3.5-5.53-3.5-9S9.79 5.49 12 3m-9 9h18',
    Website: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.21-2.49 3.5-5.53 3.5-9S14.21 5.49 12 3m0 18c-2.21-2.49-3.5-5.53-3.5-9S9.79 5.49 12 3m-9 9h18',
    'Social media': 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
    'Digital slug': 'M4 7a5 5 0 015-5h6a5 5 0 010 10h-2m7 5a5 5 0 01-5 5H9a5 5 0 010-10h2',
  }
  return <div className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 shadow-[0_8px_24px_rgba(15,29,58,0.05)]"><div className="flex items-start gap-3"><span className="grid place-items-center w-10 h-10 rounded-xl bg-[var(--accent-light)] text-[var(--accent-dark)] flex-shrink-0"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={iconPaths[label] ?? 'M12 2a10 10 0 100 20 10 10 0 000-20z'} /></svg></span><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mb-1">{label}</p><p className="text-sm font-semibold text-[var(--text-primary)] break-words leading-relaxed">{value || 'Not provided'}</p></div></div></div>
}

function UserContentDetail({ data, email, selected, onBack }: { data: UserDashboardData; email: string; selected: { type: UserContentType; id: string }; onBack: () => void }) {
  if (selected.type === 'businesses') {
    const item = data.businesses.find(business => business.id === selected.id)
    return item ? <BusinessDetail item={item} email={email} onBack={onBack} /> : <EmptyState title="Business not found" description="This business is no longer available." />
  }
  if (selected.type === 'events') {
    const item = data.events.find(event => event.id === selected.id)
    return item ? <EventDetail item={item} email={email} onBack={onBack} /> : <EmptyState title="Event not found" description="This event is no longer available." />
  }
  const items = selected.type === 'articles' ? data.articles : data.blogs
  const item = items.find(article => article.id === selected.id)
  return item ? <ArticleDetail item={item} type={selected.type} email={email} onBack={onBack} /> : <EmptyState title="Post not found" description="This post is no longer available." />
}

function DetailHeader({ title, onBack, editing, onEdit, onSave, onCancel, onDelete }: { title: string; onBack: () => void; editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void; onDelete: () => void }) {
  return <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"><button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-light)]"><span aria-hidden="true">←</span> Back to list</button><div className="flex items-center gap-2">{editing ? <><button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]">Cancel</button><button onClick={onSave} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)]">Save changes</button></> : <><button onClick={onEdit} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)]">Edit</button><button onClick={onDelete} className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50">Delete</button></>}</div><h2 className="sr-only">{title}</h2></div>
}

function DetailField({ label, value, locked = false }: { label: string; value: string; locked?: boolean }) {
  return <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] p-4"><div className="flex items-center justify-between gap-2 mb-1"><p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{label}</p>{locked && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-tertiary)] normal-case tracking-normal" title="This field cannot be edited"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4m-2 0h12v9H6v-9z" /></svg>Cannot be edited</span>}</div><p className="text-sm text-[var(--text-primary)] break-words whitespace-pre-wrap">{value || 'Not provided'}</p></div>
}

function EditField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const className = "w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
  return <label className="block"><span className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</span>{multiline ? <textarea value={value} onChange={event => onChange(event.target.value)} rows={4} className={`${className} resize-y`} /> : <input value={value} onChange={event => onChange(event.target.value)} className={className} />}</label>
  return <div className="animate-fade-in"><DetailHeader title={form.title} onBack={onBack} editing={editing} onEdit={() => setEditing(true)} onSave={save} onCancel={() => { setForm(item); setEditing(false) }} /><div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden"><img src={form.featuredImage} alt="" className="w-full h-56 object-cover" /><div className="p-6 md:p-8">{editing ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><EditField label="Title" value={form.title} onChange={value => update('title', value)} /><EditField label="Topic" value={form.topic} onChange={value => update('topic', value)} /><EditField label="Featured image URL" value={form.featuredImage} onChange={value => update('featuredImage', value)} /><EditField label="Author" value={form.author} onChange={value => update('author', value)} /><DetailField label="Published date" value={form.publishedDate} locked /><EditField label="Status" value={form.status} onChange={value => update('status', value as UserArticleData['status'])} /><EditField label="Visibility" value={form.visibility} onChange={value => update('visibility', value as UserArticleData['visibility'])} /><div className="sm:col-span-2"><EditField label="Excerpt" value={form.excerpt} onChange={value => update('excerpt', value)} multiline /></div></div> : <><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-dark)]">{form.topic}</p><h1 className="font-serif text-3xl text-[var(--text-primary)] mt-1">{form.title}</h1></div><StatusBadge status={form.status} /></div><p className="text-base text-[var(--text-secondary)] leading-relaxed mb-7">{form.excerpt}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><DetailField label="Author" value={form.author} /><DetailField label="Published date" value={form.publishedDate} locked /><DetailField label="Visibility" value={form.visibility} /><DetailField label="Content type" value={type === 'blogs' ? 'Blog post' : 'Article'} /></div></>}</div></div></div>
}

function BusinessDetail({ item, email, onBack }: { item: UserBusinessData; email: string; onBack: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(item)
  function update<K extends keyof UserBusinessData>(key: K, value: UserBusinessData[K]) { setForm(current => ({ ...current, [key]: value })) }
  function save() { updateUserContent<UserBusinessData>(email, 'businesses', item.id, form); onBack() }
  return <div className="animate-fade-in"><DetailHeader title={form.companyName} onBack={onBack} editing={editing} onEdit={() => setEditing(true)} onSave={save} onCancel={() => { setForm(item); setEditing(false) }} onDelete={() => { if (window.confirm(`Delete ${form.companyName}?`)) { deleteUserContent(email, 'businesses', item.id); onBack() } }} /><div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden"><div className="relative h-48"><img src={form.coverImage} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><img src={form.companyLogo} alt={form.companyName} className="absolute bottom-5 left-6 w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" /></div><div className="p-6 md:p-8 pt-10">{editing ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><EditField label="Company name" value={form.companyName} onChange={value => update('companyName', value)} /><EditField label="Industry" value={form.industry} onChange={value => update('industry', value)} /><EditField label="Company logo URL" value={form.companyLogo} onChange={value => update('companyLogo', value)} /><EditField label="Cover image URL" value={form.coverImage} onChange={value => update('coverImage', value)} /><EditField label="Founder / leadership" value={form.founderLeadership} onChange={value => update('founderLeadership', value)} /><EditField label="City" value={form.city} onChange={value => update('city', value)} /><EditField label="Country" value={form.country} onChange={value => update('country', value)} /><EditField label="Website" value={form.website} onChange={value => update('website', value)} /><EditField label="Phone" value={form.phone} onChange={value => update('phone', value)} /><EditField label="Email" value={form.email} onChange={value => update('email', value)} /><EditField label="Status" value={form.status} onChange={value => update('status', value as UserBusinessData['status'])} /><div className="sm:col-span-2"><EditField label="Description" value={form.description} onChange={value => update('description', value)} multiline /></div></div> : <><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-dark)]">{form.industry}</p><h1 className="font-serif text-3xl text-[var(--text-primary)] mt-1">{form.companyName}</h1><p className="text-sm text-[var(--text-tertiary)] mt-2">{form.city}, {form.country}</p></div><StatusBadge status={form.status} /></div><p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-7">{form.description}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><DetailField label="Founder / leadership" value={form.founderLeadership} /><DetailField label="Website" value={form.website} /><DetailField label="Phone" value={form.phone} /><DetailField label="Email" value={form.email} /><DetailField label="City" value={form.city} /><DetailField label="Country" value={form.country} /><DetailField label="Company logo" value={form.companyLogo} /><DetailField label="Cover image" value={form.coverImage} /></div></>}</div></div></div>
}

function ArticleDetail({ item, type, email, onBack }: { item: UserArticleData; type: 'articles' | 'blogs'; email: string; onBack: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(item)
  function update<K extends keyof UserArticleData>(key: K, value: UserArticleData[K]) { setForm(current => ({ ...current, [key]: value })) }
  function save() { updateUserContent<UserArticleData>(email, type, item.id, form); onBack() }
  return <div className="animate-fade-in"><DetailHeader title={form.title} onBack={onBack} editing={editing} onEdit={() => setEditing(true)} onSave={save} onCancel={() => { setForm(item); setEditing(false) }} onDelete={() => { if (window.confirm(`Delete ${form.title}?`)) { deleteUserContent(email, type, item.id); onBack() } }} /><div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden"><img src={form.featuredImage} alt="" className="w-full h-56 object-cover" /><div className="p-6 md:p-8">{editing ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><EditField label="Title" value={form.title} onChange={value => update('title', value)} /><EditField label="Topic" value={form.topic} onChange={value => update('topic', value)} /><EditField label="Featured image URL" value={form.featuredImage} onChange={value => update('featuredImage', value)} /><EditField label="Author" value={form.author} onChange={value => update('author', value)} /><DetailField label="Published date" value={form.publishedDate} /><EditField label="Status" value={form.status} onChange={value => update('status', value as UserArticleData['status'])} /><EditField label="Visibility" value={form.visibility} onChange={value => update('visibility', value as UserArticleData['visibility'])} /><div className="sm:col-span-2"><EditField label="Excerpt" value={form.excerpt} onChange={value => update('excerpt', value)} multiline /></div></div> : <><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-dark)]">{form.topic}</p><h1 className="font-serif text-3xl text-[var(--text-primary)] mt-1">{form.title}</h1></div><StatusBadge status={form.status} /></div><p className="text-base text-[var(--text-secondary)] leading-relaxed mb-7">{form.excerpt}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><DetailField label="Author" value={form.author} /><DetailField label="Published date" value={form.publishedDate} /><DetailField label="Visibility" value={form.visibility} /><DetailField label="Featured image" value={form.featuredImage} /></div></>}</div></div></div>
}

function EventDetail({ item, email, onBack }: { item: UserEventData; email: string; onBack: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(item)
  function update<K extends keyof UserEventData>(key: K, value: UserEventData[K]) { setForm(current => ({ ...current, [key]: value })) }
  function save() { updateUserContent<UserEventData>(email, 'events', item.id, form); onBack() }
  return <div className="animate-fade-in"><DetailHeader title={form.title} onBack={onBack} editing={editing} onEdit={() => setEditing(true)} onSave={save} onCancel={() => { setForm(item); setEditing(false) }} onDelete={() => { if (window.confirm(`Delete ${form.title}?`)) { deleteUserContent(email, 'events', item.id); onBack() } }} /><div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden"><img src={form.eventImage} alt="" className="w-full h-56 object-cover" /><div className="p-6 md:p-8">{editing ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><EditField label="Event title" value={form.title} onChange={value => update('title', value)} /><EditField label="Event type" value={form.eventType} onChange={value => update('eventType', value)} /><EditField label="Event image URL" value={form.eventImage} onChange={value => update('eventImage', value)} /><EditField label="Start date and time" value={form.startDate} onChange={value => update('startDate', value)} /><EditField label="End date and time" value={form.endDate} onChange={value => update('endDate', value)} /><EditField label="Location" value={form.location} onChange={value => update('location', value)} /><EditField label="Event URL" value={form.eventUrl} onChange={value => update('eventUrl', value)} /><EditField label="Status" value={form.status} onChange={value => update('status', value as UserEventData['status'])} /><label className="flex items-center gap-3 text-sm text-[var(--text-secondary)] sm:col-span-2"><input type="checkbox" checked={form.online} onChange={event => update('online', event.target.checked)} className="w-4 h-4 accent-[var(--brand)]" /> This is an online event</label><div className="sm:col-span-2"><EditField label="Description" value={form.description} onChange={value => update('description', value)} multiline /></div></div> : <><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-dark)]">{form.eventType}</p><h1 className="font-serif text-3xl text-[var(--text-primary)] mt-1">{form.title}</h1></div><StatusBadge status={form.status} /></div><p className="text-base text-[var(--text-secondary)] leading-relaxed mb-7">{form.description}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><DetailField label="Starts" value={form.startDate} /><DetailField label="Ends" value={form.endDate} /><DetailField label={form.online ? 'Online event' : 'Location'} value={form.location} /><DetailField label="Event URL" value={form.eventUrl} /><DetailField label="Event image" value={form.eventImage} /></div></>}</div></div></div>
}

function AddContentForm({ type, email, user, onCancel, onCreated }: { type: UserContentType; email: string; user: NonNullable<ReturnType<typeof useAuth>['user']>; onCancel: () => void; onCreated: () => void }) {
  if (type === 'businesses') return <BusinessCreateForm email={email} onCancel={onCancel} onCreated={onCreated} />
  if (type === 'events') return <EventCreateForm email={email} onCancel={onCancel} onCreated={onCreated} />
  return <ArticleCreateForm email={email} author={user.name} type={type} onCancel={onCancel} onCreated={onCreated} />
}

function CreateShell({ title, children, onCancel, onSubmit }: { title: string; children: React.ReactNode; onCancel: () => void; onSubmit: () => void }) {
  return <div className="animate-fade-in max-w-3xl mx-auto"><div className="flex items-center justify-between gap-4 mb-6"><button onClick={onCancel} className="text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-light)]">← Back to list</button><h2 className="font-serif text-2xl text-[var(--text-primary)]">Add {title}</h2><span className="w-20" /></div><form onSubmit={event => { event.preventDefault(); onSubmit() }} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div><div className="flex justify-end gap-2 pt-6 mt-6 border-t border-[var(--border-light)]"><button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)]">Save</button></div></form></div>
}

function BusinessCreateForm({ email, onCancel, onCreated }: { email: string; onCancel: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<UserBusinessData>({ id: '', companyLogo: '', coverImage: '', companyName: '', industry: '', description: '', founderLeadership: '', city: '', country: '', website: '', phone: '', email: '', status: 'Pending review' })
  function update<K extends keyof UserBusinessData>(key: K, value: UserBusinessData[K]) { setForm(current => ({ ...current, [key]: value })) }
  function save() { createUserContent(email, 'businesses', { ...form, id: `business-${Date.now()}` }); onCreated() }
  return <CreateShell title="Business" onCancel={onCancel} onSubmit={save}><EditField label="Company name" value={form.companyName} onChange={value => update('companyName', value)} /><EditField label="Industry" value={form.industry} onChange={value => update('industry', value)} /><EditField label="Company logo URL" value={form.companyLogo} onChange={value => update('companyLogo', value)} /><EditField label="Cover image URL" value={form.coverImage} onChange={value => update('coverImage', value)} /><EditField label="Founder / leadership" value={form.founderLeadership} onChange={value => update('founderLeadership', value)} /><EditField label="City" value={form.city} onChange={value => update('city', value)} /><EditField label="Country" value={form.country} onChange={value => update('country', value)} /><EditField label="Website" value={form.website} onChange={value => update('website', value)} /><EditField label="Phone" value={form.phone} onChange={value => update('phone', value)} /><EditField label="Email" value={form.email} onChange={value => update('email', value)} /><EditField label="Status" value={form.status} onChange={value => update('status', value as UserBusinessData['status'])} /><div className="sm:col-span-2"><EditField label="Description" value={form.description} onChange={value => update('description', value)} multiline /></div></CreateShell>
}

function ArticleCreateForm({ email, author, type, onCancel, onCreated }: { email: string; author: string; type: 'articles' | 'blogs'; onCancel: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<UserArticleData>({ id: '', featuredImage: '', title: '', topic: '', excerpt: '', author, publishedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), status: 'Draft', visibility: 'Public' })
  function update<K extends keyof UserArticleData>(key: K, value: UserArticleData[K]) { setForm(current => ({ ...current, [key]: value })) }
  function save() { createUserContent(email, type, { ...form, id: `${type.slice(0, -1)}-${Date.now()}` }); onCreated() }
  return <CreateShell title={type === 'articles' ? 'Article' : 'Blog'} onCancel={onCancel} onSubmit={save}><EditField label="Title" value={form.title} onChange={value => update('title', value)} /><EditField label="Topic" value={form.topic} onChange={value => update('topic', value)} /><EditField label="Featured image URL" value={form.featuredImage} onChange={value => update('featuredImage', value)} /><EditField label="Author" value={form.author} onChange={value => update('author', value)} /><DetailField label="Published date" value={form.publishedDate} locked /><EditField label="Status" value={form.status} onChange={value => update('status', value as UserArticleData['status'])} /><EditField label="Visibility" value={form.visibility} onChange={value => update('visibility', value as UserArticleData['visibility'])} /><div className="sm:col-span-2"><EditField label="Excerpt" value={form.excerpt} onChange={value => update('excerpt', value)} multiline /></div></CreateShell>
}

function EventCreateForm({ email, onCancel, onCreated }: { email: string; onCancel: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<UserEventData>({ id: '', eventImage: '', title: '', description: '', eventType: '', startDate: '', endDate: '', location: '', online: false, eventUrl: '', status: 'Draft' })
  function update<K extends keyof UserEventData>(key: K, value: UserEventData[K]) { setForm(current => ({ ...current, [key]: value })) }
  function save() { createUserContent(email, 'events', { ...form, id: `event-${Date.now()}` }); onCreated() }
  return <CreateShell title="Event" onCancel={onCancel} onSubmit={save}><EditField label="Event title" value={form.title} onChange={value => update('title', value)} /><EditField label="Event type" value={form.eventType} onChange={value => update('eventType', value)} /><EditField label="Event image URL" value={form.eventImage} onChange={value => update('eventImage', value)} /><EditField label="Start date and time" value={form.startDate} onChange={value => update('startDate', value)} /><EditField label="End date and time" value={form.endDate} onChange={value => update('endDate', value)} /><EditField label="Location" value={form.location} onChange={value => update('location', value)} /><EditField label="Event URL" value={form.eventUrl} onChange={value => update('eventUrl', value)} /><EditField label="Status" value={form.status} onChange={value => update('status', value as UserEventData['status'])} /><label className="flex items-center gap-3 text-sm text-[var(--text-secondary)] sm:col-span-2"><input type="checkbox" checked={form.online} onChange={event => update('online', event.target.checked)} className="w-4 h-4 accent-[var(--brand)]" /> This is an online event</label><div className="sm:col-span-2"><EditField label="Description" value={form.description} onChange={value => update('description', value)} multiline /></div></CreateShell>
}

function BusinessPage({ data, email, tab, setTab, user, onOpen, onAdd }: { data: UserDashboardData; email: string; tab: Tab; setTab: (tab: Tab) => void; user: NonNullable<ReturnType<typeof useAuth>['user']>; onOpen: (id: string) => void; onAdd: () => void }) {
  return (
    <div className="animate-fade-in">
      <PageIntro title="Business" description="Businesses and companies owned by your member profile." count={data.businesses.length} onAdd={onAdd} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {data.businesses.map(business => <BusinessCard key={business.id} business={business} onOpen={onOpen} />)}
      </div>
      {data.businesses.length === 0 && <EmptyState title="No businesses yet" description="Businesses you own or submit will appear here." />}
      <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 mb-8 overflow-x-auto hide-scrollbar w-full">
        {TABS.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${tab === item.id ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'companies' && <MyCompanies email={email} />}
      {tab === 'reviews' && <MyReviews email={email} name={user.name} avatar={user.avatar} />}
      {tab === 'apply' && <ApplyCompany user={user} />}
    </div>
  )
}

function BusinessCard({ business, onOpen }: { business: UserBusinessData; onOpen: (id: string) => void }) {
  return <article role="button" tabIndex={0} onClick={() => onOpen(business.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onOpen(business.id) }} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden card-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
    <div className="relative h-36 overflow-hidden"><img src={business.coverImage} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" /><img src={business.companyLogo} alt={business.companyName} className="absolute bottom-4 left-5 w-14 h-14 rounded-xl object-cover border-2 border-white shadow-lg" /></div>
    <div className="p-5 pt-7"><div className="flex justify-between items-start gap-3"><div><p className="text-xs font-semibold text-[var(--accent-dark)] uppercase tracking-wide">{business.industry}</p><h3 className="font-serif text-xl text-[var(--text-primary)] mt-1">{business.companyName}</h3></div><StatusBadge status={business.status} /></div><p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3">{business.description}</p><div className="grid grid-cols-2 gap-3 mt-5 text-xs"><Info label="Leadership" value={business.founderLeadership} /><Info label="Location" value={`${business.city}, ${business.country}`} /><Info label="Website" value={business.website} /><Info label="Contact" value={business.email} /></div></div>
  </article>
}

function ArticlePage({ title, description, items, type, onOpen, onAdd }: { title: string; description: string; items: UserArticleData[]; type: 'articles' | 'blogs'; onOpen: (id: string) => void; onAdd: () => void }) {
  return <div className="animate-fade-in"><PageIntro title={title} description={description} count={items.length} onAdd={onAdd} /><div className="grid grid-cols-1 md:grid-cols-2 gap-5">{items.map(item => <ArticleCard key={item.id} item={item} onOpen={onOpen} />)}</div>{items.length === 0 && <EmptyState title={`No ${title.toLowerCase()} yet`} description={`Your ${title.toLowerCase()} will appear here once you publish or save them.`} />}</div>
}

function ArticleCard({ item, onOpen }: { item: UserArticleData; onOpen: (id: string) => void }) {
  return <article role="button" tabIndex={0} onClick={() => onOpen(item.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onOpen(item.id) }} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden card-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"><img src={item.featuredImage} alt="" className="w-full h-44 object-cover" /><div className="p-5"><div className="flex items-center justify-between gap-2 mb-3"><span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-dark)]">{item.topic}</span><StatusBadge status={item.status} /></div><h3 className="font-serif text-xl text-[var(--text-primary)] leading-tight">{item.title}</h3><p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3 line-clamp-3">{item.excerpt}</p><div className="flex items-center justify-between gap-3 text-xs text-[var(--text-tertiary)] mt-5 pt-4 border-t border-[var(--border-light)]"><span>{item.author} · {item.publishedDate}</span><span>{item.visibility}</span></div></div></article>
}

function EventsPage({ items, onOpen, onAdd }: { items: UserEventData[]; onOpen: (id: string) => void; onAdd: () => void }) {
  return <div className="animate-fade-in"><PageIntro title="Events" description="Events you have created or organized for the KBN community." count={items.length} onAdd={onAdd} /><div className="grid grid-cols-1 md:grid-cols-2 gap-5">{items.map(item => <EventCard key={item.id} item={item} onOpen={onOpen} />)}</div>{items.length === 0 && <EmptyState title="No events yet" description="Events you create or organize will appear here." />}</div>
}

function EventCard({ item, onOpen }: { item: UserEventData; onOpen: (id: string) => void }) {
  return <article role="button" tabIndex={0} onClick={() => onOpen(item.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onOpen(item.id) }} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden card-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"><img src={item.eventImage} alt="" className="w-full h-44 object-cover" /><div className="p-5"><div className="flex items-center justify-between gap-2 mb-3"><span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-dark)]">{item.eventType}</span><StatusBadge status={item.status} /></div><h3 className="font-serif text-xl text-[var(--text-primary)]">{item.title}</h3><p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3">{item.description}</p><div className="space-y-2 mt-5 text-xs text-[var(--text-tertiary)]"><Info label="Starts" value={item.startDate} /><Info label="Ends" value={item.endDate} /><Info label={item.online ? 'Online' : 'Location'} value={item.location} /></div><p className="text-xs font-medium text-[var(--brand)] mt-4">{item.eventUrl}</p></div></article>
}

function PageIntro({ title, description, count, onAdd }: { title: string; description: string; count: number; onAdd?: () => void }) {
  return <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6"><div><h2 className="font-serif text-2xl text-[var(--text-primary)] mb-1">{title}</h2><p className="text-sm text-[var(--text-secondary)]">{description}</p></div><div className="flex items-center gap-2"><span className="text-xs font-semibold text-[var(--text-tertiary)] bg-[var(--surface)] border border-[var(--border-light)] px-3 py-1.5 rounded-full">{count} {count === 1 ? 'item' : 'items'}</span>{onAdd && <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-light)]"><span aria-hidden="true">+</span>Add</button>}</div></div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mb-0.5">{label}</p><p className="text-[var(--text-secondary)] break-words">{value}</p></div>
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${status === 'Published' ? 'bg-emerald-100 text-emerald-700' : status === 'Pending review' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="text-center py-12 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]"><div className="text-3xl mb-3">○</div><h2 className="font-serif text-xl text-[var(--text-primary)] mb-2">{title}</h2><p className="text-sm text-[var(--text-tertiary)]">{description}</p></div>
}

function MyCompanies({ email }: { email: string }) {
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    function refresh() {
      setReviews(getUserReviews(email))
      setCompanies(getListedCompanies())
    }
    refresh()
    const u1 = userSubscribe(refresh)
    const u2 = adminSubscribe(refresh)
    return () => { u1(); u2() }
  }, [email])

  const reviewedCompanies = useMemo(() => {
    const companyMap = new Map(companies.map(c => [c.id, c]))
    return reviews.map(r => ({ review: r, company: companyMap.get(r.companyId) }))
  }, [reviews, companies])

  function startEdit(r: UserReview) {
    setEditing(r.id)
    setEditRating(r.rating)
    setEditText(r.text)
  }

  function cancelEdit() { setEditing(null) }

  function saveEdit(reviewId: string) {
    updateUserReview(email, reviewId, { rating: editRating, text: editText })
    setEditing(null)
  }

  function handleDelete(reviewId: string) {
    deleteUserReview(email, reviewId)
  }

  if (reviewedCompanies.length === 0) {
    return (
      <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] animate-fade-in">
        <div className="text-4xl mb-4">🏢</div>
        <h2 className="font-serif text-xl text-[var(--text-primary)] mb-2">No companies yet</h2>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">You haven't reviewed any companies yet. Browse the directory to find companies you've used.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {reviewedCompanies.map(({ review, company }) => (
        <div key={review.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src={review.companyLogo} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-[var(--border-light)]" />
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base truncate">{review.companyName}</h3>
                <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                  <span>{review.companyCategory}</span>
                  {company && <><span>·</span><span className="text-[var(--accent)]">{'★'.repeat(Math.round(company.rating))} {company.rating.toFixed(1)}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[var(--text-tertiary)]">{new Date(review.date).toLocaleDateString()}</span>
              <span className="text-[var(--accent)] text-sm">{'★'.repeat(review.rating)}</span>
            </div>
          </div>

          {editing === review.id ? (
            <div className="mt-4 pt-4 border-t border-[var(--border-light)] space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setEditRating(s)}
                    className={`text-2xl transition-all hover:scale-110 ${s <= editRating ? 'text-[var(--accent)]' : 'text-[var(--border-default)]'}`}>★</button>
                ))}
              </div>
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none" />
              <div className="flex items-center gap-2">
                <button onClick={() => saveEdit(review.id)}
                  className="text-xs font-semibold bg-[var(--brand)] text-white px-3 py-2 rounded-lg hover:bg-[var(--brand-light)] transition-colors">Save</button>
                <button onClick={cancelEdit}
                  className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-3 py-2">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{review.text}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => startEdit(review)}
                  className="text-xs font-medium text-[var(--brand)] hover:underline">Edit Review</button>
                <button onClick={() => handleDelete(review.id)}
                  className="text-xs font-medium text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MyReviews({ email, name, avatar }: { email: string; name: string; avatar: string }) {
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    function refresh() { setReviews(getUserReviews(email)) }
    refresh()
    return userSubscribe(refresh)
  }, [email])

  function startEdit(r: UserReview) {
    setEditing(r.id)
    setEditRating(r.rating)
    setEditText(r.text)
  }

  function cancelEdit() { setEditing(null) }

  function saveEdit(reviewId: string) {
    updateUserReview(email, reviewId, { rating: editRating, text: editText })
    setEditing(null)
  }

  function handleDelete(reviewId: string) {
    deleteUserReview(email, reviewId)
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] animate-fade-in">
        <div className="text-4xl mb-4">⭐</div>
        <h2 className="font-serif text-xl text-[var(--text-primary)] mb-2">No reviews yet</h2>
        <p className="text-sm text-[var(--text-tertiary)]">You haven't submitted any reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {reviews.map(review => (
        <div key={review.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 md:p-6">
          <div className="flex items-center gap-3 mb-3">
            <img src={review.companyLogo} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{review.companyName}</h3>
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                <span>{review.companyCategory}</span>
                <span>·</span>
                <span>{new Date(review.date).toLocaleDateString()}</span>
                <span>·</span>
                <span className="text-[var(--accent)]">{'★'.repeat(review.rating)}</span>
              </div>
            </div>
          </div>

          {editing === review.id ? (
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setEditRating(s)}
                    className={`text-2xl transition-all hover:scale-110 ${s <= editRating ? 'text-[var(--accent)]' : 'text-[var(--border-default)]'}`}>★</button>
                ))}
              </div>
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none" />
              <div className="flex items-center gap-2">
                <button onClick={() => saveEdit(review.id)}
                  className="text-xs font-semibold bg-[var(--brand)] text-white px-3 py-2 rounded-lg hover:bg-[var(--brand-light)] transition-colors">Save</button>
                <button onClick={cancelEdit}
                  className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-3 py-2">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{review.text}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => startEdit(review)}
                  className="text-xs font-medium text-[var(--brand)] hover:underline">Edit</button>
                <button onClick={() => handleDelete(review.id)}
                  className="text-xs font-medium text-red-500 hover:underline">Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

const ALL_CATEGORIES: Category[] = [
  'Construction', 'Hospitals', 'Hotels', 'Guest Houses', 'Clothing', 'Coffee Shops',
  'Furniture', 'Cars', 'Healthcare', 'Hospitality', 'Ministry', 'Fashion',
  'Food & Beverage', 'Professional Services', 'Automotive',
]

function ApplyCompany({ user }: { user: { name: string; email: string } }) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    companyName: '',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop&auto=format',
    ownerName: user.name,
    email: user.email,
    phone: '',
    website: '',
    address: '',
    category: '' as Category | '',
    description: '',
    longDescription: '',
    services: [''],
    tags: [''],
    licenseDoc: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=800&fit=crop&auto=format',
    supportingDocs: [] as string[],
    socialLinks: [] as { platform: string; url: string }[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  function addService() { setForm(prev => ({ ...prev, services: [...prev.services, ''] })) }
  function updateService(idx: number, v: string) {
    setForm(prev => ({ ...prev, services: prev.services.map((s, i) => i === idx ? v : s) }))
  }
  function removeService(idx: number) {
    setForm(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== idx) }))
  }

  function addTag() { setForm(prev => ({ ...prev, tags: [...prev.tags, ''] })) }
  function updateTag(idx: number, v: string) {
    setForm(prev => ({ ...prev, tags: prev.tags.map((t, i) => i === idx ? v : t) }))
  }
  function removeTag(idx: number) {
    setForm(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.companyName.trim()) errs.companyName = 'Company name is required'
    if (!form.phone.trim()) errs.phone = 'Phone is required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.category) errs.category = 'Category is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.longDescription.trim()) errs.longDescription = 'Detailed description is required'
    const nonEmptyServices = form.services.filter(s => s.trim())
    if (nonEmptyServices.length === 0) errs.services = 'At least one service is required'
    const nonEmptyTags = form.tags.filter(t => t.trim())
    if (nonEmptyTags.length === 0) errs.tags = 'At least one tag is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    submitApplication({
      companyName: form.companyName.trim(),
      logo: form.logo,
      ownerName: form.ownerName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      address: form.address.trim(),
      category: form.category as Category,
      description: form.description.trim(),
      longDescription: form.longDescription.trim(),
      services: form.services.filter(s => s.trim()),
      tags: form.tags.filter(t => t.trim()),
      licenseDoc: form.licenseDoc,
      socialLinks: form.socialLinks.filter(s => s.url.trim()),
      supportingDocs: form.supportingDocs.filter(d => d.trim()),
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] animate-scale-in max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-3">Application Submitted!</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-2">Your application for <strong>{form.companyName}</strong> has been received.</p>
        <p className="text-xs text-[var(--text-tertiary)]">An admin will review your application and you will be notified of the decision.</p>
      </div>
    )
  }

  const steps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Documents' },
  ]

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
        <div className="flex items-center border-b border-[var(--border-light)]">
          {steps.map((s, i) => (
            <div key={s.num} className={`flex-1 relative text-center py-4 ${i < steps.length - 1 ? 'border-r border-[var(--border-light)]' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 text-sm font-bold transition-all ${step >= s.num ? 'bg-[var(--brand)] text-white' : 'bg-[var(--surface-alt)] text-[var(--text-tertiary)]'}`}>{s.num}</div>
              <span className={`text-xs font-medium ${step >= s.num ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-serif text-xl text-[var(--text-primary)] mb-2">Basic Company Information</h2>

              <Field label="Company Name" error={errors.companyName}>
                <input type="text" value={form.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Your company name"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
              </Field>

              <Field label="Business Category" error={errors.category}>
                <select value={form.category} onChange={e => update('category', e.target.value)}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20">
                  <option value="">Select a category</option>
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Owner / Primary Contact">
                <input type="text" value={form.ownerName} onChange={e => update('ownerName', e.target.value)} placeholder="Full name"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Email">
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="contact@company.com"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
                </Field>
                <Field label="Phone Number" error={errors.phone}>
                  <input type="text" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 000-0000"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
                </Field>
              </div>

              <Field label="Website (optional)">
                <input type="text" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://yourcompany.com"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
              </Field>

              <Field label="Physical Address" error={errors.address}>
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Street, City, State, ZIP"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
              </Field>

              <Field label="Company Logo URL">
                <input type="text" value={form.logo} onChange={e => update('logo', e.target.value)} placeholder="https://example.com/logo.png"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
                {form.logo && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={form.logo} alt="" className="w-12 h-12 rounded-xl object-cover ring-2 ring-[var(--border-light)]" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <span className="text-xs text-[var(--text-tertiary)]">Logo preview</span>
                  </div>
                )}
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-serif text-xl text-[var(--text-primary)] mb-2">Company Details</h2>

              <Field label="Short Description" error={errors.description}>
                <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} placeholder="A brief one-sentence description of your company"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none" />
              </Field>

              <Field label="Detailed Description" error={errors.longDescription}>
                <textarea value={form.longDescription} onChange={e => update('longDescription', e.target.value)} rows={4} placeholder="Describe your company in detail — your mission, history, specialties, and what makes you unique"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none" />
              </Field>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Services / Products {errors.services && <span className="text-red-500 text-xs">{errors.services}</span>}
                </label>
                <div className="space-y-2">
                  {form.services.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={s} onChange={e => updateService(i, e.target.value)} placeholder={`Service ${i + 1}`}
                        className="flex-1 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
                      {form.services.length > 1 && (
                        <button onClick={() => removeService(i)} className="text-[var(--text-tertiary)] hover:text-red-500 p-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addService} className="mt-2 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Service
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Tags / Keywords {errors.tags && <span className="text-red-500 text-xs">{errors.tags}</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((t, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input type="text" value={t} onChange={e => updateTag(i, e.target.value)} placeholder="Tag"
                        className="w-28 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-lg py-1.5 px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
                      {form.tags.length > 1 && (
                        <button onClick={() => removeTag(i)} className="text-[var(--text-tertiary)] hover:text-red-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addTag} className="mt-2 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Tag
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-serif text-xl text-[var(--text-primary)] mb-2">Documents & Links</h2>

              <p className="text-sm text-[var(--text-secondary)] mb-4">Upload your government-issued business license or registration document and any additional supporting files.</p>

              <div className="bg-[var(--surface-alt)] rounded-xl border-2 border-dashed border-[var(--border-default)] p-8 text-center">
                <svg className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Upload Business License</p>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">PDF, JPG, or PNG up to 10MB</p>
                <label className="inline-flex items-center gap-2 bg-[var(--brand)] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Choose File
                  <input type="file" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) update('licenseDoc', URL.createObjectURL(file))
                  }} />
                </label>
              </div>

              <Field label="License Document URL">
                <input type="text" value={form.licenseDoc} onChange={e => update('licenseDoc', e.target.value)} placeholder="https://example.com/license.pdf"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
              </Field>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Social Media Links (optional)</label>
                <div className="space-y-2">
                  {form.socialLinks.map((sl, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input type="text" value={sl.platform} placeholder="e.g. LinkedIn" onChange={e => {
                        const updated = [...form.socialLinks]
                        updated[i] = { ...sl, platform: e.target.value }
                        update('socialLinks', updated)
                      }}
                        className="w-full sm:w-32 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
                      <input type="text" value={sl.url} placeholder="https://..." onChange={e => {
                        const updated = [...form.socialLinks]
                        updated[i] = { ...sl, url: e.target.value }
                        update('socialLinks', updated)
                      }}
                        className="flex-1 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
                      <button onClick={() => update('socialLinks', form.socialLinks.filter((_, j) => j !== i))}
                        className="text-[var(--text-tertiary)] hover:text-red-500 p-1 self-end sm:self-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => update('socialLinks', [...form.socialLinks, { platform: '', url: '' }])}
                  className="mt-2 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Social Link
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-[var(--border-light)] mt-6">
            <button onClick={() => setStep(step - 1)} disabled={step === 1}
              className="flex items-center gap-1 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Previous
            </button>
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 bg-[var(--brand)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-lg shadow-[var(--brand)]/20">
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ) : (
              <button onClick={handleSubmit}
                className="flex items-center gap-2 bg-[var(--accent)] text-[var(--brand-dark)] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[var(--accent-dark)] transition-colors shadow-lg shadow-[var(--accent)]/30">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
        {label} {error && <span className="text-red-500 text-xs ml-1">({error})</span>}
      </label>
      {children}
    </div>
  )
}
