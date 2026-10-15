/**
 * Articles API Client
 * Uses centralized baseApi for communication with backend article endpoints.
 */

import { baseApi, resolveAssetUrl } from "./baseApi"
import type { UserArticleData } from "../data/userDataStore"

export interface ArticleApiResponse {
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

export interface ArticleCreationResult {
  success: boolean
  data?: ArticleApiResponse
  message?: string
}

/**
 * Fetch all articles from the backend
 */
export async function fetchArticles(): Promise<ArticleApiResponse[]> {
  try {
    const res = await baseApi.get<ArticleApiResponse[]>("/articles")
    if (res.success && Array.isArray(res.data)) {
      return res.data
    }
    return []
  } catch (err) {
    console.warn("Could not fetch articles from backend:", err)
    return []
  }
}

/**
 * Fetch a single article by ID
 */
export async function fetchArticleById(id: string): Promise<ArticleApiResponse | null> {
  try {
    const res = await baseApi.get<ArticleApiResponse>(`/articles/${id}`)
    if (res.success && res.data) {
      return res.data
    }
    return null
  } catch (err) {
    console.warn(`Could not fetch article ${id} from backend:`, err)
    return null
  }
}

/**
 * Submit article creation with multipart/form-data
 */
export async function createArticle(
  payload: FormData | Record<string, unknown>
): Promise<ArticleCreationResult> {
  try {
    const res = await baseApi.post<ArticleApiResponse>("/articles", payload)
    return {
      success: !!res.success,
      data: res.data,
      message: res.message || "Article created successfully",
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to create article. Please verify all details and try again."
    return {
      success: false,
      message,
    }
  }
}

/**
 * Update an existing article
 */
export async function updateArticle(
  id: string,
  payload: FormData | Record<string, unknown>
): Promise<ArticleCreationResult> {
  try {
    const res = await baseApi.patch<ArticleApiResponse>(`/articles/${id}`, payload)
    return {
      success: !!res.success,
      data: res.data,
      message: res.message || "Article updated successfully",
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to update article. Please try again."
    return {
      success: false,
      message,
    }
  }
}

/**
 * Delete an article by ID
 */
export async function deleteArticleApi(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await baseApi.delete<{ message?: string }>(`/articles/${id}`)
    return {
      success: !!res.success,
      message: res.message || "Article deleted successfully",
    }
  } catch (err: unknown) {
    console.warn(`Could not delete article ${id}:`, err)
    const message =
      err instanceof Error ? err.message : "Failed to delete article. Please try again."
    return { success: false, message }
  }
}

/**
 * Format raw backend article entity to UserArticleData used across frontend cards and lists
 */
export function mapArticleToUserArticleData(article: ArticleApiResponse): UserArticleData {
  const rawImage =
    article.featured_image && article.featured_image.length > 0
      ? article.featured_image[0]
      : ""

  const resolvedImage = rawImage
    ? resolveAssetUrl(rawImage)
    : "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&h=520&fit=crop&auto=format"

  const formattedDate = article.publication_date
    ? new Date(article.publication_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return {
    id: article.id,
    featuredImage: resolvedImage,
    title: article.title,
    topic: article.topic || "General",
    excerpt: article.excerpt,
    content: article.excerpt,
    author: article.author?.full_name || "Kingdom Builders Admin",
    publishedDate: formattedDate || article.publication_date,
    status: article.status?.toLowerCase() === "published" ? "Published" : "Draft",
    visibility: "Public",
  }
}
