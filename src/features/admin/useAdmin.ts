import { useMemo, useState } from "react"
import { INITIAL_EVENTS, INITIAL_ORGANIZATIONS } from "./data"
import type { AdminEvent, EventDraft, Organization, OrganizationDraft } from "./types"

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

export function useAdmin() {
  const [organizations, setOrganizations] = useState(INITIAL_ORGANIZATIONS)
  const [events, setEvents] = useState(INITIAL_EVENTS)

  function saveOrganization(draft: OrganizationDraft, id?: string) {
    const duplicate = organizations.some(
      organization => organization.id !== id && organization.name.toLowerCase() === draft.name.trim().toLowerCase(),
    )
    if (duplicate) return { ok: false, message: "An organization with this name already exists." }

    if (id) {
      setOrganizations(current => current.map(organization =>
        organization.id === id ? { ...organization, ...draft, name: draft.name.trim() } : organization,
      ))
      return { ok: true, id }
    }

    const next: Organization = {
      ...draft,
      id: makeId("org"),
      name: draft.name.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setOrganizations(current => [next, ...current])
    return { ok: true, id: next.id }
  }

  function toggleOrganization(id: string) {
    setOrganizations(current => current.map(organization =>
      organization.id === id
        ? { ...organization, status: organization.status === "active" ? "inactive" : "active" }
        : organization,
    ))
  }

  function deleteOrganization(id: string) {
    if (events.some(event => event.organizationId === id)) return false
    setOrganizations(current => current.filter(organization => organization.id !== id))
    return true
  }

  function saveEvent(draft: EventDraft, id?: string) {
    if (id) {
      setEvents(current => current.map(event => event.id === id ? { ...event, ...draft } : event))
      return id
    }
    const next: AdminEvent = {
      ...draft,
      id: makeId("event"),
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setEvents(current => [next, ...current])
    return next.id
  }

  function duplicateEvent(id: string) {
    const source = events.find(event => event.id === id)
    if (!source) return null
    const duplicate: AdminEvent = {
      ...source,
      id: makeId("event"),
      title: `${source.title} copy`,
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setEvents(current => [duplicate, ...current])
    return duplicate.id
  }

  function cancelEvent(id: string) {
    setEvents(current => current.map(event => event.id === id ? { ...event, status: "cancelled" } : event))
  }

  function deleteEvent(id: string) {
    setEvents(current => current.filter(event => event.id !== id))
  }

  function findConflict(draft: EventDraft, editingId?: string) {
    const start = new Date(draft.startsAt).getTime()
    const end = new Date(draft.endsAt).getTime()
    if (!start || !end || end <= start) return null
    return events.find(event => {
      if (event.id === editingId || event.status === "cancelled") return false
      const sameContext =
        event.organizationId === draft.organizationId ||
        (event.location.trim() && event.location.toLowerCase() === draft.location.trim().toLowerCase())
      return sameContext && start < new Date(event.endsAt).getTime() && end > new Date(event.startsAt).getTime()
    }) ?? null
  }

  const metrics = useMemo(() => ({
    activeOrganizations: organizations.filter(organization => organization.status === "active").length,
    publishedEvents: events.filter(event => event.status === "published").length,
    draftEvents: events.filter(event => event.status === "draft").length,
    upcomingEvents: events.filter(event => event.status === "published" && new Date(event.startsAt) > new Date()).length,
  }), [events, organizations])

  return {
    organizations,
    events,
    metrics,
    saveOrganization,
    toggleOrganization,
    deleteOrganization,
    saveEvent,
    duplicateEvent,
    cancelEvent,
    deleteEvent,
    findConflict,
  }
}
