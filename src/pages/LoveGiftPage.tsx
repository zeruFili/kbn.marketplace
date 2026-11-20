import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { submitLoveGift, type LoveGiftItem } from "../api/loveGiftApi"
import Navbar from "../components/Navbar"
import dashenBankLogo from "../assets/dashen bank logo.jpg"
import birhanBankLogo from "../assets/birhan bank logo.jpg"

export interface BankAccountInfo {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  logo: string
}

export const OFFICIAL_BANK_ACCOUNTS: BankAccountInfo[] = [
  {
    id: "dashen",
    bankName: "Dashen Bank",
    accountName: "KINGDOM BUILDERS MINISTRY",
    accountNumber: "0012521619011",
    logo: dashenBankLogo,
  },
  {
    id: "birhan",
    bankName: "Birhan Bank",
    accountName: "KINGDOM BUILDERS MINISTRY",
    accountNumber: "2500010189648",
    logo: birhanBankLogo,
  },
]

const OFFICIAL_RECEIVER = OFFICIAL_BANK_ACCOUNTS[0]

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000]

export default function LoveGiftPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Voluntary Amount state
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1000)
  const [customAmount, setCustomAmount] = useState<string>("")

  // Donor state
  const [donorName, setDonorName] = useState(user?.name || "")
  const [donorEmail, setDonorEmail] = useState(user?.email || "")
  const [donorPhone, setDonorPhone] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [note, setNote] = useState("")

  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  // Result state
  const [submittedGift, setSubmittedGift] = useState<LoveGiftItem | null>(null)
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const customAmountInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      if (!donorName) setDonorName(user.name || "")
      if (!donorEmail) setDonorEmail(user.email || "")
    }
  }, [user])

  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview)
      }
    }
  }, [filePreview])

  // ---- Derived amount state (single source of truth) ----
  // Preset wins when active; otherwise fall back to the custom input.
  const effectiveAmount =
    selectedPreset !== null ? selectedPreset : Number(customAmount) || 0

  const isCustomMode = selectedPreset === null && customAmount !== ""

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      setCopiedField(null)
    }
  }

  const handleSelectPreset = (amount: number) => {
    setSelectedPreset(amount)
    setCustomAmount("") // input only holds custom values — clear it when a preset is chosen
  }

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, "")
    setCustomAmount(val)
    // Typing in the input always switches to "custom" mode
    setSelectedPreset(null)
  }

  const validateAndSetFile = (selected: File) => {
    setClientError(null)

    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ]

    if (
      !validTypes.includes(selected.type) &&
      !/\.(png|jpe?g|webp|pdf)$/i.test(selected.name)
    ) {
      setClientError("Please select a valid receipt image (PNG, JPG, WEBP) or PDF file.")
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      setClientError("Receipt file exceeds the 10MB size limit. Please choose a smaller file.")
      return
    }

    setFile(selected)
    if (selected.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(selected)
      setFilePreview(previewUrl)
    } else {
      setFilePreview(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      validateAndSetFile(selected)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleClearFile = () => {
    setFile(null)
    if (filePreview && filePreview.startsWith("blob:")) {
      URL.revokeObjectURL(filePreview)
    }
    setFilePreview(null)
    setClientError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientError(null)

    // ✅ Use effectiveAmount (preset OR custom), not the raw custom input
    const amountNum = effectiveAmount
    if (isNaN(amountNum) || amountNum <= 0) {
      setClientError("Please enter a valid gift amount greater than 0 ETB.")
      return
    }

    if (!file) {
      setClientError("Please upload or drag & drop your payment receipt.")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("attachmentFiles", file)
      formData.append("amount", String(amountNum))
      if (donorName && !isAnonymous) formData.append("donorName", donorName)
      if (donorEmail && !isAnonymous) formData.append("donorEmail", donorEmail)
      if (donorPhone && !isAnonymous) formData.append("donorPhone", donorPhone)
      formData.append("isAnonymous", isAnonymous ? "true" : "false")
      if (note) formData.append("note", note)

      const result = await submitLoveGift(formData)

      if (result.duplicate) {
        setClientError("A love gift with this transaction receipt reference has already been submitted.")
        setLoading(false)
        return
      }

      setSubmittedGift(result.data || null)
      setSubmissionMessage(result.message)
      setSubmissionSuccess(result.success)
    } catch (err: any) {
      setClientError(err?.message || "Failed to submit love gift receipt. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetForAnotherGift = () => {
    setSubmittedGift(null)
    setSubmissionMessage(null)
    setSubmissionSuccess(null)
    setFile(null)
    setFilePreview(null)
    setNote("")
    setClientError(null)
    setSelectedPreset(1000)
    setCustomAmount("")
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[var(--brand-dark)] to-[var(--brand)] text-white rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-amber-300 mb-2">
                  <span>❤️</span> Voluntary Love Gift
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl text-white">
                  Send a Love Gift
                </h1>
                <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Support the Kingdom Builders Network mission and ongoing community initiatives. Your voluntary contribution empowers Christian business leaders and professionals across Ethiopia.
                </p>
              </div>

              {user && (
                <div className="bg-white/10 border border-white/15 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0 self-start sm:self-auto">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                      Giving as Member
                    </p>
                    <p className="text-xs font-semibold text-white truncate max-w-[150px]">
                      {user.name}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--brand-dark)] flex items-center justify-center font-bold text-xs">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VIEW: RESULT AFTER SUBMISSION */}
          {submittedGift ? (
            <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-10 shadow-sm space-y-6 animate-scale-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-light)] pb-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs ${
                      submittedGift.status === "accepted"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : submittedGift.status === "rejected"
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}
                  >
                    {submittedGift.status === "accepted"
                      ? "✓"
                      : submittedGift.status === "rejected"
                      ? "✕"
                      : "⏳"}
                  </div>
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-1 ${
                        submittedGift.status === "accepted"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : submittedGift.status === "rejected"
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          submittedGift.status === "accepted"
                            ? "bg-emerald-500"
                            : submittedGift.status === "rejected"
                            ? "bg-red-500"
                            : "bg-amber-500 animate-pulse"
                        }`}
                      />
                      {submittedGift.status === "accepted"
                        ? "Gift Approved & Received"
                        : submittedGift.status === "rejected"
                        ? "Submission Rejected"
                        : "Under Verification"}
                    </div>
                    <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                      {submittedGift.status === "accepted"
                        ? "Love Gift Confirmed"
                        : submittedGift.status === "rejected"
                        ? "Verification Unsuccessful"
                        : "Submission Under Review"}
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold block">
                    Contributed Amount
                  </span>
                  <span className="font-serif text-3xl font-black text-[var(--brand)]">
                    ETB {Number(submittedGift.amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Message Alert */}
              <div
                className={`p-5 rounded-2xl border text-sm leading-relaxed ${
                  submittedGift.status === "accepted"
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : submittedGift.status === "rejected"
                    ? "bg-red-50/80 border-red-200 text-red-900"
                    : "bg-amber-50/80 border-amber-200 text-amber-900"
                }`}
              >
                <p className="font-semibold mb-1">
                  {submissionMessage ||
                    (submittedGift.status === "accepted"
                      ? "Your voluntary gift has been verified and recorded. Thank you for your generosity!"
                      : "Your payment receipt has been submitted and is currently being verified by our administration.")}
                </p>
                {submittedGift.status === "pending" && (
                  <p className="text-xs text-amber-800">
                    Once approved by an administrator, this contribution will be credited to your dashboard total.
                  </p>
                )}
              </div>

              {/* Transaction Summary Card */}
              <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
                  Gift Transaction Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                      Transaction Date
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 block">
                      {new Date(submittedGift.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                      Receiver
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 block truncate">
                      {OFFICIAL_RECEIVER.accountName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                      Donor
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 block truncate">
                      {submittedGift.isAnonymous
                        ? "Anonymous Donor"
                        : submittedGift.donorName || user?.name || "Visitor"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                      Reference
                    </span>
                    <span className="text-sm font-mono font-semibold text-[var(--text-primary)] mt-0.5 block truncate">
                      {submittedGift.reference || "Under Review"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-light)]">
                <button
                  type="button"
                  onClick={handleResetForAnotherGift}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--surface-alt)] hover:bg-[var(--border-light)] text-[var(--text-primary)] transition-colors cursor-pointer border border-[var(--border-default)]"
                >
                  Send Another Gift
                </button>

                <div className="flex items-center gap-3">
                  {user && (
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/love-gifts")}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] transition-colors cursor-pointer shadow-xs"
                    >
                      View in Dashboard →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW: GIFT SUBMISSION FLOW */
            <div className="space-y-6 sm:space-y-8">
              {/* Payment Receiver & Verification Card */}
              <div className="bg-white rounded-3xl border border-[var(--border-light)] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-[var(--border-light)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-serif text-2xl text-[var(--text-primary)]">
                      Payment Receiver & Verification
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Transfer your voluntary gift to the verified official receiver details below, then upload and verify your receipt.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[var(--accent-dark)] font-semibold bg-amber-50 border border-amber-200 self-start sm:self-auto">
                    <span>✓</span> Verified Organization
                  </span>
                </div>

                {/* Receiver Beneficiary Header Card */}
                <div className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-semibold">
                      Receiver / Beneficiary Name
                    </p>
                    <p className="text-base font-bold text-[var(--text-primary)] truncate mt-0.5">
                      {OFFICIAL_RECEIVER.accountName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(OFFICIAL_RECEIVER.accountName, "name")}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[var(--border-default)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedField === "name" ? "✓ Copied" : "Copy Name"}
                  </button>
                </div>

                {/* Bank Accounts Grid */}
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                    Available Official Bank Accounts
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {OFFICIAL_BANK_ACCOUNTS.map((bank) => (
                      <div
                        key={bank.id}
                        className="bg-[var(--surface-alt)] rounded-2xl border border-[var(--border-light)] p-5 hover:border-[var(--brand)]/40 transition-all shadow-xs flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={bank.logo}
                            alt={bank.bankName}
                            className="w-12 h-12 object-contain rounded-xl bg-white border border-[var(--border-light)] p-1.5 shadow-xs shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                                {bank.bankName}
                              </h3>
                             
                            </div>
                            <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                              {bank.accountName}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl border border-[var(--border-light)] p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                              Account Number
                            </p>
                            <p className="text-base font-mono font-bold text-[var(--text-primary)] tracking-wider truncate mt-0.5">
                              {bank.accountNumber}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(bank.accountNumber, bank.id)}
                            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface-alt)] hover:bg-[var(--brand)] hover:text-white border border-[var(--border-default)] transition-colors cursor-pointer shadow-xs"
                          >
                            {copiedField === bank.id ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="pt-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)] block mb-2">
                    Select or Enter Gift Amount (ETB)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3">
                    {PRESET_AMOUNTS.map((amt) => {
                      const isSelected = selectedPreset === amt
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleSelectPreset(amt)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                            isSelected
                              ? "bg-[var(--brand)] text-white shadow-xs"
                              : "bg-[var(--surface-alt)] text-[var(--text-primary)] hover:bg-[var(--border-light)] border border-[var(--border-default)]"
                          }`}
                        >
                          ETB {amt.toLocaleString()}
                        </button>
                      )
                    })}

                    {/* Custom amount option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPreset(null)
                        customAmountInputRef.current?.focus()
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        isCustomMode
                          ? "bg-[var(--brand)] text-white shadow-xs"
                          : "bg-[var(--surface-alt)] text-[var(--text-primary)] hover:bg-[var(--border-light)] border border-dashed border-[var(--border-default)]"
                      }`}
                    >
                      ✏️ Custom
                    </button>
                  </div>

                  {/* Custom amount input — placeholder lives INSIDE the field */}
                  <div className="mt-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-xs text-[var(--text-tertiary)]">
                        ETB
                      </span>
                      <input
                        id="custom-amount-input"
                        ref={customAmountInputRef}
                        type="text"
                        inputMode="decimal"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        placeholder="Put your custom amount here"
                        aria-label="Put your custom amount here"
                        aria-describedby="custom-amount-help"
                        className={`w-full pl-12 pr-4 py-3 bg-[var(--surface-alt)] border rounded-xl text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/70 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 ${
                          isCustomMode
                            ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/10"
                            : "border-[var(--border-default)]"
                        }`}
                      />
                    </div>
                    <p
                      id="custom-amount-help"
                      className="text-[11px] text-[var(--text-tertiary)] mt-1.5 leading-relaxed"
                    >
                      {customAmount !== "" ? (
                        <>
                          You're giving{" "}
                          <span className="font-bold text-[var(--brand)]">
                            ETB {effectiveAmount.toLocaleString()}
                          </span>
                          .
                        </>
                      ) : selectedPreset !== null ? (
                        <>
                          Giving{" "}
                          <span className="font-bold text-[var(--brand)]">
                            ETB {selectedPreset.toLocaleString()}
                          </span>{" "}
                          — type any amount above to give a different amount instead.
                        </>
                      ) : (
                        "Type any amount you wish to give above."
                      )}
                    </p>
                  </div>
                </div>

                {/* Upload & Verify Payment Receipt Section */}
                <div className="pt-4 border-t border-[var(--border-light)] space-y-5">
                  <div>
                    <h3 className="font-serif text-xl text-[var(--text-primary)]">
                      Upload & Verify Payment Receipt
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Attach your bank confirmation receipt for{" "}
                      <span className="font-bold text-[var(--brand)]">
                        ETB {effectiveAmount.toLocaleString()}
                      </span>
                      .
                    </p>
                  </div>

                  {/* Donor Information (Optional / Visitor) */}
                  <div className="bg-[var(--surface-alt)] p-4 sm:p-5 rounded-2xl border border-[var(--border-light)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Donor Details
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text-secondary)] select-none">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded text-[var(--brand)] focus:ring-[var(--brand)]/20 cursor-pointer"
                        />
                        <span>Give Anonymously</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        Optional Message / Word of Encouragement
                      </label>
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Blessings to the ministry and community..."
                        className="w-full px-3.5 py-2 bg-white border border-[var(--border-default)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                      />
                    </div>
                  </div>

                  {/* Error Alert */}
                  {clientError && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3 animate-fade-in">
                      <span className="text-base leading-none">⚠️</span>
                      <div className="flex-1">
                        <p className="font-semibold uppercase tracking-wide">Notice</p>
                        <p className="mt-0.5">{clientError}</p>
                      </div>
                    </div>
                  )}

                  {/* Dropzone */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                      className="hidden"
                      disabled={loading}
                    />

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => {
                        if (!file && !loading) {
                          fileInputRef.current?.click()
                        }
                      }}
                      className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
                        dragActive
                          ? "border-[var(--brand)] bg-[var(--brand)]/5 scale-[1.01]"
                          : file
                          ? "border-emerald-300 bg-emerald-50/20"
                          : "border-[var(--border-default)] hover:border-[var(--brand)] bg-[var(--surface-alt)]/50 cursor-pointer"
                      }`}
                    >
                      {loading ? (
                        <div className="py-8 space-y-4">
                          <div className="w-12 h-12 border-3 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin mx-auto" />
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              Submitting & Verifying Love Gift...
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">
                              Please wait while we process your receipt details.
                            </p>
                          </div>
                        </div>
                      ) : file ? (
                        <div className="space-y-4">
                          {filePreview ? (
                            <div className="relative inline-block">
                              <img
                                src={filePreview}
                                alt="Receipt Preview"
                                className="max-h-56 mx-auto rounded-2xl object-contain shadow-sm border border-[var(--border-light)] bg-white p-1"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mx-auto text-2xl font-bold">
                              📄
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-md mx-auto">
                              {file.name}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || "Document"}
                            </p>
                          </div>

                          <div className="flex items-center justify-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                fileInputRef.current?.click()
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[var(--border-default)] hover:bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                            >
                              Change Receipt
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClearFile()
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 py-4">
                          <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] text-[var(--brand)] border border-[var(--border-light)] flex items-center justify-center mx-auto text-2xl shadow-xs">
                            📤
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              Click to choose receipt, or drag and drop file here
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">
                              Supports PNG, JPG, WEBP, or PDF (up to 10MB)
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              fileInputRef.current?.click()
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] transition-colors cursor-pointer shadow-xs"
                          >
                            Browse Device
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !file || effectiveAmount <= 0}
                      className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[var(--brand)]/15 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying Receipt...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Receipt for Verification (ETB {effectiveAmount.toLocaleString()})</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}