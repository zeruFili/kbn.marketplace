import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import {
  getUserDashboardData,
  userSubscribe,
  type UserDashboardData,
} from "../../data/userDataStore"

export default function UserProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState<UserDashboardData>(() =>
    getUserDashboardData(user?.email || "", user ?? undefined),
  )

  useEffect(() => {
    if (!user) return
    const refresh = () => {
      setData(getUserDashboardData(user.email, user))
    }
    refresh()
    return userSubscribe(refresh)
  }, [user])

  if (!user) return null

  const profile = data.profile

  return (
    <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
        <div className="flex items-center gap-5">
          <img
            src={profile.profilePhoto}
            alt={profile.fullName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-[var(--brand)]/10"
          />
          <div>
            <h2 className="font-serif text-2xl text-[var(--text-primary)]">
              {profile.fullName}
            </h2>
            <p className="text-sm text-[var(--accent-dark)] mt-1">
              {profile.professionalTitle}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">
              {profile.city}, {profile.country}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard/profile/edit")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Short Bio
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {profile.shortBio || "Not provided"}
          </p>
        </div>

        <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Phone & Email
          </p>
          <p className="text-sm text-[var(--text-primary)] font-medium">
            {profile.phone || "No phone"}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {profile.email || user.email}
          </p>
        </div>

        <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Professional Experience
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {profile.professionalExperience || "Not provided"}
          </p>
        </div>

        <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Education
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {profile.education || "Not provided"}
          </p>
        </div>

        <div className="sm:col-span-2 bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Achievements
          </p>
          {profile.achievements && profile.achievements.length > 0 ? (
            <ul className="space-y-1.5">
              {profile.achievements.map((item, idx) => (
                <li
                  key={idx}
                  className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                >
                  <span className="text-[var(--accent)] font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              No achievements listed.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
