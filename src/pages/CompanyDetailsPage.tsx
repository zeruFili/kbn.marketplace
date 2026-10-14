import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import CompanyProfile from "../components/CompanyProfile"
import {
  getCompanyById,
  upsertCompany,
  subscribe,
  type Company,
} from "../data/companyStore"
import {
  fetchCompanyById,
  mapApiResponseToCompany,
} from "../data/companyApi"

export default function CompanyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | undefined>(() =>
    id ? getCompanyById(id) : undefined,
  )
  const [loading, setLoading] = useState<boolean>(!company && !!id)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    const local = getCompanyById(id)
    if (local) {
      setCompany(local)
      setLoading(false)
    } else {
      setLoading(true)
      fetchCompanyById(id)
        .then((apiComp) => {
          if (cancelled) return
          if (apiComp) {
            const mapped = mapApiResponseToCompany(apiComp)
            upsertCompany(mapped)
            setCompany(mapped)
          } else {
            setCompany(undefined)
          }
        })
        .catch((err) => {
          console.warn("Error fetching company details:", err)
          if (!cancelled) setCompany(undefined)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    const unsub = subscribe(() => {
      const fresh = getCompanyById(id)
      if (fresh) setCompany(fresh)
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [id])

  if (loading && !company) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center animate-fade-in flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-tertiary)]">Loading company profile...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] flex items-center justify-center mx-auto mb-6 text-3xl">
            🏢
          </div>
          <h1 className="font-serif text-3xl text-[var(--text-primary)] mb-3">
            Company Not Found
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-8 max-w-md mx-auto">
            We couldn't find a business with the ID "{id}". It may have been removed or the link is incorrect.
          </p>
          <button
            onClick={() => navigate("/companies")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-6 py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
          >
            ← Back to All Companies
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <Navbar />
      <CompanyProfile
        company={company}
        onBack={() => navigate("/companies")}
      />
    </div>
  )
}
