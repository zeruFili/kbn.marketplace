import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  fetchEventById,
  updateEvent,
  type EventApiResponse,
} from "../../api/eventsApi"
import { resolveAssetUrl } from "../../api/baseApi"

const EVENT_TYPES = [
  "Workshop",
  "Conference",
  "Fellowship",
  "Meetup",
  "Hackathon",
  "Webinar",
  "General",
]

function formatForDateTimeLocal(isoString?: string): string {
  if (!isoString) return ""
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ""
    // Format to YYYY-MM-DDTHH:mm
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ""
  }
}

export default function AdminEventEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Event form fields
  const [title, setTitle] = useState("")
  const [type, setType] = useState("Workshop")
  const [startDate, setStartDate] = useState("")
  const [location, setLocation] = useState("Addis Ababa, Ethiopia")
  const [status, setStatus] = useState<"published" | "draft">("published")
  const [availability, setAvailability] = useState<"public" | "private">("public")
  const [description, setDescription] = useState("")

  // Image management state
  const [existingImageUrl, setExistingImageUrl] = useState<string>("")
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Auto clean-up object URLs
  useEffect(() => {
    if (!newImageFile) {
      setNewImagePreview(null)
      return
    }
    const url = URL.createObjectURL(newImageFile)
    setNewImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [newImageFile])

  useEffect(() => {
    if (!id) return
    let isMounted = true
    setLoading(true)
    setError("")

    fetchEventById(id)
      .then((data: EventApiResponse | null) => {
        if (!isMounted) return
        if (data) {
          setTitle(data.title || "")
          setType(data.type || "Workshop")
          setStartDate(formatForDateTimeLocal(data.start_date))
          setLocation(data.location || "Addis Ababa, Ethiopia")
          setStatus(data.status?.toLowerCase() === "published" ? "published" : "draft")
          setAvailability(data.availability?.toLowerCase() === "private" ? "private" : "public")
          setDescription(data.description || "")

          if (data.images && data.images.length > 0 && data.images[0]) {
            setExistingImageUrl(data.images[0])
          }
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

  function handleFileSelected(file: File) {
    setError("")
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/svg+xml"]
    if (!validTypes.includes(file.type) && !file.type.startsWith("image/")) {
      setError("Please select a supported image file (PNG, JPG, WebP, or SVG).")
      return
    }
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 10MB.`)
      return
    }
    setNewImageFile(file)
    setRemoveExistingImage(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelected(file)
  }

  function handleClearNewImage() {
    setNewImageFile(null)
    setNewImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  function handleRemoveImage() {
    handleClearNewImage()
    setRemoveExistingImage(true)
  }

  function handleRestoreExistingImage() {
    handleClearNewImage()
    setRemoveExistingImage(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!id) return
    if (!title.trim()) {
      setError("Event title is required.")
      return
    }
    if (!startDate) {
      setError("Event start date & time is required.")
      return
    }
    if (!description.trim()) {
      setError("Event description is required.")
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("title", title.trim())
      formData.append("type", type.trim())
      formData.append("location", location.trim())
      formData.append("description", description.trim())
      formData.append("start_date", startDate)
      formData.append("status", status)
      formData.append("availability", availability)

      // Handle image updates
      if (newImageFile) {
        // Upload new image file
        formData.append("image", newImageFile)
      } else if (removeExistingImage) {
        // Request backend to remove image
        formData.append("removeImage", "true")
      }
      // If neither, existing image remains untouched on backend

      const res = await updateEvent(id, formData)
      if (res.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate(`/admin/events/${id}`)
        }, 600)
      } else {
        setError(res.message || "Failed to update event. Please check the details.")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred while updating the event.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-12 text-center animate-fade-in">
        <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
        <h2 className="font-serif text-lg text-[var(--text-primary)]">Loading Event Form...</h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Fetching current event settings</p>
      </div>
    )
  }

  const resolvedExistingImage = existingImageUrl ? resolveAssetUrl(existingImageUrl) : ""

  return (
    <div className="max-w-3xl mx-auto animate-scale-in">
      {/* Top Header Navigation (Separated from the card, matching dashboard design) */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate(`/admin/events/${id}`)}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-light)] transition-colors cursor-pointer"
        >
          <span aria-hidden="true">←</span> Back to details
        </button>
        <span className="text-xs text-[var(--text-tertiary)]">ID: {id?.slice(0, 8)}...</span>
      </div>

      {/* Main Edit Form Card */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border-light)] p-6 md:p-10 mb-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header with Icon Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-light)] pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/25 flex items-center justify-center flex-shrink-0 shadow-xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-dark)] block">
                  Event Management · Edit Details
                </span>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                  Edit Event
                </h2>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
              <span>✅</span>
              <span>Event updated successfully! Redirecting to details...</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2.5">
              <svg className="w-4 h-4 text-[var(--accent-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>1. Basic Information</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Architecture & Urban Design Summit"
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Event Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer transition-all"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer transition-all"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Availability
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as "public" | "private")}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer transition-all"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Schedule & Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2.5">
              <svg className="w-4 h-4 text-[var(--accent-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>2. Schedule & Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Addis Ababa or Online"
                  className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Event Cover Image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-2.5">
              <div className="flex items-center gap-2 text-sm font-serif font-bold text-[var(--text-primary)]">
                <svg className="w-4 h-4 text-[var(--accent-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>3. Event Cover Image</span>
              </div>
              {removeExistingImage && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Image marked for removal
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Upload a replacement image from your device or remove the background image. If left untouched, the existing image will be kept.
            </p>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/jpg, image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(file)
              }}
              className="hidden"
            />

            {/* Case 1: A NEW image file was selected */}
            {newImagePreview ? (
              <div className="p-4 rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
                <div className="w-full sm:w-48 h-28 rounded-xl overflow-hidden border border-[var(--border-light)] bg-black/10 flex-shrink-0">
                  <img
                    src={newImagePreview}
                    alt="New image preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--brand)] text-white">
                      New Image Selected
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {newImageFile?.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    {newImageFile ? (newImageFile.size / (1024 * 1024)).toFixed(2) : 0} MB · {newImageFile?.type || "Image"}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                    >
                      Change File
                    </button>
                    <span className="text-[var(--text-tertiary)]">·</span>
                    <button
                      type="button"
                      onClick={handleClearNewImage}
                      className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      Cancel New Selection
                    </button>
                  </div>
                </div>
              </div>
            ) : resolvedExistingImage && !removeExistingImage ? (
              /* Case 2: Showing currently stored background image */
              <div className="p-4 rounded-2xl border border-[var(--border-light)] bg-[var(--surface-alt)] flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
                <div className="w-full sm:w-48 h-28 rounded-xl overflow-hidden border border-[var(--border-light)] bg-black/10 flex-shrink-0">
                  <img
                    src={resolvedExistingImage}
                    alt="Current event background"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[var(--text-secondary)]">
                      Current Cover Image
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {existingImageUrl}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Replace Image
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Image
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Case 3: Empty or image marked for removal - show upload dropzone */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--brand)] rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[var(--surface-alt)] hover:bg-[var(--surface-alt)]/80 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-3 text-2xl group-hover:scale-105 transition-transform shadow-xs">
                  🖼️
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Click to upload or drag & drop replacement background image
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  PNG, JPG, WebP, or SVG (max 10MB)
                </p>
                <span className="inline-block bg-[var(--surface)] border border-[var(--border-default)] text-xs font-semibold px-4 py-2 rounded-xl text-[var(--text-secondary)] group-hover:border-[var(--brand)] group-hover:text-[var(--brand)] transition-colors shadow-xs">
                  Browse Files
                </span>
                {removeExistingImage && existingImageUrl && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRestoreExistingImage()
                      }}
                      className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                    >
                      Keep previous image instead
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Event Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2.5">
              <svg className="w-4 h-4 text-[var(--accent-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>4. Event Description <span className="text-red-500">*</span></span>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide event details, schedule, speaker information, or venue notes..."
              className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl p-4 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition-all leading-relaxed"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-[var(--border-light)] flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(`/admin/events/${id}`)}
              disabled={saving}
              className="text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-light)] rounded-xl transition-all shadow-md shadow-[var(--brand)]/15 cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
