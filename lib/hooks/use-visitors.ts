import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./use-api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSearchParams(params?: Record<string, unknown>): URLSearchParams {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    });
  }
  return sp;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useSearchVisitors(q?: string) {
  return useQuery({
    queryKey: ["search", "visitors", q],
    queryFn: () => apiFetch(`/api/search/visitors?q=${encodeURIComponent(q ?? "")}`),
    enabled: !!q && q.length >= 2,
  });
}

export function useSearchContacts(q?: string) {
  return useQuery({
    queryKey: ["search", "contacts", q],
    queryFn: () => apiFetch(`/api/search/contacts?q=${encodeURIComponent(q ?? "")}`),
    enabled: !!q && q.length >= 2,
  });
}

export interface SearchAppointmentsParams {
  q?: string;
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export function useSearchAppointments(params?: SearchAppointmentsParams) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["search", "appointments", params],
    queryFn: () => apiFetch(`/api/search/appointments?${sp}`),
    enabled: !!params?.q && params.q.length >= 2,
  });
}
