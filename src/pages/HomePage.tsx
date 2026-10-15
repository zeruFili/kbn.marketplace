import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { CompanyCard } from "../components/CompanyProfile"
import {
  fetchCompanies,
  type Company,
} from "../api/companyApi"
import {
  fetchEvents,
  mapEventToUserEventData,
} from "../api/eventsApi"
import {
  fetchBlogs,
  mapBlogToUserArticleData,
} from "../api/blogsApi"
import type { UserEventData, UserArticleData } from "../data/userDataStore"

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

function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-5 h-72 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="h-36 bg-[var(--surface-alt)] rounded-xl" />
            <div className="h-4 bg-[var(--surface-alt)] rounded w-3/4" />
            <div className="h-3 bg-[var(--surface-alt)] rounded w-1/2" />
          </div>
          <div className="h-8 bg-[var(--surface-alt)] rounded-lg w-1/3" />
        </div>
      ))}
    </div>
  )
}

function SectionError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-center max-w-md mx-auto my-6">
      <p className="text-sm text-red-600 dark:text-red-400 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
      >
        Try Again
      </button>
    </div>
  )
}

function SectionEmpty({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="text-center py-12 px-4 bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center mx-auto mb-3 text-xl">
        ✦
      </div>
      <h3 className="font-serif text-lg text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
        >
          {actionLabel} &rarr;
        </button>
      )}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()

  // Dynamic companies state
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [companiesError, setCompaniesError] = useState<string | null>(null)

  // Dynamic events state
  const [events, setEvents] = useState<UserEventData[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)

  // Dynamic blogs state
  const [blogs, setBlogs] = useState<UserArticleData[]>([])
  const [loadingBlogs, setLoadingBlogs] = useState(true)
  const [blogsError, setBlogsError] = useState<string | null>(null)

  const loadCompaniesData = useCallback(async () => {
    setLoadingCompanies(true)
    setCompaniesError(null)
    try {
      const res = await fetchCompanies({ limit: 12, is_active: true })
      setCompanies(res.companies)
    } catch (err: unknown) {
      setCompaniesError(
        err instanceof Error
          ? err.message
          : "Unable to load community members."
      )
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  const loadEventsData = useCallback(async () => {
    setLoadingEvents(true)
    setEventsError(null)
    try {
      const apiEvents = await fetchEvents()
      const mapped = apiEvents.map(mapEventToUserEventData)
      setEvents(mapped)
    } catch (err: unknown) {
      setEventsError(
        err instanceof Error ? err.message : "Unable to load events."
      )
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  const loadBlogsData = useCallback(async () => {
    setLoadingBlogs(true)
    setBlogsError(null)
    try {
      const apiBlogs = await fetchBlogs()
      const mapped = apiBlogs.map(mapBlogToUserArticleData)
      setBlogs(mapped)
    } catch (err: unknown) {
      setBlogsError(
        err instanceof Error ? err.message : "Unable to load articles and blogs."
      )
    } finally {
      setLoadingBlogs(false)
    }
  }, [])

  useEffect(() => {
    loadCompaniesData()
    loadEventsData()
    loadBlogsData()
  }, [loadCompaniesData, loadEventsData, loadBlogsData])

  // Featured or top companies from database
  const featured = companies.filter((c) => c.featured)
  const displayCompanies = featured.length > 0 ? featured.slice(0, 6) : companies.slice(0, 6)
  const displayEvents = events.slice(0, 6)
  const displayBlogs = blogs.slice(0, 3)

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

          {loadingCompanies ? (
            <LoadingSkeleton count={3} />
          ) : companiesError ? (
            <SectionError message={companiesError} onRetry={loadCompaniesData} />
          ) : displayCompanies.length === 0 ? (
            <SectionEmpty
              title="No Members Listed Yet"
              description="Be the first to list your Christian-owned business or organization in our community directory."
              actionLabel="Register Your Business"
              onAction={() => navigate("/companies/new")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-stagger">
              {displayCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onClick={() => navigate(`/companies/${company.id}`)}
                />
              ))}
            </div>
          )}

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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Register Your Business
            </button>
          </div>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="py-16 sm:py-20 md:py-28 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionHeading
            overline="Get Involved"
            title="Upcoming Events"
            subtitle="Grow in faith, build relationships, and sharpen your skills at our upcoming gatherings."
          />

          {loadingEvents ? (
            <LoadingSkeleton count={3} />
          ) : eventsError ? (
            <SectionError message={eventsError} onRetry={loadEventsData} />
          ) : displayEvents.length === 0 ? (
            <SectionEmpty
              title="No Upcoming Events Scheduled"
              description="New networking gatherings, leadership workshops, and prayer breakfasts are announced regularly."
              actionLabel="Browse Events"
              onAction={() => navigate("/events")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayEvents.map((ev, i) => (
                <div
                  key={ev.id || ev.title}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden group cursor-pointer"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={ev.eventImage}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-[var(--surface-raised)]/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--brand)]">
                      {ev.startDate}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mb-2">
                      <span className="font-semibold text-[var(--accent-dark)] uppercase tracking-wide">
                        {ev.eventType}
                      </span>
                      <span>·</span>
                      <span className="truncate">{ev.location}</span>
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2 leading-tight">
                      {ev.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2">
                      {ev.description}
                    </p>
                    <div className="text-xs font-semibold text-[var(--accent-dark)] hover:text-[var(--brand)] transition-colors flex items-center gap-1">
                      View Details &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {displayEvents.length > 0 && (
            <div className="text-center mt-10">
              <button
                onClick={() => navigate("/events")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] border border-[var(--border-default)] bg-[var(--surface)] px-6 py-2.5 rounded-xl hover:border-[var(--brand)] transition-colors cursor-pointer"
              >
                Browse All Events &rarr;
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Latest from KBN Journal / Blogs */}
      <section className="py-16 sm:py-20 md:py-28 bg-[var(--surface)] animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionHeading
            overline="Stories & Insights"
            title="Latest from KBN Journal"
            subtitle="Perspectives on faithful enterprise, purposeful leadership, and local innovation."
          />

          {loadingBlogs ? (
            <LoadingSkeleton count={3} />
          ) : blogsError ? (
            <SectionError message={blogsError} onRetry={loadBlogsData} />
          ) : displayBlogs.length === 0 ? (
            <SectionEmpty
              title="No Articles Published Yet"
              description="Reflections, interviews, and community updates will be published here soon."
              actionLabel="View Journal"
              onAction={() => navigate("/blogs")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
              {displayBlogs.map((blog) => (
                <article
                  key={blog.id}
                  onClick={() => navigate(`/blogs/${blog.id}`)}
                  className="card-hover bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] overflow-hidden cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-full h-44 object-cover"
                    />
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-dark)] mb-2">
                        {blog.topic}
                      </p>
                      <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2 leading-snug">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                        {blog.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs text-[var(--text-tertiary)] border-t border-[var(--border-light)] mt-2">
                    <span>By {blog.author}</span>
                    <span>{blog.publishedDate}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {displayBlogs.length > 0 && (
            <div className="text-center mt-10">
              <button
                onClick={() => navigate("/blogs")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] border border-[var(--brand)] px-6 py-2.5 rounded-xl hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer"
              >
                Read More Stories &rarr;
              </button>
            </div>
          )}
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
                  <button
                    key={link}
                    onClick={() => {
                      if (link === "KBN Journal") navigate("/blogs")
                      else navigate("/events")
                      window.scrollTo(0, 0)
                    }}
                    className="block text-sm text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                  >
                    {link}
                  </button>
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
