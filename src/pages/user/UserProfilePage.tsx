import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../auth/AuthContext"
import { fetchUserById, updateUserApi, resolveAssetUrl, type UserProfileResponse } from "../../api"
import UserAvatar from "../../components/common/UserAvatar"

interface LiveProfileForm {
  fullName: string
  phone: string
  website: string
  education: string
  achievement: string
  professionalExperience: string
  profilePhoto: string
}

export default function UserProfilePage() {
  const { user, updateUser: updateAuthUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [form, setForm] = useState<LiveProfileForm>({
    fullName: "",
    phone: "",
    website: "",
    education: "",
    achievement: "",
    professionalExperience: "",
    profilePhoto: "",
  })

  // File upload state for inline edit
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadUserData = async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const fresh = await fetchUserById(user.id)
      if (fresh) {
        populateFromUser(fresh)
      } else {
        // Fallback to basic session info
        setForm((prev) => ({
          ...prev,
          fullName: user.name || "",
          profilePhoto: user.profileImage || user.avatar || "",
          phone: user.phone || "",
        }))
      }
    } catch (err: any) {
      console.warn("Could not load user profile:", err)
      setError("Unable to load latest profile data from server.")
    } finally {
      setLoading(false)
    }
  }

  const populateFromUser = (fresh: UserProfileResponse) => {
    const rawImage = fresh.profileImage || fresh.profile_image
    const resolvedImg = rawImage ? resolveAssetUrl(rawImage) : ""

    setForm({
      fullName: fresh.fullName || fresh.full_name || user?.name || "",
      phone: fresh.phone || "",
      website: fresh.website || "",
      education: fresh.education || "",
      achievement: fresh.achievement || "",
      professionalExperience:
        fresh.professional_experience || fresh.professionalExperience || "",
      profilePhoto: resolvedImg,
    })
  }

  useEffect(() => {
    void loadUserData()
  }, [user?.id])

  // Object URL preview lifecycle
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  if (!user) return null

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP).")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size exceeds the 5MB limit.")
      return
    }

    setError(null)
    setImageFile(file)
    setImageRemoved(false)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageRemoved(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const cancelEdit = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageRemoved(false)
    setError(null)
    setEditing(false)
    void loadUserData()
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSuccessMsg(null)
    setSaving(true)

    try {
      let finalAvatarUrl = imageRemoved ? "" : form.profilePhoto

      if (imageFile) {
        const formData = new FormData()
        formData.append("full_name", form.fullName.trim())
        if (form.phone.trim()) formData.append("phone", form.phone.trim())
        if (form.website.trim()) formData.append("website", form.website.trim())
        if (form.education.trim()) formData.append("education", form.education.trim())
        if (form.achievement.trim()) formData.append("achievement", form.achievement.trim())
        if (form.professionalExperience.trim()) {
          formData.append("professional_experience", form.professionalExperience.trim())
        }
        formData.append("profileImage", imageFile)

        const res = await updateUserApi(user.id, formData)
        if (res.data?.profileImage || (res.data as any)?.profile_image) {
          const raw = res.data?.profileImage || (res.data as any)?.profile_image
          finalAvatarUrl = resolveAssetUrl(raw)
        }
      } else if (imageRemoved) {
        const formData = new FormData()
        formData.append("full_name", form.fullName.trim())
        if (form.phone.trim()) formData.append("phone", form.phone.trim())
        if (form.website.trim()) formData.append("website", form.website.trim())
        if (form.education.trim()) formData.append("education", form.education.trim())
        if (form.achievement.trim()) formData.append("achievement", form.achievement.trim())
        if (form.professionalExperience.trim()) {
          formData.append("professional_experience", form.professionalExperience.trim())
        }
        formData.append("remove_profile_image", "true")

        await updateUserApi(user.id, formData)
        finalAvatarUrl = ""
      } else {
        await updateUserApi(user.id, {
          full_name: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          education: form.education.trim() || undefined,
          achievement: form.achievement.trim() || undefined,
          professional_experience: form.professionalExperience.trim() || undefined,
        })
      }

      // Update auth session across the app
      updateAuthUser({
        name: form.fullName.trim(),
        avatar: finalAvatarUrl || "",
        profileImage: finalAvatarUrl || null,
        phone: form.phone.trim() || undefined,
      })

      setForm((prev) => ({
        ...prev,
        profilePhoto: finalAvatarUrl,
      }))
      setImageFile(null)
      setImagePreview(null)
      setImageRemoved(false)
      setEditing(false)
      setSuccessMsg("Profile updated successfully.")
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: any) {
      console.error("Failed to update profile:", err)
      setError(err?.message || "Failed to save profile changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const currentDisplayPhoto =
    imagePreview || (!imageRemoved ? form.profilePhoto : "") || user.profileImage || user.avatar

  const achievementList = form.achievement
    ? form.achievement
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean)
    : []

  if (loading) {
    return (
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border-light)] p-12 text-center animate-fade-in">
        <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--text-tertiary)]">Loading profile information...</p>
      </div>
    )
  }

  return (
    <section className="bg-[var(--surface)] rounded-3xl border border-[var(--border-light)] p-6 md:p-10 shadow-xs animate-fade-in">
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* VIEW MODE */}
      {!editing ? (
        <>
          {/* Header Row: Avatar, Name, and Edit Button (without role and without status) */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-8">
            <div className="flex items-start gap-5">
              <UserAvatar
                src={form.profilePhoto || user.profileImage || user.avatar}
                name={form.fullName || user.name}
                size="xl"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-sm border border-[var(--border-light)]"
              />
              <div className="min-w-0">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--brand)] dark:text-[var(--text-primary)] leading-tight">
                  {form.fullName || user.name}
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{user.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setError(null)
                setEditing(true)
              }}
              className="px-6 py-2 rounded-full text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer self-start"
            >
              Edit
            </button>
          </div>

          {/* 2-Column Detail Cards Grid displaying only existing database columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <ProfileDetail
              label="EMAIL"
              value={user.email}
              href={`mailto:${user.email}`}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              }
            />

            <ProfileDetail
              label="PHONE NUMBER"
              value={form.phone}
              href={form.phone ? `tel:${form.phone}` : undefined}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              }
            />

            <ProfileDetail
              label="WEBSITE"
              value={form.website}
              href={
                form.website
                  ? form.website.startsWith("http")
                    ? form.website
                    : `https://${form.website}`
                  : undefined
              }
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.21-2.49 3.5-5.53 3.5-9S14.21 5.49 12 3m0 18c-2.21-2.49-3.5-5.53-3.5-9S9.79 5.49 12 3m-9 9h18"
                />
              }
            />

            <ProfileDetail
              label="EDUCATION"
              value={form.education}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
              }
            />

            <div className="md:col-span-2">
              <ProfileDetail
                label="PROFESSIONAL EXPERIENCE"
                value={form.professionalExperience}
                icon={
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-10-2h4v2h-4V5z"
                  />
                }
              />
            </div>

            <div className="md:col-span-2">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-5 shadow-[0_2px_12px_rgba(15,29,58,0.03)] hover:border-[var(--border-default)] transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/15">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="7" strokeWidth={1.8} stroke="currentColor" fill="none" />
                    </svg>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[var(--text-tertiary)]">
                    ACHIEVEMENTS
                  </p>
                </div>
                {achievementList.length > 0 ? (
                  <ul className="space-y-2 pl-2">
                    {achievementList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-[var(--text-primary)]">
                        <span className="text-[var(--accent-dark)] font-bold mt-0.5">✦</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Not provided</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* INLINE EDIT MODE */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-light)]">
            <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
              Edit Profile
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Profile Photo Uploader */}
          <div className="p-4 sm:p-5 bg-[var(--surface-alt)] border border-[var(--border-light)] rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <UserAvatar
              src={currentDisplayPhoto}
              name={form.fullName || user.name}
              size="xl"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-2 ring-[var(--border-light)]"
            />
            <div className="flex-1 text-center sm:text-left min-w-0">
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Profile Photo
              </label>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                Upload a clear photo (JPG, PNG, WebP up to 5MB).
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors cursor-pointer shadow-xs"
                >
                  {currentDisplayPhoto ? "Change Photo" : "Upload Photo"}
                </button>
                {currentDisplayPhoto && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          {/* Inputs for existing database columns only */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+251 9..."
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Website
              </label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Education
              </label>
              <input
                type="text"
                value={form.education}
                onChange={(e) => setForm((prev) => ({ ...prev, education: e.target.value }))}
                placeholder="Degree or certification..."
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Professional Experience
              </label>
              <textarea
                rows={3}
                value={form.professionalExperience}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, professionalExperience: e.target.value }))
                }
                placeholder="Work history, roles, or background..."
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                Achievements (one per line)
              </label>
              <textarea
                rows={4}
                value={form.achievement}
                onChange={(e) => setForm((prev) => ({ ...prev, achievement: e.target.value }))}
                placeholder="Key accomplishments or milestones..."
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-light)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function ProfileDetail({
  label,
  value,
  icon,
  href,
}: {
  label: string
  value?: string | null
  icon: React.ReactNode
  href?: string
}) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-4 sm:p-5 flex items-center gap-4 shadow-[0_2px_12px_rgba(15,29,58,0.03)] hover:border-[var(--border-default)] transition-all group">
      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/15 shadow-xs transition-transform duration-200 group-hover:scale-105">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[var(--text-tertiary)] mb-1">
          {label}
        </p>
        {href && value ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors break-words leading-snug line-clamp-2"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-semibold text-[var(--text-primary)] break-words leading-snug">
            {value || "Not provided"}
          </p>
        )}
      </div>
    </div>
  )
}
