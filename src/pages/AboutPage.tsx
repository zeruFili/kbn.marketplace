import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import AboutUsPage from "../components/AboutUsPage"

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <Navbar />
      <AboutUsPage onBack={() => navigate("/")} />
    </div>
  )
}
