import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import {
  fetchMyCompanies,
  fetchCompanyById,
  updateCompanyApi,
  deleteCompanyApi,
  resolveFileUrl,
  type CompanyApiResponse,
} from "../../data/companyApi"
import {
  getUserDashboardData,
  updateUserContent,
  deleteUserContent,
  userSubscribe,
  type UserBusinessData,
} from "../../data/userDataStore"

function mapCompanyToBusiness(
  company: CompanyApiResponse,
  fallbackUser?: { name: string; email: string },
): UserBusinessData {
  const rawLogo = resolveFileUrl(company.company_logo)
  const logo =
    rawLogo ||
    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop&auto=format"
  const rawCover = resolveFileUrl(company.cover_image)
  const cover =
    rawCover ||
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=420&fit=crop&auto=format"

  const addressParts = (company.physical_address || "").split(",")
  const city = addressParts[0]?.trim() || "Addis Ababa"
  const country =
    addressParts.length > 1
      ? addressParts.slice(1).join(", ").trim()
      : "Ethiopia"

  let statusText: "Published" | "Pending review" = "Pending review"
  if (company.verification_status === "verified") {
    statusText = "Published"
  } else if (company.verification_status === "pending") {
    statusText = "Pending review"
  }

  return {
    id: company.id,
    companyLogo: logo,
    coverImage: cover,
    companyName: company.company_name,
    industry: company.business_category?.name || "Business",
    description: company.description || "",
    founderLeadership:
      company.owner_primary_contact || fallbackUser?.name || "Founder",
    city,
    country,
    website: company.website || "",
    phone: company.phone_number || "",
    email: company.email || fallbackUser?.email || "",
    status: statusText,
  }
}

export default function UserBusinessesPage() {
  const { companyId } = useParams<{ companyId?: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [backendBusinesses, setBackendBusinesses] = useState<UserBusinessData[]>([])
  const [loading, setLoading] = useState(true)

  // Direct fetch for specific companyId when opened
  const [targetCompany, setTargetCompany] = useState<UserBusinessData | null>(null)
  const [loadingTarget, setLoadingTarget] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const apiCompanies = await fetchMyCompanies()
      const mapped = apiCompanies.map((c) =>
        mapCompanyToBusiness(c, user ?? undefined),
      )
      setBackendBusinesses(mapped)
    } catch (err) {
      console.warn("Failed to fetch businesses from API:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
    return userSubscribe(() => void reload())
  }, [reload])

  const dashboardData = getUserDashboardData(user?.email || "", user ?? undefined)

  const allBusinesses = useMemo(() => {
    const backendIds = new Set(backendBusinesses.map((b) => b.id))
    const uniqueLocals = dashboardData.businesses.filter(
      (b) => !backendIds.has(b.id),
    )
    return [...backendBusinesses, ...uniqueLocals]
  }, [backendBusinesses, dashboardData.businesses])

  // When companyId param is present, fetch company by ID directly from backend or resolve from list
  useEffect(() => {
    if (!companyId) {
      setTargetCompany(null)
      return
    }

    const localMatch = allBusinesses.find((b) => b.id === companyId)
    if (localMatch) {
      setTargetCompany(localMatch)
    }

    let isMounted = true
    setLoadingTarget(true)

    fetchCompanyById(companyId)
      .then((apiComp) => {
        if (!isMounted) return
        if (apiComp) {
          const mapped = mapCompanyToBusiness(apiComp, user ?? undefined)
          setTargetCompany(mapped)
        } else if (!localMatch) {
          setTargetCompany(null)
        }
      })
      .catch((err) => {
        console.warn("Error fetching company details by ID:", err)
        if (!isMounted) return
        if (!localMatch) setTargetCompany(null)
      })
      .finally(() => {
        if (isMounted) setLoadingTarget(false)
      })

    return () => {
      isMounted = false
    }
  }, [companyId, allBusinesses, user])

  // ─── If companyId is specified: Render Business Detail View ───────────────
  if (companyId) {
    if (loadingTarget && !targetCompany) {
      return (
        <div className="py-16 text-center text-[var(--text-tertiary)] flex flex-col items-center justify-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
          <p className="text-sm">Loading business details...</p>
        </div>
      )
    }

    if (!targetCompany) {
      return (
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate("/dashboard/business")}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-light)] cursor-pointer"
            >
              <span aria-hidden="true">←</span> Back to list
            </button>
          </div>
          <EmptyState
            title="Business not found"
            description={`Could not find business with ID "${companyId}".`}
          />
        </div>
      )
    }

    return (
      <BusinessDetail
        item={targetCompany}
        email={user?.email || ""}
        onBack={() => navigate("/dashboard/business")}
        onSaved={(updated) => {
          setTargetCompany(updated)
          void reload()
        }}
        onDeleted={() => {
          void reload()
          navigate("/dashboard/business")
        }}
      />
    )
  }

  // ─── If companyId is NOT specified: Render Restored Previous List UI ──────
  return (
    <div className="animate-fade-in">
      <PageIntro
        title="Business"
        description="Businesses and companies owned by your member profile."
        count={allBusinesses.length}
        onAdd={() => navigate("/companies/new")}
      />

      {loading && allBusinesses.length === 0 ? (
        <div className="py-16 text-center text-[var(--text-tertiary)] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin" />
          <p className="text-sm">Loading your businesses...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            {allBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onOpen={(id) => navigate(`/dashboard/business/${id}`)}
              />
            ))}
          </div>

          {allBusinesses.length === 0 && (
            <EmptyState
              title="No businesses yet"
              description="Businesses you own or submit will appear here."
              onAdd={() => navigate("/companies/new")}
            />
          )}
        </>
      )}
    </div>
  )
}

// ─── Previous UI Layout Components ──────────────────────────────────────────

function PageIntro({
  title,
  description,
  count,
  onAdd,
}: {
  title: string
  description: string
  count: number
  onAdd?: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h2 className="font-serif text-2xl text-[var(--text-primary)] mb-1">
          {title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[var(--text-tertiary)] bg-[var(--surface)] border border-[var(--border-light)] px-3 py-1.5 rounded-full">
          {count} {count === 1 ? "item" : "items"}
        </span>
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
          >
            <span aria-hidden="true">+</span>Add
          </button>
        )}
      </div>
    </div>
  )
}

function BusinessCard({
  business,
  onOpen,
}: {
  business: UserBusinessData
  onOpen: (id: string) => void
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(business.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen(business.id)
      }}
      className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden card-hover cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition-all"
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={business.coverImage}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <img
          src={business.companyLogo}
          alt={business.companyName}
          className="absolute bottom-4 left-5 w-14 h-14 rounded-xl object-cover border-2 border-white shadow-lg bg-white"
        />
      </div>
      <div className="p-5 pt-7">
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-xs font-semibold text-[var(--accent-dark)] uppercase tracking-wide">
              {business.industry}
            </p>
            <h3 className="font-serif text-xl text-[var(--text-primary)] mt-1">
              {business.companyName}
            </h3>
          </div>
          <StatusBadge status={business.status} />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3 line-clamp-2">
          {business.description}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5 text-xs">
          <Info label="Leadership" value={business.founderLeadership} />
          <Info
            label="Location"
            value={`${business.city}, ${business.country}`}
          />
          <Info label="Website" value={business.website} />
          <Info label="Contact" value={business.email} />
        </div>
      </div>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-[var(--text-secondary)] break-words">{value || "Not provided"}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${
        status === "Published" || status === "Verified" || status === "verified"
          ? "bg-emerald-100 text-emerald-700"
          : status === "Pending review" || status === "pending"
            ? "bg-amber-100 text-amber-700"
            : status === "Rejected" || status === "rejected"
              ? "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-600"
      }`}
    >
      {status === "verified"
        ? "Verified"
        : status === "pending"
          ? "Pending review"
          : status === "rejected"
            ? "Rejected"
            : status}
    </span>
  )
}

function EmptyState({
  title,
  description,
  onAdd,
}: {
  title: string
  description: string
  onAdd?: () => void
}) {
  return (
    <div className="text-center py-12 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8">
      <div className="text-3xl mb-3">○</div>
      <h2 className="font-serif text-xl text-[var(--text-primary)] mb-2">
        {title}
      </h2>
      <p className="text-sm text-[var(--text-tertiary)] mb-5 max-w-md mx-auto">
        {description}
      </p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
        >
          + Register Business
        </button>
      )}
    </div>
  )
}

// ─── Business Detail & Inline Editing Component ─────────────────────────────

function BusinessDetail({
  item,
  email,
  onBack,
  onSaved,
  onDeleted,
}: {
  item: UserBusinessData
  email: string
  onBack: () => void
  onSaved?: (updated: UserBusinessData) => void
  onDeleted?: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(item)

  // Image upload, replacement, and removal states
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [removeCover, setRemoveCover] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setForm(item)
  }, [item])

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  function resetImages() {
    setLogoFile(null)
    setRemoveLogo(false)
    setCoverFile(null)
    setRemoveCover(false)
    if (logoInputRef.current) logoInputRef.current.value = ""
    if (coverInputRef.current) coverInputRef.current.value = ""
  }

  function update<K extends keyof UserBusinessData>(
    key: K,
    value: UserBusinessData[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("company_name", form.companyName)
      formData.append("description", form.description)
      formData.append("owner_primary_contact", form.founderLeadership)
      formData.append("website", form.website)
      formData.append("phone_number", form.phone)
      formData.append("email", form.email)
      formData.append("physical_address", `${form.city}, ${form.country}`)

      if (logoFile) {
        formData.append("company_logo", logoFile)
      } else if (removeLogo) {
        formData.append("remove_company_logo", "true")
        formData.append("company_logo", "")
      }

      if (coverFile) {
        formData.append("cover_image", coverFile)
      } else if (removeCover) {
        formData.append("remove_cover_image", "true")
        formData.append("cover_image", "")
      }

      const updated = await updateCompanyApi(item.id, formData)

      const finalLogo =
        updated?.company_logo !== undefined
          ? (updated.company_logo ? resolveFileUrl(updated.company_logo) : "")
          : (removeLogo ? "" : form.companyLogo)

      const finalCover =
        updated?.cover_image !== undefined
          ? (updated.cover_image ? resolveFileUrl(updated.cover_image) : "")
          : (removeCover ? "" : form.coverImage)

      const updatedForm: UserBusinessData = {
        ...form,
        companyLogo: finalLogo,
        coverImage: finalCover,
        companyName: updated?.company_name || form.companyName,
        description: updated?.description || form.description,
        founderLeadership: updated?.owner_primary_contact || form.founderLeadership,
        website: updated?.website || form.website,
        phone: updated?.phone_number || form.phone,
        email: updated?.email || form.email,
      }

      setForm(updatedForm)
      resetImages()
      setEditing(false)
      updateUserContent<UserBusinessData>(email, "businesses", item.id, updatedForm)
      onSaved?.(updatedForm)
    } catch (e) {
      console.warn("Backend update error:", e)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (window.confirm(`Are you sure you want to delete ${form.companyName}?`)) {
      try {
        await deleteCompanyApi(item.id)
      } catch (e) {
        console.warn("Backend delete error:", e)
      }
      deleteUserContent(email, "businesses", item.id)
      onDeleted?.(item.id)
    }
  }

  const effectiveCover = coverPreview
    ? coverPreview
    : removeCover
    ? ""
    : form.coverImage
  const effectiveLogo = logoPreview
    ? logoPreview
    : removeLogo
    ? ""
    : form.companyLogo

  return (
    <div className="animate-fade-in">
      <DetailHeader
        title={form.companyName}
        onBack={onBack}
        editing={editing}
        saving={saving}
        onEdit={() => setEditing(true)}
        onSave={() => void save()}
        onCancel={() => {
          resetImages()
          setForm(item)
          setEditing(false)
        }}
        onDelete={() => void handleDelete()}
      />

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-slate-700 to-slate-900">
          {effectiveCover ? (
            <img
              src={effectiveCover}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 text-xs">
              No cover image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {effectiveLogo ? (
            <img
              src={effectiveLogo}
              alt={form.companyName}
              className="absolute bottom-5 left-6 w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg bg-white"
            />
          ) : (
            <div className="absolute bottom-5 left-6 w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-slate-800 flex items-center justify-center text-white font-bold text-xl">
              {form.companyName.charAt(0) || "C"}
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 pt-10">
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditField
                label="Company name"
                value={form.companyName}
                onChange={(value) => update("companyName", value)}
              />
              <EditField
                label="Industry"
                value={form.industry}
                onChange={(value) => update("industry", value)}
              />

              {/* Company Logo Upload / Replace / Remove */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Company Logo
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setLogoFile(file)
                      setRemoveLogo(false)
                    }
                  }}
                />
                <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-alt)]/50 flex items-center gap-3">
                  {effectiveLogo ? (
                    <img
                      src={effectiveLogo}
                      alt="Logo preview"
                      className="w-14 h-14 rounded-xl object-cover border border-[var(--border-light)] bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-dashed border-[var(--border-default)] flex items-center justify-center text-xs text-[var(--text-tertiary)] shrink-0">
                      No Logo
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
                      >
                        {effectiveLogo ? "Replace Logo" : "Upload Logo"}
                      </button>
                      {effectiveLogo && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null)
                            setRemoveLogo(true)
                            if (logoInputRef.current) logoInputRef.current.value = ""
                          }}
                          className="text-xs text-red-500 hover:text-red-600 hover:underline px-2 py-1 cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      )}
                      {removeLogo && (
                        <button
                          type="button"
                          onClick={() => setRemoveLogo(false)}
                          className="text-xs text-[var(--brand)] hover:underline px-2 py-1 cursor-pointer"
                        >
                          Keep Original
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1 truncate">
                      {logoFile
                        ? `Selected: ${logoFile.name} (${(logoFile.size / 1024).toFixed(1)} KB)`
                        : removeLogo
                        ? "Logo will be removed upon save"
                        : form.companyLogo
                        ? "Using current uploaded logo"
                        : "PNG, JPG, WebP up to 10MB"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cover Image Upload / Replace / Remove */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Cover Image
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setCoverFile(file)
                      setRemoveCover(false)
                    }
                  }}
                />
                <div className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-alt)]/50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {effectiveCover ? (
                      <img
                        src={effectiveCover}
                        alt="Cover preview"
                        className="w-full sm:w-36 h-20 rounded-xl object-cover border border-[var(--border-light)] shrink-0"
                      />
                    ) : (
                      <div className="w-full sm:w-36 h-20 rounded-xl border border-dashed border-[var(--border-default)] flex items-center justify-center text-xs text-[var(--text-tertiary)] shrink-0">
                        No Cover
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
                        >
                          {effectiveCover ? "Replace Cover Image" : "Upload Cover Image"}
                        </button>
                        {effectiveCover && (
                          <button
                            type="button"
                            onClick={() => {
                              setCoverFile(null)
                              setRemoveCover(true)
                              if (coverInputRef.current) coverInputRef.current.value = ""
                            }}
                            className="text-xs text-red-500 hover:text-red-600 hover:underline px-2 py-1 cursor-pointer font-medium"
                          >
                            Remove
                          </button>
                        )}
                        {removeCover && (
                          <button
                            type="button"
                            onClick={() => setRemoveCover(false)}
                            className="text-xs text-[var(--brand)] hover:underline px-2 py-1 cursor-pointer"
                          >
                            Keep Original
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-1 truncate">
                        {coverFile
                          ? `Selected: ${coverFile.name} (${(coverFile.size / 1024).toFixed(1)} KB)`
                          : removeCover
                          ? "Cover image will be removed upon save"
                          : form.coverImage
                          ? "Using current cover banner"
                          : "Wide banner recommended (1200×400), JPG, PNG, WebP up to 10MB"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <EditField
                label="Founder / leadership"
                value={form.founderLeadership}
                onChange={(value) => update("founderLeadership", value)}
              />
              <EditField
                label="City"
                value={form.city}
                onChange={(value) => update("city", value)}
              />
              <EditField
                label="Country"
                value={form.country}
                onChange={(value) => update("country", value)}
              />
              <EditField
                label="Website"
                value={form.website}
                onChange={(value) => update("website", value)}
              />
              <EditField
                label="Phone"
                value={form.phone}
                onChange={(value) => update("phone", value)}
              />
              <EditField
                label="Email"
                value={form.email}
                onChange={(value) => update("email", value)}
              />
              <EditField
                label="Status"
                value={form.status}
                onChange={(value) =>
                  update("status", value as UserBusinessData["status"])
                }
              />
              <div className="sm:col-span-2">
                <EditField
                  label="Description"
                  value={form.description}
                  onChange={(value) => update("description", value)}
                  multiline
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-dark)]">
                    {form.industry}
                  </p>
                  <h1 className="font-serif text-3xl text-[var(--text-primary)] mt-1">
                    {form.companyName}
                  </h1>
                  <p className="text-sm text-[var(--text-tertiary)] mt-2">
                    {form.city}, {form.country}
                  </p>
                </div>
                <StatusBadge status={form.status} />
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-7">
                {form.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField
                  label="Founder / leadership"
                  value={form.founderLeadership}
                />
                <DetailField label="Website" value={form.website} />
                <DetailField label="Phone" value={form.phone} />
                <DetailField label="Email" value={form.email} />
                <DetailField label="City" value={form.city} />
                <DetailField label="Country" value={form.country} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailHeader({
  title,
  onBack,
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  title: string
  onBack: () => void
  editing: boolean
  saving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-light)] cursor-pointer"
      >
        <span aria-hidden="true">←</span> Back to list
      </button>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </>
        )}
      </div>
      <h2 className="sr-only">{title}</h2>
    </div>
  )
}

function DetailField({
  label,
  value,
  locked = false,
}: {
  label: string
  value: string
  locked?: boolean
}) {
  return (
    <div className="bg-[var(--surface-alt)] rounded-xl border border-[var(--border-light)] p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
          {label}
        </p>
        {locked && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-tertiary)] normal-case tracking-normal"
            title="This field cannot be edited"
          >
            Cannot be edited
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)] break-words whitespace-pre-wrap">
        {value || "Not provided"}
      </p>
    </div>
  )
}

function EditField({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  type?: React.HTMLInputTypeAttribute
  required?: boolean
}) {
  const className =
    "w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition-all"
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className={`${className} resize-y`}
          required={required}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
          required={required}
        />
      )}
    </label>
  )
}
