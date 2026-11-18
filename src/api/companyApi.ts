/**
 * Company and Category API
 * Uses centralized baseApi for communication with backend company routes.
 */

import { baseApi, API_BASE_URL, resolveAssetUrl } from "./baseApi"
import type { ApiResponse } from "./types"
import type { Company, Category } from "../data/companies"

export const API_BASE = API_BASE_URL

export type CompanyStatusValue = "pending" | "active" | "inactive" | "suspended"
export type CompanyVerificationStatusValue = "pending" | "verified" | "rejected"

export interface CategoryItem {
  id: string
  name: string
  type: string
  description?: string | null
  icon?: string | null
  is_active?: boolean
  company_count?: number
  created_at?: string
  updated_at?: string | null
}

export interface CompanyApiResponse {
  id: string
  company_name: string
  business_category_id: string
  owner_primary_contact: string
  email: string
  phone_number: string
  physical_address: string
  description: string
  services?: string[]
  website?: string
  company_logo?: string | null
  cover_image?: string | null
  business_license?: string
  verification_status: CompanyVerificationStatusValue
  status?: CompanyStatusValue
  is_active: boolean
  business_category?: CategoryItem
  social_media?: { id?: string; platform: string; link: string }[]
  created_at?: string
  updated_at?: string | null
  created_by?: string
}

export interface FetchCompaniesOptions {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  business_category_id?: string
  status?: string
  is_active?: boolean
  verification_status?: string
  sort_by?: "created_at" | "company_name" | "updated_at"
  sort_order?: "ASC" | "DESC"
  user_id?: string
  created_by?: string
  user_email?: string
}

export interface CompaniesPaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedCompaniesResponse {
  data: CompanyApiResponse[]
  meta?: CompaniesPaginationMeta
}

export interface PaginatedAdminCompaniesResponse {
  success: boolean
  data: CompanyApiResponse[]
  meta: CompaniesPaginationMeta
  message?: string
}

export async function fetchCompanies(
  options: FetchCompaniesOptions = {}
): Promise<{
  companies: Company[]
  total: number
  raw: CompanyApiResponse[]
  meta: CompaniesPaginationMeta
}> {
  try {
    const limit = options.limit || 50
    const page = options.page || 1
    const res = await baseApi.get<CompanyApiResponse[] | PaginatedCompaniesResponse>(
      "/companies",
      {
        params: {
          page: options.page,
          limit,
          search: options.search,
          business_category_id: options.categoryId || options.business_category_id,
          status: options.status,
          is_active: options.is_active,
          verification_status: options.verification_status,
          sort_by: options.sort_by,
          sort_order: options.sort_order,
          user_id: options.user_id || options.created_by,
          created_by: options.created_by,
          user_email: options.user_email,
        },
      }
    )

    let items: CompanyApiResponse[] = []
    let rawMeta = (res as { meta?: CompaniesPaginationMeta }).meta

    if (res.success && res.data) {
      if (Array.isArray(res.data)) {
        items = res.data
      } else if (Array.isArray((res.data as PaginatedCompaniesResponse).data)) {
        items = (res.data as PaginatedCompaniesResponse).data
        rawMeta = (res.data as PaginatedCompaniesResponse).meta ?? rawMeta
      }
    } else if (Array.isArray((res as any).data)) {
      items = (res as any).data
    }

    const total = rawMeta?.total ?? items.length
    const resolvedLimit = rawMeta?.limit ?? limit
    const resolvedPage = rawMeta?.page ?? page
    const meta: CompaniesPaginationMeta = {
      total,
      page: resolvedPage,
      limit: resolvedLimit,
      totalPages: rawMeta?.totalPages ?? (Math.ceil(total / resolvedLimit) || 1),
    }

    const mapped = items.map(mapApiResponseToCompany)
    return {
      companies: mapped,
      total,
      raw: items,
      meta,
    }
  } catch (err) {
    console.warn("Could not fetch companies from backend:", err)
    throw err
  }
}

/**
 * Fetch registered businesses for the Admin Business Management dashboard
 * with full pagination metadata, status/category/search filters, and sorting.
 */
export async function fetchAdminCompaniesApi(
  options: FetchCompaniesOptions = {}
): Promise<PaginatedAdminCompaniesResponse> {
  const limit = options.limit ?? 20
  const page = options.page ?? 1

  const res = await baseApi.get<CompanyApiResponse[]>("/companies", {
    params: {
      page,
      limit,
      search: options.search,
      business_category_id: options.categoryId || options.business_category_id,
      status: options.status,
      is_active:
        options.is_active !== undefined ? String(options.is_active) : undefined,
      verification_status: options.verification_status,
      sort_by: options.sort_by,
      sort_order: options.sort_order,
      created_by: options.created_by || options.user_id,
    },
  })

  const items = Array.isArray(res.data) ? res.data : []
  const rawMeta = res.meta as CompaniesPaginationMeta | undefined
  const total = rawMeta?.total ?? items.length
  const resolvedLimit = rawMeta?.limit ?? limit

  return {
    success: !!res.success,
    data: items,
    meta: {
      total,
      page: rawMeta?.page ?? page,
      limit: resolvedLimit,
      totalPages: rawMeta?.totalPages ?? (Math.ceil(total / resolvedLimit) || 1),
    },
    message: res.message,
  }
}

/**
 * Fetch a single business profile by ID for admin inspection.
 * Throws ApiError if the request fails or returns an error status.
 */
export async function fetchAdminCompanyById(
  id: string
): Promise<CompanyApiResponse | null> {
  const res = await baseApi.get<CompanyApiResponse>(`/companies/${id}`)
  if (res.success && res.data) {
    return res.data
  }
  return null
}

/**
 * Activate or deactivate a business (updates both status and is_active in real time).
 */
export async function updateCompanyStatusApi(
  id: string,
  payload:
    | { status?: CompanyStatusValue; is_active?: boolean }
    | boolean
): Promise<ApiResponse<CompanyApiResponse>> {
  const body =
    typeof payload === "boolean"
      ? {
          status: payload ? ("active" as const) : ("inactive" as const),
          is_active: payload,
        }
      : {
          ...(payload.status !== undefined ? { status: payload.status } : {}),
          ...(payload.is_active !== undefined
            ? { is_active: payload.is_active }
            : payload.status !== undefined
              ? { is_active: payload.status === "active" }
              : {}),
        }

  return baseApi.patch<CompanyApiResponse>(`/companies/${id}/status`, body)
}

/**
 * Update a business's verification status (Admin only).
 */
export async function updateCompanyVerificationStatusApi(
  id: string,
  verification_status: CompanyVerificationStatusValue
): Promise<ApiResponse<CompanyApiResponse>> {
  return baseApi.patch<CompanyApiResponse>(
    `/companies/${id}/verification-status`,
    { verification_status }
  )
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const res = await baseApi.get<CategoryItem[]>("/categories", {
      params: { is_active: "true", limit: "100" },
    })

    if (res.success && Array.isArray(res.data)) {
      return res.data
    }
    return []
  } catch (err) {
    console.warn("Could not fetch categories from backend:", err)
    return []
  }
}

export async function submitCompanyCreation(
  formData: FormData
): Promise<{ success: boolean; data?: CompanyApiResponse; message?: string }> {
  const token = baseApi.getToken()
  if (!token) {
    throw new Error("You must be logged in to create a company. Please log in first.")
  }

  const res = await baseApi.post<CompanyApiResponse>("/companies", formData)

  if (!res.success) {
    const msg =
      res.message ||
      (Array.isArray(res.errors) ? res.errors.join(", ") : "Failed to create company")
    throw new Error(msg)
  }

  return res
}

export const resolveFileUrl = resolveAssetUrl

export async function fetchMyCompanies(): Promise<CompanyApiResponse[]> {
  try {
    const token = baseApi.getToken()
    if (!token) return []

    const res = await baseApi.get<CompanyApiResponse[]>("/companies/my-companies")

    if (res.success && Array.isArray(res.data)) {
      return res.data
    }
    return []
  } catch (err) {
    console.warn("Could not fetch my companies from backend:", err)
    return []
  }
}

export async function updateCompanyApi(
  id: string,
  payload: FormData | Record<string, unknown>
): Promise<CompanyApiResponse | null> {
  try {
    const token = baseApi.getToken()
    if (!token) return null

    const res = await baseApi.patch<CompanyApiResponse>(`/companies/${id}`, payload)

    if (res.success && res.data) {
      return res.data
    }
    return null
  } catch (err) {
    console.warn("Could not update company on backend:", err)
    return null
  }
}

export async function deleteCompanyApi(id: string): Promise<boolean> {
  try {
    const token = baseApi.getToken()
    if (!token) return false

    const res = await baseApi.delete(`/companies/${id}`)
    return !!res.success
  } catch (err) {
    console.warn("Could not delete company on backend:", err)
    return false
  }
}

export async function fetchCompanyById(
  id: string
): Promise<CompanyApiResponse | null> {
  try {
    const res = await baseApi.get<CompanyApiResponse>(`/companies/${id}`)

    if (res.success && res.data) {
      return res.data
    }
    return null
  } catch (err) {
    console.warn(`Could not fetch company ${id} from backend:`, err)
    return null
  }
}

export function normalizeCategoryName(raw?: string): Category {
  if (!raw) return "Professional Services"
  const clean = raw.trim().toLowerCase()
  const map: Record<string, Category> = {
    construction: "Construction",
    hospital: "Hospitals",
    hospitals: "Hospitals",
    healthcare: "Healthcare",
    hotel: "Hotels",
    hotels: "Hotels",
    hospitality: "Hospitality",
    "guest house": "Guest Houses",
    "guest houses": "Guest Houses",
    clothing: "Clothing",
    fashion: "Fashion",
    "coffee shop": "Coffee Shops",
    "coffee shops": "Coffee Shops",
    "food & beverage": "Food & Beverage",
    "food and beverage": "Food & Beverage",
    furniture: "Furniture",
    car: "Cars",
    cars: "Cars",
    automotive: "Automotive",
    ministry: "Ministry",
    church: "Ministry",
    "professional services": "Professional Services",
  }
  return map[clean] || (raw.charAt(0).toUpperCase() + raw.slice(1) as Category)
}

export function mapApiResponseToCompany(c: CompanyApiResponse): Company {
  const logo = resolveFileUrl(c.company_logo) || ""
  const banner = resolveFileUrl(c.cover_image) || ""

  return {
    id: c.id,
    name: c.company_name,
    category: normalizeCategoryName(c.business_category?.name),
    logo,
    banner,
    rating: 5.0,
    reviewCount: 0,
    description: c.description || "",
    longDescription: c.description || "",
    phone: c.phone_number || "",
    email: c.email || "",
    website: c.website || "",
    address: c.physical_address || "Addis Ababa, Ethiopia",
    services: Array.isArray(c.services) ? c.services : [],
    gallery: [],
    tags: [c.business_category?.name || "Business"].filter(Boolean),
    reviews: [],
    featured: false,
    ownerName: c.owner_primary_contact,
    createdBy: c.created_by,
  }
}

export async function fetchCompaniesByUserId(
  userId: string,
  _userEmail?: string
): Promise<Company[]> {
  if (!userId) return []
  try {
    const res = await fetchCompanies({
      created_by: userId,
      user_id: userId,
      is_active: true,
      limit: 10,
    })
    const validActive = (res.companies || []).filter(
      (c) => c.createdBy === userId || (c as any).created_by === userId
    )
    if (validActive.length > 0) {
      return validActive
    }

    // Secondary fallback: query without is_active in case verification is pending
    const allForUser = await fetchCompanies({
      created_by: userId,
      user_id: userId,
      limit: 10,
    })
    const validAll = (allForUser.companies || []).filter(
      (c) => c.createdBy === userId || (c as any).created_by === userId
    )
    return validAll
  } catch (err) {
    console.warn(`Could not fetch companies for user ${userId}:`, err)
  }
  return []
}

export async function fetchCompanyByUserId(
  userId: string,
  userEmail?: string
): Promise<Company | null> {
  const list = await fetchCompaniesByUserId(userId, userEmail)
  return list.length > 0 ? list[0] : null
}


