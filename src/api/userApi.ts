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
  role?: string
  phone?: string | null
  status?: string
  profileImage?: string | null
  profile_image?: string | null
  website?: string | null
  education?: string | null
  achievement?: string | null
  professional_experience?: string | null
  professionalExperience?: string | null
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
    : ""
  const digitalSlug = u.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  let parsedAchievements: string[] = []
  if (u.achievement) {
    parsedAchievements = u.achievement
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return {
    fullName: name,
    phone: u.phone || "",
    professionalTitle: "",
    profilePhoto,
    shortBio: "",
    professionalExperience: u.professional_experience || u.professionalExperience || "",
    education: u.education || "",
    achievements: parsedAchievements,
    city: "",
    country: "",
    website: u.website || "",
    socialMedia: "",
    digitalSlug,
  }
}

export { resolveAssetUrl }
