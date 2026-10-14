import { useState, useEffect, useRef } from "react"
import { useAuth } from "../auth/AuthContext"
import {
  fetchCategories,
  submitCompanyCreation,
  type CategoryItem,
  type CompanyApiResponse,
} from "../api/companyApi"

interface SocialLinkItem {
  platform: string
  link: string
}

const SOCIAL_PLATFORMS = [
  { id: "telegram", label: "Telegram", placeholder: "https://t.me/company" },
  { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
  { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/company" },
  { id: "x", label: "X (Twitter)", placeholder: "https://x.com/company" },
  { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/company" },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@company" },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@company" },
  { id: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/251911..." },
]

export default function CreateBusinessPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void
  onSuccess?: (company: CompanyApiResponse) => void
}) {
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Form inputs
  const [companyName, setCompanyName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [ownerName, setOwnerName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")

  // Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([
    { platform: "telegram", link: "" },
  ])

  // File Uploads
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)

  // UI status
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [createdCompany, setCreatedCompany] = useState<CompanyApiResponse | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const licenseInputRef = useRef<HTMLInputElement>(null)

  // Load categories from backend API on mount
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoadingCategories(true)
      const data = await fetchCategories()
      if (mounted) {
        setCategories(data)
        if (data.length > 0) {
          setCategoryId(data[0].id)
        }
        setLoadingCategories(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Auto-cleanup object URL preview for logo
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  // Auto-cleanup object URL preview for cover image
  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  function handleAddSocialLink() {
    setSocialLinks((prev) => [...prev, { platform: "telegram", link: "" }])
  }

  function handleUpdateSocialLink(index: number, key: "platform" | "link", val: string) {
    setSocialLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: val } : item))
    )
  }

  function handleRemoveSocialLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function validateStep(currentStep: number): boolean {
    setErrorMessage("")
    if (currentStep === 1) {
      if (!companyName.trim()) {
        setErrorMessage("Please enter your company name.")
        return false
      }
      if (!categoryId) {
        setErrorMessage("Please select a business category.")
        return false
      }
      if (!ownerName.trim()) {
        setErrorMessage("Please enter the owner or primary contact name.")
        return false
      }
      if (!email.trim() || !email.includes("@")) {
        setErrorMessage("Please enter a valid company email address.")
        return false
      }
      if (!phone.trim()) {
        setErrorMessage("Please enter a phone number.")
        return false
      }
      if (!address.trim()) {
        setErrorMessage("Please enter the physical address.")
        return false
      }
    }

    if (currentStep === 2) {
      if (!description.trim()) {
        setErrorMessage("Please enter a company description.")
        return false
      }
    }

    if (currentStep === 3) {
      if (!licenseFile) {
        setErrorMessage("Please select and upload your business license or registration document.")
        return false
      }
    }

    return true
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => s + 1)
    }
  }

  function handleBackStep() {
    setErrorMessage("")
    setStep((s) => s - 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage("")

    if (!licenseFile) {
      setErrorMessage("Business license document is required. Please upload it in Step 3.")
      setStep(3)
      return
    }

    setSubmitting(true)

    try {
      // Build FormData with text fields and file attachments
      const formData = new FormData()
      formData.append("company_name", companyName.trim())
      formData.append("business_category_id", categoryId)
      formData.append("owner_primary_contact", ownerName.trim())
      formData.append("email", email.trim())
      formData.append("phone_number", phone.trim())
      formData.append("physical_address", address.trim())
      formData.append("description", description.trim())

      if (website.trim()) {
        formData.append("website", website.trim())
      }

      // Filter non-empty social links
      const validSocials = socialLinks
        .filter((s) => s.link.trim().length > 0)
        .map((s) => ({ platform: s.platform, link: s.link.trim() }))

      if (validSocials.length > 0) {
        formData.append("social_media", JSON.stringify(validSocials))
      }

      // Append files:
      // We append under attachmentFiles AND specific field names so both conventions succeed
      if (logoFile) {
        formData.append("company_logo", logoFile)
      }

      if (coverFile) {
        formData.append("cover_image", coverFile)
      }

      if (licenseFile) {
        formData.append("business_license", licenseFile)
      }

      // Send to backend endpoint POST /api/v1/companies
      const result = await submitCompanyCreation(formData)

      if (result.data) {
        setCreatedCompany(result.data)
        onSuccess?.(result.data)
      }
    } catch (err: unknown) {
      console.error("Company registration error:", err)
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during company creation."
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Success Screen
  if (createdCompany) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border-light)] rounded-3xl p-8 md:p-12 text-center shadow-xl shadow-black/5 animate-scale-in">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6 text-3xl">
            ✓
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[var(--accent-dark)] mb-2">
            Application Received
          </span>
          <h2 className="font-serif text-3xl text-[var(--text-primary)] mb-3">
            Company Registered!
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            Your company profile for <strong>{createdCompany.company_name}</strong> has been
            successfully created and submitted for verification.
          </p>

          <div className="bg-[var(--surface-alt)] rounded-2xl p-5 mb-8 text-left space-y-3 border border-[var(--border-default)]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-tertiary)]">Company ID:</span>
              <span className="font-mono text-[var(--text-primary)]">{createdCompany.id}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-tertiary)]">Status:</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-semibold uppercase text-[10px] tracking-wider">
                {createdCompany.verification_status}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-tertiary)]">Primary Email:</span>
              <span className="text-[var(--text-primary)] font-medium">{createdCompany.email}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-tertiary)]">Contact Phone:</span>
              <span className="text-[var(--text-primary)] font-medium">{createdCompany.phone_number}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onBack}
              className="bg-[var(--brand)] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-lg shadow-[var(--brand)]/20 cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] py-10 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span>←</span> Back
          </button>
          <span className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wider">
            Step {step} of 4
          </span>
        </div>

        {/* Title & Description */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--text-primary)] mb-2">
            Register Your Business
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Complete the form below to list your company in the Kingdom Builders Network directory.
            Government license documents and logos can be uploaded directly.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { num: 1, label: "Basic Info" },
            { num: 2, label: "About & Social" },
            { num: 3, label: "Upload Files" },
            { num: 4, label: "Review & Submit" },
          ].map((s) => (
            <div
              key={s.num}
              className={`text-center pb-2 border-b-2 transition-all ${
                step >= s.num
                  ? "border-[var(--brand)] text-[var(--brand)] font-semibold"
                  : "border-[var(--border-default)] text-[var(--text-tertiary)]"
              }`}
            >
              <span className="text-xs">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 animate-fade-in">
            <span className="text-lg leading-none">⚠️</span>
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface)] border border-[var(--border-light)] rounded-3xl p-6 md:p-10 shadow-sm"
        >
          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-serif text-xl text-[var(--text-primary)] border-b border-[var(--border-light)] pb-3">
                1. Basic Company Information
              </h2>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Selam Construction Group"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Business Category <span className="text-red-500">*</span>
                </label>
                {loadingCategories ? (
                  <div className="text-xs text-[var(--text-tertiary)] py-2">Loading categories...</div>
                ) : categories.length > 0 ? (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.type})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    placeholder="Enter category UUID"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)]"
                  />
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Owner / Primary Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Abebe Bikila"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Official Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 911 223344"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Physical Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Bole Subcity, Woreda 03, Addis Ababa, Ethiopia"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                />
              </div>
            </div>
          )}

          {/* STEP 2: ABOUT & SOCIAL */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-serif text-xl text-[var(--text-primary)] border-b border-[var(--border-light)] pb-3">
                2. Company Details & Social Links
              </h2>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Company Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your company services, mission, background, and specialties..."
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Social Media Profiles
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSocialLink}
                    className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                  >
                    + Add Another Link
                  </button>
                </div>

                <div className="space-y-3">
                  {socialLinks.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.platform}
                        onChange={(e) => handleUpdateSocialLink(idx, "platform", e.target.value)}
                        className="bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                      >
                        {SOCIAL_PLATFORMS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="url"
                        value={item.link}
                        onChange={(e) => handleUpdateSocialLink(idx, "link", e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                      />
                      {socialLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSocialLink(idx)}
                          className="text-[var(--text-tertiary)] hover:text-red-500 p-2 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FILE UPLOADS */}
          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="font-serif text-xl text-[var(--text-primary)] border-b border-[var(--border-light)] pb-3">
                3. File Uploads
              </h2>

              {/* Company Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Company Logo (Optional)
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setLogoFile(file)
                  }}
                />

                {logoFile && logoPreview ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-default)]">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-xl object-cover border border-[var(--border-light)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {logoFile.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {(logoFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null)
                        if (logoInputRef.current) logoInputRef.current.value = ""
                      }}
                      className="text-xs text-red-500 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--brand)] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[var(--surface-alt)]/50"
                  >
                    <div className="text-2xl mb-2">🖼️</div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                      Click to choose Company Logo
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      PNG, JPG, WebP, SVG up to 10MB
                    </p>
                  </div>
                )}
              </div>

              {/* Company Cover Image Upload (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Company Cover Image <span className="text-[var(--text-tertiary)] font-normal lowercase">(optional banner photo)</span>
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setCoverFile(file)
                  }}
                />

                {coverFile && coverPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--border-default)] bg-[var(--surface-alt)]">
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="p-3 flex items-center justify-between bg-[var(--surface)]/90 backdrop-blur-sm border-t border-[var(--border-light)]">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {coverFile.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          {(coverFile.size / 1024).toFixed(1)} KB · Banner Image
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCoverFile(null)
                          if (coverInputRef.current) coverInputRef.current.value = ""
                        }}
                        className="text-xs text-red-500 hover:underline px-2 py-1 cursor-pointer font-medium"
                      >
                        Remove Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--brand)] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[var(--surface-alt)]/50"
                  >
                    <div className="text-2xl mb-2">🌄</div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                      Click to choose Company Cover Image
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      Wide banner photo (1200×400 recommended), PNG, JPG, WebP up to 10MB
                    </p>
                  </div>
                )}
              </div>

              {/* Business License Upload (Required) */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Business License / Registration Document <span className="text-red-500">*</span>
                </label>
                <input
                  ref={licenseInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setLicenseFile(file)
                  }}
                />

                {licenseFile ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border-default)]">
                    <div className="w-12 h-12 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center text-xl">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {licenseFile.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {(licenseFile.size / 1024).toFixed(1)} KB · {licenseFile.type || "Document"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLicenseFile(null)
                        if (licenseInputRef.current) licenseInputRef.current.value = ""
                      }}
                      className="text-xs text-red-500 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => licenseInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--brand)] rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[var(--surface-alt)]/50"
                  >
                    <div className="text-3xl mb-2">📑</div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                      Upload Government-Issued Business License
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mb-4">
                      PDF, DOCX, JPG, or PNG up to 10MB
                    </p>
                    <span className="inline-block bg-[var(--brand)] text-white text-xs font-semibold px-4 py-2 rounded-xl">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-serif text-xl text-[var(--text-primary)] border-b border-[var(--border-light)] pb-3">
                4. Review & Confirm Submission
              </h2>

              <div className="bg-[var(--surface-alt)] rounded-2xl p-6 space-y-4 border border-[var(--border-default)] text-sm overflow-hidden">
                {coverPreview && (
                  <div className="-mx-6 -mt-6 mb-4 h-32 overflow-hidden border-b border-[var(--border-light)]">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex justify-between items-start border-b border-[var(--border-light)] pb-3">
                  <div>
                    <h3 className="font-serif text-lg text-[var(--text-primary)]">{companyName}</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {categories.find((c) => c.id === categoryId)?.name || categoryId}
                    </p>
                  </div>
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Owner / Contact:</span>
                    <span className="text-[var(--text-primary)] font-medium">{ownerName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Email:</span>
                    <span className="text-[var(--text-primary)] font-medium">{email}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Phone:</span>
                    <span className="text-[var(--text-primary)] font-medium">{phone}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Address:</span>
                    <span className="text-[var(--text-primary)] font-medium">{address}</span>
                  </div>
                </div>

                <div className="border-t border-[var(--border-light)] pt-3 text-xs">
                  <span className="text-[var(--text-tertiary)] block mb-1">Description:</span>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{description}</p>
                </div>

                {coverFile && (
                  <div className="border-t border-[var(--border-light)] pt-3 text-xs">
                    <span className="text-[var(--text-tertiary)] block mb-1">Attached Cover Image:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ {coverFile.name} ({(coverFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}

                <div className="border-t border-[var(--border-light)] pt-3 text-xs">
                  <span className="text-[var(--text-tertiary)] block mb-1">Attached License File:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    ✓ {licenseFile?.name} ({(licenseFile ? licenseFile.size / 1024 : 0).toFixed(1)} KB)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs leading-relaxed">
                ℹ️ By submitting, your company will be registered in the system with status <strong>Pending</strong>.
                Our team will verify the business license before publishing it to the public directory.
              </div>
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-[var(--border-light)]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBackStep}
                disabled={submitting}
                className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2.5 rounded-xl border border-[var(--border-default)] cursor-pointer"
              >
                ← Previous
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-[var(--brand)] text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting & Uploading...
                  </>
                ) : (
                  "Confirm & Register Company"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
