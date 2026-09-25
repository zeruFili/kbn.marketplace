import { useState } from 'react'
import knbLogo from '../assets/kbn logo.jpg'
import surafelImg from '../assets/surafel.jpg'
import usaOneImg from '../assets/usa one.jpg'
import usaTwoImg from '../assets/usa two.jpg'
import addisOneImg from '../assets/addis one.jpg'
import addisTwoImg from '../assets/addis two.jpg'
import hawassaOneImg from '../assets/hawassa one.jpg'
import hawassaBuildingImg from '../assets/hawassa building.jpg'

function SectionHeading({ overline, title, subtitle }: { overline?: string; title: string; subtitle?: string }) {
  return (
    <div className="w-full text-center max-w-2xl mx-auto mb-8 md:mb-14">
      {overline && <span className="inline-block text-xs font-semibold text-[var(--accent-dark)] tracking-widest uppercase mb-3 break-words">{overline}</span>}
      <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)] mb-3 md:mb-4 break-words">{title}</h2>
      {subtitle && <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed break-words">{subtitle}</p>}
    </div>
  )
}

function ValueCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="card-hover bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-6 group text-center min-w-0">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} /></svg>
      </div>
      <h3 className="font-semibold text-[var(--text-primary)] mb-1.5 sm:mb-2 text-sm sm:text-base">{title}</h3>
      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed break-words">{desc}</p>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-4 sm:p-6 text-center min-w-0">
      <div className="font-serif text-2xl sm:text-3xl font-extrabold text-[var(--accent-dark)] mb-0.5 sm:mb-1">{value}</div>
      <div className="text-xs sm:text-sm text-[var(--text-tertiary)] font-medium leading-tight break-words">{label}</div>
    </div>
  )
}

function HubCard({ icon, title, children, highlight }: { icon: React.ReactNode; title: string; children: React.ReactNode; highlight: string }) {
  return (
    <div className="card-hover bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-8 min-w-0">
      <h3 className="font-serif text-lg sm:text-xl text-[var(--text-primary)] mb-3 sm:mb-4 flex items-center gap-2 min-w-0">
        {icon}
        <span className="truncate">{title}</span>
      </h3>
      <div className="space-y-1.5 sm:space-y-2 min-w-0">
        {children}
      </div>
      <div className="mt-4 bg-[var(--accent-light)] border-l-4 border-[var(--accent)] rounded-r-lg px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-[var(--text-primary)] break-words">
        {highlight}
      </div>
    </div>
  )
}

function AchievementList({ items, amharic }: { items: string[]; amharic?: string }) {
  return (
    <div className="space-y-2 sm:space-y-3 min-w-0">
      <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 min-w-0">
            <span className="text-[var(--accent-dark)] mt-0.5 flex-shrink-0">◆</span>
            <span className="break-words">{item}</span>
          </li>
        ))}
      </ul>
      {amharic && (
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-[var(--text-tertiary)] italic break-words">{amharic}</div>
      )}
    </div>
  )
}

const ACHIEVEMENT_DATA = {
  usa: {
    label: 'United States',
    items: [
      'Connected Ethiopian Christian professionals and business leaders in multiple states.',
      'Hosted 3 successful national networking events ',
      'Developed a strategic plan to purchase commercial buildings that support Christian businesses and community services',
    ],
  },
  ethiopia: {
    label: 'Ethiopia',
    items: [
      'Hosted large-scale networking events in Addis Ababa uniting local Christian entrepreneurs.',
      'Launched community initiatives supporting local churches and ministries.',
      'Established a strong presence in the capital city.',
    ],
  },
  hawassa: {
    label: 'Hawassa, Ethiopia',
    items: [
      'Chosen for its 85% Christian population as a strategic hub.',
      'Held 2 large-scale networking events uniting local Christian entrepreneurs and professionals.',
      'Launched and began building a Christian school from KG to college level — a major step toward holistic Kingdom development.',
    ]
  },
}

const PHOTO_LABELS = {
  usa: 'USA',
  ethiopia: 'Addis Ababa',
  hawassa: 'Hawassa',
} as const

export default function AboutUsPage({ onBack }: { onBack: () => void }) {
  const [achieveTab, setAchieveTab] = useState<keyof typeof ACHIEVEMENT_DATA>('usa')

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] overflow-x-hidden">
      {/* Hero Banner */}
      <div className="relative bg-[var(--brand-dark)] py-10 sm:py-12 md:py-16">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #D4A853 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 -right-10 w-48 h-48 sm:w-96 sm:h-96 bg-[var(--accent)] rounded-full blur-[120px] sm:blur-[180px] opacity-10 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/15 hover:bg-white/20 transition-all mb-4 sm:mb-6">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="hidden xs:inline">Back to Home</span>
          </button>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl text-white mb-2 sm:mb-3 leading-tight break-words">About Kingdom Builders Network</h1>
          <p className="text-sm sm:text-base md:text-lg text-[#94A3B8] max-w-2xl leading-relaxed break-words">A registered ministry under the Ethiopian Council of Gospel Believers Churches and in the United States of America — building God&apos;s Kingdom through faith, business, and community.</p>
        </div>
      </div>

      {/* Who We Are */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <SectionHeading overline="Who We Are" title="Kingdom Builders Network" subtitle={'Inspired by Psalm 133:1 — "Behold, how good and pleasant it is when God\u2019s people live together in unity!" — KBN envisions a united community of Christian entrepreneurs and professionals.'} />
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 max-w-5xl mx-auto">
            <div className="space-y-3 sm:space-y-4 min-w-0">
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed break-words">
                <strong className="text-[var(--text-primary)]">Kingdom Builders Network (KBN)</strong> is a movement of Christian professionals and entrepreneurs called to build lives, businesses, and institutions that glorify God and serve His people.
              </p>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed break-words">
                Over the past three years, we have connected and mobilized hundreds of Ethiopian Christian entrepreneurs and professionals through impactful networking events, strategic initiatives, and community projects in both the U.S. and Ethiopia.
              </p>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed break-words">
                Through <strong className="text-[var(--text-primary)]">connection, communication, and collaboration</strong>, we strengthen both the spiritual and physical well-being of the Christian community locally and globally.
              </p>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <StatCard value="3+" label="Years of Impact" />
              <StatCard value="100s" label="Members Connected" />
              <StatCard value="2" label="Countries (USA & Ethiopia)" />
              <StatCard value="5+" label="Major Initiatives" />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12 sm:py-16 md:py-24 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <SectionHeading overline="Core Values" title="What We Stand For" subtitle="Our foundation is built on Christian ethics, excellence, and a heart for service." />
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <ValueCard icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" title="Unity in Christ" desc="Building relationships among believers for mutual spiritual and professional growth." />
            <ValueCard icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" title="Integrity" desc="Upholding Christian ethics in all professional and business dealings." />
            <ValueCard icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" title="Service" desc="Using resources, skills, and influence to serve churches, communities, and God's Kingdom." />
            <ValueCard icon="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" title="Excellence" desc="Pursuing excellence in leadership, entrepreneurship, and community transformation." />
          </div>
        </div>
      </section>

      {/* Our Impact */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <SectionHeading overline="Our Impact" title="Achievements" subtitle="Connecting and mobilizing Christian entrepreneurs across the USA and Ethiopia." />
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 justify-center flex-wrap">
              {(Object.keys(ACHIEVEMENT_DATA) as Array<keyof typeof ACHIEVEMENT_DATA>).map(key => (
                <button
                  key={key}
                  onClick={() => setAchieveTab(key)}
                  className={`text-xs sm:text-sm font-medium px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border transition-all flex-shrink-0 ${
                    achieveTab === key
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                      : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--text-primary)]'
                  }`}
                >
                  {ACHIEVEMENT_DATA[key].label}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--accent-dark)] mb-3">{ACHIEVEMENT_DATA[achieveTab].label}</p>
                <AchievementList
                  items={ACHIEVEMENT_DATA[achieveTab].items}
                  amharic={'amharic' in ACHIEVEMENT_DATA[achieveTab] ? (ACHIEVEMENT_DATA[achieveTab] as typeof ACHIEVEMENT_DATA.hawassa).amharic : undefined}
                />
              </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {achieveTab === 'usa' ? (
                <>
                  <img src={usaOneImg} alt="USA Event Photo 1" className="w-full aspect-[4/3] object-cover rounded-2xl border border-[var(--border-light)]" />
                  <img src={usaTwoImg} alt="USA Event Photo 2" className="w-full aspect-[4/3] object-cover rounded-2xl border border-[var(--border-light)]" />
                </>
              ) : achieveTab === 'ethiopia' ? (
                <>
                  <img src={addisOneImg} alt="Addis Ababa Event Photo 1" className="w-full aspect-[4/3] object-cover rounded-2xl border border-[var(--border-light)]" />
                  <img src={addisTwoImg} alt="Addis Ababa Event Photo 2" className="w-full aspect-[4/3] object-cover rounded-2xl border border-[var(--border-light)]" />
                </>
              ) : (
                <>
                  <img src={hawassaOneImg} alt="Hawassa Event Photo 1" className="w-full aspect-[4/3] object-cover rounded-2xl border border-[var(--border-light)]" />
                  <img src={hawassaBuildingImg} alt="Hawassa Building" className="w-full aspect-[4/3] object-cover rounded-2xl border border-[var(--border-light)]" />
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Hubs */}
      <section className="py-12 sm:py-16 md:py-24 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <SectionHeading overline="Strategic Hubs" title="Ethiopia Presence" />
          <div className="grid md:grid-cols-2 gap-5 sm:gap-8 max-w-4xl mx-auto">
            <HubCard
              icon={<svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>}
              title="Addis Ababa"
              highlight="Building a movement in the capital."
            >
              <HubItem>Recent large-scale networking events uniting local Christian entrepreneurs and professionals.</HubItem>
              <HubItem>Strong community engagement and ministry support.</HubItem>
            </HubCard>
            <HubCard
              icon={<svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
              title="Hawassa"
              highlight="Holistic Kingdom development through education."
            >
              <HubItem>Chosen for its <strong className="text-[var(--text-primary)]">85% Christian population</strong> as a strategic hub.</HubItem>
              <HubItem>Held 2 large-scale networking events uniting local Christian entrepreneurs.</HubItem>
              <HubItem><strong className="text-[var(--text-primary)]">Launched and began building a Christian school</strong> from KG to college level.</HubItem>
            </HubCard>
          </div>
        </div>
      </section>

      {/* Strategic Objectives */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <SectionHeading overline="Roadmap 2025–2028" title="Strategic Goals" />
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {[
              { num: '01', title: 'Foster Christian Unity', desc: 'Through consistent networking and fellowship.' },
              { num: '02', title: 'Empower Entrepreneurship', desc: 'Equipping believers with business skills and spiritual grounding.' },
              { num: '03', title: 'Support Local Churches', desc: 'With financial, professional, and physical resources.' },
              { num: '04', title: 'Establish Institutions', desc: 'Schools, community centers, and businesses reflecting Kingdom values.' },
              { num: '05', title: 'Expand Global Impact', desc: 'Replicating our model in other cities and countries.' },
            ].map(obj => (
              <div key={obj.num} className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-6 text-center group min-w-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-[var(--accent)]/20 mb-1.5 sm:mb-2 group-hover:text-[var(--accent)]/40 transition-colors">{obj.num}</div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-1 sm:mb-1.5 text-sm sm:text-base break-words">{obj.title}</h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed break-words">{obj.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monitoring & Funding */}
      <section className="py-12 sm:py-16 md:py-24 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <SectionHeading overline="Operations" title="Monitoring & Funding" />
          <div className="grid md:grid-cols-2 gap-5 sm:gap-8 max-w-4xl mx-auto">
            <div className="card-hover bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-8 min-w-0">
              <h3 className="font-serif text-lg sm:text-xl text-[var(--text-primary)] mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span className="break-words">Monitoring & Evaluation</span>
              </h3>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 font-bold flex-shrink-0">•</span> <span className="break-words">Appoint regional and international coordinators for follow-up and reporting.</span></li>
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 font-bold flex-shrink-0">•</span> <span className="break-words">Create a dashboard to track KPIs: events hosted, members joined, businesses launched, communities supported.</span></li>
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 font-bold flex-shrink-0">•</span> <span className="break-words">Conduct annual reviews and strategic planning sessions with advisors and members.</span></li>
              </ul>
            </div>
            <div className="card-hover bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-8 min-w-0">
              <h3 className="font-serif text-lg sm:text-xl text-[var(--text-primary)] mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="break-words">Funding Strategy</span>
              </h3>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 font-bold flex-shrink-0">•</span> <span className="break-words">Membership contributions and donations.</span></li>
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 font-bold flex-shrink-0">•</span> <span className="break-words">Business sponsorships and Christian investment partners.</span></li>
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 font-bold flex-shrink-0">•</span> <span className="break-words">Grant applications and fundraising events.</span></li>
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 font-bold flex-shrink-0">•</span> <span className="break-words">Revenue from events, training programs, and KBN services.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-12 sm:py-16 md:py-24 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 w-full">
          <SectionHeading overline="Our Founder" title="Mr. Surafel Tilahun Tulu" subtitle="Visionary founder of Kingdom Builders Network — a born-again Christian, minister of God, and pioneering entrepreneur dedicated to uplifting Christian communities through innovation, mentorship, and service." />
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5 sm:gap-8">
            <div className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-8 min-w-0 flex flex-col justify-center">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3 sm:mb-4 text-base sm:text-lg break-words">Spiritual & Entrepreneurial Leadership</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-3 sm:mb-4 leading-relaxed break-words">Born-again Christian and minister of God, faithfully teaching the Word of God. As both a spiritual leader and a forward-thinking entrepreneur, Mr. Surafel has dedicated his life to uplifting Christian communities.</p>
              <p className="text-xs font-semibold text-[var(--accent-dark)] mb-2 sm:mb-3">Pioneering Contributions since 1994 (E.C.):</p>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 flex-shrink-0">✦</span> <span className="break-words">Introduced CD Printing and Duplication Technology to Ethiopia.</span></li>
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 flex-shrink-0">✦</span> <span className="break-words">Developed and installed Full-Body Disinfection Tunnels during public health crises.</span></li>
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 flex-shrink-0">✦</span> <span className="break-words">Created Smart Cafe Counting Machines for Ethiopian cafes.</span></li>
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 flex-shrink-0">✦</span> <span className="break-words">Developed Debbol App (e-commerce platform).</span></li>
                <li className="flex gap-2 min-w-0"><span className="text-[var(--accent-dark)] mt-0.5 flex-shrink-0">✦</span> <span className="break-words">Launched and supported various business and social ventures focused on Christian values.</span></li>
              </ul>
            </div>
            <div className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 sm:p-8 min-w-0">
              <img src={surafelImg} alt="Mr. Surafel Tilahun Tulu" className="w-full object-contain rounded-xl mb-5 sm:mb-6" />
              <h3 className="font-semibold text-[var(--text-primary)] mb-3 sm:mb-4 text-base sm:text-lg break-words">Enterprises & Ventures</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6">
                {['Sura Investment Consultancy', 'Addis Tec Industrial Machinery Equipment', 'Debol Trading LLC (USA)', 'ET-POL Global sp.z.o.o (Poland)'].map(e => (
                  <span key={e} className="text-xs bg-[var(--surface-alt)] border border-[var(--border-light)] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[var(--text-secondary)] break-words max-w-full">{e}</span>
                ))}
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-[var(--text-secondary)] border-t border-[var(--border-light)] pt-3 sm:pt-4">
                <p className="flex items-center gap-2 min-w-0">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent-dark)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="break-all">+251-911963232 | 011790370</span>
                </p>
                <p className="flex items-center gap-2 min-w-0">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent-dark)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span className="break-all">www.ethiochristiannet.com</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conclusion CTA */}
      <section className="py-12 sm:py-16 md:py-20 bg-[var(--brand-dark)] relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #D4A853 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2 className="font-serif text-xl sm:text-2xl md:text-4xl text-white mb-4 sm:mb-6 leading-tight break-words">
            More Than a Ministry —<br />
            <span className="text-[var(--accent)]">A Movement</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#94A3B8] leading-relaxed mb-6 sm:mb-8 break-words">
            Kingdom Builders Network is a movement of Christian professionals and entrepreneurs called to build lives, businesses, and institutions that glorify God and serve His people. By uniting under our shared faith and values, we will transform communities and expand the Kingdom of God both spiritually and economically.
          </p>
          <button onClick={onBack} className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border border-white/15 hover:bg-white/20 transition-colors">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--brand)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <img src={knbLogo} alt="KBN Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover bg-white/10 flex-shrink-0" />
              <span className="font-serif text-base sm:text-lg truncate">Kingdom Builders Network</span>
            </div>
            <p className="text-xs text-[#64748B] text-center flex-shrink-0">&copy; 2025 Kingdom Builders Network. All rights reserved.</p>
          </div>
          <p className="text-xs text-[#64748B] text-center mt-3 sm:mt-4 break-words">Built with faith · Unity · Integrity · Service · Excellence</p>
        </div>
      </footer>
    </div>
  )
}

function HubItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-xs sm:text-sm text-[var(--text-secondary)] min-w-0">
      <span className="text-[var(--accent-dark)] mt-0.5 flex-shrink-0">▸</span>
      <span className="break-words">{children}</span>
    </div>
  )
}
