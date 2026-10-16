import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  fetchAdminUserById,
  updateUserApi,
  updateUserRoleApi,
  updateUserStatusApi,
  type UserProfileResponse,
} from "../../api/userApi"
import { resolveAssetUrl } from "../../api/baseApi"
import UserAvatar from "../../components/common/UserAvatar"

export default function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // User & Form State
  const [user, setUser] = useState<UserProfileResponse | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<string>("user")
  const [status, setStatus] = useState<string>("active")
  const [website, setWebsite] = useState("")
  const [education, setEducation] = useState("")
  const [achievement, setAchievement] = useState("")
  const [professionalExperience, setProfessionalExperience] = useState("")

  // Photo upload state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)

  // Submit states
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load user data from real database
  useEffect(() => {
    if (!id) return
    let active = true
    setPageLoading(true)
    setLoadError("")

    fetchAdminUserById(id)
      .then((data) => {
        if (!active) return
        if (data) {
          setUser(data)
          setName(data.fullName || data.full_name || data.name || "")
          setEmail(data.email || "")
          setPhone(data.phone || "")
          setRole((data.role || "user").toLowerCase())
          setStatus((data.status || (data.is_active ? "active" : "inactive")).toLowerCase())
          setWebsite(data.website || "")
          setEducation(data.education || "")
          setAchievement(data.achievement || "")
          setProfessionalExperience(
            data.professional_experience || data.professionalExperience || ""
          )
          setImageFile(null)
          setImageRemoved(false)
        } else {
          setLoadError(`User with ID "${id}" could not be found in database.`)
        }
      })
      .catch((err: any) => {
        if (!active) return
        setLoadError(err?.message || "Failed to load user details from server.")
      })
      .finally(() => {
        if (active) setPageLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  // Manage image preview
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

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

  if (pageLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center animate-fade-in">
        <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-[var(--text-tertiary)]">
          Loading user record for editing...
        </p>
      </div>
    )
  }

  if (loadError || !user) {
    return (
      <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8 text-center animate-fade-in">
        <div className="text-3xl mb-3">👤</div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          User Not Found
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          {loadError || `Could not find a user with ID "${id}".`}
        </p>
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
        >
          ← Back to Users List
        </button>
      </div>
    )
  }

  const currentPhotoUrl =
    imagePreview ||
    (!imageRemoved
      ? resolveAssetUrl(user.profileImage || user.profile_image || user.avatar || "")
      : "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Full name is required.")
      return
    }
    if (!email.trim()) {
      setError("Email address is required.")
      return
    }

    setSaving(true)
    setError("")

    try {
      // 1. Update Profile Fields (with multipart/form-data if image included)
      if (imageFile) {
        const formData = new FormData()
        formData.append("full_name", name.trim())
        formData.append("email", email.trim())
        formData.append("phone", phone.trim())
        formData.append("role", role)
        formData.append("status", status)
        formData.append("website", website.trim())
        formData.append("education", education.trim())
        formData.append("achievement", achievement.trim())
        formData.append("professional_experience", professionalExperience.trim())
        formData.append("profileImage", imageFile)

        await updateUserApi(user.id, formData)
      } else if (imageRemoved) {
        const formData = new FormData()
        formData.append("full_name", name.trim())
        formData.append("email", email.trim())
        formData.append("phone", phone.trim())
        formData.append("role", role)
        formData.append("status", status)
        formData.append("website", website.trim())
        formData.append("education", education.trim())
        formData.append("achievement", achievement.trim())
        formData.append("professional_experience", professionalExperience.trim())
        formData.append("remove_profile_image", "true")

        await updateUserApi(user.id, formData)
      } else {
        await updateUserApi(user.id, {
          full_name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          status,
          website: website.trim() || undefined,
          education: education.trim() || undefined,
          achievement: achievement.trim() || undefined,
          professional_experience: professionalExperience.trim() || undefined,
        })
      }

      // 2. Also ensure Role and Status endpoints are synced if changed
      if (user.role?.toLowerCase() !== role.toLowerCase()) {
        await updateUserRoleApi(user.id, role)
      }
      if (user.status?.toLowerCase() !== status.toLowerCase()) {
        await updateUserStatusApi(user.id, status)
      }

      navigate(`/admin/users/${user.id}`)
    } catch (err: any) {
      console.error("Failed to update user:", err)
      setError(
        err?.message ||
          "Failed to save user changes. Please review the form and try again."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden shadow-xs animate-scale-in">
      {/* Header Banner */}
      <div className="bg-[var(--brand-dark)] px-6 py-4 flex items-center justify-between text-white">
        <button
          onClick={() => navigate(`/admin/users/${user.id}`)}
          className="flex items-center gap-2 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <span aria-hidden="true">←</span> Cancel & Return
        </button>
        <span className="text-sm font-semibold text-white">
          Edit User: {name || user.email}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Profile Image Section */}
        <div className="p-5 bg-[var(--surface-alt)] border border-[var(--border-light)] rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <UserAvatar
              src={currentPhotoUrl}
              name={name || "User"}
              size="xl"
              className="w-20 h-20 rounded-2xl ring-2 ring-[var(--border-light)]"
            />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Profile Photo
            </label>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Upload a user avatar from device (JPG, PNG, WebP, max 5MB).
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

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Samuel Bekele"
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 91 123 4567"
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
            >
              <option value="user">User (Individual Member)</option>
              <option value="company">Company (Business Owner)</option>
              <option value="church">Church</option>
              <option value="ministry">Ministry</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive / Deactivated</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Website / Portfolio
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          {/* Education */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Education
            </label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. B.Sc. in Civil Engineering, Addis Ababa University"
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          {/* Professional Experience */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Professional Experience
            </label>
            <textarea
              rows={3}
              value={professionalExperience}
              onChange={(e) => setProfessionalExperience(e.target.value)}
              placeholder="Brief summary of professional experience and career background..."
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none"
            />
          </div>

          {/* Key Achievements */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Key Achievements (one per line)
            </label>
            <textarea
              rows={3}
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              placeholder="Founded XYZ Collective&#10;Awarded Top Innovator 2023"
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[var(--border-light)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/admin/users/${user.id}`)}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
