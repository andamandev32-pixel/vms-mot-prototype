import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPatch } from "./use-api";

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
// Query params type
// ---------------------------------------------------------------------------

export interface AppointmentListParams {
  status?: string;
  type?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useAppointments(params?: AppointmentListParams) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: () => apiFetch(`/api/appointments?${sp}`),
  });
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: ["appointments", id],
    queryFn: () => apiFetch(`/api/appointments/${id}`),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/appointments", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPatch(`/api/appointments/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useApproveAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPost(`/api/appointments/${id}/approve`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useRejectAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; reason?: string }) =>
      apiPost(`/api/appointments/${id}/reject`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; reason?: string }) =>
      apiPost(`/api/appointments/${id}/cancel`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useAddCompanions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      companions,
    }: {
      appointmentId: number;
      companions: unknown[];
    }) => apiPost(`/api/appointments/${appointmentId}/companions`, { companions }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
