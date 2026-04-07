"use client";

// ════════════════════════════════════════════════════
// LIFF Provider — React Context สำหรับ LINE LIFF SDK
// ใช้ wrap LIFF pages เพื่อให้ทุก component เข้าถึง LIFF profile & methods
// ════════════════════════════════════════════════════

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import liff from "@line/liff";

// ===== Types =====

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffContextValue {
  /** LIFF SDK initialized สำเร็จแล้ว */
  isReady: boolean;
  /** ผู้ใช้ login แล้ว */
  isLoggedIn: boolean;
  /** เปิดใน LINE app (ไม่ใช่ external browser) */
  isInClient: boolean;
  /** LINE profile ของผู้ใช้ */
  profile: LiffProfile | null;
  /** LINE access token สำหรับ verify server-side */
  accessToken: string | null;
  /** Error message ถ้า init ล้มเหลว */
  error: string | null;
  /** กำลัง loading */
  loading: boolean;
  /** ปิด LIFF window (กลับไป LINE chat) */
  closeWindow: () => void;
  /** Login (redirect ไป LINE login) */
  login: () => void;
  /** Raw LIFF object */
  liff: typeof liff;
}

export const LiffContext = createContext<LiffContextValue | null>(null);

// ===== Provider =====

interface LiffProviderProps {
  children: ReactNode;
  /** Override LIFF ID (ถ้าไม่ระบุจะใช้ env NEXT_PUBLIC_LIFF_ID) */
  liffId?: string;
}

export function LiffProvider({ children, liffId }: LiffProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = liffId ?? process.env.NEXT_PUBLIC_LIFF_ID;
    if (!id) {
      setError("LIFF ID ไม่ได้ตั้งค่า (NEXT_PUBLIC_LIFF_ID)");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function initLiff() {
      try {
        await liff.init({ liffId: id! });

        if (cancelled) return;

        setIsReady(true);
        setIsInClient(liff.isInClient());

        if (!liff.isLoggedIn()) {
          // ถ้าเปิดใน LINE แต่ยังไม่ login → auto login
          if (liff.isInClient()) {
            liff.login();
            return;
          }
          // ถ้าเปิดนอก LINE → ไม่ force login, ให้ page จัดการเอง
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        setIsLoggedIn(true);

        // ดึง access token
        const token = liff.getAccessToken();
        setAccessToken(token);

        // ดึง profile
        try {
          const p = await liff.getProfile();
          if (!cancelled) {
            setProfile({
              userId: p.userId,
              displayName: p.displayName,
              pictureUrl: p.pictureUrl,
              statusMessage: p.statusMessage,
            });
          }
        } catch {
          // profile อาจดึงไม่ได้ในบาง case (permission)
          console.warn("Failed to get LIFF profile");
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "LIFF init failed";
          setError(message);
          console.error("LIFF init error:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initLiff();
    return () => {
      cancelled = true;
    };
  }, [liffId]);

  const closeWindow = useCallback(() => {
    if (liff.isInClient()) {
      liff.closeWindow();
    } else {
      window.close();
    }
  }, []);

  const login = useCallback(() => {
    if (isReady && !isLoggedIn) {
      liff.login();
    }
  }, [isReady, isLoggedIn]);

  return (
    <LiffContext.Provider
      value={{
        isReady,
        isLoggedIn,
        isInClient,
        profile,
        accessToken,
        error,
        loading,
        closeWindow,
        login,
        liff,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}
