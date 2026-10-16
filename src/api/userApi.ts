/**
 * Centralized User API Service
 * Handles user fetching, admin user management, role/status updates, and profile updates.
 */

import { baseApi, resolveAssetUrl } from "./baseApi"
import type { ApiResponse } from "./types"

export interface UserProfileResponse {
  id: string
  fullName?: string
  full_name?: string
  name?: string
  email?: string
  role?: string
  phone?: string | null
  status?: string
  is_active?: boolean
  isActive?: boolean
  profileImage?: string | null
  profile_image?: string | null
  avatar?: string | null
  website?: string | null
  education?: string | null
  achievement?: string | null
  professional_experience?: string | null
  professionalExperience?: string | null
  last_login_at?: string | null
  created_at?: string | null
  createdAt?: string | null
  registeredAt?: string | null
  updated_at?: string | null
  updatedAt?: string | null
  business?: string | null
}

export interface AdminUsersQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  sort_by?: string
  sort_order?: "ASC" | "DESC"
  is_active?: boolean | string
  include_admin?: boolean
}

export interface PaginatedUsersResponse {
  success: boolean
  data: UserProfileResponse[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Fetch a single user by ID
 */
export async function fetchUserById(
  id: string
): Promise<UserProfileResponse | null> {
  try {
    const res = await baseApi.get<UserProfileResponse>(`/users/${id}`)
    if (res.success && res.data) {
      return res.data
    }
    return null
  } catch (err) {
    console.warn(`Failed to fetch user ${id}:`, err)
    return null
  }
}

export const fetchAdminUserById = fetchUserById

/**
 * Update user details (profile, text fields, profile photo)
 */
export async function updateUserApi(
  id: string,
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<UserProfileResponse>> {
  return baseApi.patch<UserProfileResponse>(`/users/${id}`, payload)
}

/**
 * Update user role (admin only)
 */
export async function updateUserRoleApi(
  id: string,
  role: string
): Promise<ApiResponse<UserProfileResponse>> {
  return baseApi.patch<UserProfileResponse>(`/users/${id}/role`, {
    role: role.trim().toLowerCase(),
  })
}

/**
 * Update user status (admin only: active, pending, inactive, suspended)
 */
export async function updateUserStatusApi(
  id: string,
  status: string,
  is_active?: boolean
): Promise<ApiResponse<UserProfileResponse>> {
  const normalizedStatus = status.trim().toLowerCase()
  const activeFlag =
    is_active !== undefined ? is_active : normalizedStatus === "active"

  return baseApi.patch<UserProfileResponse>(`/users/${id}/status`, {
    status: normalizedStatus,
    is_active: activeFlag,
  })
}

/**
 * Delete (soft-delete) user account (admin only)
 */
export async function deleteUserApi(
  id: string
): Promise<ApiResponse<{ message: string }>> {
  return baseApi.delete<{ message: string }>(`/users/${id}`)
}

/**
 * Fetch users for the admin user management table with pagination, search, role & status filtering
 */
export async function fetchAdminUsersApi(
  params?: AdminUsersQueryParams
): Promise<PaginatedUsersResponse> {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    include_admin: true,
  }

  if (params?.page !== undefined) queryParams.page = params.page
  if (params?.limit !== undefined) queryParams.limit = params.limit
  if (params?.search) queryParams.search = params.search
  if (params?.role && params.role !== "all") queryParams.role = params.role
  if (params?.status && params.status !== "all") queryParams.status = params.status
  if (params?.sort_by) queryParams.sort_by = params.sort_by
  if (params?.sort_order) queryParams.sort_order = params.sort_order
  if (params?.is_active !== undefined) queryParams.is_active = params.is_active

  const res = await baseApi.get<any>("/users", { params: queryParams })

  let rawList: UserProfileResponse[] = []
  if (res.success && res.data) {
    if (Array.isArray(res.data)) {
      rawList = res.data
    } else if (Array.isArray(res.data.data)) {
      rawList = res.data.data
    }
  }

  const meta = (res as any)?.meta || (res?.data as any)?.meta || {
    total: rawList.length,
    page: params?.page || 1,
    limit: params?.limit || rawList.length || 20,
    totalPages: Math.ceil((rawList.length || 1) / (params?.limit || 20)) || 1,
  }

  return {
    success: res.success,
    data: rawList,
    meta,
  }
}

/**
 * Fetch public community members (filtered by active and excludes admin)
 */
export async function fetchUsersApi(
  params?: Record<string, unknown>
): Promise<UserProfileResponse[]> {
  try {
    const res = await baseApi.get<any>("/users", {
      params: { is_active: "true", limit: "50", ...params },
    })
    if (res.success && res.data) {
      const rawList: UserProfileResponse[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
        : []
      return rawList.filter((u) => u.role?.toLowerCase() !== "admin")
    }
    return []
  } catch (err) {
    console.warn("Could not fetch users from backend:", err)
    return []
  }
}

import type { UserProfileData } from "../data/userDataStore"

export function mapUserToProfileData(u: UserProfileResponse): UserProfileData {
  const name = u.fullName || u.full_name || u.name || "Community Member"
  const rawImage = u.profileImage || u.profile_image || u.avatar
  const profilePhoto = rawImage ? resolveAssetUrl(rawImage) : ""
  const digitalSlug = u.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  let parsedAchievements: string[] = []
  if (u.achievement) {
    parsedAchievements = u.achievement
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return {
    id: u.id,
    fullName: name,
    phone: u.phone || "",
    professionalTitle: "",
    profilePhoto,
    shortBio: "",
    professionalExperience:
      u.professional_experience || u.professionalExperience || "",
    education: u.education || "",
    achievements: parsedAchievements,
    city: "",
    country: "",
    website: u.website || "",
    socialMedia: "",
    digitalSlug,
    email: u.email || "",
  }
}

export { resolveAssetUrl }
