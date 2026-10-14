import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import {
  fetchMyCompanies,
  resolveFileUrl,
  type CompanyApiResponse,
} from "../../data/companyApi"
import {
  getUserDashboardData,
  userSubscribe,
  type UserBusinessData,
} from "../../data/userDataStore"

function mapCompanyToBusiness(
  company: CompanyApiResponse,
  fallbackUser?: { name: string; email: string },
): UserBusinessData {
  const rawLogo = resolveFileUrl(company.company_logo)
  const logo =
    rawLogo ||
    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop&auto=format"
  const rawCover = resolveFileUrl(company.cover_image)
  const cover =
    rawCover ||
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=420&fit=crop&auto=format"

  const addressParts = (company.physical_address || "").split(",")
  const city = addressParts[0]?.trim() || "Addis Ababa"
  const country =
    addressParts.length > 1
      ? addressParts.slice(1).join(", ").trim()
      : "Ethiopia"

  let statusText: "Published" | "Pending review" = "Pending review"
  if (company.verification_status === "verified") {
    statusText = "Published"
  } else if (company.verification_status === "pending") {
    statusText = "Pending review"
  }

  return {
    id: company.id,
    companyLogo: logo,
    coverImage: cover,
    companyName: company.company_name,
    industry: company.business_category?.name || "Business",
    description: company.description || "",
    founderLeadership:
      company.owner_primary_contact || fallbackUser?.name || "Founder",
    city,
    country,
    website: company.website || "",
    phone: company.phone_number || "",
    email: company.email || fallbackUser?.email || "",
    status: statusText,
  }
}

export default function UserBusinessesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [backendBusinesses, setBackendBusinesses] = useState<UserBusinessData[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const apiCompanies = await fetchMyCompanies()
      const mapped = apiCompanies.map((c) =>
        mapCompanyToBusiness(c, user ?? undefined),
      )
      setBackendBusinesses(mapped)
    } catch (err) {
      console.warn("Failed to fetch businesses from API:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
    return userSubscribe(() => void reload())
  }, [reload])

  const dashboardData = getUserDashboardData(user?.email || "", user ?? undefined)

  const allBusinesses = useMemo(() => {
    const backendIds = new Set(backendBusinesses.map((b) => b.id))
    const uniqueLocals = dashboardData.businesses.filter(
      (b) => !backendIds.has(b.id),
    )
    return [...backendBusinesses, ...uniqueLocals]
  }, [backendBusinesses, dashboardData.businesses])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border-light)]">
        <div>
          <h2 className="font-serif text-2xl text-[var(--text-primary)]">
            My Businesses
          </h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Manage your registered businesses and listings in the KBN marketplace.
          </p>
        </div>
        <button
          onClick={() => navigate("/companies/new")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer"
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
          Register Business
        </button>
      </div>

      {loading && allBusinesses.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <svg
            className="w-8 h-8 animate-spin text-[var(--brand)] mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-[var(--text-tertiary)]">
            Loading your businesses...
          </p>
        </div>
      ) : allBusinesses.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8">
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
            No businesses registered yet
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto mb-6">
            Register your company or ministry in the Kingdom Builders Network directory to connect with believers and expand your Kingdom impact.
          </p>
          <button
            onClick={() => navigate("/companies/new")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer"
          >
            + Register Your First Business
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-stagger">
          {allBusinesses.map((biz) => (
            <div
              key={biz.id}
              className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden card-hover flex flex-col"
            >
              <div className="relative h-36 bg-slate-800">
                <img
                  src={biz.coverImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm ${
                      biz.status === "Published"
                        ? "bg-emerald-500/90 text-white"
                        : "bg-amber-500/90 text-white"
                    }`}
                  >
                    {biz.status}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3 -mt-10 mb-3">
                    <img
                      src={biz.companyLogo}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover ring-4 ring-[var(--surface)] bg-white flex-shrink-0 shadow-md"
                    />
                    <div className="min-w-0 pt-7">
                      <h3 className="font-serif text-lg font-bold text-[var(--text-primary)] truncate">
                        {biz.companyName}
                      </h3>
                      <p className="text-xs text-[var(--accent-dark)] font-medium">
                        {biz.industry}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                    {biz.description}
                  </p>

                  <div className="space-y-1 text-xs text-[var(--text-tertiary)] mb-4">
                    <p>📍 {biz.city}, {biz.country}</p>
                    {biz.founderLeadership && <p>👤 {biz.founderLeadership}</p>}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-light)] flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/companies/${biz.id}`)}
                    className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                  >
                    View Details →
                  </button>
                  <button
                    onClick={() => navigate(`/companies/${biz.id}/edit`)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface-alt)] hover:bg-[var(--border-light)] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
