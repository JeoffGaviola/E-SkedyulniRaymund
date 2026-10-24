import { useState } from "react"
import type { FormData } from "./types"
import { ScreenShell, Card, Logo, Button, InputField, BackButton, ClockIcon } from "../../shared/ui"
import { PENDING_STEPS } from "./data"
import { getJoinRequestStatus, submitJoinRequest } from "./joinRequests"

export function WelcomeScreen({ onStart, onAdmin }: { onStart: () => void; onAdmin: () => void }) {
  return (
    <ScreenShell>
      <div className="mt-16 flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="p-5 bg-[#1B3A6B] rounded-[22px] shadow-lg">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
              <path d="M28 4v8M24 8h8" stroke="#C9921A" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="16" y="16" width="24" height="30" rx="2" stroke="white" strokeWidth="2.5" fill="none" />
              <path d="M22 46V34h12v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 26h24" stroke="white" strokeWidth="2" />
              <path d="M16 34h24" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-[#1B3A6B] tracking-tight leading-none">E-Skedyul</h1>
            <p className="mt-3 text-[18px] font-medium text-[#64748B]">Your ministry schedule, made simple.</p>
          </div>
        </div>

        <div className="text-center px-2">
          <p className="text-xl font-semibold leading-relaxed text-[#1A202C]">Share when you're available and volunteer when your ministry needs help.</p>
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          <Button onClick={onStart}>Get Started</Button>
          <Button onClick={onAdmin} variant="ghost">Sign in as Admin</Button>
        </div>
      </div>
    </ScreenShell>
  )
}

export function TellNameScreen({ firstName, lastName, setFirstName, setLastName, onContinue }: {
  firstName: string
  lastName: string
  setFirstName: (value: string) => void
  setLastName: (value: string) => void
  onContinue: () => void
}) {
  const [error, setError] = useState("")

  function continueToApp() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.")
      return
    }
    setError("")
    onContinue()
  }

  return (
    <ScreenShell>
      <div className="mb-8 flex justify-center"><Logo size="md" /></div>
      <Card>
        <p className="text-2xl font-bold text-[#1B3A6B]">Tell us your name</p>
        <p className="mb-6 mt-2 text-[18px] leading-relaxed text-[#64748B]">This is how your name will appear to your ministries.</p>
        <div className="flex flex-col gap-5">
          <InputField label="First Name" id="first-name" value={firstName} onChange={setFirstName} placeholder="First name" autoComplete="given-name" />
          <InputField label="Last Name" id="last-name" value={lastName} onChange={setLastName} placeholder="Last name" autoComplete="family-name" />
          {error && <p role="alert" className="text-[16px] font-medium text-[#C0392B]">{error}</p>}
          <Button onClick={continueToApp}>Continue</Button>
        </div>
      </Card>
    </ScreenShell>
  )
}

export function JoinGroupScreen({
  data,
  setData,
  onJoin,
  onBack,
}: {
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
      const request = await submitJoinRequest(
        data.name,
        pasteMode ? pasteLink : data.groupCode,
      )
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
    <ScreenShell>
      <BackButton onClick={onBack} />
      <div className="mb-6 flex flex-col items-center">
        <h2 className="text-center text-2xl font-bold text-[#1B3A6B]">Join a Ministry Group</h2>
        <p className="mt-2 text-center text-[17px] text-[#64748B]">
          Enter the group code given to you by your group leader or coordinator.
        </p>
      </div>
      <Card>
        <div className="flex flex-col gap-6">
          {!pasteMode ? (
            <>
              <InputField
                label="Group Code"
                id="group-code"
                value={data.groupCode}
                onChange={value => {
                  setData({ groupCode: value.toUpperCase() })
                  setError("")
                }}
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
                id="paste-link"
                value={pasteLink}
                onChange={value => { setPasteLink(value); setError("") }}
                helper="Paste the link provided by your organization."
                error={error}
                placeholder="Paste group link or code"
                autoComplete="off"
              />
            </>
          )}
          {error && (
            <p role="alert" className="text-sm font-medium text-[#C0392B]">{error}</p>
          )}
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
    </ScreenShell>
  )
}

export function PendingScreen({
  data,
  onBack,
  onApproved,
}: {
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
    <ScreenShell>
      <div className="mt-6 flex flex-col items-center gap-7">
        <ClockIcon />
        <div className="text-center">
          <h2 className={`mb-2 text-2xl font-bold ${status === "approved" ? "text-[#15803D]" : status === "rejected" ? "text-[#C0392B]" : "text-[#C9921A]"}`}>
            {status === "approved" ? "Your request was approved" : status === "rejected" ? "Your request was rejected" : "Your request has been saved"}
          </h2>
          <p className="text-[17px] leading-relaxed text-[#1A202C]">
            You've requested to join the <strong>{data.groupName || "selected organization"}</strong> group.
          </p>
        </div>
        <div className="w-full rounded-2xl border border-[#C9921A]/30 bg-[#FEF3DC] p-6">
          <p className="text-[17px] leading-relaxed text-[#1A202C]">
            Your request is stored in E-Skedyul. The organization administrator can review it and record a decision.
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
        <div className="flex w-full flex-col gap-3 border-t border-[#D1D9E8] pt-5">
          <Button onClick={() => void checkStatus()} disabled={checking || status === "approved"}>
            {checking ? "Checking status..." : "Check request status"}
          </Button>
          {status === "approved" && <Button onClick={onApproved}>Continue to schedule</Button>}
          <Button onClick={onBack} variant="ghost">← Start Over</Button>
        </div>
      </div>
    </ScreenShell>
  )
}
