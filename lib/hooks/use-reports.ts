import { useQuery, useMutation } from "@tanstack/react-query";
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
// Types
// ---------------------------------------------------------------------------

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  purposeId?: number;
  page?: number;
  limit?: number;
}

export interface AuditLogParams {
  action?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ExportParams {
  type: "visits" | "visitors" | "audit-log";
  format?: "csv" | "xlsx";
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  purposeId?: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useVisitReport(params?: ReportParams) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["reports", "visits", params],
    queryFn: () => apiFetch(`/api/reports/visits?${sp}`),
  });
}

export function useVisitorReport(params?: ReportParams) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["reports", "visitors", params],
    queryFn: () => apiFetch(`/api/reports/visitors?${sp}`),
  });
}

export function useAuditLog(params?: AuditLogParams) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["reports", "audit-log", params],
    queryFn: () => apiFetch(`/api/reports/audit-log?${sp}`),
  });
}

// ---------------------------------------------------------------------------
// Export (returns a file download)
// ---------------------------------------------------------------------------

export function useExportReport() {
  return useMutation({
    mutationFn: async (params: ExportParams) => {
      const sp = toSearchParams(params as unknown as Record<string, unknown>);
      const res = await fetch(`/api/reports/export?${sp}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message || "Export failed");
      }
      // Trigger browser file download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("content-disposition");
      const filename =
        disposition?.match(/filename="?([^"]+)"?/)?.[1] ??
        `report-${params.type}.${params.format || "csv"}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  });
}
