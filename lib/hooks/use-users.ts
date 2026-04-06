import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPatch, apiPost, apiDelete } from "./use-api";

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

export interface UserListParams {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useUsers(params?: UserListParams) {
  const sp = toSearchParams(params as Record<string, unknown>);
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => apiFetch(`/api/users?${sp}`),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: () => apiFetch("/api/users/me"),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => apiPost("/api/users", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiPatch(`/api/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useLockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, locked }: { id: number; locked: boolean }) =>
      apiPatch(`/api/users/${id}/lock`, { isActive: !locked }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiPost("/api/users/me/change-password", data),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; newPassword?: string }) =>
      apiPost(`/api/users/${id}/reset-password`, data),
  });
}

export function useUnlinkLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      apiDelete(`/api/users/${userId}/line/unlink`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
