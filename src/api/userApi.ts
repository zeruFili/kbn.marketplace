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

export { resolveAssetUrl }
