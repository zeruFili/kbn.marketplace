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
    <section className="bg-[var(--surface)] rounded-3xl border border-[var(--border-light)] p-6 md:p-10 shadow-xs animate-fade-in">
      {/* Header Row: Avatar, Info, and Pill Edit Button */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <img
            src={profile.profilePhoto}
            alt={profile.fullName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0 shadow-sm border border-[var(--border-light)]"
          />
          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--brand)] dark:text-[var(--text-primary)] leading-tight">
              {profile.fullName}
            </h1>
            <p className="text-sm font-semibold text-[var(--accent-dark)] mt-1">
              {profile.professionalTitle}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1.5">
              {profile.city}, {profile.country}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard/profile/edit")}
          className="px-6 py-2 rounded-full text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer self-start"
        >
          Edit
        </button>
      </div>

      {/* Bio Paragraph */}
      <p className="text-sm md:text-[15px] text-[var(--text-secondary)] leading-relaxed mt-6 mb-8 max-w-3xl">
        {profile.shortBio || "Not provided"}
      </p>

      {/* 2-Column Detail Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <ProfileDetail
          label="PHONE NUMBER"
          value={profile.phone}
          href={profile.phone ? `tel:${profile.phone}` : undefined}
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
          label="PROFESSIONAL EXPERIENCE"
          value={profile.professionalExperience}
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-10-2h4v2h-4V5z"
            />
          }
        />

        <ProfileDetail
          label="EDUCATION"
          value={profile.education}
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            />
          }
        />

        <ProfileDetail
          label="ACHIEVEMENTS"
          value={
            profile.achievements && profile.achievements.length > 0
              ? profile.achievements.join(" • ")
              : "Not provided"
          }
          icon={
            <circle
              cx="12"
              cy="12"
              r="7"
              strokeWidth={1.8}
              stroke="currentColor"
              fill="none"
            />
          }
        />

        <ProfileDetail
          label="WEBSITE"
          value={profile.website}
          href={
            profile.website
              ? profile.website.startsWith("http")
                ? profile.website
                : `https://${profile.website}`
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
          label="SOCIAL MEDIA"
          value={profile.socialMedia}
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
            />
          }
        />

        <ProfileDetail
          label="DIGITAL SLUG"
          value={
            profile.digitalSlug
              ? profile.digitalSlug.startsWith("/")
                ? profile.digitalSlug
                : `/${profile.digitalSlug}`
              : "Not provided"
          }
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M4 7a5 5 0 015-5h6a5 5 0 010 10h-2m7 5a5 5 0 01-5 5H9a5 5 0 010-10h2"
            />
          }
        />
      </div>
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
  value?: string
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
