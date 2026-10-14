import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { useAuth } from "../auth/AuthContext"
import {
  getCompanyById,
  updateCompany,
  upsertCompany,
  type Company,
} from "../data/companyStore"
import { CATEGORIES, type Category } from "../data/companies"
import {
  updateCompanyApi,
  fetchCompanyById,
  mapApiResponseToCompany,
} from "../api/companyApi"

export default function EditCompanyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [category, setCategory] = useState<Category>("Construction")
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

  useEffect(() => {
    if (!id) return
    let isMounted = true

    const populate = (comp: Company) => {
      setCompany(comp)
      setName(comp.name || "")
      setCategory(comp.category || "Construction")
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
    }

    const comp = getCompanyById(id)
    if (comp) {
      populate(comp)
      setLoading(false)
    } else {
      setLoading(true)
      fetchCompanyById(id)
        .then((apiComp) => {
          if (!isMounted) return
          if (apiComp) {
            const mapped = mapApiResponseToCompany(apiComp)
            upsertCompany(mapped)
            populate(mapped)
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch company by ID:", err)
        })
        .finally(() => {
          if (isMounted) setLoading(false)
        })
    }

    return () => {
      isMounted = false
    }
  }, [id])

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault()
    if (newService.trim()) {
      setServices([...services, newService.trim()])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !company) return
    setError("")

    if (!name.trim()) {
      setError("Company name is required.")
      return
    }

    setSaving(true)

    const updatedData: Partial<Company> = {
      name: name.trim(),
      category,
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      website: website.trim(),
      address: address.trim(),
      description: description.trim(),
      longDescription: longDescription.trim(),
      missionStatement: missionStatement.trim(),
      logo: logo.trim() || company.logo,
      banner: banner.trim() || company.banner,
      services,
      tags,
    }

    try {
      // Update local company store
      updateCompany(id, updatedData)

      // Also attempt backend API update
      try {
        await updateCompanyApi(id, {
          company_name: updatedData.name,
          owner_primary_contact: updatedData.ownerName,
          email: updatedData.email,
          phone_number: updatedData.phone,
          website: updatedData.website,
          physical_address: updatedData.address,
          description: updatedData.description,
        })
      } catch (apiErr) {
        console.warn("Backend API update optional fallback:", apiErr)
      }

      setSuccess(true)
      setTimeout(() => {
        navigate(`/companies/${id}`)
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
            onClick={() => navigate(`/companies/${id}`)}
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
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
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
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="Add a service..."
                    className="flex-1 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-4 py-2 bg-[var(--brand)] text-white text-xs font-semibold rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
                  >
                    Add
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
                        className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2 mb-3">
                  Tags
                </h2>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    className="flex-1 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-[var(--accent-dark)] text-white text-xs font-semibold rounded-xl hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    Add
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
                        className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--border-light)]">
              <button
                type="button"
                onClick={() => navigate(`/companies/${id}`)}
                className="px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[var(--brand)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--brand-light)] transition-all shadow-md cursor-pointer disabled:opacity-50"
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
