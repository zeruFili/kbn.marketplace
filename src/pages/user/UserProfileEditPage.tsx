import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import {
  getUserDashboardData,
  updateUserProfile,
  type UserProfileData,
} from "../../data/userDataStore"

export default function UserProfileEditPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<UserProfileData | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const data = getUserDashboardData(user.email, user)
    setForm({ ...data.profile })
  }, [user])

  if (!user || !form) return null

  const update = <K extends keyof UserProfileData>(
    key: K,
    value: UserProfileData[K],
  ) => {
    setForm((curr) => (curr ? { ...curr, [key]: value } : null))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    updateUserProfile(user.email, form)
    setTimeout(() => {
      setSaving(false)
      navigate("/dashboard/profile")
    }, 200)
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
          Cancel
        </button>
        <span className="text-sm font-semibold text-white">Edit Profile</span>
      </div>

      <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-5">
          <img
            src={form.profilePhoto}
            alt=""
            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[var(--border-light)]"
          />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Profile Photo URL
            </label>
            <input
              type="url"
              value={form.profilePhoto}
              onChange={(e) => update("profilePhoto", e.target.value)}
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
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
