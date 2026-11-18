import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  fetchAdminCompanyById,
  updateCompanyStatusApi,
  updateCompanyVerificationStatusApi,
  resolveFileUrl,
  type CompanyApiResponse,
  type CompanyVerificationStatusValue,
} from "../../api/companyApi"
import {
  fetchAdminUserById,
  type UserProfileResponse,
} from "../../api/userApi"

function isBusinessActive(company: CompanyApiResponse): boolean {
  const normalizedStatus = (company.status || "").toLowerCase()
  return (
    company.is_active === true &&
    normalizedStatus !== "inactive" &&
    normalizedStatus !== "suspended"
  )
}

function getStatusBadgeMeta(company: CompanyApiResponse): {
  label: string
  headerClass: string
  pillClass: string
  dotClass: string
} {
  const active = isBusinessActive(company)
  const raw = (company.status || (company.is_active ? "active" : "inactive")).toLowerCase()

  if (active) {
    return {
      label: "Active",
      headerClass: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30",
      pillClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      dotClass: "bg-emerald-500",
    }
  }
  if (raw === "suspended") {
    return {
      label: "Suspended",
      headerClass: "bg-orange-500/20 text-orange-300 border border-orange-400/30",
      pillClass:
        "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      dotClass: "bg-orange-500",
    }
  }
  if (raw === "pending") {
    return {
      label: "Pending",
      headerClass: "bg-amber-500/20 text-amber-300 border border-amber-400/30",
      pillClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      dotClass: "bg-amber-500",
    }
  }
  return {
    label: "Inactive",
    headerClass: "bg-red-500/20 text-red-300 border border-red-400/30",
    pillClass: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    dotClass: "bg-red-500",
  }
}

function isImagePath(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url)
}

export default function AdminCompanyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [company, setCompany] = useState<CompanyApiResponse | null>(null)
  const [ownerUser, setOwnerUser] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Action modal & states
  const [confirmNextActive, setConfirmNextActive] = useState<boolean | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [verificationUpdating, setVerificationUpdating] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const loadCompany = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminCompanyById(id)
      if (data) {
        setCompany(data)
      } else {
        setCompany(null)
        setError(`Could not find a registered business with ID "${id}".`)
      }
    } catch (err: unknown) {
      setCompany(null)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load business profile from server."
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadCompany()
  }, [loadCompany])

  // Load registered account owner if created_by is set
  useEffect(() => {
    let active = true
    if (!company?.created_by) {
      setOwnerUser(null)
      return
    }
    fetchAdminUserById(company.created_by)
      .then((u) => {
        if (active) setOwnerUser(u)
      })
      .catch(() => {
        if (active) setOwnerUser(null)
      })
    return () => {
      active = false
    }
  }, [company?.created_by])

  const handleCopyId = () => {
    if (!company?.id) return
    navigator.clipboard.writeText(company.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleConfirmStatusUpdate = async () => {
    if (!company || confirmNextActive === null) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await updateCompanyStatusApi(company.id, {
        status: confirmNextActive ? "active" : "inactive",
        is_active: confirmNextActive,
      })

      if (res.success && res.data) {
        setCompany(res.data)
        setSuccessMessage(
          `"${res.data.company_name}" has been ${
            confirmNextActive ? "activated" : "deactivated"
          } successfully.`
        )
        setConfirmNextActive(null)
      } else {
        setActionError(res.message || "Failed to update business status.")
      }
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to update business status. Please try again."
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerificationChange = async (
    nextStatus: CompanyVerificationStatusValue
  ) => {
    if (!company || company.verification_status === nextStatus) return
    setVerificationUpdating(true)
    setActionError(null)

    try {
      const res = await updateCompanyVerificationStatusApi(company.id, nextStatus)
      if (res.success && res.data) {
        setCompany(res.data)
        setSuccessMessage(
          `Verification status updated to ${nextStatus.toUpperCase()}.`
        )
      } else {
        setActionError(res.message || "Failed to update verification status.")
      }
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to update verification status."
      )
    } finally {
      setVerificationUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center animate-fade-in">
        <div className="w-12 h-12 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-[var(--text-tertiary)]">
          Loading business profile...
        </p>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8 text-center animate-fade-in">
        <div className="text-4xl mb-3">🏢</div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          Business Not Found
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          {error || `Could not find a registered business with ID "${id}".`}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/companies")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
          >
            ← Back to Business Management
          </button>
          <button
            type="button"
            onClick={() => void loadCompany()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] border border-[var(--border-default)] px-5 py-2.5 rounded-xl hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const active = isBusinessActive(company)
  const statusMeta = getStatusBadgeMeta(company)
  const logoUrl = resolveFileUrl(company.company_logo)
  const coverUrl = resolveFileUrl(company.cover_image)
  const licenseUrl = resolveFileUrl(company.business_license)
  const vStatus = (company.verification_status || "pending").toLowerCase()
  const ownerDisplayName =
    ownerUser?.fullName || ownerUser?.full_name || ownerUser?.name

  const contactItems: {
    label: string
    value: string
    href?: string
    iconPath: string
    onClick?: () => void
  }[] = [
    {
      label: "Owner / Primary Contact",
      value: company.owner_primary_contact || "Not provided",
      iconPath:
        "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    ...(ownerUser
      ? [
          {
            label: "Registered Account",
            value: ownerDisplayName || ownerUser.email || "View User Profile",
            iconPath:
              "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z",
            onClick: () => navigate(`/admin/users/${ownerUser.id}`),
          },
        ]
      : []),
    {
      label: "Email",
      value: company.email || "Not provided",
      href: company.email ? `mailto:${company.email}` : undefined,
      iconPath:
        "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    },
    {
      label: "Phone",
      value: company.phone_number || "Not provided",
      href: company.phone_number ? `tel:${company.phone_number}` : undefined,
      iconPath:
        "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    },
    ...(company.website
      ? [
          {
            label: "Website",
            value: company.website.replace(/^https?:\/\//, ""),
            href: company.website.startsWith("http")
              ? company.website
              : `https://${company.website}`,
            iconPath:
              "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
          },
        ]
      : []),
    {
      label: "Physical Address",
      value: company.physical_address || "Not provided",
      iconPath:
        "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      label: "Business Category",
      value: company.business_category?.name || "Uncategorized",
      iconPath:
        "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Success Toast Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            <svg
              className="w-5 h-5 text-emerald-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 cursor-pointer font-bold px-1"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && confirmNextActive === null && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 flex items-center justify-between">
          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
            {actionError}
          </span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs text-red-600 hover:text-red-800 cursor-pointer font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden shadow-xs">
        {/* Top Action Bar */}
        <div className="bg-[var(--brand-dark)] px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/companies")}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors cursor-pointer"
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
            Back to Business Management
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/companies/${company.id}`)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              View Public Page
            </button>
            <button
              type="button"
              onClick={() => navigate(`/companies/${company.id}/edit`)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-dark)] bg-[var(--accent)] hover:brightness-105 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Edit Business
            </button>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full uppercase ${statusMeta.headerClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* Cover Banner & Business Identity */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-br from-[var(--brand-dark)] via-[var(--brand)] to-slate-800 overflow-hidden">
          {coverUrl && (
            <img
              src={coverUrl}
              alt={`${company.company_name} cover`}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4 min-w-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={company.company_name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/25 bg-white flex-shrink-0 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--brand)] text-white font-serif font-bold text-2xl flex items-center justify-center ring-4 ring-white/25 flex-shrink-0 shadow-lg">
                  {company.company_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-white min-w-0 pb-0.5">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-white border border-white/20">
                    {company.business_category?.name || "Business"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      vStatus === "verified"
                        ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/30"
                        : vStatus === "rejected"
                          ? "bg-red-500/25 text-red-200 border border-red-400/30"
                          : "bg-amber-500/25 text-amber-200 border border-amber-400/30"
                    }`}
                  >
                    {vStatus}
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold truncate">
                  {company.company_name}
                </h1>
                <p className="text-xs text-white/80 mt-0.5">
                  Registered{" "}
                  {company.created_at
                    ? new Date(company.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              {active ? (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null)
                    setConfirmNextActive(false)
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold transition-colors shadow-lg cursor-pointer"
                >
                  Deactivate Business
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null)
                    setConfirmNextActive(true)
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-lg cursor-pointer"
                >
                  Activate Business
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Deactivated Status Alert Banner */}
        {!active && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">
                This business is currently {statusMeta.label.toLowerCase()}
              </h3>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                It is hidden from the public business directory until reactivated by
                an administrator.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActionError(null)
                setConfirmNextActive(true)
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap w-fit"
            >
              Activate Now
            </button>
          </div>
        )}

        {/* Main Detail Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Description, Services, Social Media, License */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2.5">
                About Business
              </h2>
              <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {company.description || "No business description provided."}
                </p>
              </div>
            </div>

            {Array.isArray(company.services) && company.services.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2.5">
                  Services Offered
                </h2>
                <div className="flex flex-wrap gap-2">
                  {company.services.map((service, idx) => (
                    <span
                      key={`${service}-${idx}`}
                      className="text-xs font-medium text-[var(--text-primary)] bg-[var(--surface-alt)] px-3.5 py-1.5 rounded-xl border border-[var(--border-light)]"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(company.social_media) &&
              company.social_media.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2.5">
                    Social Media Links
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {company.social_media.map((sm, idx) => {
                      const href = sm.link.startsWith("http")
                        ? sm.link
                        : `https://${sm.link}`
                      return (
                        <a
                          key={sm.id || `${sm.platform}-${idx}`}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-light)] hover:border-[var(--brand)]/40 transition-colors group"
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                              {sm.platform}
                            </p>
                            <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] truncate">
                              {sm.link.replace(/^https?:\/\//, "")}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--brand)] flex-shrink-0">
                            ↗
                          </span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

            {/* Business License Document */}
            <div>
              <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2.5">
                Business License & Registration Document
              </h2>
              <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5">
                {licenseUrl ? (
                  <div className="space-y-4">
                    {isImagePath(licenseUrl) && (
                      <div className="rounded-xl overflow-hidden border border-[var(--border-light)] bg-[var(--surface)] max-h-64">
                        <img
                          src={licenseUrl}
                          alt="Business license document"
                          className="w-full h-full max-h-64 object-contain"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Uploaded Registration / License File
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate max-w-md">
                          {company.business_license}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors"
                        >
                          View Document ↗
                        </a>
                        <a
                          href={licenseUrl}
                          download
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    No business license document uploaded.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Contact Details, Status Controls, Metadata */}
          <div className="space-y-5">
            {/* Contact & Business Details Card */}
            <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5">
              <h2 className="font-semibold text-sm text-[var(--text-primary)] mb-4">
                Contact & Business Details
              </h2>
              <div className="space-y-3.5">
                {contactItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3 group">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d={item.iconPath}
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
                        {item.label}
                      </p>
                      {item.onClick ? (
                        <button
                          type="button"
                          onClick={item.onClick}
                          className="text-xs font-semibold text-[var(--brand)] dark:text-[var(--accent)] hover:underline text-left break-words cursor-pointer"
                        >
                          {item.value} →
                        </button>
                      ) : item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={
                            item.href.startsWith("http")
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors break-words block"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-xs font-semibold text-[var(--text-primary)] break-words">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status & Visibility Management Card */}
            <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-sm text-[var(--text-primary)]">
                  Business Status
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${statusMeta.pillClass}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`}
                  />
                  {statusMeta.label}
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {active
                  ? "This business is active and publicly visible in the KBN business directory."
                  : "This business is currently inactive and hidden from public listings."}
              </p>

              {active ? (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null)
                    setConfirmNextActive(false)
                  }}
                  className="w-full border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  Deactivate Business
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null)
                    setConfirmNextActive(true)
                  }}
                  className="w-full bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Activate Business
                </button>
              )}

              {/* Verification Status Control */}
              <div className="pt-3 border-t border-[var(--border-light)]">
                <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Verification Status
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["verified", "pending", "rejected"] as const).map((vs) => {
                    const selected = vStatus === vs
                    return (
                      <button
                        key={vs}
                        type="button"
                        disabled={verificationUpdating || selected}
                        onClick={() => void handleVerificationChange(vs)}
                        className={`text-[11px] font-semibold py-1.5 rounded-lg capitalize transition-all cursor-pointer disabled:cursor-default ${
                          selected
                            ? vs === "verified"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : vs === "rejected"
                                ? "bg-red-600 text-white shadow-xs"
                                : "bg-amber-500 text-white shadow-xs"
                            : "bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40"
                        }`}
                      >
                        {vs}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Record Metadata Card */}
            <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 space-y-2.5">
              <h2 className="font-semibold text-sm text-[var(--text-primary)]">
                Record Metadata
              </h2>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[var(--text-tertiary)]">Business ID</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 font-mono text-[11px] bg-[var(--surface)] border border-[var(--border-light)] px-2 py-0.5 rounded text-[var(--text-secondary)] hover:text-[var(--brand)] cursor-pointer"
                  title="Copy full ID"
                >
                  {company.id.slice(0, 8)}…
                  <span>{copiedId ? "✓" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[var(--text-tertiary)]">Registered</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {company.created_at
                    ? new Date(company.created_at).toLocaleString()
                    : "—"}
                </span>
              </div>
              {company.updated_at && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[var(--text-tertiary)]">Last Updated</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {new Date(company.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Activate / Deactivate Business */}
      {confirmNextActive !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => {
            if (!actionLoading) setConfirmNextActive(null)
          }}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
              {confirmNextActive ? "Activate Business" : "Deactivate Business"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              {confirmNextActive ? (
                <>
                  Activating <strong>{company.company_name}</strong> will
                  immediately restore its active status and make it visible to
                  members in the business directory.
                </>
              ) : (
                <>
                  Deactivating <strong>{company.company_name}</strong> will
                  immediately mark it inactive and hide it from the public
                  business directory until reactivated.
                </>
              )}
            </p>

            {actionError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-800/40">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmNextActive(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleConfirmStatusUpdate()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2 ${
                  confirmNextActive
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {confirmNextActive
                  ? "Confirm Activation"
                  : "Confirm Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
