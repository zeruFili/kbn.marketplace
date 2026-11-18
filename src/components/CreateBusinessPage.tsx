import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "../auth/AuthContext"
import { ApiError } from "../api/baseApi"
import {
  submitCompanyCreation,
  type CompanyApiResponse,
} from "../api/companyApi"
import {
  fetchActiveCategoriesApi,
  type CategoryApiItem,
} from "../api/categoryApi"

interface SocialLinkItem {
  platform: string
  link: string
}

type BusinessField =
  | "companyName"
  | "categoryId"
  | "ownerName"
  | "email"
  | "phone"
  | "website"
  | "address"
  | "description"
  | "logoFile"
  | "coverFile"
  | "licenseFile"

type FieldTargetKey = BusinessField | `socialLink-${number}`

const STEP_FIELDS: Record<1 | 2 | 3, BusinessField[]> = {
  1: ["companyName", "categoryId", "ownerName", "email", "phone", "website", "address"],
  2: ["description"],
  3: ["logoFile", "coverFile", "licenseFile"],
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

function isValidHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw)
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.includes(".")
    )
  } catch {
    return false
  }
}

function validateSocialLinkValue(link: string): string | undefined {
  const trimmed = link.trim()
  if (!trimmed) return undefined
  if (trimmed.length > 255) {
    return "Social media link must be 255 characters or fewer."
  }
  if (!isValidHttpUrl(trimmed)) {
    return "Please enter a valid URL starting with http:// or https://."
  }
  return undefined
}

function validateSingleField(field: BusinessField, value: string | File | null): string | undefined {
  switch (field) {
    case "companyName": {
      const trimmed = String(value || "").trim()
      if (!trimmed) return "Please enter your company name."
      if (trimmed.length > 255) return "Company name must be 255 characters or fewer."
      return undefined
    }
    case "categoryId": {
      if (!String(value || "").trim()) return "Please select a business category."
      return undefined
    }
    case "ownerName": {
      const trimmed = String(value || "").trim()
      if (!trimmed) return "Please enter the owner or primary contact name."
      if (trimmed.length > 255) return "Owner / primary contact name must be 255 characters or fewer."
      return undefined
    }
    case "email": {
      const trimmed = String(value || "").trim()
      if (!trimmed) return "Please enter your official company email address."
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return "Please enter a valid company email address."
      }
      if (trimmed.length > 255) return "Email address must be 255 characters or fewer."
      return undefined
    }
    case "phone": {
      const trimmed = String(value || "").trim()
      if (!trimmed) return "Please enter a phone number."
      if (trimmed.length > 20) return "Phone number must be 20 characters or fewer."
      const digits = trimmed.replace(/\D/g, "")
      if (!/^[+\d\s\-()]+$/.test(trimmed) || digits.length < 7) {
        return "Please enter a valid phone number (e.g. +251 911 223344)."
      }
      return undefined
    }
    case "website": {
      const trimmed = String(value || "").trim()
      if (!trimmed) return undefined
      if (trimmed.length > 255) return "Website URL must be 255 characters or fewer."
      if (!isValidHttpUrl(trimmed)) {
        return "Please enter a valid website URL starting with http:// or https://."
      }
      return undefined
    }
    case "address": {
      const trimmed = String(value || "").trim()
      if (!trimmed) return "Please enter the physical address."
      if (trimmed.length > 255) return "Physical address must be 255 characters or fewer."
      return undefined
    }
    case "description": {
      const trimmed = String(value || "").trim()
      if (!trimmed) return "Please enter a company description."
      return undefined
    }
    case "logoFile": {
      const file = value instanceof File ? value : null
      if (!file) return undefined
      if (!file.type.startsWith("image/")) {
        return "Please upload a valid image file (PNG, JPG, WebP, or SVG)."
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return "Company logo must be 10MB or smaller."
      }
      return undefined
    }
    case "coverFile": {
      const file = value instanceof File ? value : null
      if (!file) return undefined
      if (!file.type.startsWith("image/")) {
        return "Please upload a valid image file (PNG, JPG, or WebP)."
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return "Cover image must be 10MB or smaller."
      }
      return undefined
    }
    case "licenseFile": {
      const file = value instanceof File ? value : null
      if (!file) {
        return "Please select and upload your business license or registration document."
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return "Business license file must be 10MB or smaller."
      }
      return undefined
    }
  }
}

const SOCIAL_PLATFORMS = [
  { id: "telegram", label: "Telegram", placeholder: "https://t.me/company" },
  { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
  { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/company" },
  { id: "x", label: "X (Twitter)", placeholder: "https://x.com/company" },
  { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/company" },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@company" },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@company" },
  { id: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/251911..." },
]

export default function CreateBusinessPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void
  onSuccess?: (company: CompanyApiResponse) => void
}) {
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<CategoryApiItem[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  // Form inputs
  const [companyName, setCompanyName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [ownerName, setOwnerName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")

  // Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([
    { platform: "telegram", link: "" },
  ])

  // Services
  const [services, setServices] = useState<string[]>([])
  const [newService, setNewService] = useState("")

  function handleAddService(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (newService.trim()) {
      if (!services.includes(newService.trim())) {
        setServices((prev) => [...prev, newService.trim()])
      }
      setNewService("")
    }
  }

  function handleRemoveService(index: number) {
    setServices((prev) => prev.filter((_, i) => i !== index))
  }

  // File Uploads
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)

  // UI status
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<BusinessField, string>>>({})
  const [socialLinkErrors, setSocialLinkErrors] = useState<Record<number, string>>({})
  const [createdCompany, setCreatedCompany] = useState<CompanyApiResponse | null>(null)
  const [scrollTarget, setScrollTarget] = useState<{
    key: FieldTargetKey | "banner"
    step?: number
    token: number
  } | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const licenseInputRef = useRef<HTMLInputElement>(null)
  const errorBannerRef = useRef<HTMLDivElement>(null)
  const fieldWrapperRefs = useRef<Partial<Record<FieldTargetKey, HTMLDivElement | null>>>({})
  const fieldInputRefs = useRef<
    Partial<Record<FieldTargetKey, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>
  >({})

  // Smoothly scroll to the first errored field (after step transitions commit if needed)
  useEffect(() => {
    if (!scrollTarget) return
    if (scrollTarget.step !== undefined && scrollTarget.step !== step) return

    const frameId = requestAnimationFrame(() => {
      if (scrollTarget.key === "banner") {
        errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      } else {
        const wrapper = fieldWrapperRefs.current[scrollTarget.key]
        const input = fieldInputRefs.current[scrollTarget.key]
        const target = wrapper || input
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        if (input) {
          input.focus({ preventScroll: true })
        }
      }
      setScrollTarget(null)
    })

    return () => cancelAnimationFrame(frameId)
  }, [scrollTarget, step])

  const syncErrorBanner = (
    nextFieldErrors: Partial<Record<BusinessField, string>>,
    nextSocialErrors: Record<number, string>
  ) => {
    const currentStepHasErrors =
      (step === 1 || step === 2 || step === 3) &&
      (STEP_FIELDS[step].some((field) => Boolean(nextFieldErrors[field])) ||
        (step === 2 && Object.keys(nextSocialErrors).length > 0))
    if (!currentStepHasErrors) {
      setErrorMessage("")
    }
  }

  const updateFieldErrorOnChange = (field: BusinessField, nextValue: string | File | null) => {
    if (!fieldErrors[field]) return
    const nextErr = validateSingleField(field, nextValue)
    const nextFieldErrors = { ...fieldErrors }
    if (nextErr) {
      nextFieldErrors[field] = nextErr
    } else {
      delete nextFieldErrors[field]
    }
    setFieldErrors(nextFieldErrors)
    syncErrorBanner(nextFieldErrors, socialLinkErrors)
  }

  const clearFieldError = (field: BusinessField) => {
    if (!fieldErrors[field]) return
    const nextFieldErrors = { ...fieldErrors }
    delete nextFieldErrors[field]
    setFieldErrors(nextFieldErrors)
    syncErrorBanner(nextFieldErrors, socialLinkErrors)
  }

  const stepHasErrors = (stepNum: 1 | 2 | 3): boolean => {
    if (STEP_FIELDS[stepNum].some((field) => Boolean(fieldErrors[field]))) {
      return true
    }
    if (stepNum === 2 && Object.keys(socialLinkErrors).length > 0) {
      return true
    }
    return false
  }

  const getInputClassName = (field: BusinessField, extraClasses = "") =>
    `w-full rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all border ${
      fieldErrors[field]
        ? "bg-red-50/50 dark:bg-red-950/20 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/25"
        : "bg-[var(--surface-alt)] border-[var(--border-default)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
    }${extraClasses ? ` ${extraClasses}` : ""}`

  // Load active categories from backend API
  const loadCategories = useCallback(async () => {
    setLoadingCategories(true)
    setCategoriesError(null)
    try {
      const data = await fetchActiveCategoriesApi()
      setCategories(data)
      setCategoryId((prev) => {
        if (prev && data.some((c) => c.id === prev)) return prev
        return data.length > 0 ? data[0].id : ""
      })
      if (data.length > 0) {
        setFieldErrors((prev) => {
          if (!prev.categoryId) return prev
          const next = { ...prev }
          delete next.categoryId
          return next
        })
      }
    } catch (err: unknown) {
      setCategories([])
      setCategoriesError(
        err instanceof Error
          ? err.message
          : "Failed to load categories from server."
      )
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  // Auto-cleanup object URL preview for logo
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  // Auto-cleanup object URL preview for cover image
  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  function handleAddSocialLink() {
    setSocialLinks((prev) => [...prev, { platform: "telegram", link: "" }])
  }

  function handleUpdateSocialLink(index: number, key: "platform" | "link", val: string) {
    setSocialLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: val } : item))
    )
    if (key === "link" && socialLinkErrors[index]) {
      const nextErr = validateSocialLinkValue(val)
      const nextSocialErrors = { ...socialLinkErrors }
      if (nextErr) {
        nextSocialErrors[index] = nextErr
      } else {
        delete nextSocialErrors[index]
      }
      setSocialLinkErrors(nextSocialErrors)
      syncErrorBanner(fieldErrors, nextSocialErrors)
    }
  }

  function handleRemoveSocialLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index))
    if (Object.keys(socialLinkErrors).length > 0) {
      const nextSocialErrors: Record<number, string> = {}
      Object.entries(socialLinkErrors).forEach(([k, msg]) => {
        const idx = Number(k)
        if (idx < index) nextSocialErrors[idx] = msg
        else if (idx > index) nextSocialErrors[idx - 1] = msg
      })
      setSocialLinkErrors(nextSocialErrors)
      syncErrorBanner(fieldErrors, nextSocialErrors)
    }
  }

  function getFieldValue(field: BusinessField): string | File | null {
    switch (field) {
      case "companyName":
        return companyName
      case "categoryId":
        return categoryId
      case "ownerName":
        return ownerName
      case "email":
        return email
      case "phone":
        return phone
      case "website":
        return website
      case "address":
        return address
      case "description":
        return description
      case "logoFile":
        return logoFile
      case "coverFile":
        return coverFile
      case "licenseFile":
        return licenseFile
    }
  }

  function collectErrorsForSteps(stepsToValidate: (1 | 2 | 3)[]): {
    nextFieldErrors: Partial<Record<BusinessField, string>>
    nextSocialErrors: Record<number, string>
    firstError: { step: 1 | 2 | 3; key: FieldTargetKey; message: string } | null
  } {
    const nextFieldErrors: Partial<Record<BusinessField, string>> = {}
    const nextSocialErrors: Record<number, string> = {}
    let firstError: { step: 1 | 2 | 3; key: FieldTargetKey; message: string } | null = null

    for (const s of stepsToValidate) {
      for (const field of STEP_FIELDS[s]) {
        const err = validateSingleField(field, getFieldValue(field))
        if (err) {
          nextFieldErrors[field] = err
          if (!firstError) {
            firstError = { step: s, key: field, message: err }
          }
        }
      }
      if (s === 2) {
        socialLinks.forEach((item, idx) => {
          const err = validateSocialLinkValue(item.link)
          if (err) {
            nextSocialErrors[idx] = err
            if (!firstError) {
              firstError = { step: 2, key: `socialLink-${idx}`, message: err }
            }
          }
        })
      }
    }

    return { nextFieldErrors, nextSocialErrors, firstError }
  }

  function validateStep(currentStep: number): boolean {
    if (currentStep !== 1 && currentStep !== 2 && currentStep !== 3) {
      return true
    }

    const { nextFieldErrors, nextSocialErrors, firstError } = collectErrorsForSteps([
      currentStep,
    ])

    // Preserve any existing errors on other steps while replacing errors for currentStep
    const mergedFieldErrors: Partial<Record<BusinessField, string>> = { ...fieldErrors }
    for (const field of STEP_FIELDS[currentStep]) {
      delete mergedFieldErrors[field]
    }
    Object.assign(mergedFieldErrors, nextFieldErrors)

    setFieldErrors(mergedFieldErrors)
    if (currentStep === 2) {
      setSocialLinkErrors(nextSocialErrors)
    }

    if (firstError) {
      const stepErrorCount =
        Object.keys(nextFieldErrors).length +
        (currentStep === 2 ? Object.keys(nextSocialErrors).length : 0)
      setErrorMessage(
        stepErrorCount === 1
          ? firstError.message
          : "Please correct the highlighted fields below before continuing."
      )
      setScrollTarget({
        key: firstError.key,
        step: currentStep,
        token: Date.now(),
      })
      return false
    }

    setErrorMessage("")
    return true
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => s + 1)
    }
  }

  function handleBackStep() {
    setErrorMessage("")
    setStep((s) => s - 1)
  }

  function parseServerErrors(err: unknown): {
    bannerMessage: string
    mappedFields: Partial<Record<BusinessField, string>>
    mappedSocial: Record<number, string>
  } {
    const rawMessages: string[] = []
    let fallbackMessage = "An unexpected error occurred during company creation."

    if (err instanceof ApiError) {
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        rawMessages.push(...err.errors)
      }
      if (err.message) {
        fallbackMessage = err.message
        if (rawMessages.length === 0) {
          rawMessages.push(
            ...err.message
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean)
          )
        }
      }
    } else if (err instanceof Error) {
      fallbackMessage = err.message
      rawMessages.push(
        ...err.message
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
      )
    }

    const mappedFields: Partial<Record<BusinessField, string>> = {}
    const mappedSocial: Record<number, string> = {}

    for (const msg of rawMessages) {
      const lower = msg.toLowerCase()
      if (lower.includes("company_name") || lower.includes("company name")) {
        mappedFields.companyName = msg
      } else if (lower.includes("business_category") || lower.includes("category")) {
        mappedFields.categoryId = msg
      } else if (lower.includes("owner_primary_contact") || lower.includes("owner")) {
        mappedFields.ownerName = msg
      } else if (lower.includes("email")) {
        mappedFields.email = msg
      } else if (lower.includes("phone_number") || lower.includes("phone")) {
        mappedFields.phone = msg
      } else if (lower.includes("website")) {
        mappedFields.website = msg
      } else if (lower.includes("physical_address") || lower.includes("address")) {
        mappedFields.address = msg
      } else if (lower.includes("description")) {
        mappedFields.description = msg
      } else if (lower.includes("social_media") || lower.includes("social")) {
        const firstNonEmptyIdx = socialLinks.findIndex((s) => s.link.trim().length > 0)
        mappedSocial[firstNonEmptyIdx >= 0 ? firstNonEmptyIdx : 0] = msg
      } else if (lower.includes("company_logo") || lower.includes("logo")) {
        mappedFields.logoFile = msg
      } else if (lower.includes("cover_image") || lower.includes("cover")) {
        mappedFields.coverFile = msg
      } else if (lower.includes("business_license") || lower.includes("license")) {
        mappedFields.licenseFile = msg
      }
    }

    const totalMapped = Object.keys(mappedFields).length + Object.keys(mappedSocial).length
    const bannerMessage =
      totalMapped > 1
        ? "Please correct the highlighted fields below and submit again."
        : rawMessages.length > 0
          ? rawMessages.join(". ")
          : fallbackMessage

    return { bannerMessage, mappedFields, mappedSocial }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Pressing Enter while on Steps 1-3 should validate & advance the current step
    if (step < 4) {
      handleNext()
      return
    }

    setErrorMessage("")

    // Validate all steps before submitting so any missing/invalid fields on earlier pages are caught
    const { nextFieldErrors, nextSocialErrors, firstError } = collectErrorsForSteps([1, 2, 3])
    setFieldErrors(nextFieldErrors)
    setSocialLinkErrors(nextSocialErrors)

    if (firstError) {
      const totalErrors =
        Object.keys(nextFieldErrors).length + Object.keys(nextSocialErrors).length
      setErrorMessage(
        totalErrors === 1
          ? firstError.message
          : `Please fix the highlighted errors starting on Step ${firstError.step} before submitting.`
      )
      setStep(firstError.step)
      setScrollTarget({
        key: firstError.key,
        step: firstError.step,
        token: Date.now(),
      })
      return
    }

    setSubmitting(true)

    try {
      // Build FormData with text fields and file attachments
      const formData = new FormData()
      formData.append("company_name", companyName.trim())
      formData.append("business_category_id", categoryId)
      formData.append("owner_primary_contact", ownerName.trim())
      formData.append("email", email.trim())
      formData.append("phone_number", phone.trim())
      formData.append("physical_address", address.trim())
      formData.append("description", description.trim())

      if (website.trim()) {
        formData.append("website", website.trim())
      }

      // Filter non-empty social links
      const validSocials = socialLinks
        .filter((s) => s.link.trim().length > 0)
        .map((s) => ({ platform: s.platform, link: s.link.trim() }))

      if (validSocials.length > 0) {
        formData.append("social_media", JSON.stringify(validSocials))
      }

      if (services.length > 0) {
        formData.append("services", JSON.stringify(services))
      }

      // Append files:
      // We append under attachmentFiles AND specific field names so both conventions succeed
      if (logoFile) {
        formData.append("company_logo", logoFile)
      }

      if (coverFile) {
        formData.append("cover_image", coverFile)
      }

      if (licenseFile) {
        formData.append("business_license", licenseFile)
      }

      // Send to backend endpoint POST /api/v1/companies
      const result = await submitCompanyCreation(formData)

      if (result.data) {
        setCreatedCompany(result.data)
        onSuccess?.(result.data)
      }
    } catch (err: unknown) {
      console.error("Company registration error:", err)
      const { bannerMessage, mappedFields, mappedSocial } = parseServerErrors(err)
      setErrorMessage(bannerMessage)
      setFieldErrors(mappedFields)
      setSocialLinkErrors(mappedSocial)

      // Find the earliest step and first field with a server error
      let firstServerTarget: { step: 1 | 2 | 3; key: FieldTargetKey } | null = null
      for (const s of [1, 2, 3] as const) {
        for (const field of STEP_FIELDS[s]) {
          if (mappedFields[field]) {
            firstServerTarget = { step: s, key: field }
            break
          }
        }
        if (firstServerTarget) break
        if (s === 2) {
          const socialIdx = Object.keys(mappedSocial)
            .map(Number)
            .sort((a, b) => a - b)[0]
          if (socialIdx !== undefined) {
            firstServerTarget = { step: 2, key: `socialLink-${socialIdx}` }
            break
          }
        }
      }

      if (firstServerTarget) {
        setStep(firstServerTarget.step)
        setScrollTarget({
          key: firstServerTarget.key,
          step: firstServerTarget.step,
          token: Date.now(),
        })
      } else {
        setScrollTarget({ key: "banner", token: Date.now() })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Success Screen
  if (createdCompany) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border-light)] rounded-3xl p-8 md:p-12 text-center shadow-xl shadow-black/5 animate-scale-in">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6 text-3xl">
            ✓
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[var(--accent-dark)] mb-2">
            Application Received
          </span>
          <h2 className="font-serif text-3xl text-[var(--text-primary)] mb-3">
            Company Registered!
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            Your company profile for <strong>{createdCompany.company_name}</strong> has been
            successfully created and submitted for verification.
          </p>

          <div className="bg-[var(--surface-alt)] rounded-2xl p-5 mb-8 text-left space-y-3 border border-[var(--border-default)]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-tertiary)]">Company ID:</span>
              <span className="font-mono text-[var(--text-primary)]">{createdCompany.id}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-tertiary)]">Status:</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-semibold uppercase text-[10px] tracking-wider">
                {createdCompany.verification_status}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-tertiary)]">Primary Email:</span>
              <span className="text-[var(--text-primary)] font-medium">{createdCompany.email}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-tertiary)]">Contact Phone:</span>
              <span className="text-[var(--text-primary)] font-medium">{createdCompany.phone_number}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onBack}
              className="bg-[var(--brand)] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-lg shadow-[var(--brand)]/20 cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] py-10 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span>←</span> Back
          </button>
          <span className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wider">
            Step {step} of 4
          </span>
        </div>

        {/* Title & Description */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--text-primary)] mb-2">
            Register Your Business
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Complete the form below to list your company in the Kingdom Builders Network directory.
            Government license documents and logos can be uploaded directly.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { num: 1, label: "Basic Info" },
            { num: 2, label: "About & Social" },
            { num: 3, label: "Upload Files" },
            { num: 4, label: "Review & Submit" },
          ].map((s) => {
            const hasStepError =
              s.num !== 4 && stepHasErrors(s.num as 1 | 2 | 3)
            return (
              <div
                key={s.num}
                className={`text-center pb-2 border-b-2 transition-all ${
                  hasStepError
                    ? "border-red-500 text-red-600 dark:text-red-400 font-semibold"
                    : step >= s.num
                      ? "border-[var(--brand)] text-[var(--brand)] font-semibold"
                      : "border-[var(--border-default)] text-[var(--text-tertiary)]"
                }`}
              >
                <span className="text-xs inline-flex items-center justify-center gap-1">
                  {s.label}
                  {hasStepError && (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"
                      aria-label={`Step ${s.num} has errors`}
                    />
                  )}
                </span>
              </div>
            )
          })}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            ref={errorBannerRef}
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 animate-fade-in"
          >
            <span className="text-lg leading-none">⚠️</span>
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[var(--surface)] border border-[var(--border-light)] rounded-3xl p-6 md:p-10 shadow-sm"
        >
          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-serif text-xl text-[var(--text-primary)] border-b border-[var(--border-light)] pb-3">
                1. Basic Company Information
              </h2>

              <div
                ref={(el) => {
                  fieldWrapperRefs.current.companyName = el
                }}
              >
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={(el) => {
                    fieldInputRefs.current.companyName = el
                  }}
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    const nextVal = e.target.value
                    setCompanyName(nextVal)
                    updateFieldErrorOnChange("companyName", nextVal)
                  }}
                  placeholder="e.g. Selam Construction Group"
                  aria-invalid={Boolean(fieldErrors.companyName)}
                  aria-describedby={fieldErrors.companyName ? "companyName-error" : undefined}
                  className={getInputClassName("companyName")}
                />
                {fieldErrors.companyName && (
                  <p id="companyName-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                    {fieldErrors.companyName}
                  </p>
                )}
              </div>

              <div
                ref={(el) => {
                  fieldWrapperRefs.current.categoryId = el
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="business-category-select"
                    className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider"
                  >
                    Business Category <span className="text-red-500">*</span>
                  </label>
                  {!loadingCategories && (
                    <button
                      type="button"
                      onClick={() => void loadCategories()}
                      className="text-[11px] font-medium text-[var(--brand)] dark:text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      Refresh list
                    </button>
                  )}
                </div>

                {loadingCategories ? (
                  <div className="w-full bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-sm text-[var(--text-tertiary)] flex items-center gap-2.5">
                    <span className="w-4 h-4 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full animate-spin flex-shrink-0" />
                    <span>Loading categories...</span>
                  </div>
                ) : categoriesError ? (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 flex items-center justify-between gap-3">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {categoriesError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadCategories()}
                      className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand-light)] transition-colors cursor-pointer flex-shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <select
                        ref={(el) => {
                          fieldInputRefs.current.categoryId = el
                        }}
                        id="business-category-select"
                        value={categoryId}
                        onChange={(e) => {
                          const nextVal = e.target.value
                          setCategoryId(nextVal)
                          updateFieldErrorOnChange("categoryId", nextVal)
                        }}
                        disabled={categories.length === 0}
                        aria-invalid={Boolean(fieldErrors.categoryId)}
                        aria-describedby={fieldErrors.categoryId ? "categoryId-error" : undefined}
                        className={`w-full appearance-none rounded-xl pl-4 pr-10 py-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border ${
                          fieldErrors.categoryId
                            ? "bg-red-50/50 dark:bg-red-950/20 border-red-500 focus:border-red-500 focus:ring-red-500/25"
                            : "bg-[var(--surface-alt)] border-[var(--border-default)] focus:border-[var(--brand)] focus:ring-[var(--brand)]/20"
                        }`}
                      >
                        {categories.length === 0 ? (
                          <option value="">No categories available yet</option>
                        ) : (
                          <>
                            <option value="">Select a business category...</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                    {categories.length === 0 && (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3.5 py-2.5">
                        No active categories have been configured yet. Please ask an administrator to add categories in the Admin Dashboard.
                      </p>
                    )}
                  </>
                )}
                {fieldErrors.categoryId && (
                  <p id="categoryId-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                    {fieldErrors.categoryId}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div
                  ref={(el) => {
                    fieldWrapperRefs.current.ownerName = el
                  }}
                >
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Owner / Primary Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={(el) => {
                      fieldInputRefs.current.ownerName = el
                    }}
                    type="text"
                    value={ownerName}
                    onChange={(e) => {
                      const nextVal = e.target.value
                      setOwnerName(nextVal)
                      updateFieldErrorOnChange("ownerName", nextVal)
                    }}
                    placeholder="e.g. Abebe Bikila"
                    aria-invalid={Boolean(fieldErrors.ownerName)}
                    aria-describedby={fieldErrors.ownerName ? "ownerName-error" : undefined}
                    className={getInputClassName("ownerName")}
                  />
                  {fieldErrors.ownerName && (
                    <p id="ownerName-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                      {fieldErrors.ownerName}
                    </p>
                  )}
                </div>

                <div
                  ref={(el) => {
                    fieldWrapperRefs.current.email = el
                  }}
                >
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Official Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={(el) => {
                      fieldInputRefs.current.email = el
                    }}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const nextVal = e.target.value
                      setEmail(nextVal)
                      updateFieldErrorOnChange("email", nextVal)
                    }}
                    placeholder="contact@company.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    className={getInputClassName("email")}
                  />
                  {fieldErrors.email && (
                    <p id="email-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div
                  ref={(el) => {
                    fieldWrapperRefs.current.phone = el
                  }}
                >
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={(el) => {
                      fieldInputRefs.current.phone = el
                    }}
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const nextVal = e.target.value
                      setPhone(nextVal)
                      updateFieldErrorOnChange("phone", nextVal)
                    }}
                    placeholder="+251 911 223344"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                    className={getInputClassName("phone")}
                  />
                  {fieldErrors.phone && (
                    <p id="phone-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div
                  ref={(el) => {
                    fieldWrapperRefs.current.website = el
                  }}
                >
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Website (Optional)
                  </label>
                  <input
                    ref={(el) => {
                      fieldInputRefs.current.website = el
                    }}
                    type="url"
                    value={website}
                    onChange={(e) => {
                      const nextVal = e.target.value
                      setWebsite(nextVal)
                      updateFieldErrorOnChange("website", nextVal)
                    }}
                    placeholder="https://company.com"
                    aria-invalid={Boolean(fieldErrors.website)}
                    aria-describedby={fieldErrors.website ? "website-error" : undefined}
                    className={getInputClassName("website")}
                  />
                  {fieldErrors.website && (
                    <p id="website-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                      {fieldErrors.website}
                    </p>
                  )}
                </div>
              </div>

              <div
                ref={(el) => {
                  fieldWrapperRefs.current.address = el
                }}
              >
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Physical Address <span className="text-red-500">*</span>
                </label>
                <input
                  ref={(el) => {
                    fieldInputRefs.current.address = el
                  }}
                  type="text"
                  value={address}
                  onChange={(e) => {
                    const nextVal = e.target.value
                    setAddress(nextVal)
                    updateFieldErrorOnChange("address", nextVal)
                  }}
                  placeholder="e.g. Bole Subcity, Woreda 03, Addis Ababa, Ethiopia"
                  aria-invalid={Boolean(fieldErrors.address)}
                  aria-describedby={fieldErrors.address ? "address-error" : undefined}
                  className={getInputClassName("address")}
                />
                {fieldErrors.address && (
                  <p id="address-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                    {fieldErrors.address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: ABOUT & SOCIAL */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-serif text-xl text-[var(--text-primary)] border-b border-[var(--border-light)] pb-3">
                2. Company Details & Social Links
              </h2>

              <div
                ref={(el) => {
                  fieldWrapperRefs.current.description = el
                }}
              >
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Company Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  ref={(el) => {
                    fieldInputRefs.current.description = el
                  }}
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    const nextVal = e.target.value
                    setDescription(nextVal)
                    updateFieldErrorOnChange("description", nextVal)
                  }}
                  placeholder="Describe your company services, mission, background, and specialties..."
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={fieldErrors.description ? "description-error" : undefined}
                  className={getInputClassName("description", "resize-none")}
                />
                {fieldErrors.description && (
                  <p id="description-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              {/* Services Offered */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Services Offered
                  </label>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    Add multiple services your company provides
                  </span>
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddService()
                      }
                    }}
                    placeholder="e.g. Web Development, Consulting, Cloud Solutions..."
                    className="flex-1 bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddService()}
                    className="px-5 py-2.5 bg-[var(--brand)] text-white text-xs font-semibold rounded-xl hover:bg-[var(--brand-light)] transition-colors cursor-pointer shadow-sm"
                  >
                    + Add Service
                  </button>
                </div>

                {services.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-[var(--surface-alt)]/60 rounded-xl border border-[var(--border-default)]">
                    {services.map((svc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-light)] text-xs font-medium text-[var(--text-primary)] rounded-full shadow-xs"
                      >
                        <span>{svc}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 transition-colors cursor-pointer text-xs leading-none"
                          title="Remove service"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)] italic">
                    No services added yet. Type a service above and click "+ Add Service" or press Enter.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Social Media Profiles
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSocialLink}
                    className="text-xs font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                  >
                    + Add Another Link
                  </button>
                </div>

                <div className="space-y-3">
                  {socialLinks.map((item, idx) => {
                    const socialErr = socialLinkErrors[idx]
                    const targetKey: FieldTargetKey = `socialLink-${idx}`
                    return (
                      <div
                        key={idx}
                        ref={(el) => {
                          fieldWrapperRefs.current[targetKey] = el
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <select
                            value={item.platform}
                            onChange={(e) => handleUpdateSocialLink(idx, "platform", e.target.value)}
                            className="bg-[var(--surface-alt)] border border-[var(--border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none"
                          >
                            {SOCIAL_PLATFORMS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                          <input
                            ref={(el) => {
                              fieldInputRefs.current[targetKey] = el
                            }}
                            type="url"
                            value={item.link}
                            onChange={(e) => handleUpdateSocialLink(idx, "link", e.target.value)}
                            placeholder="https://..."
                            aria-invalid={Boolean(socialErr)}
                            aria-describedby={socialErr ? `socialLink-${idx}-error` : undefined}
                            className={`flex-1 rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] outline-none transition-all border ${
                              socialErr
                                ? "bg-red-50/50 dark:bg-red-950/20 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/25"
                                : "bg-[var(--surface-alt)] border-[var(--border-default)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
                            }`}
                          />
                          {socialLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialLink(idx)}
                              className="text-[var(--text-tertiary)] hover:text-red-500 p-2 text-sm cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        {socialErr && (
                          <p
                            id={`socialLink-${idx}-error`}
                            role="alert"
                            className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium"
                          >
                            {socialErr}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FILE UPLOADS */}
          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="font-serif text-xl text-[var(--text-primary)] border-b border-[var(--border-light)] pb-3">
                3. File Uploads
              </h2>

              {/* Company Logo Upload */}
              <div
                ref={(el) => {
                  fieldWrapperRefs.current.logoFile = el
                }}
              >
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Company Logo (Optional)
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const err = validateSingleField("logoFile", file)
                      if (err) {
                        setFieldErrors((prev) => ({ ...prev, logoFile: err }))
                        if (logoInputRef.current) logoInputRef.current.value = ""
                        setScrollTarget({ key: "logoFile", step: 3, token: Date.now() })
                        return
                      }
                      setLogoFile(file)
                      clearFieldError("logoFile")
                    }
                  }}
                />

                {logoFile && logoPreview ? (
                  <div
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                      fieldErrors.logoFile
                        ? "bg-red-50/50 dark:bg-red-950/20 border-red-500"
                        : "bg-[var(--surface-alt)] border-[var(--border-default)]"
                    }`}
                  >
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-xl object-cover border border-[var(--border-light)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {logoFile.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {(logoFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null)
                        clearFieldError("logoFile")
                        if (logoInputRef.current) logoInputRef.current.value = ""
                      }}
                      className="text-xs text-red-500 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                      fieldErrors.logoFile
                        ? "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                        : "border-[var(--border-default)] hover:border-[var(--brand)] bg-[var(--surface-alt)]/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">🖼️</div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                      Click to choose Company Logo
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      PNG, JPG, WebP, SVG up to 10MB
                    </p>
                  </div>
                )}
                {fieldErrors.logoFile && (
                  <p id="logoFile-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                    {fieldErrors.logoFile}
                  </p>
                )}
              </div>

              {/* Company Cover Image Upload (Optional) */}
              <div
                ref={(el) => {
                  fieldWrapperRefs.current.coverFile = el
                }}
              >
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Company Cover Image <span className="text-[var(--text-tertiary)] font-normal lowercase">(optional banner photo)</span>
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const err = validateSingleField("coverFile", file)
                      if (err) {
                        setFieldErrors((prev) => ({ ...prev, coverFile: err }))
                        if (coverInputRef.current) coverInputRef.current.value = ""
                        setScrollTarget({ key: "coverFile", step: 3, token: Date.now() })
                        return
                      }
                      setCoverFile(file)
                      clearFieldError("coverFile")
                    }
                  }}
                />

                {coverFile && coverPreview ? (
                  <div
                    className={`relative rounded-2xl overflow-hidden border transition-colors ${
                      fieldErrors.coverFile
                        ? "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                        : "border-[var(--border-default)] bg-[var(--surface-alt)]"
                    }`}
                  >
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="p-3 flex items-center justify-between bg-[var(--surface)]/90 backdrop-blur-sm border-t border-[var(--border-light)]">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {coverFile.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          {(coverFile.size / 1024).toFixed(1)} KB · Banner Image
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCoverFile(null)
                          clearFieldError("coverFile")
                          if (coverInputRef.current) coverInputRef.current.value = ""
                        }}
                        className="text-xs text-red-500 hover:underline px-2 py-1 cursor-pointer font-medium"
                      >
                        Remove Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                      fieldErrors.coverFile
                        ? "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                        : "border-[var(--border-default)] hover:border-[var(--brand)] bg-[var(--surface-alt)]/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">🌄</div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                      Click to choose Company Cover Image
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      Wide banner photo (1200×400 recommended), PNG, JPG, WebP up to 10MB
                    </p>
                  </div>
                )}
                {fieldErrors.coverFile && (
                  <p id="coverFile-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                    {fieldErrors.coverFile}
                  </p>
                )}
              </div>

              {/* Business License Upload (Required) */}
              <div
                ref={(el) => {
                  fieldWrapperRefs.current.licenseFile = el
                }}
              >
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Business License / Registration Document <span className="text-red-500">*</span>
                </label>
                <input
                  ref={licenseInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const err = validateSingleField("licenseFile", file)
                      if (err) {
                        setFieldErrors((prev) => ({ ...prev, licenseFile: err }))
                        if (licenseInputRef.current) licenseInputRef.current.value = ""
                        setScrollTarget({ key: "licenseFile", step: 3, token: Date.now() })
                        return
                      }
                      setLicenseFile(file)
                      clearFieldError("licenseFile")
                    }
                  }}
                />

                {licenseFile ? (
                  <div
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                      fieldErrors.licenseFile
                        ? "bg-red-50/50 dark:bg-red-950/20 border-red-500"
                        : "bg-[var(--surface-alt)] border-[var(--border-default)]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center text-xl">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {licenseFile.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {(licenseFile.size / 1024).toFixed(1)} KB ·{" "}
                        {licenseFile.type ||
                          (licenseFile.name.includes(".")
                            ? licenseFile.name.split(".").pop()?.toUpperCase()
                            : "File")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLicenseFile(null)
                        if (licenseInputRef.current) licenseInputRef.current.value = ""
                      }}
                      className="text-xs text-red-500 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => licenseInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                      fieldErrors.licenseFile
                        ? "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                        : "border-[var(--border-default)] hover:border-[var(--brand)] bg-[var(--surface-alt)]/50"
                    }`}
                  >
                    <div className="text-3xl mb-2">📑</div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                      Upload Government-Issued Business License
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mb-4">
                      All file types supported up to 10MB
                    </p>
                    <span className="inline-block bg-[var(--brand)] text-white text-xs font-semibold px-4 py-2 rounded-xl">
                      Browse Files
                    </span>
                  </div>
                )}
                {fieldErrors.licenseFile && (
                  <p id="licenseFile-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                    {fieldErrors.licenseFile}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-serif text-xl text-[var(--text-primary)] border-b border-[var(--border-light)] pb-3">
                4. Review & Confirm Submission
              </h2>

              <div className="bg-[var(--surface-alt)] rounded-2xl p-6 space-y-4 border border-[var(--border-default)] text-sm overflow-hidden">
                {coverPreview && (
                  <div className="-mx-6 -mt-6 mb-4 h-32 overflow-hidden border-b border-[var(--border-light)]">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex justify-between items-start border-b border-[var(--border-light)] pb-3">
                  <div>
                    <h3 className="font-serif text-lg text-[var(--text-primary)]">{companyName}</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {categories.find((c) => c.id === categoryId)?.name || categoryId}
                    </p>
                  </div>
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Owner / Contact:</span>
                    <span className="text-[var(--text-primary)] font-medium">{ownerName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Email:</span>
                    <span className="text-[var(--text-primary)] font-medium">{email}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Phone:</span>
                    <span className="text-[var(--text-primary)] font-medium">{phone}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Address:</span>
                    <span className="text-[var(--text-primary)] font-medium">{address}</span>
                  </div>
                </div>

                <div className="border-t border-[var(--border-light)] pt-3 text-xs">
                  <span className="text-[var(--text-tertiary)] block mb-1">Description:</span>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{description}</p>
                </div>

                {services.length > 0 && (
                  <div className="border-t border-[var(--border-light)] pt-3 text-xs">
                    <span className="text-[var(--text-tertiary)] block mb-1.5">Services:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {services.map((svc, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-[var(--brand)]/10 text-[var(--brand)] rounded-lg text-xs font-medium"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {coverFile && (
                  <div className="border-t border-[var(--border-light)] pt-3 text-xs">
                    <span className="text-[var(--text-tertiary)] block mb-1">Attached Cover Image:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ {coverFile.name} ({(coverFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}

                <div className="border-t border-[var(--border-light)] pt-3 text-xs">
                  <span className="text-[var(--text-tertiary)] block mb-1">Attached License File:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    ✓ {licenseFile?.name} ({(licenseFile ? licenseFile.size / 1024 : 0).toFixed(1)} KB)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs leading-relaxed">
                ℹ️ By submitting, your company will be registered in the system with status <strong>Pending</strong>.
                Our team will verify the business license before publishing it to the public directory.
              </div>
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-[var(--border-light)]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBackStep}
                disabled={submitting}
                className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2.5 rounded-xl border border-[var(--border-default)] cursor-pointer"
              >
                ← Previous
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-[var(--brand)] text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-[var(--brand-light)] transition-colors shadow-sm cursor-pointer"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting & Uploading...
                  </>
                ) : (
                  "Confirm & Register Company"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
