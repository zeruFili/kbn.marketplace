import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import { fetchUserById, updateUserApi, resolveAssetUrl } from "../../api"
import UserAvatar from "../../components/common/UserAvatar"

interface ProfileFormState {
  fullName: string
  phone: string
  website: string
  education: string
  achievement: string
  professionalExperience: string
  profilePhoto: string
}

export default function UserProfileEditPage() {
  const { user, updateUser: updateAuthUser } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<ProfileFormState>({
    fullName: "",
    phone: "",
    website: "",
    education: "",
    achievement: "",
    professionalExperience: "",
    profilePhoto: "",
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false
    setLoading(true)

    fetchUserById(user.id)
      .then((fresh) => {
        if (cancelled) return
        if (fresh) {
          const raw = fresh.profileImage || fresh.profile_image
          setForm({
            fullName: fresh.fullName || fresh.full_name || user.name || "",
            phone: fresh.phone || "",
            website: fresh.website || "",
            education: fresh.education || "",
            achievement: fresh.achievement || "",
            professionalExperience:
              fresh.professional_experience || fresh.professionalExperience || "",
            profilePhoto: raw ? resolveAssetUrl(raw) : "",
          })
        } else {
          setForm({
            fullName: user.name || "",
            phone: user.phone || "",
            website: "",
            education: "",
            achievement: "",
            professionalExperience: "",
            profilePhoto: user.profileImage || user.avatar || "",
          })
        }
      })
      .catch((err) => {
        console.warn("Could not load user data for edit:", err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
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
      setError("Selected image file size exceeds the 5MB limit.")
      return
    }

    setError("")
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError("")
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

      updateAuthUser({
        name: form.fullName.trim(),
        avatar: finalAvatarUrl || "",
        profileImage: finalAvatarUrl || null,
        phone: form.phone.trim() || undefined,
      })

      navigate("/dashboard/profile")
    } catch (err: any) {
      console.error("Failed to update profile:", err)
      setError(err?.message || "Failed to save profile changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const currentPhotoUrl =
    imagePreview || (!imageRemoved ? form.profilePhoto : "") || user.profileImage || user.avatar

  if (loading) {
    return (
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-12 text-center animate-fade-in">
        <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--text-tertiary)]">Loading profile...</p>
      </section>
    )
  }

  return (
    <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden animate-scale-in">
      <div className="bg-[var(--brand-dark)] px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/dashboard/profile")}
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
          Back to Profile
        </button>
        <span className="text-sm font-semibold text-white">Edit Profile</span>
      </div>

      <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Profile Image Upload & Preview Section */}
        <div className="p-4 sm:p-5 bg-[var(--surface-alt)] border border-[var(--border-light)] rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <UserAvatar
              src={currentPhotoUrl}
              name={form.fullName || user.name}
              size="xl"
              className="w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-[var(--border-light)]"
            />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Profile Photo
            </label>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Upload a photo from your device (Max 5MB).
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors cursor-pointer shadow-xs"
              >
                {currentPhotoUrl ? "Change Photo" : "Upload Photo"}
              </button>

              {currentPhotoUrl && (
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

        {/* Existing Database Fields only */}
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
            onClick={() => navigate("/dashboard/profile")}
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
    </section>
  )
}
