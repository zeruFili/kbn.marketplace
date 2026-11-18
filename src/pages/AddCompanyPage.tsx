import { useNavigate, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar"
import CreateBusinessPage from "../components/CreateBusinessPage"
import { type CompanyApiResponse } from "../api/companyApi"

export default function AddCompanyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo =
    (location.state as { from?: string } | null)?.from || "/companies"

  const handleBack = () => {
    navigate(returnTo)
  }

  const handleSuccess = (company: CompanyApiResponse) => {
    if (returnTo === "/dashboard/business") {
      return
    }
    if (company?.id) {
      navigate(`/companies/${company.id}`)
    } else {
      navigate("/companies")
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <Navbar />
      <CreateBusinessPage
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
