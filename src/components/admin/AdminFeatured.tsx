import { useState, useEffect, useCallback, useMemo } from "react"
import {
  fetchFeaturedMembers,
  fetchFeaturedCompanies,
  updateFeaturedMembers,
  updateFeaturedCompanies,
  type FeaturedMemberItem,
  type FeaturedCompanyItem,
} from "../../api/featuredApi"
import {
  fetchAdminUsersApi,
  type UserProfileResponse,
} from "../../api/userApi"
import {
  fetchCompanies,
  resolveFileUrl,
  type Company,
} from "../../api/companyApi"
import UserAvatar from "../common/UserAvatar"
import MembershipBadge from "../common/MembershipBadge"

type FeaturedTab = "members" | "companies"

export default function AdminFeatured() {
  const [activeTab, setActiveTab] = useState<FeaturedTab>("members")

  // Members data state
  const [featuredMembers, setFeaturedMembers] = useState<UserProfileResponse[]>([])
  const [initialFeaturedMemberIds, setInitialFeaturedMemberIds] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<UserProfileResponse[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [savingMembers, setSavingMembers] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")

  // Companies data state
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([])
  const [initialFeaturedCompanyIds, setInitialFeaturedCompanyIds] = useState<string[]>([])
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [savingCompanies, setSavingCompanies] = useState(false)
  const [companySearch, setCompanySearch] = useState("")

  // Notification banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
        setErrorMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

  // Load all members data (featured + available)
  const loadMembersData = useCallback(async () => {
    setLoadingMembers(true)
    try {
      const [featuredList, allUsersRes] = await Promise.all([
        fetchFeaturedMembers(),
        fetchAdminUsersApi({ limit: 100 }),
      ])

      const nonAdminUsers = (allUsersRes.data || []).filter(
        (u) => (u.role || "").toLowerCase() !== "admin"
      )
      setAvailableUsers(nonAdminUsers)

      // Map featured records to user objects
      const orderedUsers: UserProfileResponse[] = []
      const featuredIds: string[] = []

      featuredList.forEach((fm: FeaturedMemberItem) => {
        if (fm.user) {
          orderedUsers.push(fm.user)
          featuredIds.push(fm.user.id || fm.user_id)
        } else {
          const matched = nonAdminUsers.find((u) => u.id === fm.user_id)
          if (matched) {
            orderedUsers.push(matched)
            featuredIds.push(matched.id)
          }
        }
      })

      setFeaturedMembers(orderedUsers)
      setInitialFeaturedMemberIds(featuredIds)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load members."
      )
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  // Load all companies data (featured + available)
  const loadCompaniesData = useCallback(async () => {
    setLoadingCompanies(true)
    try {
      const [featuredList, allCompaniesRes] = await Promise.all([
        fetchFeaturedCompanies(),
        fetchCompanies({ limit: 100 }),
      ])

      const companiesList = allCompaniesRes.companies || []
      setAvailableCompanies(companiesList)

      // Map featured records to company objects
      const orderedCompanies: Company[] = []
      const featuredIds: string[] = []

      featuredList.forEach((fc: FeaturedCompanyItem) => {
        const id = fc.company?.id || fc.company_id
        const matched = companiesList.find((c) => c.id === id)
        if (matched) {
          orderedCompanies.push(matched)
          featuredIds.push(matched.id)
        } else if (fc.company) {
          // If not in first page, use company payload
          const fallback: Company = {
            id: fc.company.id,
            name: fc.company.company_name,
            tagline: fc.company.description?.slice(0, 80) || "",
            description: fc.company.description,
            logo: fc.company.company_logo
              ? resolveFileUrl(fc.company.company_logo)
              : undefined,
            coverImage: fc.company.cover_image
              ? resolveFileUrl(fc.company.cover_image)
              : undefined,
            businessCategory: fc.company.business_category?.name || "General",
            categoryId: fc.company.business_category_id,
            industry: fc.company.business_category?.name || "Business",
            location: fc.company.physical_address,
            phone: fc.company.phone_number,
            email: fc.company.email,
            website: fc.company.website || "",
            status: fc.company.status || "active",
            is_active: fc.company.is_active,
            featured: true,
            created_at: fc.company.created_at,
          }
          orderedCompanies.push(fallback)
          featuredIds.push(fallback.id)
        }
      })

      setFeaturedCompanies(orderedCompanies)
      setInitialFeaturedCompanyIds(featuredIds)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load companies."
      )
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  useEffect(() => {
    loadMembersData()
    loadCompaniesData()
  }, [loadMembersData, loadCompaniesData])

  // --- Member Actions ---
  const addFeaturedMember = (user: UserProfileResponse) => {
    if (featuredMembers.some((m) => m.id === user.id)) return
    if (featuredMembers.length >= 7) {
      setErrorMessage("Maximum 7 featured members allowed. Please remove one first.")
      return
    }
    setFeaturedMembers([...featuredMembers, user])
    setErrorMessage(null)
  }

  const removeFeaturedMember = (userId: string) => {
    setFeaturedMembers(featuredMembers.filter((m) => m.id !== userId))
  }

  const moveMemberUp = (index: number) => {
    if (index <= 0) return
    const updated = [...featuredMembers]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setFeaturedMembers(updated)
  }

  const moveMemberDown = (index: number) => {
    if (index >= featuredMembers.length - 1) return
    const updated = [...featuredMembers]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    setFeaturedMembers(updated)
  }

  const handleSaveMembers = async () => {
    if (featuredMembers.length < 5 || featuredMembers.length > 7) {
      setErrorMessage("You must select between 5 and 7 featured members.")
      return
    }

    setSavingMembers(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const userIds = featuredMembers.map((m) => m.id)
      const res = await updateFeaturedMembers(userIds)
      if (res.success) {
        setSuccessMessage("Featured members updated and saved successfully!")
        setInitialFeaturedMemberIds(userIds)
      } else {
        setErrorMessage(res.message || "Failed to update featured members.")
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save featured members."
      )
    } finally {
      setSavingMembers(false)
    }
  }

  const handleResetMembers = () => {
    loadMembersData()
  }

  // --- Company Actions ---
  const addFeaturedCompany = (company: Company) => {
    if (featuredCompanies.some((c) => c.id === company.id)) return
    if (featuredCompanies.length >= 7) {
      setErrorMessage("Maximum 7 featured companies allowed. Please remove one first.")
      return
    }
    setFeaturedCompanies([...featuredCompanies, company])
    setErrorMessage(null)
  }

  const removeFeaturedCompany = (companyId: string) => {
    setFeaturedCompanies(featuredCompanies.filter((c) => c.id !== companyId))
  }

  const moveCompanyUp = (index: number) => {
    if (index <= 0) return
    const updated = [...featuredCompanies]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setFeaturedCompanies(updated)
  }

  const moveCompanyDown = (index: number) => {
    if (index >= featuredCompanies.length - 1) return
    const updated = [...featuredCompanies]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    setFeaturedCompanies(updated)
  }

  const handleSaveCompanies = async () => {
    if (featuredCompanies.length < 5 || featuredCompanies.length > 7) {
      setErrorMessage("You must select between 5 and 7 featured companies.")
      return
    }

    setSavingCompanies(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const companyIds = featuredCompanies.map((c) => c.id)
      const res = await updateFeaturedCompanies(companyIds)
      if (res.success) {
        setSuccessMessage("Featured companies updated and saved successfully!")
        setInitialFeaturedCompanyIds(companyIds)
      } else {
        setErrorMessage(res.message || "Failed to update featured companies.")
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save featured companies."
      )
    } finally {
      setSavingCompanies(false)
    }
  }

  const handleResetCompanies = () => {
    loadCompaniesData()
  }

  // Filter available items
  const filteredUsers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase()
    if (!term) return availableUsers
    return availableUsers.filter((u) => {
      const name = (u.fullName || u.full_name || u.name || "").toLowerCase()
      const email = (u.email || "").toLowerCase()
      const title = (
        u.professional_experience ||
        u.professionalExperience ||
        ""
      ).toLowerCase()
      return name.includes(term) || email.includes(term) || title.includes(term)
    })
  }, [availableUsers, memberSearch])

  const filteredCompanies = useMemo(() => {
    const term = companySearch.trim().toLowerCase()
    if (!term) return availableCompanies
    return availableCompanies.filter((c) => {
      const name = (c.name || "").toLowerCase()
      const email = (c.email || "").toLowerCase()
      const cat = (c.businessCategory || "").toLowerCase()
      const loc = (c.location || "").toLowerCase()
      return (
        name.includes(term) ||
        email.includes(term) ||
        cat.includes(term) ||
        loc.includes(term)
      )
    })
  }, [availableCompanies, companySearch])

  const currentMemberIds = useMemo(
    () => new Set(featuredMembers.map((m) => m.id)),
    [featuredMembers]
  )
  const currentCompanyIds = useMemo(
    () => new Set(featuredCompanies.map((c) => c.id)),
    [featuredCompanies]
  )

  const membersCount = featuredMembers.length
  const isMembersValid = membersCount >= 5 && membersCount <= 7

  const companiesCount = featuredCompanies.length
  const isCompaniesValid = companiesCount >= 5 && companiesCount <= 7

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 text-xl font-bold">
              ✦
            </span>
            <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
              Featured Members & Companies
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Curate and reorder the 5–7 members and 5–7 businesses spotlighted on the public landing page.
          </p>
        </div>

        {/* Global tab toggle */}
        <div className="flex items-center bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border-light)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "members"
                ? "bg-[var(--brand)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Members</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "members"
                  ? isMembersValid
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "bg-amber-400/20 text-amber-200"
                  : isMembersValid
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {membersCount}/7
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("companies")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "companies"
                ? "bg-[var(--brand)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Companies</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "companies"
                  ? isCompaniesValid
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "bg-amber-400/20 text-amber-200"
                  : isCompaniesValid
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {companiesCount}/7
            </span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* MEMBERS SECTION */}
      {/* ============================================================== */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Status & Save Banner */}
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  Selected Featured Members:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isMembersValid
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {membersCount} of 5–7 Selected
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                {membersCount < 5
                  ? `Select at least ${5 - membersCount} more member(s) to meet the 5–7 requirement.`
                  : membersCount <= 7
                  ? "Selection is valid. Use the up and down arrows to control display sequence on the landing page."
                  : "Too many members selected. Please remove items until you have at most 7."}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleResetMembers}
                disabled={savingMembers || loadingMembers}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-light)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSaveMembers}
                disabled={!isMembersValid || savingMembers || loadingMembers}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isMembersValid && !savingMembers
                    ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] shadow-sm cursor-pointer"
                    : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                {savingMembers ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Featured Members</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Current Featured List (Ordered) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <span>Current Featured Order</span>
                  <span className="text-xs text-[var(--text-tertiary)] font-normal">
                    ({featuredMembers.length} active)
                  </span>
                </h2>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  Top items appear first
                </span>
              </div>

              {loadingMembers ? (
                <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-8 text-center text-xs text-[var(--text-tertiary)] animate-pulse">
                  Loading featured members...
                </div>
              ) : featuredMembers.length === 0 ? (
                <div className="bg-[var(--surface)] border border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center space-y-2">
                  <div className="text-2xl">👥</div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">
                    No Featured Members Selected
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)] max-w-xs mx-auto">
                    Browse the list on the right and click "+ Feature" to pick 5 to 7 members.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {featuredMembers.map((member, index) => {
                    const name =
                      member.fullName || member.full_name || member.name || "Member"
                    const category =
                      member.membershipCategory || member.membership_category

                    return (
                      <div
                        key={member.id}
                        className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-[var(--brand)]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-[var(--surface-alt)] text-[var(--brand)] font-bold text-xs flex items-center justify-center shrink-0 border border-[var(--border-light)]">
                            {index + 1}
                          </span>
                          <UserAvatar
                            src={member.profileImage || member.profile_image}
                            name={name}
                            size="sm"
                            className="w-9 h-9 rounded-xl shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                                {name}
                              </h4>
                              {category && (
                                <MembershipBadge category={category} size="xs" />
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                              {member.email || "No email"}
                            </p>
                          </div>
                        </div>

                        {/* Order and remove buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveMemberUp(index)}
                            disabled={index === 0}
                            title="Move Up"
                            className="w-7 h-7 rounded-lg border border-[var(--border-light)] hover:bg-[var(--surface-alt)] flex items-center justify-center text-xs text-[var(--text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveMemberDown(index)}
                            disabled={index === featuredMembers.length - 1}
                            title="Move Down"
                            className="w-7 h-7 rounded-lg border border-[var(--border-light)] hover:bg-[var(--surface-alt)] flex items-center justify-center text-xs text-[var(--text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFeaturedMember(member.id)}
                            title="Remove"
                            className="w-7 h-7 rounded-lg border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-xs cursor-pointer ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Available Members Catalog */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-[var(--text-primary)]">
                  Available Members Directory
                </h2>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {filteredUsers.length} available
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search members by name, email, or title..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border-light)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand)]"
                />
                {memberSearch && (
                  <button
                    type="button"
                    onClick={() => setMemberSearch("")}
                    className="absolute right-3 top-2.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-2 max-h-[520px] overflow-y-auto space-y-1.5">
                {filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
                    No members match your search.
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = currentMemberIds.has(user.id)
                    const name =
                      user.fullName || user.full_name || user.name || "Member"
                    const category =
                      user.membershipCategory || user.membership_category

                    return (
                      <div
                        key={user.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? "bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20"
                            : "border-transparent hover:bg-[var(--surface-alt)]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            src={user.profileImage || user.profile_image}
                            name={name}
                            size="sm"
                            className="w-8 h-8 rounded-lg shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                {name}
                              </h4>
                              {category && (
                                <MembershipBadge category={category} size="xs" />
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>

                        {isSelected ? (
                          <button
                            type="button"
                            onClick={() => removeFeaturedMember(user.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer shrink-0"
                            title="Click to remove from featured"
                          >
                            ✓ Featured (Remove)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addFeaturedMember(user)}
                            disabled={featuredMembers.length >= 7}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                              featuredMembers.length >= 7
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                : "bg-[var(--surface-alt)] text-[var(--brand)] border border-[var(--border-light)] hover:bg-[var(--brand)] hover:text-white"
                            }`}
                          >
                            + Feature
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* COMPANIES SECTION */}
      {/* ============================================================== */}
      {activeTab === "companies" && (
        <div className="space-y-6">
          {/* Status & Save Banner */}
          <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  Selected Featured Companies:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isCompaniesValid
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {companiesCount} of 5–7 Selected
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                {companiesCount < 5
                  ? `Select at least ${5 - companiesCount} more company to meet the 5–7 requirement.`
                  : companiesCount <= 7
                  ? "Selection is valid. Use the up and down arrows to control display sequence on the landing page."
                  : "Too many companies selected. Please remove items until you have at most 7."}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleResetCompanies}
                disabled={savingCompanies || loadingCompanies}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-light)] hover:bg-[var(--surface-alt)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSaveCompanies}
                disabled={!isCompaniesValid || savingCompanies || loadingCompanies}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isCompaniesValid && !savingCompanies
                    ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] shadow-sm cursor-pointer"
                    : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                {savingCompanies ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Featured Companies</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Current Featured List (Ordered) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <span>Current Featured Order</span>
                  <span className="text-xs text-[var(--text-tertiary)] font-normal">
                    ({featuredCompanies.length} active)
                  </span>
                </h2>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  Top items appear first
                </span>
              </div>

              {loadingCompanies ? (
                <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-8 text-center text-xs text-[var(--text-tertiary)] animate-pulse">
                  Loading featured companies...
                </div>
              ) : featuredCompanies.length === 0 ? (
                <div className="bg-[var(--surface)] border border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center space-y-2">
                  <div className="text-2xl">🏢</div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">
                    No Featured Companies Selected
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)] max-w-xs mx-auto">
                    Browse the list on the right and click "+ Feature" to pick 5 to 7 companies.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {featuredCompanies.map((company, index) => {
                    return (
                      <div
                        key={company.id}
                        className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-[var(--brand)]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-[var(--surface-alt)] text-[var(--brand)] font-bold text-xs flex items-center justify-center shrink-0 border border-[var(--border-light)]">
                            {index + 1}
                          </span>
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-9 h-9 rounded-xl object-cover shrink-0 border border-[var(--border-light)]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {company.name?.slice(0, 2).toUpperCase() || "CO"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                                {company.name}
                              </h4>
                              {company.businessCategory && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--surface-alt)] text-[var(--text-secondary)] border border-[var(--border-light)]">
                                  {company.businessCategory}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                              {[company.email, company.location]
                                .filter(Boolean)
                                .join(" • ") || "No contact info"}
                            </p>
                          </div>
                        </div>

                        {/* Order and remove buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveCompanyUp(index)}
                            disabled={index === 0}
                            title="Move Up"
                            className="w-7 h-7 rounded-lg border border-[var(--border-light)] hover:bg-[var(--surface-alt)] flex items-center justify-center text-xs text-[var(--text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCompanyDown(index)}
                            disabled={index === featuredCompanies.length - 1}
                            title="Move Down"
                            className="w-7 h-7 rounded-lg border border-[var(--border-light)] hover:bg-[var(--surface-alt)] flex items-center justify-center text-xs text-[var(--text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFeaturedCompany(company.id)}
                            title="Remove"
                            className="w-7 h-7 rounded-lg border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-xs cursor-pointer ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Available Companies Catalog */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-[var(--text-primary)]">
                  Available Companies Directory
                </h2>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {filteredCompanies.length} available
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies by name, email, or category..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border-light)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand)]"
                />
                {companySearch && (
                  <button
                    type="button"
                    onClick={() => setCompanySearch("")}
                    className="absolute right-3 top-2.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="bg-[var(--surface)] border border-[var(--border-light)] rounded-2xl p-2 max-h-[520px] overflow-y-auto space-y-1.5">
                {filteredCompanies.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
                    No companies match your search.
                  </div>
                ) : (
                  filteredCompanies.map((company) => {
                    const isSelected = currentCompanyIds.has(company.id)

                    return (
                      <div
                        key={company.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? "bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20"
                            : "border-transparent hover:bg-[var(--surface-alt)]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[var(--border-light)]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {company.name?.slice(0, 2).toUpperCase() || "CO"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                {company.name}
                              </h4>
                              {company.businessCategory && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-alt)] text-[var(--text-secondary)]">
                                  {company.businessCategory}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                              {company.email || company.location || "No details"}
                            </p>
                          </div>
                        </div>

                        {isSelected ? (
                          <button
                            type="button"
                            onClick={() => removeFeaturedCompany(company.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer shrink-0"
                            title="Click to remove from featured"
                          >
                            ✓ Featured (Remove)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addFeaturedCompany(company)}
                            disabled={featuredCompanies.length >= 7}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                              featuredCompanies.length >= 7
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                : "bg-[var(--surface-alt)] text-[var(--brand)] border border-[var(--border-light)] hover:bg-[var(--brand)] hover:text-white"
                            }`}
                          >
                            + Feature
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
