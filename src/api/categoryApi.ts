/**
 * Category API
 * Communicates with backend /api/v1/categories endpoints for public listing
 * and admin CRUD management.
 */

import { baseApi } from "./baseApi"

export type CategoryType = "company" | "business"

export interface CategoryApiItem {
  id: string
  name: string
  type: CategoryType
  description?: string | null
  icon?: string | null
  is_active: boolean
  company_count?: number
  created_at?: string
  updated_at?: string | null
}

export interface CategoryPaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedCategoriesResponse {
  success: boolean
  data: CategoryApiItem[]
  meta: CategoryPaginationMeta
  message?: string
}

export interface FetchCategoriesParams {
  page?: number
  limit?: number
  search?: string
  type?: CategoryType
  is_active?: boolean
  sort_by?: "name" | "created_at" | "type"
  sort_order?: "ASC" | "DESC"
}

export interface CreateCategoryPayload {
  name: string
  type?: CategoryType
  description?: string
  icon?: string
  is_active?: boolean
}

export interface UpdateCategoryPayload {
  name?: string
  type?: CategoryType
  description?: string
  icon?: string
  is_active?: boolean
}

export async function fetchCategoriesApi(
  params: FetchCategoriesParams = {}
): Promise<PaginatedCategoriesResponse> {
  const res = await baseApi.get<CategoryApiItem[]>("/categories", {
    params: {
      page: params.page,
      limit: params.limit ?? 50,
      search: params.search,
      type: params.type,
      is_active:
        params.is_active !== undefined ? String(params.is_active) : undefined,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    },
  })

  const items = Array.isArray(res.data) ? res.data : []
  const rawMeta = res.meta as CategoryPaginationMeta | undefined
  const limit = params.limit ?? 50
  const page = params.page ?? 1
  const total = rawMeta?.total ?? items.length

  return {
    success: !!res.success,
    data: items,
    meta: {
      total,
      page: rawMeta?.page ?? page,
      limit: rawMeta?.limit ?? limit,
      totalPages: rawMeta?.totalPages ?? (Math.ceil(total / limit) || 1),
    },
    message: res.message,
  }
}

export async function fetchActiveCategoriesApi(
  type?: CategoryType
): Promise<CategoryApiItem[]> {
  const res = await fetchCategoriesApi({
    is_active: true,
    type,
    limit: 100,
    sort_by: "name",
    sort_order: "ASC",
  })
  return res.data
}

export async function fetchCategoryByIdApi(
  id: string
): Promise<CategoryApiItem | null> {
  const res = await baseApi.get<CategoryApiItem>(`/categories/${id}`)
  if (res.success && res.data) {
    return res.data
  }
  return null
}

export async function createCategoryApi(
  payload: CreateCategoryPayload | FormData
): Promise<{ success: boolean; data?: CategoryApiItem; message?: string }> {
  const body =
    payload instanceof FormData
      ? payload
      : {
          name: payload.name.trim(),
          type: payload.type || "company",
          ...(payload.description !== undefined
            ? { description: payload.description.trim() }
            : {}),
          ...(payload.icon?.trim() ? { icon: payload.icon.trim() } : {}),
          ...(payload.is_active !== undefined
            ? { is_active: payload.is_active }
            : {}),
        }

  const res = await baseApi.post<CategoryApiItem>("/categories", body)
  return {
    success: !!res.success,
    data: res.data,
    message: res.message,
  }
}

export async function updateCategoryApi(
  id: string,
  payload: UpdateCategoryPayload | FormData
): Promise<{ success: boolean; data?: CategoryApiItem; message?: string }> {
  const body =
    payload instanceof FormData
      ? payload
      : {
          ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
          ...(payload.type !== undefined ? { type: payload.type } : {}),
          ...(payload.description !== undefined
            ? { description: payload.description.trim() }
            : {}),
          ...(payload.icon?.trim() ? { icon: payload.icon.trim() } : {}),
          ...(payload.is_active !== undefined
            ? { is_active: payload.is_active }
            : {}),
        }

  const res = await baseApi.patch<CategoryApiItem>(`/categories/${id}`, body)
  return {
    success: !!res.success,
    data: res.data,
    message: res.message,
  }
}

export async function updateCategoryStatusApi(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; data?: CategoryApiItem; message?: string }> {
  const res = await baseApi.patch<CategoryApiItem>(`/categories/${id}/status`, {
    is_active,
  })
  return {
    success: !!res.success,
    data: res.data,
    message: res.message,
  }
}

export async function deleteCategoryApi(
  id: string
): Promise<{ success: boolean; message?: string }> {
  const res = await baseApi.delete(`/categories/${id}`)
  return {
    success: !!res.success,
    message: res.message,
  }
}
