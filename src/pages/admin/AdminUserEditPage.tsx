import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  getAdminUserById,
  updateAdminUser,
  type AdminUser,
} from "../../data/adminStore"

export default function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<AdminUser | undefined>(() =>
    id ? getAdminUserById(id) : undefined,
  )

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "company" | "user">("user")
  const [business, setBusiness] = useState("")
  const [status, setStatus] = useState<"active" | "deactivated">("active")
  const [avatar, setAvatar] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    const u = getAdminUserById(id)
    if (u) {
      setUser(u)
      setName(u.name)
      setEmail(u.email)
      setRole(u.role)
      setBusiness(u.business || "")
      setStatus(u.status)
      setAvatar(u.avatar || "")
    }
  }, [id])

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8 text-center animate-fade-in">
        <div className="text-3xl mb-3">👤</div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          User Not Found
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          Could not find a user with ID "{id}".
        </p>
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
        >
          ← Back to Users
        </button>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Name is required")
      return
    }
    if (!email.trim()) {
      setError("Email is required")
      return
    }

    setSaving(true)
    setError("")

    updateAdminUser(user.id, {
      name: name.trim(),
      email: email.trim(),
      role,
      business: business.trim() || undefined,
      status,
      avatar: avatar.trim() || user.avatar,
    })

    setTimeout(() => {
      setSaving(false)
      navigate(`/admin/users/${user.id}`)
    }, 200)
  }

  return (
    <div className="max-w-2xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden animate-scale-in">
      <div className="bg-[var(--brand-dark)] px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(`/admin/users/${user.id}`)}
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
        <span className="text-sm font-semibold text-white">Edit User Profile</span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <img
            src={avatar || user.avatar}
            alt=""
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[var(--border-light)]"
          />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              User Role
            </label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "admin" | "company" | "user")
              }
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            >
              <option value="user">User (Individual Member)</option>
              <option value="company">Company (Business Owner)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "active" | "deactivated")
              }
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            >
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Business / Organization Name
            </label>
            <input
              type="text"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder="e.g. Selam Build Collective"
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-light)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/admin/users/${user.id}`)}
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
    </div>
  )
}
