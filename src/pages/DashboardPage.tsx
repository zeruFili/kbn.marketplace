import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import AdminDashboard from "../components/AdminDashboard"
import CompanyDashboard from "../components/CompanyDashboard"
import UserDashboard from "../components/UserDashboard"

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate("/")
  }

  const role = user?.role?.toLowerCase()

  if (role === "admin") {
    return <AdminDashboard onBack={handleBack} />
  }

  if (role === "company") {
    return <CompanyDashboard onBack={handleBack} />
  }

  return <UserDashboard onBack={handleBack} />
}
