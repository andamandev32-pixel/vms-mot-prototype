import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./use-api";

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => apiFetch("/api/dashboard/kpis"),
  });
}

export function useDashboardToday() {
  return useQuery({
    queryKey: ["dashboard", "today"],
    queryFn: () => apiFetch("/api/dashboard/today"),
  });
}

export function useDashboardCharts(period?: "7d" | "30d") {
  const sp = period ? `?period=${period}` : "";
  return useQuery({
    queryKey: ["dashboard", "charts", period],
    queryFn: () => apiFetch(`/api/dashboard/charts${sp}`),
  });
}
