import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPatch, apiPut, apiDelete } from "./use-api";

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

// ============================================================================
// Visit Purposes
// ============================================================================

export function useVisitPurposes(params?: { page?: number; limit?: number }) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["visit-purposes", params],
    queryFn: () => apiFetch(`/api/visit-purposes?${sp}`),
  });
}

export function useCreateVisitPurpose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/visit-purposes", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-purposes"] }),
  });
}

export function useUpdateVisitPurpose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPatch(`/api/visit-purposes/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-purposes"] }),
  });
}

export function useDeleteVisitPurpose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/visit-purposes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-purposes"] }),
  });
}

// ============================================================================
// Visit Purpose Department Rules
// ============================================================================

export function useCreateDepartmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ purposeId, ...data }: { purposeId: number; [key: string]: unknown }) =>
      apiPost(`/api/visit-purposes/${purposeId}/department-rules`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-purposes"] }),
  });
}

export function useUpdateDepartmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ purposeId, ruleId, ...data }: { purposeId: number; ruleId: number; [key: string]: unknown }) =>
      apiPatch(`/api/visit-purposes/${purposeId}/department-rules/${ruleId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-purposes"] }),
  });
}

export function useDeleteDepartmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ purposeId, ruleId }: { purposeId: number; ruleId: number }) =>
      apiDelete(`/api/visit-purposes/${purposeId}/department-rules/${ruleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-purposes"] }),
  });
}

// ============================================================================
// Document Types
// ============================================================================

export function useDocumentTypes(params?: { page?: number; limit?: number }) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["document-types", params],
    queryFn: () => apiFetch(`/api/document-types?${sp}`),
  });
}

export function useCreateDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/document-types", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document-types"] }),
  });
}

export function useUpdateDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPut(`/api/document-types/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document-types"] }),
  });
}

export function useDeleteDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/document-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document-types"] }),
  });
}

// ============================================================================
// Buildings & Floors & Departments (Locations)
// ============================================================================

export function useBuildings() {
  return useQuery({
    queryKey: ["buildings"],
    queryFn: () => apiFetch("/api/locations/buildings"),
  });
}

export function useCreateBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/locations/buildings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buildings"] });
      qc.invalidateQueries({ queryKey: ["floors"] });
    },
  });
}

export function useUpdateBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPatch(`/api/locations/buildings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buildings"] });
      qc.invalidateQueries({ queryKey: ["floors"] });
    },
  });
}

export function useDeleteBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/locations/buildings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buildings"] });
      qc.invalidateQueries({ queryKey: ["floors"] });
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => apiFetch("/api/locations/departments"),
  });
}

export function useFloors(buildingId: number) {
  return useQuery({
    queryKey: ["floors", buildingId],
    queryFn: () => apiFetch(`/api/locations/buildings/${buildingId}/floors`),
    enabled: !!buildingId,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/locations/departments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      qc.invalidateQueries({ queryKey: ["buildings"] });
      qc.invalidateQueries({ queryKey: ["floors"] });
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPatch(`/api/locations/departments/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      qc.invalidateQueries({ queryKey: ["buildings"] });
      qc.invalidateQueries({ queryKey: ["floors"] });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/locations/departments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      qc.invalidateQueries({ queryKey: ["buildings"] });
      qc.invalidateQueries({ queryKey: ["floors"] });
    },
  });
}

export function useCreateFloor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/locations/floors", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["floors"] });
      qc.invalidateQueries({ queryKey: ["buildings"] });
    },
  });
}

export function useUpdateFloor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPatch(`/api/locations/floors/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["floors"] });
      qc.invalidateQueries({ queryKey: ["buildings"] });
    },
  });
}

export function useDeleteFloor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/locations/floors/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["floors"] });
      qc.invalidateQueries({ queryKey: ["buildings"] });
    },
  });
}

export function useAllFloors() {
  return useQuery({
    queryKey: ["floors"],
    queryFn: () => apiFetch("/api/locations/floors"),
  });
}

export function useFloorDepartments(floorId: number) {
  return useQuery({
    queryKey: ["floor-departments", floorId],
    queryFn: () => apiFetch(`/api/locations/floors/${floorId}/departments`),
    enabled: !!floorId,
  });
}

// ============================================================================
// Service Points
// ============================================================================

export function useServicePoints(params?: { page?: number; limit?: number }) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["service-points", params],
    queryFn: () => apiFetch(`/api/service-points?${sp}`),
  });
}

export function useCreateServicePoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/service-points", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-points"] }),
  });
}

export function useUpdateServicePoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPut(`/api/service-points/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-points"] }),
  });
}

export function useDeleteServicePoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/service-points/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-points"] }),
  });
}

// ============================================================================
// Business Hours & Holidays
// ============================================================================

export function useBusinessHours() {
  return useQuery({
    queryKey: ["business-hours"],
    queryFn: () => apiFetch("/api/business-hours"),
  });
}

export function useUpdateBusinessHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPut("/api/business-hours", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-hours"] }),
  });
}

export function useHolidays() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: () => apiFetch("/api/business-hours/holidays"),
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/business-hours/holidays", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

// ============================================================================
// Access Zones
// ============================================================================

export function useAccessZones(params?: { page?: number; limit?: number }) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["access-zones", params],
    queryFn: () => apiFetch(`/api/access-zones?${sp}`),
  });
}

export function useCreateAccessZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/access-zones", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access-zones"] }),
  });
}

export function useUpdateAccessZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPut(`/api/access-zones/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access-zones"] }),
  });
}

export function useDeleteAccessZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/access-zones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access-zones"] }),
  });
}

export function useTestAccessZone() {
  return useMutation({
    mutationFn: (id: number) => apiPost(`/api/access-zones/${id}/test`, {}),
  });
}

// ============================================================================
// Approver Groups
// ============================================================================

export function useApproverGroups(params?: { page?: number; limit?: number }) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["approver-groups", params],
    queryFn: () => apiFetch(`/api/approver-groups?${sp}`),
  });
}

export function useApproverGroup(id: number) {
  return useQuery({
    queryKey: ["approver-groups", id],
    queryFn: () => apiFetch(`/api/approver-groups/${id}`),
    enabled: !!id,
  });
}

export function useCreateApproverGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/approver-groups", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approver-groups"] }),
  });
}

export function useUpdateApproverGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPut(`/api/approver-groups/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approver-groups"] }),
  });
}

export function useDeleteApproverGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/approver-groups/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approver-groups"] }),
  });
}

export function useUpdateApproverGroupMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, members }: { id: number; members: unknown[] }) =>
      apiPut(`/api/approver-groups/${id}/members`, { members }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approver-groups"] }),
  });
}

// ============================================================================
// Notification Templates
// ============================================================================

export function useNotificationTemplates(params?: { page?: number; limit?: number }) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["notification-templates", params],
    queryFn: () => apiFetch(`/api/notification-templates?${sp}`),
  });
}

export function useCreateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/notification-templates", data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notification-templates"] }),
  });
}

export function useUpdateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPatch(`/api/notification-templates/${id}`, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notification-templates"] }),
  });
}

export function useDeleteNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/notification-templates/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notification-templates"] }),
  });
}

export function usePreviewNotificationTemplate() {
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/notification-templates/${id}/preview`),
  });
}

// ============================================================================
// Blocklist
// ============================================================================

export function useBlocklist(params?: { search?: string; page?: number; limit?: number }) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["blocklist", params],
    queryFn: () => apiFetch(`/api/blocklist?${sp}`),
  });
}

export function useCreateBlocklistEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/blocklist", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocklist"] }),
  });
}

export function useUpdateBlocklistEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiPatch(`/api/blocklist/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocklist"] }),
  });
}

export function useDeleteBlocklistEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/api/blocklist/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocklist"] }),
  });
}

export function useCheckBlocklist() {
  return useMutation({
    mutationFn: (data: { documentNumber?: string; name?: string }) =>
      apiPost("/api/blocklist/check", data),
  });
}

// ============================================================================
// PDPA Config & Consent
// ============================================================================

export function usePdpaConfig() {
  return useQuery({
    queryKey: ["pdpa-config"],
    queryFn: () => apiFetch("/api/pdpa/config"),
  });
}

export function useUpdatePdpaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPut("/api/pdpa/config", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdpa-config"] }),
  });
}

export function useAcceptPdpa() {
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/pdpa/accept", data),
  });
}

export function usePdpaLogs(params?: { page?: number; limit?: number }) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["pdpa-logs", params],
    queryFn: () => apiFetch(`/api/pdpa/logs?${sp}`),
  });
}

// ============================================================================
// Visit Slips
// ============================================================================

export function useVisitSlipConfig() {
  return useQuery({
    queryKey: ["visit-slip-config"],
    queryFn: () => apiFetch("/api/visit-slips/config"),
  });
}

export function useUpdateVisitSlipConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPut("/api/visit-slips/config", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-slip-config"] }),
  });
}

export function usePreviewVisitSlip() {
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/visit-slips/preview", data),
  });
}

/**
 * Public hook — ดึง Visit Slip Template สำหรับ Kiosk / Counter พิมพ์บัตร
 * ไม่ต้อง auth (endpoint /api/visit-slips/template เป็น public)
 */
export function useVisitSlipTemplate() {
  return useQuery({
    queryKey: ["visit-slip-template"],
    queryFn: () => apiFetch("/api/visit-slips/template"),
    staleTime: 5 * 60 * 1000, // cache 5 นาที
  });
}

// ============================================================================
// System Settings (Email, LINE OA, General)
// ============================================================================

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: () => apiFetch("/api/settings/system"),
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPut("/api/settings/system", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-settings"] }),
  });
}

export function useEmailSettings() {
  return useQuery({
    queryKey: ["email-settings"],
    queryFn: () => apiFetch("/api/settings/email"),
  });
}

export function useUpdateEmailSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPut("/api/settings/email", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-settings"] }),
  });
}

export function useTestEmail() {
  return useMutation({
    mutationFn: (data: { to: string }) =>
      apiPost("/api/settings/email/test", data),
  });
}

export function useEmailLogs(params?: { page?: number; limit?: number }) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["email-logs", params],
    queryFn: () => apiFetch(`/api/settings/email/logs?${sp}`),
  });
}

export function useLineOaSettings() {
  return useQuery({
    queryKey: ["line-oa-settings"],
    queryFn: () => apiFetch("/api/settings/line-oa"),
  });
}

export function useUpdateLineOaSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPut("/api/settings/line-oa", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["line-oa-settings"] }),
  });
}

export function useTestLineOa() {
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/settings/line-oa/test", data),
  });
}

export function useVerifyLineOaWebhook() {
  return useMutation({
    mutationFn: () => apiPost("/api/settings/line-oa/verify-webhook", {}),
  });
}

// ============================================================================
// LINE Flex Message Templates
// ============================================================================

export function useLineFlexTemplates() {
  return useQuery({
    queryKey: ["line-flex-templates"],
    queryFn: () => apiFetch("/api/settings/line-oa/flex-templates"),
  });
}

export function useUpdateLineFlexTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPut("/api/settings/line-oa/flex-templates", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["line-flex-templates"] }),
  });
}

export function useUpdateLineFlexTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stateId, ...data }: { stateId: string; [key: string]: unknown }) =>
      apiPatch(`/api/settings/line-oa/flex-templates/${stateId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["line-flex-templates"] }),
  });
}
