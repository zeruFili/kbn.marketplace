import { useState, useMemo, useEffect } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom"
import CompanyProfile, { CompanyCard } from "./components/CompanyProfile"
import LoginPage from "./components/LoginPage"
import SignUpPage from "./components/SignUpPage"
import ProtectedRoute from "./components/ProtectedRoute"
import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import CompaniesPage from "./pages/CompaniesPage"
import CompanyDetailsPage from "./pages/CompanyDetailsPage"
import AddCompanyPage from "./pages/AddCompanyPage"
import EditCompanyPage from "./pages/EditCompanyPage"
import DashboardPage from "./pages/DashboardPage"
import AboutPage from "./pages/AboutPage"
import NotFoundPage from "./pages/NotFoundPage"
import CompanyDashboard from "./components/CompanyDashboard"
import AdminLayout from "./pages/admin/AdminLayout"
import AdminOverview from "./components/admin/AdminOverview"
import AdminApplications from "./components/admin/AdminApplications"
import AdminApplicationDetailsPage from "./pages/admin/AdminApplicationDetailsPage"
import AdminCompanies from "./components/admin/AdminCompanies"
import AdminCompanyDetailsPage from "./pages/admin/AdminCompanyDetailsPage"
import AdminUsers from "./components/admin/AdminUsers"
import AdminUserDetailsPage from "./pages/admin/AdminUserDetailsPage"
import AdminUserEditPage from "./pages/admin/AdminUserEditPage"
import AdminPayments from "./components/admin/AdminPayments"
import AdminCategories from "./components/admin/AdminCategories"
import AdminContent from "./components/admin/AdminContent"
import UserLayout from "./pages/user/UserLayout"
import UserProfilePage from "./pages/user/UserProfilePage"
import UserProfileEditPage from "./pages/user/UserProfileEditPage"
import UserBusinessesPage from "./pages/user/UserBusinessesPage"
import UserPaymentPage from "./pages/user/UserPaymentPage"
import { useAuth } from "./auth/AuthContext"
import { type UserRole } from "./auth/auth"
import { getCompanies, subscribe } from "./data/companyStore"
import { CATEGORIES, type Company, type Category } from "./data/companies"
import {
  getPublicUserDashboardData,
  type UserDashboardData,
  type UserProfileData,
  type UserArticleData,
  type UserEventData,
} from "./data/userDataStore"

type PublicPage = "companies" | "people" | "blogs" | "events" | "articles"
type PublicSelection = { type: "person" item: UserProfileData } | {
  type: "article" | "blog"
  item: UserArticleData
  returnToProfile?: UserProfileData
} | { type: "event" item: UserEventData returnToProfile?: UserProfileData }

const ABEL_DEMO_COMPANY: Company = {
  id: "abel-demo-company",
  name: "Selam Build Collective",
  category: "Construction",
  logo: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=160&h=160&fit=crop&auto=format",
  banner:
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=420&fit=crop&auto=format",
  rating: 4.8,
  reviewCount: 42,
  description:
    "A purpose-led construction studio creating durable homes, schools, and community spaces across Addis Ababa.",
  longDescription:
    "Selam Build Collective helps communities create durable, welcoming spaces through thoughtful construction, transparent planning, and excellent craftsmanship.",
  phone: "+251 911 246 810",
  email: "hello@selambuild.et",
  website: "https://selambuild.et",
  address: "Addis Ababa, Ethiopia",
  services: [
    "Community spaces",
    "Residential construction",
    "Project planning",
  ],
  gallery: [],
  tags: ["Purpose-led", "Construction", "Community"],
  reviews: [],
  featured: false,
  ownerName: "Abel Tesfaye",
  missionStatement: "Build spaces that strengthen families and communities.",
}




function DirectoryPage({
  onBack,
  onSelectCompany,
  title = "All Members",
}: {
  onBack: () => void
  onSelectCompany: (c: Company) => void
  title?: string
}) {
  const [dirCategory, setDirCategory] = useState<Category | null>(null)
  const [dirSearch, setDirSearch] = useState("")
  const [dirSort, setDirSort] = useState<"rating" | "reviews" | "name">(
    "rating",
  )
  const [allCompanies, setAllCompanies] = useState(getCompanies())

  useEffect(() => {
    setAllCompanies(getCompanies())
    const unsub = subscribe(() => setAllCompanies(getCompanies()))
    return unsub
  }, [])

  const dirFiltered = useMemo(() => {
    let result = dirCategory
      ? allCompanies.filter((c) => c.category === dirCategory)
      : allCompanies
    if (dirSearch) {
      const q = dirSearch.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q),
      )
    }
    if (dirSort === "rating") result.sort((a, b) => b.rating - a.rating)
    else if (dirSort === "reviews")
      result.sort((a, b) => b.reviewCount - a.reviewCount)
    else result.sort((a, b) => a.name.localeCompare(b.name))
    return result
  }, [allCompanies, dirCategory, dirSearch, dirSort])

  return (
    <div>
      <div className="bg-[var(--brand-dark)] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/20 transition-all mb-6"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
          <h1 className="font-serif text-3xl md:text-5xl text-white mb-3">
            {title}
          </h1>
          <p className="text-[#94A3B8] text-lg">
            Browse all {allCompanies.length} businesses in our network
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search companies..."
              value={dirSearch}
              onChange={(e) => setDirSearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl p-1">
            {(["rating", "reviews", "name"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setDirSort(opt)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  dirSort === opt
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {opt === "rating"
                  ? "Top Rated"
                  : opt === "reviews"
                    ? "Most Reviews"
                    : "A-Z"}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6 flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          <button
            onClick={() => setDirCategory(null)}
            className={`flex-shrink-0 text-xs font-medium px-4 py-2 rounded-xl border transition-all ${
              !dirCategory
                ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                : "text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--text-primary)]"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setDirCategory(cat)}
              className={`flex-shrink-0 text-xs font-medium px-4 py-2 rounded-xl border transition-all ${
                dirCategory === cat
                  ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                  : "text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--text-primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
          {dirFiltered.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              onClick={() => onSelectCompany(c)}
            />
          ))}
        </div>
        {dirFiltered.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] flex items-center justify-center mx-auto mb-5 text-3xl">
              🔍
            </div>
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              No results found
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-6">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function PublicContentPage({
  page,
  onBack,
  onSelectCompany,
  onSelectContent,
}: {
  page: PublicPage
  onBack: () => void
  onSelectCompany: (company: Company) => void
  onSelectContent: (selection: PublicSelection) => void
}) {
  const memberData = getPublicUserDashboardData()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const title =
    page === "people" ? "People" : page.charAt(0).toUpperCase() + page.slice(1)
  const description =
    page === "people"
      ? "Meet the people building purposeful businesses and communities through the KBN network."
      : `Explore ${page} shared by members of the Kingdom Builders Network.`

  if (page === "companies")
    return (
      <DirectoryPage
        title="Companies"
        onBack={onBack}
        onSelectCompany={onSelectCompany}
      />
    )

  const people = memberData.map((data) => data.profile)
  const articles = memberData.flatMap((data) =>
    page === "articles" ? data.articles : data.blogs,
  )
  const events = memberData.flatMap((data) => data.events)
  const categories =
    page === "people"
      ? [...new Set(people.map((person) => person.professionalTitle))]
      : page === "events"
        ? [...new Set(events.map((event) => event.eventType))]
        : [...new Set(articles.map((article) => article.topic))]
  const query = search.trim().toLowerCase()
  const filteredPeople = people.filter(
    (person) =>
      (!query ||
        `${person.fullName} ${person.professionalTitle} ${person.shortBio} ${person.city}`
          .toLowerCase()
          .includes(query)) &&
      (category === "All" || person.professionalTitle === category),
  )
  const filteredArticles = articles.filter(
    (article) =>
      (!query ||
        `${article.title} ${article.author} ${article.topic} ${article.excerpt}`
          .toLowerCase()
          .includes(query)) &&
      (category === "All" || article.topic === category),
  )
  const filteredEvents = events.filter(
    (event) =>
      (!query ||
        `${event.title} ${event.eventType} ${event.location} ${event.description}`
          .toLowerCase()
          .includes(query)) &&
      (category === "All" || event.eventType === category),
  )
  const resultCount =
    page === "people"
      ? filteredPeople.length
      : page === "events"
        ? filteredEvents.length
        : filteredArticles.length
  const placeholder =
    page === "people"
      ? "Search people by name, title, or city..."
      : page === "events"
        ? "Search events by title, type, or location..."
        : `Search ${page} by title, topic, or author...`

  return (
    <main className="min-h-screen bg-[var(--surface-alt)]">
      <div className="bg-[var(--brand-dark)] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-6"
          >
            <span aria-hidden="true">←</span> Back to Home
          </button>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">
            KBN Community
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-3">
            {title}
          </h1>
          <p className="text-[#94A3B8] text-lg max-w-2xl">{description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={placeholder}
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="md:w-64 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          >
            <option value="All">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          Showing {resultCount} of{" "}
          {page === "people"
            ? people.length
            : page === "events"
              ? events.length
              : articles.length}{" "}
          {page}
        </p>
        {page === "people" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
            {filteredPeople.map((profile) => (
              <div
                key={profile.digitalSlug}
                onClick={() =>
                  onSelectContent({ type: "person", item: profile })
                }
                className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-5">
                  <img
                    src={profile.profilePhoto}
                    alt={profile.fullName}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                  <div>
                    <h2 className="font-serif text-xl text-[var(--text-primary)]">
                      {profile.fullName}
                    </h2>
                    <p className="text-sm text-[var(--accent-dark)]">
                      {profile.professionalTitle}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5 line-clamp-3">
                  {profile.shortBio}
                </p>
                <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                  <span>
                    {profile.city}, {profile.country}
                  </span>
                  <span>{profile.digitalSlug}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {(page === "articles" || page === "blogs") && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
            {filteredArticles.map((item) => (
              <article
                key={item.id}
                onClick={() =>
                  onSelectContent({
                    type: page === "articles" ? "article" : "blog",
                    item,
                  })
                }
                className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden cursor-pointer"
              >
                <img
                  src={item.featuredImage}
                  alt={item.title}
                  className="w-full h-44 object-cover"
                />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-dark)] mb-2">
                    {item.topic}
                  </p>
                  <h2 className="font-serif text-xl text-[var(--text-primary)] mb-3">
                    {item.title}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5 line-clamp-3">
                    {item.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span>{item.publishedDate}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {page === "events" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                onClick={() => onSelectContent({ type: "event", item: event })}
                className="card-hover bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden cursor-pointer"
              >
                <img
                  src={event.eventImage}
                  alt={event.title}
                  className="w-full h-44 object-cover"
                />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-dark)]">
                      {event.eventType}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {event.online ? "Online" : "In person"}
                    </span>
                  </div>
                  <h2 className="font-serif text-xl text-[var(--text-primary)] mb-3">
                    {event.title}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5 line-clamp-3">
                    {event.description}
                  </p>
                  <div className="space-y-1 text-xs text-[var(--text-tertiary)]">
                    <p>{event.startDate}</p>
                    <p>{event.location}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {resultCount === 0 && (
          <div className="text-center py-20 text-[var(--text-tertiary)]">
            No matching {page} found.
          </div>
        )}
      </div>
    </main>
  )
}

function PublicDetailField({ label, value }: { label: string value: string }) {
  if (label === "Publication status" || label === "Audience") return null
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-[0_8px_24px_rgba(15,29,58,0.04)]">
      <div className="absolute left-0 top-0 h-full w-1 bg-[var(--accent)]" />
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mb-2">
        {label}
      </p>
      <p className="text-sm text-[var(--text-primary)] break-words whitespace-pre-wrap leading-relaxed">
        {value || "Not provided"}
      </p>
    </div>
  )
}

function PublicIcon({
  path,
  className = "w-5 h-5",
}: {
  path: string
  className?: string
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
        d={path}
      />
    </svg>
  )
}

function PublicContentDetail({
  selection,
  onBack,
  onSelectCompany,
  onSelectContent,
}: {
  selection: PublicSelection
  onBack: () => void
  onSelectCompany: (company: Company, returnToProfile?: UserProfileData) => void
  onSelectContent: (selection: PublicSelection) => void
}) {
  const collection =
    selection.type === "person"
      ? "People"
      : selection.type === "event"
        ? "Events"
        : selection.type === "article"
          ? "Articles"
          : "Blogs"
  const title =
    selection.type === "person" ? selection.item.fullName : selection.item.title

  return (
    <main className="min-h-screen bg-[var(--surface-alt)]">
      <div className="bg-[var(--brand-dark)] py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-white/75 hover:text-white text-sm font-medium mb-6"
          >
            <span aria-hidden="true">←</span> Back to {collection}
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            Kingdom Builders Network
          </p>
          <h1 className="font-serif text-3xl md:text-5xl text-white max-w-4xl">
            {title}
          </h1>
        </div>
      </div>
      {selection.type === "person" && (
        <PublicPersonDetail
          item={selection.item}
          onSelectCompany={onSelectCompany}
          onSelectContent={onSelectContent}
        />
      )}
      {selection.type === "article" && (
        <PublicPostDetail item={selection.item} kind="Article" />
      )}
      {selection.type === "blog" && (
        <PublicPostDetail item={selection.item} kind="Blog" />
      )}
      {selection.type === "event" && (
        <PublicEventDetail item={selection.item} />
      )}
    </main>
  )
}

function PublicPersonDetailLegacy({ item }: { item: UserProfileData }) {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
      <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
        <aside className="bg-[var(--brand)] rounded-[2rem] p-7 text-white lg:sticky lg:top-24 shadow-xl shadow-[var(--brand)]/10">
          <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-bold uppercase tracking-[0.16em] mb-6">
            <PublicIcon
              path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              className="w-4 h-4"
            />{" "}
            Member profile
          </div>
          <img
            src={item.profilePhoto}
            alt={item.fullName}
            className="w-32 h-32 rounded-2xl object-cover ring-4 ring-white/20 mb-6"
          />
          <p className="text-sm text-[var(--accent)] font-semibold mb-2">
            {item.professionalTitle}
          </p>
          <h2 className="font-serif text-3xl mb-4">{item.fullName}</h2>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <PublicIcon
              path="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
              className="w-4 h-4"
            />
            {item.city}, {item.country}
          </div>
          <div className="mt-7 pt-5 border-t border-white/10 space-y-3">
            <a
              href={`https://${item.website}`}
              className="flex items-center gap-2 text-sm text-white/85 hover:text-[var(--accent)]"
            >
              <PublicIcon
                path="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.21-2.49 3.5-5.53 3.5-9S14.21 5.49 12 3m0 18c-2.21-2.49-3.5-5.53-3.5-9S9.79 5.49 12 3m-9 9h18"
                className="w-4 h-4"
              />
              {item.website}
            </a>
            <p className="flex items-center gap-2 text-sm text-white/70">
              <PublicIcon
                path="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
                className="w-4 h-4"
              />
              {item.socialMedia}
            </p>
          </div>
        </aside>
        <section className="space-y-6">
          <div className="relative overflow-hidden bg-white rounded-[2rem] border border-[var(--border-light)] p-7 md:p-10 shadow-[0_12px_30px_rgba(15,29,58,0.05)]">
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-[var(--accent-light)]" />
            <div className="relative">
              <div className="flex items-center gap-3 text-[var(--accent-dark)] mb-4">
                <PublicIcon path="M8 10h.01M12 10h.01M16 10h.01M9 16h6m5-4a8 8 0 01-8 8H5l-2 2 1-5a8 8 0 1116-5z" />
                <p className="text-xs font-bold uppercase tracking-[0.16em]">
                  A word from {item.fullName.split(" ")[0]}
                </p>
              </div>
              <p className="font-serif text-2xl md:text-3xl text-[var(--text-primary)] leading-relaxed">
                {item.shortBio}
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <PublicDetailField
              label="Professional experience"
              value={item.professionalExperience}
            />
            <PublicDetailField label="Education" value={item.education} />
            <PublicDetailField label="Phone number" value={item.phone} />
            <PublicDetailField label="Digital slug" value={item.digitalSlug} />
          </div>
          <div className="bg-white rounded-[2rem] border border-[var(--border-light)] p-7 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--accent-light)] text-[var(--accent-dark)]">
                <PublicIcon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-dark)]">
                  Milestones
                </p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  A few highlights from the journey
                </p>
              </div>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3">
              {item.achievements.map((achievement) => (
                <li
                  key={achievement}
                  className="flex gap-3 items-start rounded-xl bg-[var(--surface-alt)] p-4 text-sm text-[var(--text-secondary)]"
                >
                  <span className="text-[var(--accent-dark)] mt-0.5">✦</span>
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

function PublicPersonDetail({
  item,
  onSelectCompany,
  onSelectContent,
}: {
  item: UserProfileData
  onSelectCompany: (company: Company, returnToProfile?: UserProfileData) => void
  onSelectContent: (selection: PublicSelection) => void
}) {
  const [activeTab, setActiveTab] =
    useState<"profile" | "blogs" | "articles" | "events" | "companies">(
      "profile",
    )
  const member = getPublicUserDashboardData().find(
    (data) => data.profile.digitalSlug === item.digitalSlug,
  )
  const tabs = ["profile", "blogs", "articles", "events", "companies"] as const
  const content =
    activeTab === "blogs"
      ? (member?.blogs ?? [])
      : activeTab === "articles"
        ? (member?.articles ?? [])
        : activeTab === "events"
          ? (member?.events ?? [])
          : []
  const isAbel = item.digitalSlug === "abel-tesfaye"

  function emptyState(label: string) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--border-light)] p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 grid place-items-center w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-dark)]">
          <PublicIcon path="M12 6v12m6-6H6" />
        </div>
        <h3 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          No content available
        </h3>
        <p className="text-sm text-[var(--text-tertiary)]">
          No {label} are currently available for this member.
        </p>
      </div>
    )
  }

  function renderTab() {
    if (activeTab === "profile") return <PublicPersonDetailLegacy item={item} />
    if (activeTab === "companies")
      return isAbel ? (
        <CompanyCard
          company={ABEL_DEMO_COMPANY}
          onClick={() => onSelectCompany(ABEL_DEMO_COMPANY, item)}
        />
      ) : (
        emptyState("companies")
      )
    if (!content.length) return emptyState(activeTab)
    if (activeTab === "articles" || activeTab === "blogs")
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {content.map((post) => (
            <article
              key={post.id}
              onClick={() =>
                onSelectContent({
                  type: activeTab === "articles" ? "article" : "blog",
                  item: post,
                  returnToProfile: item,
                })
              }
              className="card-hover bg-white rounded-2xl overflow-hidden cursor-pointer"
            >
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-44 object-cover"
              />
              <div className="p-5">
                <p className="text-xs uppercase tracking-wide text-[var(--accent-dark)] mb-2">
                  {post.topic}
                </p>
                <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                  {post.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>
      )
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {content.map((event) => (
          <article
            key={event.id}
            onClick={() =>
              onSelectContent({
                type: "event",
                item: event,
                returnToProfile: item,
              })
            }
            className="card-hover bg-white rounded-2xl overflow-hidden cursor-pointer"
          >
            <img
              src={event.eventImage}
              alt={event.title}
              className="w-full h-44 object-cover"
            />
            <div className="p-5">
              <p className="text-xs uppercase tracking-wide text-[var(--accent-dark)] mb-2">
                {event.eventType}
              </p>
              <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
                {event.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                {event.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
      <div className="flex flex-wrap gap-2 bg-white rounded-2xl border border-[var(--border-light)] p-2 mb-6 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[92px] px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-alt)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  )
}

function PublicPostDetail({
  item,
  kind,
}: {
  item: UserArticleData
  kind: "Article" | "Blog"
}) {
  const isBlog = kind === "Blog"
  return (
    <div
      className={`max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16 ${
        isBlog ? "bg-[#fbfaf7]" : ""
      }`}
    >
      <article
        className={`overflow-hidden ${
          isBlog
            ? "bg-white rounded-[2rem] border border-[#e8e1d5] shadow-[0_18px_50px_rgba(90,67,40,0.08)]"
            : "bg-white rounded-xl border border-[var(--border-light)] shadow-[0_18px_45px_rgba(15,29,58,0.07)]"
        }`}
      >
        <div className="relative">
          <img
            src={item.featuredImage}
            alt={item.title}
            className={`w-full object-cover ${
              isBlog ? "h-64 md:h-[25rem]" : "h-64 md:h-[28rem]"
            }`}
          />
          <div
            className={`absolute inset-0 ${
              isBlog
                ? "bg-gradient-to-t from-[#2c241d]/65 via-transparent to-transparent"
                : "bg-gradient-to-t from-[var(--brand-dark)]/75 via-transparent to-transparent"
            }`}
          />
          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <span
              className={`text-xs font-bold uppercase tracking-[0.18em] px-3 py-2 rounded-full ${
                isBlog
                  ? "bg-[#f4ead7] text-[#6d5137]"
                  : "bg-white/95 text-[var(--brand)]"
              }`}
            >
              {kind}
            </span>
            <span className="text-xs font-medium text-white/85">
              {item.topic}
            </span>
          </div>
        </div>
        <div className={`${isBlog ? "p-7 md:p-12" : "p-7 md:p-12 md:pt-14"}`}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 text-[var(--accent-dark)] mb-5">
              <PublicIcon
                path={
                  isBlog
                    ? "M4 4h16v16H4zM8 8h8M8 12h6M8 16h4"
                    : "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
                }
              />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">
                {isBlog ? "A community journal" : "KBN editorial"}
              </p>
            </div>
            <h2
              className={`font-serif leading-tight text-[var(--text-primary)] mb-6 ${
                isBlog ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"
              }`}
            >
              {item.title}
            </h2>
            <div
              className={`flex flex-wrap items-center gap-x-5 gap-y-3 text-sm border-b pb-7 mb-8 ${
                isBlog
                  ? "border-[#e8e1d5] text-[#806d5c]"
                  : "border-[var(--border-light)] text-[var(--text-tertiary)]"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <PublicIcon
                  path="M15 19a4 4 0 00-8 0m4-8a3 3 0 110-6 3 3 0 010 6zm6 8a3 3 0 00-3-3"
                  className="w-4 h-4"
                />
                By {item.author}
              </span>
              <span className="inline-flex items-center gap-2">
                <PublicIcon
                  path="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
                  className="w-4 h-4"
                />
                {item.publishedDate}
              </span>
              <span className="inline-flex items-center gap-2">
                <PublicIcon
                  path="M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 01-.1 1l2 1.5-2 3.4-2.3-.9a7.5 7.5 0 01-1.7 1l-.3 2.4h-4l-.3-2.4a7.5 7.5 0 01-1.7-1l-2.3.9-2-3.4L4.8 13a7.4 7.4 0 010-2L2.7 9.5l2-3.4 2.3.9a7.5 7.5 0 011.7-1L9 3.6h4l.3 2.4a7.5 7.5 0 011.7 1l2.3-.9 2 3.4-2 1.5c.1.3.1.7.1 1z"
                  className="w-4 h-4"
                />
                {item.visibility}
              </span>
            </div>
            <div
              className={`${
                isBlog
                  ? "bg-[#f8f3ea] border-l-4 border-[#d7b27a] px-6 py-5"
                  : "border-l-4 border-[var(--accent)] bg-[var(--surface-alt)] px-6 py-5"
              }`}
            >
              <p
                className={`text-xl leading-relaxed ${
                  isBlog
                    ? "font-serif italic text-[#5f4c3c]"
                    : "text-[var(--text-primary)] font-medium"
                }`}
              >
                {item.excerpt}
              </p>
            </div>
            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              <PublicDetailField
                label="Publication status"
                value={item.status}
              />
              <PublicDetailField label="Audience" value={item.visibility} />
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

function PublicEventDetail({ item }: { item: UserEventData }) {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
      <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-8 items-start">
        <article className="bg-[var(--surface)] rounded-3xl border border-[var(--border-light)] overflow-hidden">
          <img
            src={item.eventImage}
            alt={item.title}
            className="w-full h-64 md:h-96 object-cover"
          />
          <div className="p-7 md:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-dark)]">
                {item.eventType}
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--surface-alt)] text-[var(--text-secondary)]">
                {item.online ? "Online event" : "In-person event"}
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-[var(--text-primary)] mb-6">
              {item.title}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {item.description}
            </p>
          </div>
        </article>
        <aside className="bg-[var(--brand)] rounded-3xl p-7 md:p-8 text-white lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-5">
            Event details
          </p>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-white/55 uppercase tracking-wide mb-1">
                Starts
              </p>
              <p className="text-sm font-medium">{item.startDate}</p>
            </div>
            <div>
              <p className="text-xs text-white/55 uppercase tracking-wide mb-1">
                Ends
              </p>
              <p className="text-sm font-medium">{item.endDate}</p>
            </div>
            <div>
              <p className="text-xs text-white/55 uppercase tracking-wide mb-1">
                Location
              </p>
              <p className="text-sm font-medium">{item.location}</p>
            </div>
            <div>
              <p className="text-xs text-white/55 uppercase tracking-wide mb-1">
                Status
              </p>
              <p className="text-sm font-medium">{item.status}</p>
            </div>
            <a
              href={`https://${item.eventUrl}`}
              className="inline-flex w-full justify-center bg-[var(--accent)] text-[var(--brand-dark)] font-semibold text-sm px-4 py-3 rounded-xl hover:brightness-105"
            >
              View event link
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}

function CompanyDashboardWrapper() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <Navbar />
      <CompanyDashboard onBack={() => navigate("/")} />
    </div>
  )
}

function PublicPageWrapper({ page }: { page: PublicPage }) {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const memberData = getPublicUserDashboardData()

  const resolvedSelection = useMemo<PublicSelection | null>(() => {
    if (!id) return null
    if (page === "people") {
      const found = memberData
        .map((d) => d.profile)
        .find(
          (p) =>
            p.digitalSlug === id ||
            p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-") === id,
        )
      return found ? { type: "person", item: found } : null
    }
    if (page === "events") {
      const events = memberData.flatMap((d) => d.events)
      const found = events.find(
        (e) =>
          e.id === id ||
          e.eventUrl.toLowerCase().replace(/[^a-z0-9]+/g, "-").includes(id) ||
          e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === id,
      )
      return found ? { type: "event", item: found } : null
    }
    if (page === "articles" || page === "blogs") {
      const articles = memberData.flatMap((d) =>
        page === "articles" ? d.articles : d.blogs,
      )
      const found = articles.find(
        (a) =>
          a.id === id ||
          a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === id,
      )
      return found
        ? { type: page === "articles" ? "article" : "blog", item: found }
        : null
    }
    return null
  }, [id, page, memberData])

  const handleSelectContent = (selection: PublicSelection) => {
    const targetId =
      selection.type === "person"
        ? selection.item.digitalSlug ||
          selection.item.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : selection.item.id
    navigate(`/${page}/${targetId}`)
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <Navbar
        onPublicPage={(p) => {
          navigate(`/${p}`)
        }}
        onHome={() => {
          navigate("/")
        }}
      />
      {resolvedSelection ? (
        <PublicContentDetail
          selection={resolvedSelection}
          onBack={() => {
            navigate(`/${page}`)
          }}
          onSelectCompany={(company) => {
            navigate(`/companies/${company.id}`)
          }}
          onSelectContent={handleSelectContent}
        />
      ) : (
        <PublicContentPage
          page={page}
          onBack={() => navigate("/")}
          onSelectCompany={(company) => {
            navigate(`/companies/${company.id}`)
          }}
          onSelectContent={handleSelectContent}
        />
      )}
    </div>
  )
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* Public Landing & Marketing */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Companies Directory & Management */}
        <Route path="/companies" element={<CompaniesPage />} />
        <Route
          path="/companies/new"
          element={
            <ProtectedRoute>
              <AddCompanyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies/add"
          element={
            <ProtectedRoute>
              <AddCompanyPage />
            </ProtectedRoute>
          }
        />
        <Route path="/companies/:id" element={<CompanyDetailsPage />} />
        <Route
          path="/companies/:id/edit"
          element={
            <ProtectedRoute>
              <EditCompanyPage />
            </ProtectedRoute>
          }
        />

        {/* Public Sections with Deep-Linking */}
        <Route path="/people" element={<PublicPageWrapper page="people" />} />
        <Route
          path="/people/:id"
          element={<PublicPageWrapper page="people" />}
        />
        <Route path="/blogs" element={<PublicPageWrapper page="blogs" />} />
        <Route path="/blogs/:id" element={<PublicPageWrapper page="blogs" />} />
        <Route path="/events" element={<PublicPageWrapper page="events" />} />
        <Route
          path="/events/:id"
          element={<PublicPageWrapper page="events" />}
        />
        <Route
          path="/articles"
          element={<PublicPageWrapper page="articles" />}
        />
        <Route
          path="/articles/:id"
          element={<PublicPageWrapper page="articles" />}
        />

        {/* Main Dashboard Dispatcher */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Company Dashboard */}
        <Route
          path="/dashboard/company"
          element={
            <ProtectedRoute allowedRoles={["company", "admin"]}>
              <CompanyDashboardWrapper />
            </ProtectedRoute>
          }
        />

        {/* Member / User Dashboard with Persistent Sidebar */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="profile/edit" element={<UserProfileEditPage />} />
          <Route path="business" element={<UserBusinessesPage />} />
          <Route path="business/:companyId" element={<UserBusinessesPage />} />
          <Route path="businesses" element={<UserBusinessesPage />} />
          <Route path="businesses/:companyId" element={<UserBusinessesPage />} />
          <Route path="payment" element={<UserPaymentPage />} />
          <Route path="billing" element={<UserPaymentPage />} />
        </Route>

        {/* User profile aliases */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard/profile" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard/profile/edit" replace />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard with Persistent Sidebar */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route
            path="applications/:id"
            element={<AdminApplicationDetailsPage />}
          />
          <Route path="companies" element={<AdminCompanies />} />
          <Route
            path="companies/:id"
            element={<AdminCompanyDetailsPage />}
          />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetailsPage />} />
          <Route path="users/:id/edit" element={<AdminUserEditPage />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="events" element={<AdminContent kind="events" />} />
          <Route path="articles" element={<AdminContent kind="articles" />} />
          <Route path="blogs" element={<AdminContent kind="blogs" />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

