import { useState, useEffect } from 'react'
import { type Company, type Category } from '../data/companies'

function CategoryIcon({ category }: { category: Category }) {
  const icons: Record<Category, string> = {
    Automotive: '🚗',
    Cars: '🚗',
    Clothing: '👕',
    'Coffee Shops': '☕',
    Construction: '🏗️',
    Fashion: '👕',
    'Food & Beverage': '☕',
    Furniture: '🪑',
    'Guest Houses': '🏡',
    Healthcare: '🏥',
    Hospitals: '🏥',
    Hospitality: '🏨',
    Hotels: '🏨',
    Ministry: '⛪',
    'Professional Services': '💼',
  }
  return <span>{icons[category]}</span>
}

function getCategoryGradient(cat: Category): string {
  const g: Record<Category, string> = {
    Construction: 'from-amber-500/10 to-orange-500/10',
    Hospitals: 'from-emerald-500/10 to-teal-500/10',
    Healthcare: 'from-emerald-500/10 to-teal-500/10',
    Hotels: 'from-violet-500/10 to-purple-500/10',
    Hospitality: 'from-violet-500/10 to-purple-500/10',
    'Guest Houses': 'from-rose-500/10 to-pink-500/10',
    Clothing: 'from-sky-500/10 to-blue-500/10',
    'Coffee Shops': 'from-yellow-500/10 to-amber-500/10',
    Furniture: 'from-indigo-500/10 to-blue-500/10',
    Cars: 'from-red-500/10 to-orange-500/10',
    Ministry: 'from-sky-500/10 to-blue-500/10',
    Fashion: 'from-rose-500/10 to-pink-500/10',
    'Food & Beverage': 'from-yellow-500/10 to-amber-500/10',
    'Professional Services': 'from-indigo-500/10 to-blue-500/10',
    Automotive: 'from-red-500/10 to-orange-500/10',
  }
  return g[cat]
}

function getCategoryColor(cat: Category): string {
  const c: Record<Category, string> = {
    Construction: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    Hospitals: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    Healthcare: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    Hotels: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    Hospitality: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    'Guest Houses': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    Clothing: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    'Coffee Shops': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    Furniture: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    Cars: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    Ministry: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    Fashion: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    'Food & Beverage': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'Professional Services': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    Automotive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  return c[cat]
}

function CompanyCard({ company, onClick }: { company: Company; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden cursor-pointer group"
    >
      <div className="relative h-36 bg-[var(--border-light)] overflow-hidden">
        <img
          src={company.banner}
          alt=""
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        {company.featured && (
          <span className="absolute top-3 left-3 text-[10px] font-semibold text-white bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
            ✦ Featured
          </span>
        )}
        <div className="absolute top-3 right-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/30 bg-white shadow-lg">
            <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getCategoryColor(company.category)}`}>
            {company.category}
          </span>
          <span className="text-[10px] font-medium text-[var(--text-tertiary)] flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {company.address.split(',')[1]?.trim() || company.address.split(',')[0]}
          </span>
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] text-[15px] leading-tight mb-1.5 truncate group-hover:text-[var(--brand)] transition-colors">
          {company.name}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-4 line-clamp-2">{company.description}</p>
        <div className="flex items-center justify-end">
          <span className="text-xs font-medium text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
            View →
          </span>
        </div>
      </div>
    </article>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[var(--border-light)] rounded-2xl overflow-hidden transition-colors hover:border-[var(--border-default)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-semibold text-[var(--text-primary)] text-sm pr-4">{q}</span>
        <svg
          className={`w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`px-6 overflow-hidden transition-all duration-300 ${open ? 'pb-4 max-h-48' : 'max-h-0'}`}
      >
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export default function CompanyProfile({ company, onBack }: { company: Company; onBack: () => void }) {
  useEffect(() => { window.scrollTo(0, 0) }, [company.id])

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <div className="relative h-64 md:h-80 lg:h-96 bg-[var(--brand-dark)] overflow-hidden">
        <img src={company.banner} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-dark)]/90 via-[var(--brand-dark)]/30 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-5 left-5 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/20 transition-all z-10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-white/20 flex-shrink-0 bg-white/10 backdrop-blur-sm shadow-2xl">
              <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getCategoryColor(company.category)}`}>
                  {company.category}
                </span>
                {company.featured && (
                  <span className="text-xs font-semibold text-white bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">✦ Featured</span>
                )}
                <span className="text-xs font-medium text-white/70 bg-white/5 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Verified
                </span>
              </div>
              <h1 className="font-serif text-2xl md:text-5xl text-white leading-tight">{company.name}</h1>
              {company.ownerName && (
                <p className="text-white/70 text-sm mt-1">Owned by <span className="font-medium text-white">{company.ownerName}</span></p>
              )}
              {company.missionStatement && (
                <p className="text-white/50 text-sm italic mt-2 max-w-xl leading-relaxed">"{company.missionStatement}"</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <a href={`tel:${company.phone}`} className="flex items-center gap-2 bg-white text-[var(--brand)] text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Call
              </a>
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[var(--brand)] text-white text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-[var(--brand-dark)] transition-colors shadow-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Visit Website
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in-up">
              <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-5">About</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">{company.longDescription}</p>
              <div className="flex flex-wrap gap-2 mt-5">
                {company.tags.map(tag => (
                  <span key={tag} className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-1.5 rounded-full border border-[var(--border-light)]">{tag}</span>
                ))}
              </div>
            </section>

            <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in-up">
              <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-5">Services & Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {company.services.map((svc, i) => (
                  <div key={svc} className="flex items-center gap-3 p-3.5 bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] hover:border-[var(--brand)]/30 hover:bg-[var(--brand)]/5 transition-all group" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--brand)]/20 transition-colors">
                      <svg className="w-4 h-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{svc}</span>
                  </div>
                ))}
              </div>
            </section>

            {company.gallery.length > 0 && (
              <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in-up">
                <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-5">Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {company.gallery.map((img, i) => (
                    <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-[var(--border-light)] group">
                      <img src={img} alt={`${company.name} ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in-up">
              <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-5">Frequently Asked Questions</h2>
              <div className="space-y-3">
                <FAQItem q={`How can I book an appointment with ${company.name}?`} a="You can reach us via phone, email, or our website. We typically respond within 2 hours during business days." />
                <FAQItem q="What is the cancellation policy?" a="Cancellations are free up to 24 hours before the scheduled appointment. Late cancellations may be subject to a small fee." />
                <FAQItem q="Do you offer any guarantees or warranties?" a="Yes, all our services come with a satisfaction guarantee. Specific warranty terms vary by service — please contact us for details." />
                <FAQItem q={`What areas does ${company.name} serve?`} a={`We primarily serve ${company.address.split(',')[1]?.trim() || company.address} and surrounding areas. Contact us to confirm availability in your location.`} />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 animate-fade-in-up">
              <h3 className="font-semibold text-[var(--text-primary)] mb-5">Contact</h3>
              <div className="space-y-4">
                {[
                  { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Phone', value: company.phone, href: `tel:${company.phone}` },
                  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email', value: company.email, href: `mailto:${company.email}` },
                  { icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', label: 'Website', value: company.website.replace('https://', ''), href: company.website },
                  { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Address', value: company.address },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--surface-alt)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors break-all">{item.value}</a>
                      ) : (
                        <p className="text-sm font-medium text-[var(--text-primary)]">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 animate-fade-in-up">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Business Hours</h3>
              <div className="space-y-2">
                {['Monday - Friday', 'Saturday', 'Sunday'].map((day, i) => (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{day}</span>
                    <span className={`font-medium ${i < 2 ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                      {i < 2 ? '8:00 AM - 6:00 PM' : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { CompanyCard, CategoryIcon, getCategoryColor }
