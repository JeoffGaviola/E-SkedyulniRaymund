import { apiRequest } from "../../lib/api"
import type { JoinRequestStatus, PublicJoinRequestStatus } from "../admin/types"

export type SubmittedJoinRequest = {
  id: string
  organizationId: string
  organizationName: string
  memberName: string
  submittedJoinCode: string
  status: JoinRequestStatus
  requestedAt: string
  reviewedAt: string | null
  reviewerNote: string
  message: string
}

export function extractJoinCode(value: string): string {
  const input = value.trim()
  if (!input) return ""

  try {
    const parsed = new URL(input)
    const parts = parsed.pathname.split("/").filter(Boolean)
    return decodeURIComponent(parts[parts.length - 1] ?? "").trim().toUpperCase()
  } catch {
    const clean = input.split(/[?#]/, 1)[0]
    const parts = clean.split("/").filter(Boolean)
    return (parts[parts.length - 1] ?? "").trim().toUpperCase()
  }
}

export async function submitJoinRequest(
  memberName: string,
  codeOrLink: string,
): Promise<SubmittedJoinRequest> {
  const name = memberName.trim().replace(/\s+/g, " ")
  const joinCode = extractJoinCode(codeOrLink)

  if (name.length < 2) {
    throw new Error("Please enter your name before joining a group.")
  }
  if (!joinCode) {
    throw new Error("Please enter the group code given to you by your group leader.")
  }

  return apiRequest<SubmittedJoinRequest>(
    "/public/join-requests",
    {
      method: "POST",
      body: JSON.stringify({ memberName: name, joinCode }),
    },
    false,
  )
}

export async function getJoinRequestStatus(
  requestId: string,
): Promise<PublicJoinRequestStatus> {
  if (!requestId.trim()) {
    throw new Error("The request receipt is missing. Please submit your request again.")
  }

  return apiRequest<PublicJoinRequestStatus>(
    \`/public/join-requests/\${encodeURIComponent(requestId)}\`,
    { method: "GET" },
    false,
  )
}
