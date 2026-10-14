import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { CompanyCard } from "../components/CompanyProfile"
import { getCompanies, subscribe, type Company } from "../data/companyStore"

const knbLogo = `${import.meta.env.BASE_URL}kbn-logo.jpg`

export function SectionHeading({
  overline,
  title,
  subtitle,
  light,
}: {
  overline?: string
  title: string
  subtitle?: string
  light?: boolean
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-14">
      {overline && (
        <span className="inline-block text-xs font-semibold text-[var(--accent-dark)] tracking-widest uppercase mb-3">
          {overline}
        </span>
      )}
      <h2
        className={`font-serif text-2xl sm:text-3xl md:text-4xl mb-4 ${
          light ? "text-white" : "text-[var(--text-primary)]"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`leading-relaxed ${
            light ? "text-[#94A3B8]" : "text-[var(--text-secondary)]"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

const EVENTS = [
  {
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop&auto=format",
    date: "Aug 15, 2025",
    time: "7:30 AM – 9:30 AM",
    location: "Abren Cafe, Addis Ababa",
    title: "Quarterly Networking Breakfast",
    description:
      "Start your morning with fellowship, prayer, and purposeful connections with fellow Christian entrepreneurs over coffee and breakfast at our quarterly gathering.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop&auto=format",
    date: "Sep 20, 2025",
    time: "9:00 AM – 4:00 PM",
    location: "Betesha Retreat Center, Addis Ababa",
    title: "National Ethiopian Christian Business Summit",
    description:
      "A full day of worship, keynote sessions, and workshops designed to equip Christian leaders for greater Kingdom impact across Ethiopia.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&h=400&fit=crop&auto=format",
    date: "Oct 7, 2025",
    time: "6:30 PM – 8:30 PM",
    location: "Addis Ababa, Ethiopia",
    title: "Prayer & Worship Gathering",
    description:
      "An evening of powerful worship and intercessory prayer for our businesses, families, and nation. All are welcome.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600&h=400&fit=crop&auto=format",
    date: "Nov 11, 2025",
    time: "9:00 AM – 12:30 PM",
    location: "Hawassa, SNNPR, Ethiopia",
    title: "Hawassa Regional Networking Event",
    description:
      "Strategic networking event in Hawassa — chosen for its 85% Christian population — uniting local Christian entrepreneurs and professionals.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop&auto=format",
    date: "Dec 5, 2025",
    time: "8:00 AM – 5:00 PM",
    location: "Addis Ababa, Ethiopia",
    title: "Kingdom Builders Leadership Academy Launch",
    description:
      "Launch of our leadership academy equipping believers with business skills and spiritual grounding for Kingdom impact.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&h=400&fit=crop&auto=format",
    date: "Dec 19, 2025",
    time: "6:00 PM – 8:00 PM",
    location: "Abren Cafe, Addis Ababa",
    title: "Year-End Celebration & Prayer",
    description:
      "Wind down the year with fellowship and celebration. Share testimonies of God's faithfulness and look ahead to the new year together.",
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [liveCompanies, setLiveCompanies] = useState<Company[]>(getCompanies())

  useEffect(() => {
    setLiveCompanies(getCompanies())
    const unsub = subscribe(() => setLiveCompanies(getCompanies()))
    return unsub
  }, [])

  const featured = liveCompanies.filter((c) => c.featured)

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <Navbar />

      {/* Featured Members */}
      <section className="py-16 sm:py-20 md:py-28 bg-[var(--surface)] animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionHeading
            overline="Our Community"
            title="Featured Members"
            subtitle="Meet some of the incredible Ethiopian Christian business owners and professionals in our network."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-stagger">
            {featured.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onClick={() => navigate(`/companies/${company.id}`)}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            <button
              onClick={() => navigate("/companies")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] border border-[var(--brand)] px-6 py-3 rounded-xl hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer"
            >
              View All Members
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
            <button
              onClick={() => navigate("/companies/new")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-xl transition-colors shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register Your Business
            </button>
          </div>
        </div>
      </section>

      {/* Events */}
      <section
        id="events"
        className="py-16 sm:py-20 md:py-28 animate-fade-in-up"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionHeading
            overline="Get Involved"
            title="Upcoming Events"
            subtitle="Grow in faith, build relationships, and sharpen your skills at our upcoming gatherings."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {EVENTS.map((ev, i) => (
              <div
                key={ev.title}
                className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={ev.image}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-[var(--surface-raised)]/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--brand)]">
                    {ev.date}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mb-2">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {ev.time}
                    <span className="mx-1">·</span>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {ev.location.split(",")[0]}
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2 leading-tight">
                    {ev.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2">
                    {ev.description}
                  </p>
                  <button
                    onClick={() => navigate("/events")}
                    className="text-xs font-semibold text-[var(--accent-dark)] hover:text-[var(--brand)] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Register Now
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--brand)] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <img
                  src={knbLogo}
                  alt="KBN Logo"
                  className="w-9 h-9 rounded-xl object-cover bg-white/10"
                />
                <span className="font-serif text-xl">
                  Kingdom Builders Network
                </span>
              </div>
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-6 max-w-sm">
                A registered ministry under the Ethiopian Council of Gospel
                Believers Churches and in the United States — connecting
                Christian entrepreneurs and professionals across borders.
              </p>
            </div>
            <div className="mt-8 sm:mt-0">
              <h4 className="font-semibold text-white text-sm mb-4">
                Navigation
              </h4>
              <div className="space-y-2.5">
                {[
                  "About Us",
                  "Community & Membership",
                  "Events",
                  "Contact",
                ].map((link) =>
                  link === "Community & Membership" ? (
                    <button
                      key={link}
                      onClick={() => {
                        navigate("/companies")
                        window.scrollTo(0, 0)
                      }}
                      className="block text-sm text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    >
                      {link}
                    </button>
                  ) : link === "About Us" ? (
                    <button
                      key={link}
                      onClick={() => {
                        navigate("/about")
                        window.scrollTo(0, 0)
                      }}
                      className="block text-sm text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    >
                      {link}
                    </button>
                  ) : link === "Events" ? (
                    <button
                      key={link}
                      onClick={() => {
                        navigate("/events")
                        window.scrollTo(0, 0)
                      }}
                      className="block text-sm text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    >
                      {link}
                    </button>
                  ) : (
                    <a
                      key={link}
                      href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                      className="block text-sm text-[#94A3B8] hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  ),
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">
                Resources
              </h4>
              <div className="space-y-2.5">
                {[
                  "Leadership Academy",
                  "KBN App & Podcast",
                  "Prayer Requests",
                  "KBN Journal",
                  "FAQ",
                ].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-sm text-[#94A3B8] hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Contact</h4>
              <div className="space-y-2.5 text-sm text-[#94A3B8]">
                <p>info@kbn.org</p>
                <p>+251 91 196 3232</p>
                <p>Addis Ababa, Ethiopia</p>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <a
                  href="https://www.tiktok.com/@kbn_ethiopia?is_from_webapp=1&sender_device=pc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/50 hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-all"
                  aria-label="TikTok"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/link/v2?aid=1988&lang=en&scene=bio_url&target=https%3A%2F%2Fwww.facebook.com%2Fshare%2F17VqXsVbz6%2F%3Fmibextid%3DwwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/50 hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-all"
                  aria-label="Facebook"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#64748B]">
              &copy; 2025 Kingdom Builders Network. All rights reserved.
            </p>
            <div className="flex items-center gap-4 sm:gap-6 text-xs text-[#64748B]">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
