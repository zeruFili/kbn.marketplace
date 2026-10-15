import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  fetchBlogById,
  deleteBlogApi,
  type BlogApiResponse,
} from "../../api/blogsApi"
import { resolveAssetUrl } from "../../api/baseApi"
import { getPublicUserDashboardData } from "../../data/userDataStore"

export default function AdminBlogDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [blog, setBlog] = useState<BlogApiResponse | null>(null)
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

    fetchBlogById(id)
      .then((data) => {
        if (!isMounted) return
        if (data) {
          setBlog(data)
        } else {
          // Check fallback demo blogs
          const demoBlogs = getPublicUserDashboardData().flatMap((m) => m.blogs)
          const fallback = demoBlogs.find(
            (b) => b.id === id || b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === id
          )
          if (fallback) {
            setBlog({
              id: fallback.id,
              title: fallback.title,
              slug: fallback.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              topic: fallback.topic || "General",
              featured_image: fallback.featuredImage ? [fallback.featuredImage] : [],
              publication_date: fallback.publishedDate || new Date().toISOString(),
              status: fallback.status?.toLowerCase() === "published" ? "published" : "draft",
              excerpt: fallback.excerpt || fallback.content || "",
              author_id: "demo-author",
              author: {
                id: "demo-author",
                full_name: fallback.author || "Kingdom Builders Admin",
                email: "admin@kingdombuilders.et",
              },
              created_at: new Date().toISOString(),
            })
          } else {
            setError(`Could not find blog post with ID "${id}".`)
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return
        // Check fallback demo blogs on network failure
        const demoBlogs = getPublicUserDashboardData().flatMap((m) => m.blogs)
        const fallback = demoBlogs.find(
          (b) => b.id === id || b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === id
        )
        if (fallback) {
          setBlog({
            id: fallback.id,
            title: fallback.title,
            slug: fallback.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            topic: fallback.topic || "General",
            featured_image: fallback.featuredImage ? [fallback.featuredImage] : [],
            publication_date: fallback.publishedDate || new Date().toISOString(),
            status: fallback.status?.toLowerCase() === "published" ? "published" : "draft",
            excerpt: fallback.excerpt || fallback.content || "",
            author_id: "demo-author",
            author: {
              id: "demo-author",
              full_name: fallback.author || "Kingdom Builders Admin",
              email: "admin@kingdombuilders.et",
            },
            created_at: new Date().toISOString(),
          })
        } else {
          setError(err instanceof Error ? err.message : "Failed to load blog details.")
        }
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

    const res = await deleteBlogApi(id)
    if (res.success) {
      setDeleting(false)
      setShowDeleteModal(false)
      navigate("/admin/blogs")
    } else {
      setDeleting(false)
      setDeleteError(res.message || "Failed to delete blog. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-12 text-center animate-fade-in">
        <div className="w-10 h-10 border-3 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
        <h2 className="font-serif text-lg text-[var(--text-primary)]">Loading Blog Details...</h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Fetching blog data from server</p>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] p-8 text-center animate-fade-in">
        <div className="text-4xl mb-3">📰</div>
        <h1 className="font-serif text-2xl text-[var(--text-primary)] mb-2">
          Blog Post Not Found
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          {error || `Could not find blog post with ID "${id}".`}
        </p>
        <button
          onClick={() => navigate("/admin/blogs")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer"
        >
          ← Back to Blogs
        </button>
      </div>
    )
  }

  const rawImage = blog.featured_image && blog.featured_image.length > 0 ? blog.featured_image[0] : ""
  const bannerImage = rawImage
    ? resolveAssetUrl(rawImage)
    : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=480&fit=crop&auto=format"

  const formattedDate = blog.publication_date
    ? new Date(blog.publication_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : ""

  const isPublished = blog.status?.toLowerCase() === "published"

  return (
    <div className="max-w-4xl mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden animate-scale-in">
      {/* Top Header Bar following Company Details Page style */}
      <div className="bg-[var(--brand-dark)] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate("/admin/blogs")}
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
          Back to blogs
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/blogs/${blog.id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            View Public Page
          </button>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isPublished
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      {/* Hero Cover Banner */}
      <div className="relative h-48 sm:h-64 bg-slate-900">
        <img
          src={bannerImage}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-5 left-6 right-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--brand-dark)]">
              {blog.topic}
            </span>
            <span className="text-xs text-white/70">
              {formattedDate}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
            {blog.title}
          </h1>
          {blog.author && (
            <p className="text-xs text-white/80 mt-1.5 flex items-center gap-1.5">
              <span>By {blog.author.full_name}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/60">{blog.author.email}</span>
            </p>
          )}
        </div>
      </div>

      {/* Details & Metadata Section */}
      <div className="p-6 sm:p-8 space-y-8">
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Excerpt & Content Summary
          </h3>
          <div className="bg-[var(--surface-alt)] p-5 rounded-2xl border border-[var(--border-light)] text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
            {blog.excerpt || "No excerpt or content provided for this blog post."}
          </div>
        </div>

        {/* Information Grid */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
            Article Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-1">
                Topic
              </p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {blog.topic || "General"}
              </p>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-1">
                Author
              </p>
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {blog.author?.full_name || "Admin"}
              </p>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-1">
                Publication Date
              </p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {formattedDate}
              </p>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-1">
                Slug
              </p>
              <p className="text-sm font-semibold text-[var(--text-primary)] font-mono text-xs truncate">
                {blog.slug || "—"}
              </p>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-1">
                Visibility
              </p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Public Community Feed
              </p>
            </div>

            <div className="bg-[var(--surface-alt)] p-4 rounded-xl border border-[var(--border-light)]">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-1">
                Status
              </p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {isPublished ? "Published" : "Draft"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer with ID and Delete Action */}
        <div className="pt-6 border-t border-[var(--border-light)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-tertiary)]">
            Blog ID: <code className="bg-[var(--surface-alt)] px-2 py-0.5 rounded text-[11px] font-mono">{blog.id}</code>
          </p>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Delete Blog Post
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-in">
            <h3 className="font-serif text-lg font-bold text-[var(--text-primary)] mb-2">
              Delete Blog Post?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Are you sure you want to permanently delete <strong className="text-[var(--text-primary)]">"{blog.title}"</strong>? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 dark:text-red-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-light)]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-4 py-2 rounded-xl border border-[var(--border-light)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
