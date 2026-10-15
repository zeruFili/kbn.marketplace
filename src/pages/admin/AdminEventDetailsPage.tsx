import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  fetchEventById,
  deleteEventApi,
  type EventApiResponse,
} from "../../api/eventsApi"
import { resolveAssetUrl } from "../../api/baseApi"

export default function AdminEventDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    if (!id) return
    let isMounted = true
    setLoading(true)
    setError("")

    fetchEventById(id)
      .then((data) => {
        if (!isMounted) return
        if (data) {
          setEvent(data)
        } else {
          setError(`Could not find event with ID "${id}".`)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Failed to load event details.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    setDeleteError("")

    const res = await deleteEventApi(id)
    if (res.success) {
      setDeleting(false)
      setShowDeleteModal(false)
      navigate("/admin/events")
    } else {
      setDeleting(false)
      setDeleteError(res.message || "Failed to delete event. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-12 text-center animate-fade-in">
        <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
        <h2 className="font-serif text-lg text-[var(--text-primary)]">Loading Event Details...</h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Fetching event data from server</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8 text-center animate-fade-in">
        <div className="text-4xl mb-3">📅</div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          Event Not Found
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          {error || `Could not find event with ID "${id}".`}
        </p>
        <button
          onClick={() => navigate("/admin/events")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
        >
          ← Back to Events
        </button>
      </div>
    )
  }

  const rawImage = event.images && event.images.length > 0 ? event.images[0] : ""
  const bannerImage = rawImage ? resolveAssetUrl(rawImage) : ""

  const formattedDate = event.start_date
    ? new Date(event.start_date).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "Date not specified"

  const isPublished = event.status?.toLowerCase() === "published"

  return (
    <div className="max-w-4xl mx-auto animate-scale-in">
      {/* Top Header Navigation & Actions (Separated from the card, matching dashboard design) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/events")}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors cursor-pointer"
        >
          <span aria-hidden="true">←</span> Back to list
        </button>

        <div className="flex items-center gap-2.5">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isPublished
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {isPublished ? "Published" : "Draft"}
          </span>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-[var(--border-light)]">
            {event.availability === "private" ? "Private" : "Public"}
          </span>

          <button
            onClick={() => navigate(`/admin/events/${event.id}/edit`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-colors cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Edit
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden shadow-sm">

      {/* Hero Background / Banner Section */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 p-6 text-center">
            <span className="text-5xl mb-2">🖼️</span>
            <span className="text-xs uppercase tracking-wider font-semibold">No Background Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[var(--accent)] text-[var(--brand-dark)]">
              {event.type || "General"}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight drop-shadow-sm">
            {event.title}
          </h1>
          <p className="text-xs sm:text-sm text-white/85 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {event.location || "Addis Ababa, Ethiopia"}
            </span>
          </p>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="p-6 sm:p-8 space-y-8">
        {/* Description Section */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
            {event.description || "No description provided for this event."}
          </p>
        </div>

        {/* Info Grid Cards */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
            Event Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)] flex items-start gap-3.5 hover:border-[var(--border-default)] transition-all group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-0.5">Start Date</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{formattedDate}</p>
              </div>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)] flex items-start gap-3.5 hover:border-[var(--border-default)] transition-all group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-0.5">Location</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{event.location}</p>
              </div>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)] flex items-start gap-3.5 hover:border-[var(--border-default)] transition-all group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-0.5">Event Type</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{event.type}</p>
              </div>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)] flex items-start gap-3.5 hover:border-[var(--border-default)] transition-all group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-0.5">Availability</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{event.availability}</p>
              </div>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)] flex items-start gap-3.5 hover:border-[var(--border-default)] transition-all group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-0.5">Created By</p>
                <p className="text-sm font-mono font-semibold text-[var(--text-primary)] truncate">{event.created_by}</p>
              </div>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)] flex items-start gap-3.5 hover:border-[var(--border-default)] transition-all group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-0.5">Created At</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {new Date(event.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] max-w-md w-full p-6 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center text-2xl mb-4">
              🗑️
            </div>
            <h3 className="font-serif text-xl font-bold text-[var(--text-primary)] mb-2">
              Delete Event
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">"{event.title}"</span>? This will permanently remove the event record and delete its associated images. This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteError("")
                }}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                {deleting && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {deleting ? "Deleting Event..." : "Yes, Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
