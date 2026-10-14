import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  getApplicationById,
  approveApplication,
  rejectApplication,
  adminSubscribe,
  type CompanyApplication,
} from "../../data/adminStore"
import { useAuth } from "../../auth/AuthContext"

export default function AdminApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [app, setApp] = useState<CompanyApplication | undefined>(() =>
    id ? getApplicationById(id) : undefined,
  )

  useEffect(() => {
    if (!id) return
    const refresh = () => {
      setApp(getApplicationById(id))
    }
    refresh()
    return adminSubscribe(refresh)
  }, [id])

  if (!app) {
    return (
      <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8 text-center animate-fade-in">
        <div className="text-3xl mb-3">📄</div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          Application Not Found
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          Could not find an application with ID "{id}".
        </p>
        <button
          onClick={() => navigate("/admin/applications")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
        >
          ← Back to Applications
        </button>
      </div>
    )
  }

  const handleApprove = () => {
    approveApplication(app.id, user?.name ?? "Admin")
  }

  const handleReject = () => {
    rejectApplication(app.id, user?.name ?? "Admin")
  }

  return (
    <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden animate-scale-in">
      <div className="bg-[var(--brand-dark)] px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/applications")}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors cursor-pointer"
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
          Back to applications
        </button>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            app.status === "pending"
              ? "bg-amber-500/20 text-amber-300"
              : app.status === "approved"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
          }`}
        >
          {app.status}
        </span>
      </div>

      <div className="p-4 sm:p-6 md:p-8 grid md:grid-cols-5 gap-6 md:gap-8">
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={app.logo}
              alt=""
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-[var(--border-light)]"
            />
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] truncate">
                {app.companyName}
              </h1>
              <div className="text-xs sm:text-sm text-[var(--text-tertiary)]">
                {app.category} · Submitted{" "}
                {new Date(app.submittedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {app.longDescription}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {app.services.map((s) => (
                <span
                  key={s}
                  className="text-xs text-[var(--text-secondary)] bg-[var(--surface-alt)] px-3 py-1.5 rounded-lg border border-[var(--border-light)]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {app.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-medium text-[var(--brand)] bg-[var(--brand)]/5 px-2.5 py-1 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
              Government License Document
            </h3>
            <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] overflow-hidden">
              <img
                src={app.licenseDoc}
                alt="License document"
                className="w-full object-cover max-h-80"
              />
              <div className="p-3 flex items-center justify-between border-t border-[var(--border-light)]">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[var(--text-tertiary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    Business License
                  </span>
                </div>
                <a
                  href={app.licenseDoc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[var(--brand)] hover:underline"
                >
                  View Full Document
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              Contact Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg
                  className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {app.ownerName}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg
                  className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {app.email}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg
                  className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {app.phone}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg
                  className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {app.address}
              </div>
              {app.website && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <svg
                    className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <a
                    href={app.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--brand)] hover:underline truncate"
                  >
                    {app.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {app.status === "pending" ? (
            <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 space-y-3">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Review Decision
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                Approving will list the company directory publicly and grant company status.
              </p>
              <button
                onClick={handleApprove}
                className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
              >
                ✓ Approve Application
              </button>
              <button
                onClick={handleReject}
                className="w-full border border-red-200 text-red-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors cursor-pointer"
              >
                ✕ Reject Application
              </button>
            </div>
          ) : (
            <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 space-y-2">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Decision History
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Status: <span className="font-semibold capitalize">{app.status}</span>
              </p>
              {app.reviewedBy && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  Reviewed by: {app.reviewedBy}
                </p>
              )}
              {app.reviewedAt && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  On: {new Date(app.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
