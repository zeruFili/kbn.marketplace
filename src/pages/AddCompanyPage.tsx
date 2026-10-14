import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import CreateBusinessPage from "../components/CreateBusinessPage"
import { type CompanyApiResponse } from "../api/companyApi"

export default function AddCompanyPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate("/companies")
  }

  const handleSuccess = (company: CompanyApiResponse) => {
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
