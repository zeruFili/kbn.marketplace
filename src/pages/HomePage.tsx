import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { CompanyCard } from "../components/CompanyProfile"
import {
  fetchCompanies,
  type Company,
} from "../api/companyApi"
import {
  fetchUsersApi,
  mapUserToProfileData,
} from "../api/userApi"
import UserAvatar from "../components/common/UserAvatar"
import MembershipBadge from "../components/common/MembershipBadge"
import type { UserProfileData } from "../data/userDataStore"

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

function truncateToWords(
  text: string | string[] | undefined | null,
  count = 5,
): string {
  if (!text) return ""
  const str = Array.isArray(text) ? text.join(" ") : String(text)
  const trimmed = str.trim()
  if (!trimmed) return ""
  const words = trimmed.split(/\s+/)
  if (words.length <= count) return words.join(" ")
  return words.slice(0, count).join(" ") + "..."
}

export default function HomePage() {
  const navigate = useNavigate()

  // Dynamic people / members state
  const [people, setPeople] = useState<UserProfileData[]>([])
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [peopleError, setPeopleError] = useState<string | null>(null)

  // Dynamic companies state
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [companiesError, setCompaniesError] = useState<string | null>(null)

  const loadPeopleData = useCallback(async () => {
    setLoadingPeople(true)
    setPeopleError(null)
    try {
      const apiUsers = await fetchUsersApi({ limit: 12 })
      setPeople((apiUsers || []).map(mapUserToProfileData))
    } catch (err: unknown) {
      setPeopleError(
        err instanceof Error ? err.message : "Unable to load community members."
      )
    } finally {
      setLoadingPeople(false)
    }
  }, [])

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
          : "Unable to load companies."
      )
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  useEffect(() => {
    loadPeopleData()
    loadCompaniesData()
  }, [loadPeopleData, loadCompaniesData])

  // Featured members (people) and companies from database (strictly maximum 6 each)
  const displayPeople = people.slice(0, 6)
  const featuredCompanies = companies.filter((c) => c.featured)
  const nonFeaturedCompanies = companies.filter((c) => !c.featured)
  const displayCompanies = [...featuredCompanies, ...nonFeaturedCompanies].slice(0, 6)

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <Navbar showRegisterButton={false} />

      {/* Love Gift Call-To-Action Banner */}
      <section className="bg-gradient-to-r from-[var(--brand-dark)] via-[#162746] to-[var(--brand)] text-white py-8 md:py-12 border-b border-white/10 shadow-sm animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">
                <span>❤️</span> Kingdom Voluntary Giving
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-bold leading-tight">
                Support Our Mission with a Love Gift
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Send a voluntary Love Gift to empower Ethiopian Christian businesses, mentorship programs, and kingdom initiatives. No membership package required.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate("/love-gift")}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-bold text-[var(--brand-dark)] bg-gradient-to-r from-[var(--accent)] to-amber-300 hover:brightness-105 shadow-lg shadow-[var(--accent)]/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>❤️</span>
                <span>Send a Love Gift</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Members */}
      <section className="py-8 sm:py-10 md:py-14 bg-[var(--surface)] animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionHeading
            overline="Our Community"
            title="Featured Members"
            subtitle="Meet some of the incredible Ethiopian Christian business owners and professionals in our network."
          />

          {loadingPeople ? (
            <LoadingSkeleton count={3} />
          ) : peopleError ? (
            <SectionError message={peopleError} onRetry={loadPeopleData} />
          ) : displayPeople.length === 0 ? (
            <SectionEmpty
              title="No Members Listed Yet"
              description="Be the first to list your profile or connect with professionals across our community."
              actionLabel="Browse People"
              onAction={() => navigate("/people")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-stagger">
              {displayPeople.map((person, idx) => {
                const experience = truncateToWords(
                  person.professionalExperience,
                  5
                )
                const achievements = truncateToWords(
                  person.achievements,
                  5
                )

                return (
                  <div
                    key={person.id || person.digitalSlug || idx}
                    onClick={() => {
                      const targetId =
                        person.id ||
                        person.digitalSlug ||
                        person.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                      navigate(`/people/${targetId}`)
                    }}
                    className="card-hover bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-6 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3.5 mb-4">
                        <UserAvatar
                          src={person.profilePhoto}
                          name={person.fullName}
                          size="lg"
                          allowEnlarge={true}
                          className="w-14 h-14 rounded-2xl shrink-0 mt-0.5 shadow-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-lg font-bold text-[var(--text-primary)] truncate">
                            {person.fullName}
                          </h3>
                          {person.membershipCategory && (
                            <div className="mt-1 mb-1.5">
                              <MembershipBadge
                                category={person.membershipCategory}
                                size="xs"
                              />
                            </div>
                          )}
                          {person.professionalTitle && (
                            <p className="text-xs text-[var(--text-secondary)] truncate">
                              {person.professionalTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {experience && (
                        <p className="text-sm font-medium text-[var(--accent-dark)] mb-2 leading-relaxed">
                          {experience}
                        </p>
                      )}
                      {achievements && (
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                          {achievements}
                        </p>
                      )}
                      {!experience && !achievements && person.shortBio && (
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3 mb-4">
                          {person.shortBio}
                        </p>
                      )}
                    </div>

                    {(person.city || person.country) && (
                      <div className="flex items-center text-xs text-[var(--text-tertiary)] pt-3 border-t border-[var(--border-light)]/60 mt-auto">
                        <span className="truncate">
                          {[person.city, person.country].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            <button
              onClick={() => navigate("/people")}
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
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section id="companies" className="py-8 sm:py-10 md:py-14 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionHeading
            overline="Get Involved"
            title="Featured Businesses"
            subtitle="Grow in faith, build relationships, and discover purpose-driven enterprises in our network."
          />

          {loadingCompanies ? (
            <LoadingSkeleton count={3} />
          ) : companiesError ? (
            <SectionError message={companiesError} onRetry={loadCompaniesData} />
          ) : displayCompanies.length === 0 ? (
            <SectionEmpty
              title="No Businesses Listed Yet"
              description="Be the first to list your Christian-owned business or organization in our community directory."
              actionLabel="Browse Companies"
              onAction={() => navigate("/companies")}
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

          {displayCompanies.length > 0 && (
            <div className="text-center mt-10">
              <button
                onClick={() => navigate("/companies")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] border border-[var(--border-default)] bg-[var(--surface)] px-6 py-2.5 rounded-xl hover:border-[var(--brand)] transition-colors cursor-pointer"
              >
                Browse All Businesses &rarr;
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--brand)] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            <div className="sm:col-span-2 lg:col-span-2 pr-4 sm:pr-8 lg:pr-12">
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
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-6 max-w-md">
                A registered ministry under the Ethiopian Council of Gospel
                Believers Churches and in the United States — connecting
                Christian entrepreneurs and professionals across borders.
              </p>
            </div>
            <div className="sm:col-span-1 lg:col-span-1 pr-4 sm:pr-6 lg:pr-8">
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
            <div className="sm:col-span-1 lg:col-span-1 pr-4 sm:pr-6">
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
