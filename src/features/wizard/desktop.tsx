import { useState } from "react"
import type { FormData } from "./types"
import { Button, InputField, Card, BackButton, ClockIcon } from "../../shared/ui"
import { PENDING_STEPS } from "./data"
import { getJoinRequestStatus, submitJoinRequest } from "./joinRequests"

// ─── Layout ───────────────────────────────────────────────────────────────────

function DesktopBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-[#1B3A6B] text-white p-12 min-h-screen w-[480px] flex-shrink-0 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute bottom-32 -right-16 w-48 h-48 rounded-full bg-[#C9921A]/15 pointer-events-none" />
      <div className="absolute top-1/2 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-white/10 rounded-2xl">
            <svg width="40" height="40" viewBox="0 0 56 56" fill="none" aria-hidden="true">
              <path d="M28 4v8M24 8h8" stroke="#C9921A" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="16" y="16" width="24" height="30" rx="2" stroke="white" strokeWidth="2.5" fill="none" />
              <path d="M22 46V34h12v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 26h24M16 34h24" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-none">E-Skedyul</h1>
            <p className="text-white/60 text-[15px] font-medium mt-0.5">Parish & Ministry Scheduler</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex justify-center">
          <svg width="120" height="140" viewBox="0 0 120 140" fill="none" aria-hidden="true">
            <rect x="50" y="0" width="20" height="140" rx="6" fill="white" opacity="0.08" />
            <rect x="0" y="44" width="120" height="20" rx="6" fill="white" opacity="0.08" />
            <rect x="53" y="3" width="14" height="134" rx="4" fill="#C9921A" opacity="0.6" />
            <rect x="3" y="47" width="114" height="14" rx="4" fill="#C9921A" opacity="0.6" />
            <circle cx="60" cy="54" r="18" fill="#1B3A6B" stroke="#C9921A" strokeWidth="2.5" />
            <path d="M53 54l5 5 9-10" stroke="#C9921A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold leading-snug mb-3">Organize your ministry.<br />Serve with clarity.</h2>
          <p className="text-white/70 text-[16px] leading-relaxed">E-Skedyul helps ministry members join their group, share when they're available, and volunteer for open slots.</p>
        </div>
        <div className="flex flex-col gap-4">
          {[{ icon: "👥", text: "Join Lectors, Altar Servers, Choir & more" }].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[20px] flex-shrink-0">{icon}</span>
              <span className="text-white/80 text-[15px] font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-white/40 text-[13px]">For parishioners and ministry staff only.</p>
      </div>
    </div>
  )
}

function DesktopFormPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F4F6FB] min-h-screen px-12 py-12">
      <div className="w-full max-w-[480px]">{children}</div>
    </div>
  )
}

// ─── Desktop Wizard Screens ───────────────────────────────────────────────────

export function DesktopJoinGroupScreen({ data, setData, onJoin, onBack }: {
  data: FormData
  setData: (data: Partial<FormData>) => void
  onJoin: () => void
  onBack: () => void
}) {
  const [error, setError] = useState("")
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteLink, setPasteLink] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setLoading(true)
    setError("")
    try {
      const request = await submitJoinRequest(data.name, pasteMode ? pasteLink : data.groupCode)
      setData({
        groupCode: request.submittedJoinCode,
        groupName: request.organizationName,
        joinRequestId: request.id,
      })
      onJoin()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your join request.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <DesktopBrandPanel />
      <DesktopFormPanel>
        <BackButton onClick={onBack} />
        <div className="mb-6">
          <h2 className="mb-1 text-2xl font-bold text-[#1B3A6B]">Join a Ministry Group</h2>
          <p className="text-[17px] text-[#64748B]">Enter the group code given to you by your group leader or coordinator.</p>
        </div>
        <Card>
          <div className="flex flex-col gap-6">
            {!pasteMode ? (
              <>
                <InputField
                  label="Group Code"
                  id="d-group-code"
                  value={data.groupCode}
                  onChange={value => { setData({ groupCode: value.toUpperCase() }); setError("") }}
                  helper="Your organization administrator provides this code."
                  error={error}
                  placeholder="Enter group code"
                  autoComplete="off"
                />
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#D1D9E8]" />
                  <span className="text-[14px] font-medium text-[#94A3B8]">or</span>
                  <div className="h-px flex-1 bg-[#D1D9E8]" />
                </div>
                <button
                  type="button"
                  onClick={() => { setPasteMode(true); setError("") }}
                  className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#9BA8C0] text-[16px] font-semibold text-[#1B3A6B] transition-colors hover:border-[#1B3A6B] hover:bg-[#F4F6FB]"
                >
                  Paste a Group Link Instead
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setPasteMode(false); setError("") }}
                  className="-mb-2 flex cursor-pointer items-center gap-1 text-left text-[15px] text-[#64748B] transition-colors hover:text-[#1B3A6B]"
                >
                  ← Back to entering a code
                </button>
                <InputField
                  label="Paste Your Group Link"
                  id="d-paste-link"
                  value={pasteLink}
                  onChange={value => { setPasteLink(value); setError("") }}
                  helper="Paste the link provided by your organization."
                  error={error}
                  placeholder="Paste group link or code"
                  autoComplete="off"
                />
              </>
            )}
            {error && <p role="alert" className="text-sm font-medium text-[#C0392B]">{error}</p>}
            <Button onClick={() => void handleJoin()} variant="primary" disabled={loading}>
              {loading ? "Submitting request..." : "Join This Group"}
            </Button>
          </div>
        </Card>
        <div className="mt-5 rounded-xl border border-[#2563EB]/20 bg-[#EFF6FF] p-4">
          <p className="mb-2 text-[15px] font-semibold text-[#2563EB]">Need a group code?</p>
          <p className="text-[15px] leading-relaxed text-[#1A202C]">
            Ask your group leader or organization administrator for the current join code.
            E-Skedyul will check it against the organization records.
          </p>
        </div>
      </DesktopFormPanel>
    </div>
  )
}

export function DesktopPendingScreen({ data, onBack, onApproved }: {
  data: FormData
  onBack: () => void
  onApproved: () => void
}) {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending")
  const [statusMessage, setStatusMessage] = useState("")
  const [reviewerNote, setReviewerNote] = useState("")
  const [error, setError] = useState("")

  async function checkStatus() {
    if (!data.joinRequestId) {
      setError("The request receipt is missing. Please submit your request again.")
      return
    }
    setChecking(true)
    setError("")
    try {
      const result = await getJoinRequestStatus(data.joinRequestId)
      setStatus(result.status)
      setStatusMessage(result.message)
      setReviewerNote(result.reviewerNote)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check request status.")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <DesktopBrandPanel />
      <DesktopFormPanel>
        <div className="flex flex-col items-center gap-7">
          <ClockIcon />
          <div className="text-center">
            <h2 className={\`mb-2 text-2xl font-bold \${status === "approved" ? "text-[#15803D]" : status === "rejected" ? "text-[#C0392B]" : "text-[#C9921A]"}\`}>
              {status === "approved" ? "Your request was approved" : status === "rejected" ? "Your request was rejected" : "Your request has been saved"}
            </h2>
            <p className="text-[17px] leading-relaxed text-[#1A202C]">
              You've requested to join the <strong>{data.groupName || "selected organization"}</strong> group.
            </p>
          </div>
          <div className="w-full rounded-2xl border border-[#C9921A]/30 bg-[#FEF3DC] p-6">
            <p className="text-[17px] leading-relaxed text-[#1A202C]">
              Your request is saved in E-Skedyul. The organization administrator can review it and record a decision.
            </p>
            <p className="mt-3 text-sm font-semibold text-[#1B3A6B]">
              Request receipt: <span className="break-all font-mono">{data.joinRequestId || "Unavailable"}</span>
            </p>
          </div>
          <div className="w-full rounded-xl border border-[#D1D9E8] bg-white p-4">
            <p className="mb-2 text-[15px] font-semibold uppercase tracking-wide text-[#64748B]">What's next?</p>
            <ol className="flex flex-col gap-2">
              {PENDING_STEPS.map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-[15px] text-[#1A202C]">
                  <span className="mt-0.5 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#C9921A]/15 text-[13px] font-bold text-[#C9921A]">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            {statusMessage && <p role="status" className="mt-3 text-sm font-semibold text-[#1B3A6B]">{statusMessage}</p>}
            {reviewerNote && <p className="mt-2 text-sm text-[#64748B]">Administrator note: {reviewerNote}</p>}
          </div>
          {error && <p role="alert" className="w-full rounded-xl bg-red-light p-4 text-sm font-semibold text-red">{error}</p>}
          <div className="w-full border-t border-[#D1D9E8] pt-5 flex flex-col gap-3">
            <Button onClick={() => void checkStatus()} disabled={checking || status === "approved"}>
              {checking ? "Checking status..." : "Check request status"}
            </Button>
            {status === "approved" && <Button onClick={onApproved}>Continue to schedule</Button>}
            <Button onClick={onBack} variant="ghost">← Start Over</Button>
          </div>
        </div>
      </DesktopFormPanel>
    </div>
  )
}
