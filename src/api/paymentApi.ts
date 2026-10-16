/**
 * Payment API Client
 * Integrates directly with backend payment verification endpoint: /api/v1/payments/verify
 * and status check /api/v1/payments/status
 * Uses the centralized baseApi client.
 */

import { baseApi, ApiError } from "./baseApi"

export interface VerifiedPayment {
  id?: string
  user_id?: string
  amount?: string | number
  status?: string
  provider?: string | null
  reference?: string | null
  date?: string | Date
  time?: string
  url?: string | null
  image?: string | null
  expirationDate?: string | Date | null
  expiration_date?: string | Date | null
  created_at?: string | Date
}

export interface VerifyReceiptSuccessResponse {
  success: true
  duplicate: false
  message: string
  data?: VerifiedPayment
}

export interface VerifyReceiptFailureResponse {
  success: false
  duplicate: boolean
  message: string
  reason?: string
  existingPaymentId?: string
  data?: VerifiedPayment
}

export type VerifyReceiptResponse = VerifyReceiptSuccessResponse | VerifyReceiptFailureResponse

export interface PaymentValidityData {
  userId?: string
  hasPayment?: boolean
  isValid?: boolean
  isExpired?: boolean
  expirationDate?: string | null
  daysRemaining?: number
  latestPayment?: VerifiedPayment | null
  isActive?: boolean
  lastPaymentDate?: string
}

export interface PaymentUserSummary {
  id: string
  full_name?: string
  name?: string
  email?: string
  phone?: string | null
  profileImage?: string | null
  avatar?: string | null
  role?: string
  status?: string
  is_active?: boolean
}

export interface PaymentItem {
  id: string
  user_id: string
  amount: string
  status: "accepted" | "pending" | "rejected" | string
  provider?: string | null
  reference?: string | null
  date?: string | null
  time?: string | null
  url?: string | null
  image?: string | null
  expirationDate?: string | null
  expiration_date?: string | null
  isExpired?: boolean
  is_expired?: boolean
  isValid?: boolean
  is_valid?: boolean
  created_at: string
  updated_at?: string
  user?: PaymentUserSummary | null
}

export interface PaymentListResponse {
  success: boolean
  data: PaymentItem[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AdminPaymentQueryParams {
  month?: number
  year?: number
  status?: string
  userName?: string
  page?: number
  limit?: number
}

/**
 * Fetch current user payment validity and latest payment status via GET /api/v1/payments/status
 */
export async function fetchPaymentValidity(): Promise<PaymentValidityData | null> {
  try {
    const res = await baseApi.get<PaymentValidityData>("/payments/status")
    if (res.success && res.data) {
      return res.data
    }
    return null
  } catch {
    return null
  }
}

/**
 * Upload and verify a payment receipt image or PDF via POST /api/v1/payments/verify
 *
 * @param file Receipt file (PNG, JPG, JPEG, PDF up to 10MB)
 * @returns Standardized verification response with extracted bank details or error reason
 */
export async function verifyPaymentReceipt(file: File): Promise<VerifyReceiptResponse> {
  const formData = new FormData()
  formData.append("attachmentFiles", file)

  try {
    const res = await baseApi.post<VerifiedPayment>("/payments/verify", formData)

    if (res.success) {
      return {
        success: true,
        duplicate: false,
        message: res.message || "Your payment has been submitted successfully and is currently under verification. Please wait while the admin reviews your payment.",
        data: res.data,
      }
    }

    // Backend returned 200 with success: false (e.g. unverified, rejected, or pending review)
    // The backend still saves the payment record in PENDING status for manual admin verification.
    const rawRes = res as unknown as Record<string, unknown>
    return {
      success: false,
      duplicate: Boolean(rawRes.duplicate),
      message: "Your payment has been submitted successfully and is currently under verification. Please wait while the admin reviews your payment.",
      reason: (rawRes.reason as string) || res.message,
      data: res.data,
    }
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      const errorData = (err.data && typeof err.data === "object") ? (err.data as Record<string, unknown>) : undefined
      const isDuplicate = err.status === 409 || Boolean(errorData?.duplicate)
      const existingId = (errorData?.existing_payment_id as string) || undefined

      if (isDuplicate) {
        return {
          success: false,
          duplicate: true,
          message: "This payment receipt has already been submitted and is currently under verification. Please wait while the admin reviews your payment.",
          reason: "Duplicate receipt submission",
          existingPaymentId: existingId,
        }
      }

      // Backend returned an error (e.g. 500, 400).
      // Per requirements: display the "Your payment is under verification" message when the backend returns an error.
      return {
        success: false,
        duplicate: false,
        message: "Your payment has been submitted successfully and is currently under verification. Please wait while the admin reviews your payment.",
        reason: (errorData?.reason as string) || (errorData?.message as string) || err.message,
        data: errorData?.data as VerifiedPayment | undefined,
      }
    }

    // Network or other error: also assure the user that their payment is under verification if submitted
    return {
      success: false,
      duplicate: false,
      message: "Your payment has been submitted successfully and is currently under verification. Please wait while the admin reviews your payment.",
      reason: err instanceof Error ? err.message : undefined,
    }
  }
}

/**
 * Fetch payments for admin with optional month, year, status, and userName filters via GET /api/v1/payments
 */
export async function fetchAdminPayments(
  params?: AdminPaymentQueryParams
): Promise<PaymentListResponse> {
  const queryParams: Record<string, string | number | undefined> = {}
  if (params?.month !== undefined) queryParams.month = params.month
  if (params?.year !== undefined) queryParams.year = params.year
  if (params?.status && params.status !== "all") queryParams.status = params.status
  if (params?.userName) queryParams.userName = params.userName
  if (params?.page !== undefined) queryParams.page = params.page
  if (params?.limit !== undefined) queryParams.limit = params.limit

  const res = await baseApi.get<PaymentItem[]>("/payments", { params: queryParams })
  return {
    success: res.success,
    data: Array.isArray(res.data) ? res.data : [],
    meta: (res as any).meta,
  }
}

/**
 * Fetch single payment details by ID via GET /api/v1/payments/:id
 */
export async function fetchPaymentById(id: string): Promise<PaymentItem | null> {
  try {
    const res = await baseApi.get<PaymentItem>(`/payments/${id}`)
    if (res.success && res.data) {
      return res.data
    }
    return null
  } catch {
    return null
  }
}

/**
 * Update payment status (admin) via PATCH /api/v1/payments/:id
 */
export async function updateAdminPaymentStatus(
  id: string,
  status: "accepted" | "pending" | "rejected"
): Promise<PaymentItem | null> {
  const res = await baseApi.patch<PaymentItem>(`/payments/${id}`, { status })
  if (res.success && res.data) {
    return res.data
  }
  return null
}

