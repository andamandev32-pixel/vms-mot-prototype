import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "./use-api";

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
// Types
// ---------------------------------------------------------------------------

export interface EntryListParams {
  status?: string;
  date?: string;
  search?: string;
  servicePointId?: number;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useEntries(params?: EntryListParams) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["entries", params],
    queryFn: () => apiFetch(`/api/entries?${sp}`),
  });
}

export function useTodayEntries() {
  return useQuery({
    queryKey: ["entries", "today"],
    queryFn: () => apiFetch("/api/entries/today"),
  });
}

export function useEntry(id: number) {
  return useQuery({
    queryKey: ["entries", id],
    queryFn: () => apiFetch(`/api/entries/${id}`),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Check-in: create a new entry */
export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/entries", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Check-out an existing entry */
export function useCheckout(entryId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data?: unknown) =>
      apiPost(`/api/entries/${entryId}/checkout`, data ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
