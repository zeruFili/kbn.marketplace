/**
 * Events API Client
 * Uses centralized baseApi for communication with backend event endpoints.
 */

import { baseApi, resolveAssetUrl } from "./baseApi"
import type { UserEventData } from "../data/userDataStore"

export interface EventApiResponse {
  id: string
  title: string
  slug: string
  type: string
  images?: string[] | null
  start_date: string
  status: "draft" | "published"
  availability: "public" | "private"
  location: string
  description: string
  created_by: string
  created_at: string
  updated_at?: string
}

export interface EventCreationResult {
  success: boolean
  data?: EventApiResponse
  message?: string
}

/**
 * Fetch all events from backend
 */
export async function fetchEvents(): Promise<EventApiResponse[]> {
  try {
    const res = await baseApi.get<EventApiResponse[]>("/events")
    if (res.success && Array.isArray(res.data)) {
      return res.data
    }
    return []
  } catch (err) {
    console.warn("Could not fetch events from backend:", err)
    return []
  }
}

/**
 * Fetch a single event by ID
 */
export async function fetchEventById(id: string): Promise<EventApiResponse | null> {
  try {
    const res = await baseApi.get<EventApiResponse>(`/events/${id}`)
    if (res.success && res.data) {
      return res.data
    }
    return null
  } catch (err) {
    console.warn(`Could not fetch event ${id} from backend:`, err)
    return null
  }
}

/**
 * Submit event creation with multipart/form-data
 */
export async function createEvent(
  payload: FormData | Record<string, unknown>
): Promise<EventCreationResult> {
  try {
    const res = await baseApi.post<EventApiResponse>("/events", payload)
    return {
      success: !!res.success,
      data: res.data,
      message: res.message || "Event created successfully",
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to create event. Please verify all details and try again."
    return {
      success: false,
      message,
    }
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(
  id: string,
  payload: FormData | Record<string, unknown>
): Promise<EventCreationResult> {
  try {
    const res = await baseApi.patch<EventApiResponse>(`/events/${id}`, payload)
    return {
      success: !!res.success,
      data: res.data,
      message: res.message || "Event updated successfully",
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to update event. Please try again."
    return {
      success: false,
      message,
    }
  }
}

/**
 * Delete an event by ID
 */
export async function deleteEventApi(id: string): Promise<boolean> {
  try {
    const res = await baseApi.delete(`/events/${id}`)
    return !!res.success
  } catch (err) {
    console.warn(`Could not delete event ${id}:`, err)
    return false
  }
}

/**
 * Format raw backend event entity to UserEventData used across frontend cards and lists
 */
export function mapEventToUserEventData(event: EventApiResponse): UserEventData {
  const rawImage =
    event.images && event.images.length > 0 ? event.images[0] : ""
  const resolvedImage = rawImage
    ? resolveAssetUrl(rawImage)
    : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=520&fit=crop&auto=format"

  const formattedDate = event.start_date
    ? new Date(event.start_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return {
    id: event.id,
    eventImage: resolvedImage,
    title: event.title,
    description: event.description,
    eventType: event.type || "General",
    startDate: formattedDate || event.start_date,
    endDate: formattedDate || event.start_date,
    location: event.location,
    online: event.location.toLowerCase().includes("online"),
    eventUrl: "",
    status: event.status?.toLowerCase() === "published" ? "Published" : "Draft",
  }
}
