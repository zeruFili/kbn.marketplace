import { getStoredToken } from "../auth/auth"
import type { Company, Category } from "./companies"

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.port === "3001"
    ? "/api/v1"
    : "http://localhost:3001/api/v1")

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
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const token = getStoredToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}/categories?is_active=true&limit=100`, {
      method: "GET",
      headers,
    })

    const json = await res.json()
    if (res.ok && json.success && Array.isArray(json.data)) {
      return json.data
    }
    return []
  } catch (err) {
    console.warn("Could not fetch categories from backend, using fallback:", err)
    return []
  }
}

export async function submitCompanyCreation(
  formData: FormData
): Promise<{ success: boolean; data?: CompanyApiResponse; message?: string }> {
  const token = getStoredToken()
  if (!token) {
    throw new Error("You must be logged in to create a company. Please log in first.")
  }

  const res = await fetch(`${API_BASE}/companies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // NOTE: Do not set Content-Type header when sending FormData!
      // The browser automatically sets multipart/form-data with the correct boundary.
    },
    body: formData,
  })

  const json = await res.json()

  if (!res.ok || !json.success) {
    const msg =
      json.message ||
      (Array.isArray(json.errors) ? json.errors.join(", ") : "Failed to create company")
    throw new Error(msg)
  }

  return json
}

export function resolveFileUrl(filePath?: string): string {
  if (!filePath) return ""
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("blob:") ||
    filePath.startsWith("data:")
  ) {
    return filePath
  }
  const base = API_BASE.replace(/\/api\/v1\/?$/, "")
  return `${base}${filePath.startsWith("/") ? "" : "/"}${filePath}`
}

export async function fetchMyCompanies(): Promise<CompanyApiResponse[]> {
  try {
    const token = getStoredToken()
    if (!token) return []

    const res = await fetch(`${API_BASE}/companies/my-companies`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const json = await res.json()
    if (res.ok && json.success && Array.isArray(json.data)) {
      return json.data
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
    const token = getStoredToken()
    if (!token) return null

    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    let body: BodyInit
    if (payload instanceof FormData) {
      body = payload
    } else {
      headers["Content-Type"] = "application/json"
      body = JSON.stringify(payload)
    }

    const res = await fetch(`${API_BASE}/companies/${id}`, {
      method: "PATCH",
      headers,
      body,
    })

    const json = await res.json()
    if (res.ok && json.success && json.data) {
      return json.data
    }
    return null
  } catch (err) {
    console.warn("Could not update company on backend:", err)
    return null
  }
}

export async function deleteCompanyApi(id: string): Promise<boolean> {
  try {
    const token = getStoredToken()
    if (!token) return false

    const res = await fetch(`${API_BASE}/companies/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const json = await res.json()
    return !!(res.ok && json.success)
  } catch (err) {
    console.warn("Could not delete company on backend:", err)
    return false
  }
}

export async function fetchCompanyById(
  id: string,
): Promise<CompanyApiResponse | null> {
  try {
    const token = getStoredToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}/companies/${id}`, {
      method: "GET",
      headers,
    })

    const json = await res.json()
    if (res.ok && json.success && json.data) {
      return json.data
    }
    return null
  } catch (err) {
    console.warn(`Could not fetch company ${id} from backend:`, err)
    return null
  }
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
    category: (c.business_category?.name as Category) || "Professional Services",
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
    services: [],
    gallery: [],
    tags: [c.business_category?.name || "Business"].filter(Boolean),
    reviews: [],
    featured: false,
    ownerName: c.owner_primary_contact,
  }
}
