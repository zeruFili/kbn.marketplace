import { useEffect, useMemo, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"

import {
  getPublicUserDashboardData,
  type UserArticleData,
  type UserEventData,
} from "../../data/userDataStore"
import {
  fetchEvents,
  createEvent,
  mapEventToUserEventData,
} from "../../api"

type ContentKind = "events" | "articles" | "blogs"

type ContentItem = UserArticleData | UserEventData

export default function AdminContent({ kind }: { kind: ContentKind }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")

  const [status, setStatus] = useState<"all" | "Published" | "Draft">("all")

  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const initialItems = useMemo<ContentItem[]>(() => {
    const members = getPublicUserDashboardData()

    return members.flatMap((member) =>
      kind === "events"
        ? member.events
        : kind === "articles"
          ? member.articles
          : member.blogs,
    )
  }, [kind])

  const [items, setItems] = useState<ContentItem[]>(initialItems)

  useEffect(() => {
    let active = true

    if (kind === "events") {
      setLoading(true)
      fetchEvents()
        .then((backendEvents) => {
          if (active) {
            if (backendEvents && backendEvents.length > 0) {
              setItems(backendEvents.map(mapEventToUserEventData))
            } else {
              setItems(initialItems)
            }
          }
        })
        .catch((err) => {
          console.warn("Could not load events from backend, using fallback:", err)
          if (active) setItems(initialItems)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    } else {
      setItems(initialItems)
    }

    setAdding(false)
    return () => {
      active = false
    }
  }, [kind, initialItems])

  function addItem(item: ContentItem) {
    setItems((current) => [item, ...current])

    setAdding(false)
  }

  const filtered = items.filter((item) => {
    if (status !== "all" && item.status !== status) return false

    if (!search) return true

    const query = search.toLowerCase()

    const text =
      "eventType" in item
        ? `${item.title} ${item.description} ${item.eventType} ${item.location}`
        : `${item.title} ${item.topic} ${item.excerpt} ${item.author}`

    return text.toLowerCase().includes(query)
  })

  const published = items.filter((item) => item.status === "Published").length

  const drafts = items.filter((item) => item.status === "Draft").length

  const title = kind[0].toUpperCase() + kind.slice(1)

  if (adding) {
    return (
      <div className="animate-fade-in">
        <AdminContentForm
          kind={kind}
          onCancel={() => setAdding(false)}
          onSubmit={addItem}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Manage community {kind}.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-light)] transition-colors"
        >
          <span aria-hidden="true">+</span>Add{" "}
          {kind === "events" ? "Event" : title.slice(0, -1)}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total",
            value: items.length,
            color: "border-l-[var(--brand)]",
          },

          {
            label: "Published",
            value: published,
            color: "border-l-emerald-500",
          },

          { label: "Drafts", value: drafts, color: "border-l-amber-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-[var(--surface)] rounded-xl border border-[var(--border-light)] border-l-4 ${stat.color} p-4`}
          >
            <div className="font-serif text-2xl text-[var(--text-primary)] font-bold">
              {stat.value}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-1 w-fit">
          {(["all", "Published", "Draft"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setStatus(option)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                status === option
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {option === "all" ? "All" : option}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder={`Search ${kind}...`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:w-64 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl py-2 px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <div className="w-8 h-8 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[var(--text-tertiary)]">Loading events from server...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border-light)]">
          <p className="text-sm text-[var(--text-tertiary)]">
            No {kind} found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-stagger">
          {filtered.map((item) => (
            <article
              key={item.id}
              onClick={() => {
                if (kind === "events") {
                  navigate(`/admin/events/${item.id}`)
                }
              }}
              className={`bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden card-hover transition-all ${
                kind === "events"
                  ? "cursor-pointer hover:border-[var(--brand)]/50 hover:shadow-lg"
                  : ""
              }`}
            >
              <img
                src={
                  "eventImage" in item ? item.eventImage : item.featuredImage
                }
                alt=""
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-dark)]">
                    {"eventType" in item ? item.eventType : item.topic}
                  </p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.status === "Published"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <h2 className="font-serif text-xl text-[var(--text-primary)] leading-tight">
                  {item.title}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3 line-clamp-3">
                  {"eventType" in item ? item.description : item.excerpt}
                </p>
                <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[var(--border-light)] text-xs text-[var(--text-tertiary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[var(--accent-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {"eventType" in item ? item.startDate : item.publishedDate}
                  </span>
                  {"eventType" in item && (
                    <span className="inline-flex items-center gap-1.5 truncate max-w-[50%]">
                      <svg className="w-3.5 h-3.5 text-[var(--accent-dark)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{item.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="text-xs text-[var(--text-tertiary)] mt-5">
        Managing {filtered.length} of {items.length} {title.toLowerCase()}.
      </p>
    </div>
  )
}

function AdminContentForm({
  kind,
  onCancel,
  onSubmit,
}: {
  kind: ContentKind
  onCancel: () => void
  onSubmit: (item: ContentItem) => void
}) {
  const isEvent = kind === "events"

  const [form, setForm] = useState({
    title: "",
    topic: "",
    image: "",
    description: "",
    author: "",
    date: "",
    location: "Addis Ababa, Ethiopia",
    eventType: "Workshop",
    status: "Published" as "Published" | "Draft",
    availability: "public" as "public" | "private",
  })

  // File upload state for events
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Object URL auto-cleanup
  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  function handleFileSelected(file: File) {
    setErrorMessage("")
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/svg+xml"]
    if (!validTypes.includes(file.type) && !file.type.startsWith("image/")) {
      setErrorMessage("Please select a supported image file (PNG, JPG, WebP, or SVG).")
      return
    }
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 10MB.`)
      return
    }
    setImageFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelected(file)
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrorMessage("")

    if (isEvent) {
      if (!form.title.trim()) {
        setErrorMessage("Event title is required.")
        return
      }
      if (!imageFile) {
        setErrorMessage("Please select an event cover image file.")
        return
      }
      if (!form.date) {
        setErrorMessage("Event start date is required.")
        return
      }
      if (!form.description.trim()) {
        setErrorMessage("Event description is required.")
        return
      }

      setSubmitting(true)
      try {
        const formData = new FormData()
        formData.append("title", form.title.trim())
        formData.append("type", form.eventType.trim() || "General")
        formData.append("location", form.location.trim() || "Addis Ababa, Ethiopia")
        formData.append("description", form.description.trim())
        formData.append("start_date", form.date)
        formData.append("status", form.status.toLowerCase())
        formData.append("availability", form.availability || "public")
        // Cover image file
        formData.append("image", imageFile)

        const result = await createEvent(formData)
        if (result.success && result.data) {
          const mapped = mapEventToUserEventData(result.data)
          onSubmit(mapped)
        } else {
          setErrorMessage(result.message || "Failed to create event. Please check the details.")
        }
      } catch (err: unknown) {
        console.error("Event creation error:", err)
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while creating the event."
        )
      } finally {
        setSubmitting(false)
      }
    } else {
      if (!form.title.trim() || !form.image.trim()) return
      onSubmit({
        id: `admin-${kind.slice(0, -1)}-${Date.now()}`,
        featuredImage: form.image,
        title: form.title,
        topic: form.topic,
        excerpt: form.description,
        content: form.description,
        author: form.author,
        publishedDate: form.date,
        status: form.status,
        visibility: "Public",
      })
    }
  }

  // Modern, attractive Event Creation Form consistent with Company Registration
  if (isEvent) {
    return (
      <form
        onSubmit={submit}
        className="bg-[var(--surface)] rounded-3xl border border-[var(--border-light)] p-6 md:p-10 mb-8 shadow-sm animate-scale-in space-y-8"
      >
        {/* Header with Icon Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-light)] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/25 flex items-center justify-center flex-shrink-0 shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-dark)] block">
                Event Management · New Event
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                Create New Event
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-3.5 py-2 rounded-xl border border-[var(--border-light)] hover:border-[var(--border-default)] transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
            >
              ×
            </button>
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
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
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
                value={form.eventType}
                onChange={(e) => update("eventType", e.target.value)}
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer transition-all"
              >
                {["Workshop", "Conference", "Fellowship", "Meetup", "Hackathon", "Webinar", "General"].map((t) => (
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
                value={form.status}
                onChange={(e) => update("status", e.target.value as "Published" | "Draft")}
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer transition-all"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Availability
              </label>
              <select
                value={form.availability}
                onChange={(e) => update("availability", e.target.value as "public" | "private")}
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
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
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
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Addis Ababa, Ethiopia or Online"
                className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Event Cover Image */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-[var(--text-primary)] border-b border-[var(--border-light)] pb-2.5">
            <svg className="w-4 h-4 text-[var(--accent-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>3. Event Cover Image <span className="text-red-500">*</span></span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            Select a high-resolution cover image to represent your event across cards, banners, and member feeds.
          </p>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelected(file)
            }}
          />

          {imagePreview && imageFile ? (
            <div className="p-4 rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
              <div className="w-full sm:w-48 h-28 rounded-xl overflow-hidden border border-[var(--border-light)] bg-black/10 flex-shrink-0">
                <img
                  src={imagePreview}
                  alt="Event cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--brand)] text-white">
                    Image Selected
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {imageFile.name}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {(imageFile.size / (1024 * 1024)).toFixed(2)} MB · {imageFile.type || "Image"}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                  >
                    Change Image
                  </button>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--brand)] rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[var(--surface-alt)] hover:bg-[var(--surface-alt)]/80 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-dark)] border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-3 text-2xl group-hover:scale-105 transition-transform shadow-xs">
                🖼️
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                Click or drag image file here to upload
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mb-3">
                PNG, JPG, WebP, or SVG (max 10MB)
              </p>
              <span className="inline-block bg-[var(--surface)] border border-[var(--border-default)] text-xs font-semibold px-4 py-2 rounded-xl text-[var(--text-secondary)] group-hover:border-[var(--brand)] group-hover:text-[var(--brand)] transition-colors shadow-xs">
                Browse Files
              </span>
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
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe what attendees will learn, key speakers, schedule highlights, and prerequisites..."
            className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl p-4 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition-all leading-relaxed"
            required
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[var(--border-light)] flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-all shadow-md shadow-[var(--brand)]/15 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Event...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Event</span>
              </>
            )}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 mb-6"
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <h3 className="font-serif text-xl text-[var(--text-primary)]">
          Add {kind === "blogs" ? "Blog" : "Article"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdminField
          label="Title"
          value={form.title}
          onChange={(value) => update("title", value)}
          required
        />
        <AdminField
          label="Topic"
          value={form.topic}
          onChange={(value) => update("topic", value)}
        />
        <AdminField
          label="Featured image URL"
          value={form.image}
          onChange={(value) => update("image", value)}
          required
        />
        <AdminField
          label="Publication date"
          value={form.date}
          onChange={(value) => update("date", value)}
          required
        />
        <AdminField
          label="Status"
          value={form.status}
          onChange={(value) => update("status", value)}
          select
          options={["Published", "Draft"]}
        />
        <AdminField
          label="Author"
          value={form.author}
          onChange={(value) => update("author", value)}
        />
        <div className="sm:col-span-2">
          <AdminField
            label="Excerpt"
            value={form.description}
            onChange={(value) => update("description", value)}
            multiline
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-6 mt-6 border-t border-[var(--border-light)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-light)] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  )
}

function AdminField({
  label,
  value,
  onChange,
  multiline = false,
  select = false,
  options = [],
  required = false,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  select?: boolean
  options?: string[]
  required?: boolean
  type?: string
}) {
  const className =
    "w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl py-2.5 pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand)]/20"

  const icon =
    label.toLowerCase().includes("title") || label === "Topic"
      ? "M4 5h16M4 12h10M4 19h7"
      : label.toLowerCase().includes("image")
        ? "M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 11l3-3 2 2 2-2 3 3M8 8h.01"
        : label.toLowerCase().includes("date")
          ? "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
          : label.toLowerCase().includes("location")
            ? "M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11zm0-8a3 3 0 100-6 3 3 0 000 6z"
            : label.toLowerCase().includes("author")
              ? "M16 21v-2a4 4 0 00-8 0v2m4-11a4 4 0 100-8 4 4 0 000 8z"
              : label.toLowerCase().includes("status")
                ? "M5 12l4 4L19 6"
                : "M4 6h16M4 12h16M4 18h16"

  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      <span className="relative block">
        <svg
          className="absolute left-3 top-3 w-4 h-4 text-[var(--brand)] pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d={icon}
          />
        </svg>
        {multiline ? (
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            className={`${className} resize-y`}
            required={required}
          />
        ) : select ? (
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={className}
          >
            {options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={className}
            required={required}
          />
        )}
      </span>
    </label>
  )
}
