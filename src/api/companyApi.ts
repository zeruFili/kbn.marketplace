/**
 * Company and Category API
 * Uses centralized baseApi for communication with backend company routes.
 */

import { baseApi, API_BASE_URL, resolveAssetUrl } from "./baseApi"
import type { Company, Category } from "../data/companies"

export const API_BASE = API_BASE_URL

export interface CategoryItem {
  id: string
  name: string
  type: string
  description?: string
  icon?: string
  is_active?: boolean
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
  company_logo?: string
  cover_image?: string
  business_license?: string
  verification_status: "pending" | "verified" | "rejected"
  status?: "pending" | "active" | "inactive" | "suspended"
  is_active: boolean
  business_category?: CategoryItem
  social_media?: { id?: string; platform: string; link: string }[]
  created_at?: string
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

export interface PaginatedCompaniesResponse {
  data: CompanyApiResponse[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export async function fetchCompanies(
  options: FetchCompaniesOptions = {}
): Promise<{ companies: Company[]; total: number; raw: CompanyApiResponse[] }> {
  try {
    const res = await baseApi.get<CompanyApiResponse[] | PaginatedCompaniesResponse>(
      "/companies",
      {
        params: {
          page: options.page,
          limit: options.limit || 50,
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
    let total = 0

    if (res.success && res.data) {
      if (Array.isArray(res.data)) {
        items = res.data
        total = items.length
      } else if (Array.isArray((res.data as PaginatedCompaniesResponse).data)) {
        items = (res.data as PaginatedCompaniesResponse).data
        total = (res.data as PaginatedCompaniesResponse).meta?.total ?? items.length
      }
    } else if (Array.isArray((res as any).data)) {
      items = (res as any).data
      total = items.length
    }

    const mapped = items.map(mapApiResponseToCompany)
    return {
      companies: mapped,
      total,
      raw: items,
    }
  } catch (err) {
    console.warn("Could not fetch companies from backend:", err)
    throw err
  }
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
  const rawLogo = resolveFileUrl(c.company_logo)
  const logo =
    rawLogo ||
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=120&h=120&fit=crop&auto=format"
  const rawCover = resolveFileUrl(c.cover_image)
  const banner =
    rawCover ||
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=420&fit=crop&auto=format"

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


