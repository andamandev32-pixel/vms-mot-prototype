import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "./use-api";

// Load counter service point config
export function useCounterConfig(servicePointId: number | null) {
  return useQuery({
    queryKey: ["counter-config", servicePointId],
    queryFn: () => apiFetch(`/api/service-points/${servicePointId}`),
    enabled: !!servicePointId,
  });
}

// Dashboard stats for counter
export function useCounterDashboard() {
  return useQuery({
    queryKey: ["counter-dashboard"],
    queryFn: async () => {
      const [kpis, todayEntries] = await Promise.all([
        apiFetch("/api/dashboard/kpis"),
        apiFetch("/api/entries/today"),
      ]);
      return { kpis, todayEntries };
    },
    refetchInterval: 30000, // refresh every 30s
  });
}

// Today's appointments (with period support)
export function useTodayAppointments(search?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("date", new Date().toISOString().slice(0, 10));
  return useQuery({
    queryKey: ["counter-appointments", search],
    queryFn: () => apiFetch(`/api/appointments?${params.toString()}`),
  });
}

// Search visitor by ID/name
export function useCounterSearchVisitor() {
  return useMutation({
    mutationFn: (params: { search: string }) =>
      apiFetch(`/api/search/visitors?search=${encodeURIComponent(params.search)}`),
  });
}

// Check blocklist
export function useCounterBlocklistCheck() {
  return useMutation({
    mutationFn: (params: { firstName: string; lastName: string; channel: string }) =>
      apiPost("/api/blocklist/check", params),
  });
}

// Get visit purposes for counter
export function useCounterPurposes() {
  return useQuery({
    queryKey: ["counter-purposes"],
    queryFn: () => apiFetch("/api/visit-purposes"),
  });
}

// Counter check-in (walk-in or appointment)
export function useCounterCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      visitorId: number;
      checkinChannel: string;
      area: string;
      building: string;
      floor: string;
      room?: string;
      purpose?: string;
      visitType?: string;
      hostStaffId?: number;
      departmentId?: number;
      appointmentId?: number;
      idMethod?: string;
      companions?: number;
      notes?: string;
    }) => apiPost("/api/entries", { ...data, checkinChannel: "counter" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["counter-dashboard"] });
      qc.invalidateQueries({ queryKey: ["counter-appointments"] });
    },
  });
}

// Counter checkout
export function useCounterCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) =>
      apiPost(`/api/entries/${entryId}/checkout`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["counter-dashboard"] });
    },
  });
}

// Inline approve (officer approves at counter)
export function useInlineApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: number) =>
      apiPost(`/api/appointments/${appointmentId}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["counter-appointments"] });
    },
  });
}

// Inline reject
export function useInlineReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { appointmentId: number; reason: string }) =>
      apiPost(`/api/appointments/${params.appointmentId}/reject`, { reason: params.reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["counter-appointments"] });
    },
  });
}

// Create pending appointment from walk-in
export function useCounterCreateAppointment() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost("/api/appointments", { ...data, channel: "counter" }),
  });
}
