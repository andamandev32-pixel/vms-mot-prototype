import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "./use-api";

// Load kiosk service point config
export function useKioskConfig(servicePointId: number | null) {
  return useQuery({
    queryKey: ["kiosk-config", servicePointId],
    queryFn: () => apiFetch(`/api/service-points/${servicePointId}`),
    enabled: !!servicePointId,
  });
}

// Load visit purposes with department rules
export function useKioskPurposes() {
  return useQuery({
    queryKey: ["kiosk-purposes"],
    queryFn: () => apiFetch("/api/visit-purposes"),
  });
}

// Search visitor by ID number
export function useSearchVisitor() {
  return useMutation({
    mutationFn: (params: { idNumber: string }) =>
      apiFetch(`/api/search/visitors?search=${encodeURIComponent(params.idNumber)}`),
  });
}

// Check blocklist (kiosk-specific)
export function useKioskBlocklistCheck() {
  return useMutation({
    mutationFn: (params: { firstName: string; lastName: string }) =>
      apiPost("/api/blocklist/check", params),
  });
}

// Create check-in entry (with period validation built into API)
export function useKioskCheckin() {
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
    }) => apiPost("/api/entries", data),
  });
}

// Lookup appointment by booking code (QR scan)
export function useAppointmentLookup() {
  return useMutation({
    mutationFn: (params: { bookingCode: string }) =>
      apiFetch(`/api/search/appointments?search=${encodeURIComponent(params.bookingCode)}`),
  });
}

// Create pending appointment (for walk-in that needs approval)
export function useCreatePendingAppointment() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost("/api/appointments", { ...data, channel: "kiosk" }),
  });
}

// Poll appointment status (for PENDING_APPROVAL)
export function usePollAppointmentStatus(appointmentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["appointment-status", appointmentId],
    queryFn: () => apiFetch(`/api/appointments/${appointmentId}`),
    enabled: !!appointmentId && enabled,
    refetchInterval: 10000, // poll every 10 seconds
  });
}

// Record PDPA consent
export function useRecordPdpaConsent() {
  return useMutation({
    mutationFn: (data: { visitorId: number; configVersion: number; consentChannel: string; deviceId?: string }) =>
      apiPost("/api/pdpa/accept", data),
  });
}
