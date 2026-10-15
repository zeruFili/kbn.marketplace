import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import {
  getUserDashboardData,
  updateUserProfile,
  type UserProfileData,
} from "../../data/userDataStore"
import { updateUserApi, resolveAssetUrl } from "../../api"
import UserAvatar from "../../components/common/UserAvatar"

export default function UserProfileEditPage() {
  const { user, updateUser: updateAuthUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<UserProfileData | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    const data = getUserDashboardData(user.email, user)
    setForm({ ...data.profile })
  }, [user])

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

  if (!user || !form) return null

  const update = <K extends keyof UserProfileData>(
    key: K,
    value: UserProfileData[K],
  ) => {
    setForm((curr) => (curr ? { ...curr, [key]: value } : null))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP, etc.).")
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
    if (!form || !user) return
    setError("")
    setSaving(true)

    try {
      let finalAvatarUrl = imageRemoved ? "" : form.profilePhoto

      if (imageFile) {
        const formData = new FormData()
        formData.append("full_name", form.fullName)
        if (form.phone && form.phone !== "Not provided") {
          formData.append("phone", form.phone)
        }
        if (form.website && form.website !== "Not provided") {
          formData.append("website", form.website)
        }
        formData.append("profileImage", imageFile)

        const res = await updateUserApi(user.id, formData)
        if (res.data?.profileImage) {
          finalAvatarUrl = resolveAssetUrl(res.data.profileImage)
        }
      } else if (imageRemoved) {
        const formData = new FormData()
        formData.append("full_name", form.fullName)
        if (form.phone && form.phone !== "Not provided") {
          formData.append("phone", form.phone)
        }
        if (form.website && form.website !== "Not provided") {
          formData.append("website", form.website)
        }
        formData.append("remove_profile_image", "true")

        await updateUserApi(user.id, formData)
        finalAvatarUrl = ""
      } else {
        // Preserving existing photo
        await updateUserApi(user.id, {
          full_name: form.fullName,
          phone: form.phone && form.phone !== "Not provided" ? form.phone : undefined,
          website: form.website && form.website !== "Not provided" ? form.website : undefined,
        })
      }

      const updatedProfile: UserProfileData = {
        ...form,
        profilePhoto: finalAvatarUrl,
      }
      updateUserProfile(user.email, updatedProfile)

      updateAuthUser({
        name: form.fullName,
        avatar: finalAvatarUrl || `https://i.pravatar.cc/96?u=${user.id}`,
        profileImage: finalAvatarUrl || null,
      })

      navigate("/dashboard/profile")
    } catch (err: any) {
      console.error("Failed to update profile:", err)
      setError(err?.message || "Failed to save profile changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Determine current image to preview in UI
  const currentPhotoUrl = imagePreview || (!imageRemoved ? form.profilePhoto : "")

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
          Cancel
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
              name={form.fullName}
              size="xl"
              className="w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-[var(--border-light)]"
            />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Profile Photo
            </label>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Upload a clear photo from your device. Supported formats: JPG, PNG, WebP, GIF (Max 5MB).
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
              accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Professional Title
            </label>
            <input
              type="text"
              value={form.professionalTitle}
              onChange={(e) => update("professionalTitle", e.target.value)}
              placeholder="e.g. Managing Partner, Architect"
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
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+251 9..."
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              City
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Addis Ababa"
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Country
            </label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              placeholder="Ethiopia"
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Website
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://..."
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Short Bio
            </label>
            <textarea
              rows={3}
              value={form.shortBio}
              onChange={(e) => update("shortBio", e.target.value)}
              placeholder="Brief professional intro..."
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Professional Experience
            </label>
            <textarea
              rows={3}
              value={form.professionalExperience}
              onChange={(e) => update("professionalExperience", e.target.value)}
              placeholder="Career background and key roles..."
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Achievements (one per line)
            </label>
            <textarea
              rows={4}
              value={form.achievements.join("\n")}
              onChange={(e) =>
                update(
                  "achievements",
                  e.target.value
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Leadership Award 2024&#10;Founded Christian Youth Fellowship"
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
