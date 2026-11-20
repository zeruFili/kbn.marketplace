import { baseApi } from "./baseApi"

export interface LoveGiftItem {
  id: string
  user_id: string | null
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  } | null
  donorName: string | null
  donorEmail: string | null
  donorPhone: string | null
  isAnonymous: boolean
  amount: string
  currency: string
  status: "pending" | "accepted" | "rejected"
  provider: string | null
  reference: string | null
  url: string | null
  image: string | null
  date: string
  time: string
  note: string | null
  adminNotes?: string | null
  created_at: string
  updated_at?: string
}

export interface UserLoveGiftSummary {
  totalContributed: number
  totalGiftsCount: number
  approvedGiftsCount: number
  pendingGiftsCount: number
  gifts: LoveGiftItem[]
}

export interface AdminLoveGiftResponse {
  success: boolean
  data: LoveGiftItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  statistics: {
    totalApprovedAmount: number
    totalCount: number
    acceptedCount: number
    pendingCount: number
    rejectedCount: number
  }
}

export interface LoveGiftQueryParams {
  status?: string
  month?: number | string
  year?: number | string
  search?: string
  page?: number
  limit?: number
}

export interface SubmitLoveGiftResult {
  success: boolean
  duplicate: boolean
  message: string
  reason?: string
  data?: LoveGiftItem
}

/**
 * Submit a voluntary Love Gift receipt
 */
export async function submitLoveGift(formData: FormData): Promise<SubmitLoveGiftResult> {
  const response = await baseApi.post<LoveGiftItem>("/love-gifts", formData)
  return {
    success: response.success,
    duplicate: (response as any).duplicate === true,
    message: response.message || (response.success ? "Love Gift submitted successfully" : "Submission under review"),
    reason: (response as any).reason,
    data: response.data,
  }
}

/**
 * Fetch the logged-in user's Love Gift contribution summary & history
 */
export async function fetchUserLoveGiftSummary(): Promise<UserLoveGiftSummary> {
  const response = await baseApi.get<UserLoveGiftSummary>("/love-gifts/my")
  return (
    response.data || {
      totalContributed: 0,
      totalGiftsCount: 0,
      approvedGiftsCount: 0,
      pendingGiftsCount: 0,
      gifts: [],
    }
  )
}

/**
 * Admin: Fetch all Love Gifts with statistics and filtering
 */
export async function fetchAdminLoveGifts(
  params?: LoveGiftQueryParams
): Promise<AdminLoveGiftResponse> {
  const response = await baseApi.get<AdminLoveGiftResponse>("/love-gifts", {
    params: params as Record<string, string | number | boolean | undefined | null>,
  })

  const payload = response as any
  if (payload && payload.statistics) {
    return payload as AdminLoveGiftResponse
  }

  return (
    response.data || {
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      statistics: {
        totalApprovedAmount: 0,
        totalCount: 0,
        acceptedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
      },
    }
  )
}

/**
 * Admin: Update Love Gift verification status (approve or reject)
 */
export async function updateAdminLoveGiftStatus(
  id: string,
  status: "accepted" | "rejected" | "pending",
  adminNotes?: string
): Promise<LoveGiftItem> {
  const response = await baseApi.patch<LoveGiftItem>(`/love-gifts/${id}/status`, {
    status,
    adminNotes,
  })
  if (!response.data) {
    throw new Error(response.message || "Failed to update Love Gift status")
  }
  return response.data
}

/**
 * Fetch single Love Gift by ID
 */
export async function fetchLoveGiftById(id: string): Promise<LoveGiftItem> {
  const response = await baseApi.get<LoveGiftItem>(`/love-gifts/${id}`)
  if (!response.data) {
    throw new Error(response.message || "Love Gift not found")
  }
  return response.data
}
