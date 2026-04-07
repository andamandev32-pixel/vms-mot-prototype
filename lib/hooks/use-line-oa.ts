/**
 * LINE OA / LIFF — React Query hooks
 * สำหรับ /line-oa page: ใช้งานจริง ทั้ง visitor + officer flows
 *
 * Re-exports existing hooks where available, adds LINE-specific wrappers.
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "./use-api";
import type { LineFlowStateId } from "@/lib/line-oa-flow-data";
import { getFlowState } from "@/lib/line-oa-flow-data";

// Note: These hooks are already available via the barrel export (index.ts):
// useAppointments, useAppointment, useCreateAppointment, useApproveAppointment,
// useRejectAppointment, useCancelAppointment (from use-appointments.ts)
// useEntries, useTodayEntries, useCreateEntry, useCheckout (from use-entries.ts)
// useStaffList (from use-staff.ts)
// useVisitPurposes, useDepartments (from use-settings.ts)

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

export interface LineAuthState {
  visitorSession: { id: number; name: string; email?: string } | null;
  staffSession: { id: number; name: string; role: string; departmentId?: number } | null;
}

export interface ApiHealthResult {
  endpoint: string;
  method: string;
  status: "ok" | "error" | "auth-required" | "pending" | "untested";
  statusCode?: number;
  latencyMs?: number;
  error?: string;
}

export interface ApiCallLog {
  id: string;
  method: string;
  url: string;
  requestBody?: unknown;
  responseStatus?: number;
  responseBody?: unknown;
  latencyMs?: number;
  error?: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Auth: Detect existing sessions
// ---------------------------------------------------------------------------

export function useVisitorMe(enabled = true) {
  return useQuery<{ id: number; firstName: string; lastName: string; email?: string; phone?: string; company?: string; lineUserId?: string } | null>({
    queryKey: ["visitor-me"],
    queryFn: async () => {
      try {
        return await apiFetch("/api/auth/visitor/me");
      } catch {
        return null;
      }
    },
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export function useStaffMe(enabled = true) {
  return useQuery<{ id: number; name: string; nameEn?: string; role: string; departmentId?: number; departmentName?: string; email?: string } | null>({
    queryKey: ["staff-me"],
    queryFn: async () => {
      try {
        return await apiFetch("/api/auth/me");
      } catch {
        return null;
      }
    },
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Auth: Login mutations
// ---------------------------------------------------------------------------

export function useVisitorLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email?: string; phone?: string; password: string }) =>
      apiPost("/api/auth/visitor/login", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitor-me"] });
    },
  });
}

export function useStaffLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      apiPost("/api/auth/login", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-me"] });
    },
  });
}

export function useVisitorRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      company?: string;
      idNumber?: string;
      idType?: string;
      password?: string;
    }) => apiPost("/api/auth/visitor/register", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitor-me"] });
    },
  });
}

export function useCheckStaff() {
  return useMutation({
    mutationFn: (data: { query: string }) =>
      apiPost<{
        found: boolean;
        staff?: { id: number; firstName: string; lastName: string; position: string; departmentName: string };
      }>("/api/auth/check-staff", data),
  });
}

// ---------------------------------------------------------------------------
// LINE Account Linking
// ---------------------------------------------------------------------------

export function useLinkLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { lineUserId: string; lineAccessToken?: string }) =>
      apiPost("/api/users/me/line/link", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitor-me"] });
      qc.invalidateQueries({ queryKey: ["staff-me"] });
    },
  });
}

export function useAssignRichMenu() {
  return useMutation({
    mutationFn: (data: { userId: string; richMenuId: string }) =>
      apiPost("/api/line/richmenu/assign", data),
  });
}

// ---------------------------------------------------------------------------
// LINE Push Message
// ---------------------------------------------------------------------------

export function usePushMessage() {
  return useMutation({
    mutationFn: (data: { to: string; messages: unknown[] }) =>
      apiPost("/api/line/push-message", data),
  });
}

// ---------------------------------------------------------------------------
// LINE-specific: Visit Purposes for LINE channel
// ---------------------------------------------------------------------------

export function useVisitPurposesForLine() {
  return useQuery({
    queryKey: ["visit-purposes", "line"],
    queryFn: () => apiFetch("/api/visit-purposes?channel=line"),
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// LINE-specific: Staff search (for host selection in booking)
// ---------------------------------------------------------------------------

export function useStaffSearch(query: string) {
  return useQuery({
    queryKey: ["staff", "search", query],
    queryFn: () => apiFetch(`/api/staff?search=${encodeURIComponent(query)}&limit=10`),
    enabled: query.length >= 1,
    staleTime: 10_000,
  });
}

// ---------------------------------------------------------------------------
// LINE-specific: Departments for booking
// ---------------------------------------------------------------------------

export function useDepartmentsForLine() {
  return useQuery({
    queryKey: ["departments", "line"],
    queryFn: () => apiFetch("/api/locations/departments"),
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// LINE-specific: My Appointments (for visitor/officer)
// ---------------------------------------------------------------------------

export interface MyAppointmentsParams {
  status?: string;
  limit?: number;
  page?: number;
  channel?: string;
}

export function useMyAppointments(params?: MyAppointmentsParams) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["my-appointments", params],
    queryFn: () => apiFetch(`/api/appointments?${sp}`),
    staleTime: 15_000,
  });
}

// ---------------------------------------------------------------------------
// LINE-specific: Booking (with channel=line default)
// ---------------------------------------------------------------------------

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      visitorId?: number;
      visitPurposeId: number;
      departmentId: number;
      date: string;
      timeStart: string;
      timeEnd: string;
      hostStaffId?: number;
      purpose?: string;
      channel?: string;
    }) => apiPost("/api/appointments", { ...data, channel: data.channel || "line" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
    },
  });
}

// LINE OA Config hooks are already in use-settings.ts:
// useLineOaSettings, useUpdateLineOaSettings, useTestLineOa, useVerifyLineOaWebhook
// Available via the barrel export (index.ts)

// ---------------------------------------------------------------------------
// API Health Check — ping endpoints for a given flow state
// ---------------------------------------------------------------------------

async function pingEndpoint(endpoint: string): Promise<ApiHealthResult> {
  const parts = endpoint.split(" ");
  const method = parts.length > 1 ? parts[0] : "GET";
  let path = parts.length > 1 ? parts[1] : parts[0];

  // Replace path params with dummy values for health check
  path = path.replace(/:(\w+)/g, "1");

  const start = performance.now();
  try {
    const res = await fetch(path, {
      method: method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE"
        ? "OPTIONS" // Use OPTIONS for mutating endpoints to avoid side-effects
        : "GET",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    });
    const latencyMs = Math.round(performance.now() - start);

    if (res.status === 401 || res.status === 403) {
      return { endpoint, method, status: "auth-required", statusCode: res.status, latencyMs };
    }
    if (res.status === 405) {
      // OPTIONS not allowed — try a lightweight GET or HEAD to at least confirm route exists
      const res2 = await fetch(path, { method: "HEAD", credentials: "same-origin" });
      const latencyMs2 = Math.round(performance.now() - start);
      if (res2.status === 401 || res2.status === 403) {
        return { endpoint, method, status: "auth-required", statusCode: res2.status, latencyMs: latencyMs2 };
      }
      return {
        endpoint,
        method,
        status: res2.ok || res2.status === 405 ? "ok" : "error",
        statusCode: res2.status,
        latencyMs: latencyMs2,
      };
    }
    if (res.ok || res.status === 400 || res.status === 422) {
      // 400/422 = route exists but validation failed (which is expected for health checks)
      return { endpoint, method, status: "ok", statusCode: res.status, latencyMs };
    }
    return { endpoint, method, status: "error", statusCode: res.status, latencyMs };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      endpoint,
      method,
      status: "error",
      latencyMs,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export function useApiHealthCheck(stateId: LineFlowStateId | null) {
  const state = stateId ? getFlowState(stateId) : null;
  const endpoints = state?.apiEndpoints ?? [];

  return useQuery<ApiHealthResult[]>({
    queryKey: ["api-health", stateId],
    queryFn: () => Promise.all(endpoints.map(pingEndpoint)),
    enabled: !!stateId && endpoints.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useManualApiHealthCheck() {
  const [results, setResults] = useState<ApiHealthResult[]>([]);
  const [testing, setTesting] = useState(false);

  const testEndpoints = useCallback(async (stateId: LineFlowStateId) => {
    const state = getFlowState(stateId);
    if (!state) return;
    setTesting(true);
    setResults(state.apiEndpoints.map((ep) => ({ endpoint: ep, method: ep.split(" ")[0], status: "pending" as const })));

    const newResults: ApiHealthResult[] = [];
    for (const ep of state.apiEndpoints) {
      const result = await pingEndpoint(ep);
      newResults.push(result);
      setResults([...newResults, ...state.apiEndpoints.slice(newResults.length).map((e) => ({ endpoint: e, method: e.split(" ")[0], status: "pending" as const }))]);
    }
    setResults(newResults);
    setTesting(false);
  }, []);

  return { results, testing, testEndpoints };
}

// ---------------------------------------------------------------------------
// API Call Logger — tracks requests for dev mode display
// ---------------------------------------------------------------------------

let callLogId = 0;

export function useApiCallLogger() {
  const [logs, setLogs] = useState<ApiCallLog[]>([]);

  const loggedFetch = useCallback(async <T,>(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<{ data: T; log: ApiCallLog }> => {
    const id = `log-${++callLogId}`;
    const start = performance.now();

    try {
      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const latencyMs = Math.round(performance.now() - start);
      const json = await res.json();

      const log: ApiCallLog = {
        id,
        method,
        url,
        requestBody: body,
        responseStatus: res.status,
        responseBody: json,
        latencyMs,
        timestamp: Date.now(),
      };
      setLogs((prev) => [log, ...prev].slice(0, 50));

      if (!json.success) {
        throw Object.assign(new Error(json.error?.message || "API error"), { log });
      }
      return { data: json.data as T, log };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      if ((err as { log?: ApiCallLog }).log) throw err; // already logged

      const log: ApiCallLog = {
        id,
        method,
        url,
        requestBody: body,
        error: err instanceof Error ? err.message : "Unknown error",
        latencyMs,
        timestamp: Date.now(),
      };
      setLogs((prev) => [log, ...prev].slice(0, 50));
      throw err;
    }
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, loggedFetch, clearLogs };
}
