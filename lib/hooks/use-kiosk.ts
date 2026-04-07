import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kioskApiFetch, kioskApiPost } from "../kiosk/kiosk-auth-context";
import { apiFetch, apiPost } from "./use-api";

// Load kiosk service point config — public endpoint (ไม่ต้อง auth)
export function useKioskConfig(servicePointId: number | null) {
  return useQuery({
    queryKey: ["kiosk-config", servicePointId],
    queryFn: () => apiFetch(`/api/kiosk/${servicePointId}/config`),
    enabled: !!servicePointId,
  });
}

// Load visit purposes with department rules
export function useKioskPurposes() {
  return useQuery({
    queryKey: ["kiosk-purposes"],
    queryFn: () => kioskApiFetch("/api/visit-purposes"),
  });
}

// Search visitor by ID number
export function useSearchVisitor() {
  return useMutation({
    mutationFn: (params: { idNumber: string }) =>
      kioskApiFetch(`/api/search/visitors?search=${encodeURIComponent(params.idNumber)}`),
  });
}

// Check blocklist (kiosk-specific)
export function useKioskBlocklistCheck() {
  return useMutation({
    mutationFn: (params: { firstName: string; lastName: string }) =>
      kioskApiPost("/api/blocklist/check", params),
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
    }) => kioskApiPost("/api/entries", data),
  });
}

// Lookup appointment by booking code (QR scan)
export function useAppointmentLookup() {
  return useMutation({
    mutationFn: (params: { bookingCode: string }) =>
      kioskApiFetch(`/api/search/appointments?search=${encodeURIComponent(params.bookingCode)}`),
  });
}

// Create pending appointment (for walk-in that needs approval)
export function useCreatePendingAppointment() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      kioskApiPost("/api/appointments", { ...data, channel: "kiosk" }),
  });
}

// Poll appointment status (for PENDING_APPROVAL)
export function usePollAppointmentStatus(appointmentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["appointment-status", appointmentId],
    queryFn: () => kioskApiFetch(`/api/appointments/${appointmentId}`),
    enabled: !!appointmentId && enabled,
    refetchInterval: 10000, // poll every 10 seconds
  });
}

// Record PDPA consent — ใช้ apiPost ปกติ เพราะ endpoint นี้เป็น public อยู่แล้ว
export function useRecordPdpaConsent() {
  return useMutation({
    mutationFn: (data: { visitorId: number; configVersion: number; consentChannel: string; deviceId?: string }) =>
      apiPost("/api/pdpa/accept", data),
  });
}
