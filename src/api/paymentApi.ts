/**
 * Payment API Client
 * Integrates directly with backend payment verification endpoint: /api/v1/payments/verify
 * and status check /api/v1/payments/status
 * Uses the centralized baseApi client.
 */

import { baseApi, ApiError } from "./baseApi"
import type { ApiResponse } from "./types"

export type BillingCycle = "monthly" | "yearly"

export const YEARLY_DISCOUNT_PERCENT = 10

export interface PlanPriceDetails {
  amount: number
  originalAmount?: number
  discountAmount?: number
  discountPercent?: number
  monthlyEquivalent: number
  formattedPrice: string
  formattedOriginalPrice?: string
  formattedDiscount?: string
  cycleLabel: "month" | "year"
  billingNote: string
}

/**
 * Calculate pricing for monthly or yearly billing cycles.
 * Yearly subscription offers a 10% discount on the full 12-month amount.
 */
export function calculatePlanPrice(
  monthlyAmount: number,
  cycle: BillingCycle = "monthly"
): PlanPriceDetails {
  if (cycle === "yearly") {
    const regularAnnual = monthlyAmount * 12
    const discount = Math.round(regularAnnual * (YEARLY_DISCOUNT_PERCENT / 100))
    const discountedTotal = regularAnnual - discount
    const monthlyEquiv = Math.round(discountedTotal / 12)

    return {
      amount: discountedTotal,
      originalAmount: regularAnnual,
      discountAmount: discount,
      discountPercent: YEARLY_DISCOUNT_PERCENT,
      monthlyEquivalent: monthlyEquiv,
      formattedPrice: `ETB ${discountedTotal.toLocaleString()}`,
      formattedOriginalPrice: `ETB ${regularAnnual.toLocaleString()}`,
      formattedDiscount: `Save ETB ${discount.toLocaleString()} (10% off)`,
      cycleLabel: "year",
      billingNote: `Billed annually (ETB ${monthlyEquiv.toLocaleString()}/mo)`,
    }
  }

  return {
    amount: monthlyAmount,
    originalAmount: monthlyAmount,
    discountAmount: 0,
    discountPercent: 0,
    monthlyEquivalent: monthlyAmount,
    formattedPrice: `ETB ${monthlyAmount.toLocaleString()}`,
    cycleLabel: "month",
    billingNote: "Billed monthly",
  }
}

export const BILLING_CYCLE_STORAGE_KEY = "kbn_selected_billing_cycle"

export function getStoredBillingCycle(): BillingCycle {
  if (typeof window === "undefined") return "monthly"
  const stored = sessionStorage.getItem(BILLING_CYCLE_STORAGE_KEY)
  if (stored === "yearly" || stored === "monthly") return stored
  return "monthly"
}

export function setStoredBillingCycle(cycle: BillingCycle): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(BILLING_CYCLE_STORAGE_KEY, cycle)
}

export interface MembershipCategoryOption {
  id: string
  code?: string
  categoryId?: string
  name: string
  amount: number
  currency: "ETB" | string
  formattedPrice: string
  tier: number
  description: string
  popular?: boolean
  is_active?: boolean
}

export const DEFAULT_MEMBERSHIP_CATEGORIES: MembershipCategoryOption[] = [
  {
    id: "beginner_professionals_business_owners",
    code: "beginner_professionals_business_owners",
    name: "Beginner Professionals & Business Owners",
    amount: 100,
    currency: "ETB",
    formattedPrice: "ETB 100",
    tier: 1,
    description: "Ideal for emerging professionals, startups, and small business owners.",
  },
  {
    id: "developing_professionals_business_owners",
    code: "developing_professionals_business_owners",
    name: "Developing Professionals & Business Owners",
    amount: 200,
    currency: "ETB",
    formattedPrice: "ETB 200",
    tier: 2,
    description: "For growing professionals and established businesses scaling operations and networking.",
  },
  {
    id: "established_professionals_business_owners",
    code: "established_professionals_business_owners",
    name: "Established Professionals & Business Owners",
    amount: 400,
    currency: "ETB",
    formattedPrice: "ETB 400",
    tier: 3,
    popular: true,
    description: "For experienced professionals and business owners expanding their influence and partnerships.",
  },
  {
    id: "senior_professionals_business_owners",
    code: "senior_professionals_business_owners",
    name: "Senior Professionals & Business Owners",
    amount: 650,
    currency: "ETB",
    formattedPrice: "ETB 650",
    tier: 4,
    description: "For seasoned executives, senior leaders, and high-impact enterprise builders.",
  },
  {
    id: "investors_strategic_partners",
    code: "investors_strategic_partners",
    name: "Investors & Strategic Partners",
    amount: 1000,
    currency: "ETB",
    formattedPrice: "ETB 1,000",
    tier: 5,
    description: "For investors and strategic partners seeking meaningful connections and opportunities.",
  },
]

export function getMembershipCategoryLabel(categoryIdOrKey?: string | null): string {
  if (!categoryIdOrKey) return ""
  const normalized = categoryIdOrKey.toLowerCase().replace(/[^a-z0-9]/g, "")
  const found = DEFAULT_MEMBERSHIP_CATEGORIES.find(
    (c) =>
      c.id.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized ||
      c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
  )
  return found ? found.name : categoryIdOrKey
}

export function getMembershipCategoryInfo(
  categoryIdOrKey?: string | null
): MembershipCategoryOption | null {
  if (!categoryIdOrKey) return null
  const trimmed = categoryIdOrKey.trim()
  if (!trimmed) return null
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "")

  const found = DEFAULT_MEMBERSHIP_CATEGORIES.find(
    (c) =>
      c.id.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized ||
      c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
  )
  if (found) return found

  if (
    normalized.includes("investor") ||
    normalized.includes("strategic") ||
    normalized.includes("partner")
  ) {
    return DEFAULT_MEMBERSHIP_CATEGORIES[4]
  }
  if (normalized.includes("senior")) {
    return DEFAULT_MEMBERSHIP_CATEGORIES[3]
  }
  if (normalized.includes("established")) {
    return DEFAULT_MEMBERSHIP_CATEGORIES[2]
  }
  if (normalized.includes("developing")) {
    return DEFAULT_MEMBERSHIP_CATEGORIES[1]
  }
  if (normalized.includes("beginner") || normalized.includes("starting")) {
    return DEFAULT_MEMBERSHIP_CATEGORIES[0]
  }

  return null
}

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
  membershipCategory?: string | null
  membership_category?: string | null
  membershipCategoryLabel?: string | null
  membership_category_label?: string | null
  expectedAmount?: string | number | null
  expected_amount?: string | number | null
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
  membershipCategory?: string | null
  membership_category?: string | null
  membershipCategoryLabel?: string | null
  membership_category_label?: string | null
  expectedAmount?: string | null
  expected_amount?: string | null
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
 * Fetch user payment validity and latest payment status by userId via GET /api/v1/payments/user/:userId/status
 * Falls back to /payments/status if userId is omitted
 */
export async function fetchUserPaymentValidity(
  userId?: string
): Promise<PaymentValidityData | null> {
  try {
    const endpoint = userId ? `/payments/user/${userId}/status` : "/payments/status"
    const res = await baseApi.get<PaymentValidityData>(endpoint)
    if (res.success && res.data) {
      return res.data
    }
    // Fallback to /payments/status if user-specific endpoint did not return data
    if (userId) {
      return await fetchPaymentValidity()
    }
    return null
  } catch {
    if (userId) {
      return await fetchPaymentValidity()
    }
    return null
  }
}

/**
 * Fetch payments list for a specific user via GET /api/v1/payments/user/:userId
 * Falls back to GET /api/v1/payments?userId=:userId or GET /api/v1/payments
 */
export async function fetchUserPayments(userId?: string): Promise<PaymentItem[]> {
  try {
    const endpoint = userId ? `/payments/user/${userId}` : "/payments"
    const res = await baseApi.get<PaymentItem[]>(endpoint)
    if (res.success && Array.isArray(res.data)) {
      return res.data
    }
    // Fallback to query parameter if route is structured that way
    if (userId) {
      const fallbackRes = await baseApi.get<PaymentItem[]>("/payments", {
        params: { userId },
      })
      if (fallbackRes.success && Array.isArray(fallbackRes.data)) {
        return fallbackRes.data
      }
    }
    return []
  } catch {
    // If user endpoint threw, attempt query param fallback
    if (userId) {
      try {
        const fallbackRes = await baseApi.get<PaymentItem[]>("/payments", {
          params: { userId },
        })
        if (fallbackRes.success && Array.isArray(fallbackRes.data)) {
          return fallbackRes.data
        }
      } catch {
        return []
      }
    }
    return []
  }
}

export interface VerifyPaymentOptions {
  membershipCategory?: string
  paymentAmount?: number
  expectedAmount?: number
  billingCycle?: BillingCycle
}

/**
 * Fetch available membership categories via GET /api/v1/payments/membership-categories
 * Falls back to DEFAULT_MEMBERSHIP_CATEGORIES
 */
export async function fetchMembershipCategories(): Promise<MembershipCategoryOption[]> {
  try {
    const res = await baseApi.get<MembershipCategoryOption[]>("/payments/membership-categories")
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((cat) => ({
        ...cat,
        popular:
          cat.id === "established_professionals_business_owners" ||
          cat.code === "established_professionals_business_owners" ||
          cat.tier === 3 ||
          (typeof cat.name === "string" && cat.name.toLowerCase().includes("established")),
      }))
    }
    return DEFAULT_MEMBERSHIP_CATEGORIES
  } catch {
    return DEFAULT_MEMBERSHIP_CATEGORIES
  }
}

/**
 * Upload and verify a payment receipt image or PDF via POST /api/v1/payments/verify
 *
 * @param file Receipt file (PNG, JPG, JPEG, PDF up to 10MB)
 * @param options Selected membership package & amount details
 * @returns Standardized verification response with extracted bank details or error reason
 */
export async function verifyPaymentReceipt(
  file: File,
  options?: VerifyPaymentOptions
): Promise<VerifyReceiptResponse> {
  const formData = new FormData()
  formData.append("attachmentFiles", file)

  if (options?.membershipCategory) {
    formData.append("membershipCategory", options.membershipCategory)
    formData.append("membership_category", options.membershipCategory)
  }

  if (options?.billingCycle) {
    formData.append("billingCycle", options.billingCycle)
    formData.append("billing_cycle", options.billingCycle)
  }

  const amt = options?.paymentAmount ?? options?.expectedAmount
  if (amt !== undefined && amt !== null) {
    formData.append("amount", String(amt))
    formData.append("paymentAmount", String(amt))
    formData.append("expectedAmount", String(amt))
  }

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

      // If client validation error (400 Bad Request, e.g. missing category or amount mismatch), surface message
      if (err.status === 400) {
        const validationMsg = (errorData?.message as string) || err.message || "Please select a membership package before proceeding."
        return {
          success: false,
          duplicate: false,
          message: validationMsg,
          reason: validationMsg,
        }
      }

      // Backend returned another error (e.g. 500).
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

/**
 * Update payment expiration date (admin) via PATCH /api/v1/payments/:id
 */
export async function updateAdminPaymentExpirationDate(
  id: string,
  expirationDate: string | Date
): Promise<PaymentItem | null> {
  const dateStr =
    expirationDate instanceof Date
      ? expirationDate.toISOString()
      : new Date(expirationDate).toISOString()
  const res = await baseApi.patch<PaymentItem>(`/payments/${id}`, {
    expirationDate: dateStr,
    expiration_date: dateStr,
  })
  if (res.success && res.data) {
    return res.data
  }
  return null
}

/**
 * Persist selected membership category to backend for authenticated user
 */
export async function selectMembershipCategoryApi(
  membershipCategory: string
): Promise<ApiResponse<{ user: any; membershipCategory: any }>> {
  return baseApi.post<{ user: any; membershipCategory: any }>("/payments/select-category", {
    membershipCategory,
  })
}

