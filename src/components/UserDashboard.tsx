import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getUserReviews, updateUserReview, deleteUserReview, submitApplication, userSubscribe, type UserReview } from '../data/userDataStore'
import { getListedCompanies, adminSubscribe, type AdminCompany } from '../data/adminStore'
import { type Category } from '../data/companies'

type Tab = 'companies' | 'reviews' | 'apply'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'companies', label: 'My Companies', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'reviews', label: 'My Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { id: 'apply', label: 'Register Company', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function UserDashboard({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('companies')

  if (!user || user.role !== 'user') {
    return <div className="min-h-screen bg-[var(--surface-alt)] flex items-center justify-center text-[var(--text-tertiary)]">Access denied.</div>
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <header className="bg-[var(--brand-dark)] py-5 md:py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <img src={user.avatar} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-white/20" />
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-white">Welcome, {user.name}</h1>
              <p className="text-[#94A3B8] text-sm">Member Dashboard</p>
            </div>
          </div>
          <button onClick={onBack} className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/15 hover:bg-white/20 transition-all self-start sm:self-auto flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 mb-8 overflow-x-auto hide-scrollbar w-full">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${tab === t.id ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} /></svg>
              <span className="hidden xs:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'companies' && <MyCompanies email={user.email} />}
        {tab === 'reviews' && <MyReviews email={user.email} name={user.name} avatar={user.avatar} />}
        {tab === 'apply' && <ApplyCompany user={user} />}
      </div>
    </div>
  )
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
