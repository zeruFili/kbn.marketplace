/**
 * Centralized Featured Members & Companies API
 * Handles fetching and admin updating of featured selections.
 */

import { baseApi } from "./baseApi"
import type { ApiResponse } from "./types"
import type { UserProfileResponse } from "./userApi"
import type { CompanyApiResponse } from "./companyApi"

export interface FeaturedMemberItem {
  id: string
  user_id: string
  display_order: number
  created_at?: string
  updated_at?: string | null
  user: UserProfileResponse
}

export interface FeaturedCompanyItem {
  id: string
  company_id: string
  display_order: number
  created_at?: string
  updated_at?: string | null
  company: CompanyApiResponse
}

export interface FeaturedCombinedResponse {
  members: FeaturedMemberItem[]
  companies: FeaturedCompanyItem[]
}

/**
 * Fetch all featured members
 */
export async function fetchFeaturedMembers(): Promise<FeaturedMemberItem[]> {
  try {
    const res = await baseApi.get<FeaturedMemberItem[]>("/featured/members")
    if (res.success && Array.isArray(res.data)) {
      return res.data
    }
    return []
  } catch (err) {
    console.warn("Could not fetch featured members:", err)
    return []
  }
}

/**
 * Fetch all featured companies
 */
export async function fetchFeaturedCompanies(): Promise<FeaturedCompanyItem[]> {
  try {
    const res = await baseApi.get<FeaturedCompanyItem[]>("/featured/companies")
    if (res.success && Array.isArray(res.data)) {
      return res.data
    }
    return []
  } catch (err) {
    console.warn("Could not fetch featured companies:", err)
    return []
  }
}

/**
 * Fetch both featured members and companies combined
 */
export async function fetchFeaturedCombined(): Promise<FeaturedCombinedResponse> {
  try {
    const res = await baseApi.get<FeaturedCombinedResponse>("/featured")
    if (res.success && res.data) {
      return {
        members: res.data.members || [],
        companies: res.data.companies || [],
      }
    }
    return { members: [], companies: [] }
  } catch (err) {
    console.warn("Could not fetch featured combined:", err)
    return { members: [], companies: [] }
  }
}

/**
 * Admin: Update featured members (requires 5 to 7 member IDs)
 */
export async function updateFeaturedMembers(
  userIds: string[]
): Promise<ApiResponse<FeaturedMemberItem[]>> {
  return baseApi.put<FeaturedMemberItem[]>("/featured/members", {
    userIds,
  })
}

/**
 * Admin: Update featured companies (requires 5 to 7 company IDs)
 */
export async function updateFeaturedCompanies(
  companyIds: string[]
): Promise<ApiResponse<FeaturedCompanyItem[]>> {
  return baseApi.put<FeaturedCompanyItem[]>("/featured/companies", {
    companyIds,
  })
}
