import { Navigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.role?.toLowerCase()

  if (role === "admin") {
    return <Navigate to="/admin/companies" replace />
  }

  if (role === "company") {
    return <Navigate to="/dashboard/company" replace />
  }

  return <Navigate to="/dashboard/profile" replace />
}
