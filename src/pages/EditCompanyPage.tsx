import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar"
import { type Company } from "../data/companies"
import {
  updateCompanyApi,
  fetchCompanyById,
  mapApiResponseToCompany,
} from "../api/companyApi"
import {
  fetchActiveCategoriesApi,
  type CategoryApiItem,
} from "../api/categoryApi"

export default function EditCompanyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isFromDashboard = Boolean(location.state?.fromDashboard)

  const [company, setCompany] = useState<Company | null>(null)
  const [categories, setCategories] = useState<CategoryApiItem[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [businessCategoryId, setBusinessCategoryId] = useState("")
  const [currentCategoryName, setCurrentCategoryName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [missionStatement, setMissionStatement] = useState("")
  const [logo, setLogo] = useState("")
  const [banner, setBanner] = useState("")
  const [services, setServices] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newService, setNewService] = useState("")
  const [newTag, setNewTag] = useState("")

  // Social Media state
  const [socialMedia, setSocialMedia] = useState<{ id?: string; platform: string; link: string }[]>([])
  const [newSocialPlatform, setNewSocialPlatform] = useState("Website")
  const [newSocialLink, setNewSocialLink] = useState("")

  useEffect(() => {
    let active = true
    setLoadingCategories(true)
    fetchActiveCategoriesApi()
      .then((cats) => {
        if (active) setCategories(cats)
      })
      .catch((err) => {
        console.warn("Could not load categories:", err)
      })
      .finally(() => {
        if (active) setLoadingCategories(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!id) return
    let isMounted = true
    setLoading(true)
    setError("")

    const populate = (comp: Company, catId?: string, catName?: string) => {
      setCompany(comp)
      setName(comp.name || "")
      setBusinessCategoryId(catId || "")
      setCurrentCategoryName(catName || comp.category || "")
      setOwnerName(comp.ownerName || "")
      setEmail(comp.email || "")
      setPhone(comp.phone || "")
      setWebsite(comp.website || "")
      setAddress(comp.address || "")
      setDescription(comp.description || "")
      setLongDescription(comp.longDescription || "")
      setMissionStatement(comp.missionStatement || "")
      setLogo(comp.logo || "")
      setBanner(comp.banner || "")
      setServices([...(comp.services || [])])
      setTags([...(comp.tags || [])])
      setSocialMedia(comp.socialMedia ? [...comp.socialMedia] : [])
    }

    fetchCompanyById(id)
      .then((apiComp) => {
        if (!isMounted) return
        if (apiComp) {
          const mapped = mapApiResponseToCompany(apiComp)
          populate(
            mapped,
            apiComp.business_category_id || apiComp.business_category?.id,
            apiComp.business_category?.name
          )
        } else {
          setError(`Could not find company with ID "${id}".`)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Failed to load company details.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  const handleAddService = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (newService.trim()) {
      if (!services.includes(newService.trim())) {
        setServices([...services, newService.trim()])
      }
      setNewService("")
    }
  }

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const handleAddSocialMedia = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (newSocialLink.trim()) {
      setSocialMedia([
        ...socialMedia,
        { platform: newSocialPlatform, link: newSocialLink.trim() },
      ])
      setNewSocialLink("")
    }
  }

  const handleRemoveSocialMedia = (index: number) => {
    setSocialMedia(socialMedia.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !company) return
    setError("")

    if (!name.trim()) {
      setError("Company name is required.")
      return
    }

    setSaving(true)

    try {
      const res = await updateCompanyApi(id, {
        company_name: name.trim(),
        ...(businessCategoryId ? { business_category_id: businessCategoryId } : {}),
        owner_primary_contact: ownerName.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        website: website.trim(),
        physical_address: address.trim(),
        description: description.trim(),
        services,
        social_media: socialMedia,
      })

      if (!res) {
        throw new Error("Failed to update company on server.")
      }

      setSuccess(true)
      setTimeout(() => {
        navigate(`/companies/${id}`, {
          state: isFromDashboard ? { fromDashboard: true } : undefined,
        })
      }, 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update company.")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] flex items-center justify-center mx-auto mb-6 text-3xl">
            🏢
          </div>
          <h1 className="font-serif text-3xl text-[var(--text-primary)] mb-3">
            Company Not Found
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-8">
            Could not find the company you want to edit.
          </p>
          <button
            onClick={() => navigate("/companies")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-6 py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
          >
            ← Back to Companies
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] pb-16">
      <Navbar />

      <div className="bg-[var(--brand-dark)] py-10 md:py-14 text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <button
            onClick={() =>
              navigate(`/companies/${id}`, {
                state: isFromDashboard ? { fromDashboard: true } : undefined,
              })
            }
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-sm font-medium px-4 py-2 rounded-xl border border-white/15 hover:bg-white/20 transition-all mb-4 cursor-pointer"
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
            Back to Company
          </button>
          <h1 className="font-serif text-3xl md:text-4xl text-white">
            Edit Company
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Updating details for <strong className="text-white">{company.name}</strong>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-6">
        <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl shadow-xl p-6 md:p-10">
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 animate-fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Company updated successfully! Redirecting...</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-3 animate-fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Information */}
            <div>
              <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Business Category *
                  </label>
                  <div className="relative">
                    <select
                      value={businessCategoryId}
                      onChange={(e) => setBusinessCategoryId(e.target.value)}
                      disabled={loadingCategories}
                      className="w-full appearance-none bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl pl-4 pr-10 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer disabled:opacity-60"
                    >
                      {loadingCategories ? (
                        <option value={businessCategoryId}>
                          Loading categories...
                        </option>
                      ) : (
                        <>
                          {!businessCategoryId && (
                            <option value="">Select a business category...</option>
                          )}
                          {businessCategoryId &&
                            !categories.some((c) => c.id === businessCategoryId) && (
                              <option value={businessCategoryId}>
                                {currentCategoryName || "Current Category"}
                              </option>
                            )}
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Founder / Primary Contact
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Addis Ababa, Ethiopia"
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div>
              <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2 mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Overview & Mission */}
            <div>
              <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2 mb-4">
                Descriptions & Mission
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Full Description
                  </label>
                  <textarea
                    rows={4}
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl p-4 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Mission Statement
                  </label>
                  <input
                    type="text"
                    value={missionStatement}
                    onChange={(e) => setMissionStatement(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Imagery */}
            <div>
              <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2 mb-4">
                Images
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                  {logo && (
                    <div className="mt-2 w-14 h-14 rounded-xl border border-[var(--border-light)] overflow-hidden">
                      <img src={logo} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
                    Cover Banner Image URL
                  </label>
                  <input
                    type="url"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  />
                  {banner && (
                    <div className="mt-2 h-14 rounded-xl border border-[var(--border-light)] overflow-hidden">
                      <img src={banner} alt="Banner preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Services & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2 mb-3">
                  Services
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddService()
                      }
                    }}
                    placeholder="Add a service..."
                    className="flex-1 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddService()}
                    className="px-5 py-2.5 bg-[var(--brand)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer min-h-[44px] shrink-0"
                  >
                    Add Service
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {services.map((svc, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-alt)] border border-[var(--border-light)] text-xs text-[var(--text-secondary)] rounded-full"
                    >
                      {svc}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(i)}
                        className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer p-0.5"
                        title="Remove service"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {services.length === 0 && (
                    <span className="text-xs text-[var(--text-tertiary)] italic">
                      No services added yet.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2 mb-3">
                  Tags
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag(e)
                      }
                    }}
                    placeholder="Add a tag..."
                    className="flex-1 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-dark)]/20 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-5 py-2.5 bg-[var(--accent-dark)] text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors cursor-pointer min-h-[44px] shrink-0"
                  >
                    Add Tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-alt)] border border-[var(--border-light)] text-xs text-[var(--text-secondary)] rounded-full"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(i)}
                        className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer p-0.5"
                        title="Remove tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs text-[var(--text-tertiary)] italic">
                      No tags added yet.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 6: Social Media Links */}
            <div>
              <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2 mb-3">
                Social Media Links
              </h2>
              <p className="text-xs text-[var(--text-tertiary)] mb-3">
                Connect your social media pages and handles to make them accessible on your company profile.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
                <select
                  value={newSocialPlatform}
                  onChange={(e) => setNewSocialPlatform(e.target.value)}
                  className="bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none min-h-[44px] sm:w-44 cursor-pointer focus:ring-2 focus:ring-[var(--brand)]/20"
                >
                  <option value="Website">Website</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Twitter">Twitter / X</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Telegram">Telegram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
                <input
                  type="text"
                  value={newSocialLink}
                  onChange={(e) => setNewSocialLink(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddSocialMedia()
                    }
                  }}
                  placeholder="https://... or handle"
                  className="flex-1 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none min-h-[44px] focus:ring-2 focus:ring-[var(--brand)]/20"
                />
                <button
                  type="button"
                  onClick={() => handleAddSocialMedia()}
                  className="px-5 py-2.5 bg-[var(--brand)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer min-h-[44px] shrink-0"
                >
                  Add Link
                </button>
              </div>

              {socialMedia.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {socialMedia.map((sm, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border-light)]"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-semibold text-[var(--brand)] uppercase tracking-wider block">
                          {sm.platform}
                        </span>
                        <p className="text-xs text-[var(--text-primary)] font-medium truncate">
                          {sm.link}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialMedia(i)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg text-sm font-bold cursor-pointer transition-colors"
                        title="Remove link"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] italic">
                  No social media links added yet.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-[var(--border-light)]">
              <button
                type="button"
                onClick={() =>
                  navigate(`/companies/${id}`, {
                    state: isFromDashboard ? { fromDashboard: true } : undefined,
                  })
                }
                className="px-5 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[var(--brand)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--brand-light)] transition-all shadow-md cursor-pointer disabled:opacity-50 text-center"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
