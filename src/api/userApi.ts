/**
 * Centralized User API Service
 * Handles user fetching and profile updates with multipart/form-data support.
 */

import { baseApi, resolveAssetUrl } from "./baseApi"
import type { ApiResponse } from "./types"
import type { AuthUserApi } from "./authApi"

export interface UserProfileResponse {
  id: string
  fullName?: string
  full_name?: string
  email?: string
  role: string
  phone?: string | null
  status?: string
  profileImage?: string | null
  profile_image?: string | null
  website?: string | null
}

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

export async function updateUserApi(
  id: string,
  payload: FormData | Record<string, unknown>
): Promise<ApiResponse<UserProfileResponse>> {
  return baseApi.patch<UserProfileResponse>(`/users/${id}`, payload)
}

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
  const name = u.fullName || u.full_name || "Community Member"
  const rawImage = u.profileImage || u.profile_image
  const profilePhoto = rawImage
    ? resolveAssetUrl(rawImage)
    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&auto=format"
  const digitalSlug = u.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const roleName = u.role
    ? u.role.charAt(0).toUpperCase() + u.role.slice(1)
    : "Member"

  return {
    fullName: name,
    phone: u.phone || "",
    professionalTitle: roleName === "Admin" ? "Network Director" : roleName,
    profilePhoto,
    shortBio: `${name} is an active member and leader within the Kingdom Builders Network community.`,
    professionalExperience: "Active contributor to Kingdom Builders Network initiatives and collaborative business development.",
    education: "Higher Education & Leadership Training",
    achievements: [
      "Kingdom Builders Network Member",
      "Community Ecosystem Partner",
    ],
    city: "Addis Ababa",
    country: "Ethiopia",
    website: u.website || "",
    socialMedia: "",
    digitalSlug,
  }
}

export { resolveAssetUrl }
