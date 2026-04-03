"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// ===== Types =====

interface KioskAuthState {
  deviceToken: string | null;
  servicePointId: number | null;
  isAuthenticated: boolean;
}

interface KioskAuthContextValue extends KioskAuthState {
  setDeviceToken: (token: string, servicePointId: number) => void;
  clearDeviceToken: () => void;
}

// ===== Constants =====

const STORAGE_KEY_TOKEN = "evms_kiosk_device_token";
const STORAGE_KEY_SP_ID = "evms_kiosk_service_point_id";

// ===== Context =====

const KioskAuthContext = createContext<KioskAuthContextValue | null>(null);

// ===== Provider =====

export function KioskAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KioskAuthState>({
    deviceToken: null,
    servicePointId: null,
    isAuthenticated: false,
  });

  // อ่านจาก localStorage ตอน mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const spId = localStorage.getItem(STORAGE_KEY_SP_ID);
    if (token) {
      setState({
        deviceToken: token,
        servicePointId: spId ? parseInt(spId, 10) : null,
        isAuthenticated: true,
      });
    }
  }, []);

  const setDeviceToken = useCallback((token: string, servicePointId: number) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_SP_ID, String(servicePointId));
    setState({ deviceToken: token, servicePointId, isAuthenticated: true });
  }, []);

  const clearDeviceToken = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_SP_ID);
    setState({ deviceToken: null, servicePointId: null, isAuthenticated: false });
  }, []);

  return (
    <KioskAuthContext.Provider value={{ ...state, setDeviceToken, clearDeviceToken }}>
      {children}
    </KioskAuthContext.Provider>
  );
}

// ===== Hook =====

export function useKioskAuth() {
  const ctx = useContext(KioskAuthContext);
  if (!ctx) {
    throw new Error("useKioskAuth must be used within KioskAuthProvider");
  }
  return ctx;
}

// ===== Kiosk-aware API fetch helpers =====

/** Get stored device token (outside React context, e.g. for fetch helpers) */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

function getStoredServicePointId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_SP_ID);
}

/** Kiosk-aware fetch — injects Authorization header with device token */
export async function kioskApiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const spId = getStoredServicePointId();

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (spId) {
    headers["X-Kiosk-Id"] = spId;
  }

  const res = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers,
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "API error");
  }
  return json.data as T;
}

/** Kiosk-aware POST */
export function kioskApiPost<T>(url: string, body: unknown): Promise<T> {
  return kioskApiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
