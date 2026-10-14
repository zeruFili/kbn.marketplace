import { useEffect, useMemo, useState, useRef } from "react"

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
              className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden card-hover"
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
                  <span>
                    {"eventType" in item ? item.startDate : item.publishedDate}
                  </span>
                  {"eventType" in item && <span>{item.location}</span>}
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
        formData.append("availability", "public")
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

  return (
    <form
      onSubmit={submit}
      className="bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-6 md:p-8 mb-6"
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <h3 className="font-serif text-xl text-[var(--text-primary)]">
          Add {isEvent ? "Event" : kind === "blogs" ? "Blog" : "Article"}
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
          label={isEvent ? "Event title" : "Title"}
          value={form.title}
          onChange={(value) => update("title", value)}
          required
        />
        {isEvent ? (
          <AdminField
            label="Event type"
            value={form.eventType}
            onChange={(value) => update("eventType", value)}
            select
            options={[
              "Workshop",
              "Conference",
              "Networking",
              "Worship",
              "Exhibition",
              "Fellowship",
              "Seminar",
              "General",
            ]}
          />
        ) : (
          <AdminField
            label="Topic"
            value={form.topic}
            onChange={(value) => update("topic", value)}
          />
        )}

        {/* Dedicated File Upload Widget for Events */}
        {isEvent ? (
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Event Cover Image <span className="text-red-500">*</span>
            </label>
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
              <div className="relative rounded-2xl overflow-hidden border border-[var(--border-default)] bg-[var(--surface-alt)]">
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="w-full h-44 object-cover"
                />
                <div className="p-3 flex items-center justify-between bg-[var(--surface)]/95 backdrop-blur-sm border-t border-[var(--border-light)]">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {imageFile.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {(imageFile.size / 1024).toFixed(1)} KB · {imageFile.type || "Image"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="text-xs text-[var(--brand)] hover:underline px-2 py-1 font-medium cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="text-xs text-red-500 hover:underline px-2 py-1 font-medium cursor-pointer"
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
                className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--brand)] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[var(--surface-alt)]/50 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto mb-3 text-2xl group-hover:scale-105 transition-transform">
                  📸
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Click or drag image to upload
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  PNG, JPG, WebP, or SVG up to 10MB
                </p>
                <span className="inline-block bg-[var(--surface)] border border-[var(--border-default)] text-xs font-medium px-3.5 py-1.5 rounded-lg text-[var(--text-secondary)] group-hover:border-[var(--brand)] group-hover:text-[var(--brand)] transition-colors">
                  Browse Files
                </span>
              </div>
            )}
          </div>
        ) : (
          <AdminField
            label="Featured image URL"
            value={form.image}
            onChange={(value) => update("image", value)}
            required
          />
        )}

        <AdminField
          label={isEvent ? "Start date & time" : "Publication date"}
          value={form.date}
          onChange={(value) => update("date", value)}
          type={isEvent ? "datetime-local" : "text"}
          required
        />
        <AdminField
          label="Status"
          value={form.status}
          onChange={(value) => update("status", value)}
          select
          options={["Published", "Draft"]}
        />
        {isEvent ? (
          <AdminField
            label="Location"
            value={form.location}
            onChange={(value) => update("location", value)}
            required
          />
        ) : (
          <AdminField
            label="Author"
            value={form.author}
            onChange={(value) => update("author", value)}
          />
        )}
        <div className="sm:col-span-2">
          <AdminField
            label={isEvent ? "Description" : "Excerpt"}
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
          {submitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating Event...
            </>
          ) : (
            `Save ${isEvent ? "Event" : ""}`
          )}
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
