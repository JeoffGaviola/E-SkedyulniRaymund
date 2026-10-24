import type { FormData } from "./types"

export const INITIAL_FORM: FormData = {
  name: "",
  groupCode: "",
  groupName: "",
  joinRequestId: "",
}

export const PENDING_STEPS = [
  "Your request is saved and waiting for administrator review.",
  "Check the request status for the administrator's decision.",
]
