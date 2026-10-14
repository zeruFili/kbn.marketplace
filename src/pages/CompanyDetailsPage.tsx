import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import CompanyProfile from "../components/CompanyProfile"
import { getCompanyById, subscribe, type Company } from "../data/companyStore"

export default function CompanyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | undefined>(() =>
    id ? getCompanyById(id) : undefined,
  )

  useEffect(() => {
    if (!id) return
    setCompany(getCompanyById(id))
    const unsub = subscribe(() => {
      setCompany(getCompanyById(id))
    })
    return unsub
  }, [id])

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
