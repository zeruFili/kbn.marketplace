import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--surface-alt)]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-24 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-3xl bg-[var(--surface)] border border-[var(--border-light)] flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm">
          🧭
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-dark)] mb-2 inline-block">
          404 Error
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] mb-4">
          Page Not Found
        </h1>
        <p className="text-base text-[var(--text-tertiary)] max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-[var(--brand)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => navigate("/companies")}
            className="px-6 py-3 bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-semibold rounded-xl hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
          >
            Browse Companies
          </button>
        </div>
      </div>
    </div>
  )
}
