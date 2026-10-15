/**
 * Blogs API Client
 * Uses centralized baseApi for communication with backend blog endpoints.
 */

import { baseApi, resolveAssetUrl } from "./baseApi"
import type { UserArticleData } from "../data/userDataStore"

export interface BlogApiResponse {
  id: string
  title: string
  slug: string
  topic: string
  featured_image?: string[] | null
  publication_date: string
  status: "draft" | "published"
  excerpt: string
  author_id: string
  author?: {
    id: string
    full_name: string
    email: string
  }
  created_at: string
  updated_at?: string
}

export interface BlogCreationResult {
  success: boolean
  data?: BlogApiResponse
  message?: string
}

/**
 * Fetch all blog posts from the backend
 */
export async function fetchBlogs(): Promise<BlogApiResponse[]> {
  try {
    const res = await baseApi.get<BlogApiResponse[]>("/blogs")
    if (res.success && Array.isArray(res.data)) {
      return res.data
    }
    return []
  } catch (err) {
    console.warn("Could not fetch blogs from backend:", err)
    return []
  }
}

/**
 * Fetch a single blog post by ID
 */
export async function fetchBlogById(id: string): Promise<BlogApiResponse | null> {
  try {
    const res = await baseApi.get<BlogApiResponse>(`/blogs/${id}`)
    if (res.success && res.data) {
      return res.data
    }
    return null
  } catch (err) {
    console.warn(`Could not fetch blog ${id} from backend:`, err)
    return null
  }
}

/**
 * Submit blog creation with multipart/form-data
 */
export async function createBlog(
  payload: FormData | Record<string, unknown>
): Promise<BlogCreationResult> {
  try {
    const res = await baseApi.post<BlogApiResponse>("/blogs", payload)
    return {
      success: !!res.success,
      data: res.data,
      message: res.message || "Blog created successfully",
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to create blog. Please verify all details and try again."
    return {
      success: false,
      message,
    }
  }
}

/**
 * Update an existing blog post
 */
export async function updateBlog(
  id: string,
  payload: FormData | Record<string, unknown>
): Promise<BlogCreationResult> {
  try {
    const res = await baseApi.patch<BlogApiResponse>(`/blogs/${id}`, payload)
    return {
      success: !!res.success,
      data: res.data,
      message: res.message || "Blog updated successfully",
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to update blog. Please try again."
    return {
      success: false,
      message,
    }
  }
}

/**
 * Delete a blog post by ID
 */
export async function deleteBlogApi(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await baseApi.delete<{ message?: string }>(`/blogs/${id}`)
    return {
      success: !!res.success,
      message: res.message || "Blog deleted successfully",
    }
  } catch (err: unknown) {
    console.warn(`Could not delete blog ${id}:`, err)
    const message =
      err instanceof Error ? err.message : "Failed to delete blog. Please try again."
    return { success: false, message }
  }
}

/**
 * Format raw backend blog entity to UserArticleData used across frontend cards and lists
 */
export function mapBlogToUserArticleData(blog: BlogApiResponse): UserArticleData {
  const rawImage =
    blog.featured_image && blog.featured_image.length > 0
      ? blog.featured_image[0]
      : ""

  const resolvedImage = rawImage
    ? resolveAssetUrl(rawImage)
    : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900&h=520&fit=crop&auto=format"

  const formattedDate = blog.publication_date
    ? new Date(blog.publication_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return {
    id: blog.id,
    featuredImage: resolvedImage,
    title: blog.title,
    topic: blog.topic || "General",
    excerpt: blog.excerpt,
    content: blog.excerpt,
    author: blog.author?.full_name || "Kingdom Builders Admin",
    publishedDate: formattedDate || blog.publication_date,
    status: blog.status?.toLowerCase() === "published" ? "Published" : "Draft",
    visibility: "Public",
  }
}
