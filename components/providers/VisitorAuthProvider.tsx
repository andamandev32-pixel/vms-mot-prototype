"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { VisitorUser } from "@/lib/visitor-auth";

interface VisitorAuthContextType {
  visitor: VisitorUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const VisitorAuthContext = createContext<VisitorAuthContextType | null>(null);

export function useVisitorAuth() {
  const ctx = useContext(VisitorAuthContext);
  if (!ctx) throw new Error("useVisitorAuth must be used within VisitorAuthProvider");
  return ctx;
}

export function VisitorAuthProvider({ children }: { children: ReactNode }) {
  const [visitor, setVisitor] = useState<VisitorUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/visitor/me");
      const json = await res.json();
      if (json.success) {
        setVisitor(json.data.visitor);
      } else {
        setVisitor(null);
      }
    } catch {
      setVisitor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = async () => {
    await fetch("/api/auth/visitor/logout", { method: "POST" });
    setVisitor(null);
    router.push("/visitor");
  };

  return (
    <VisitorAuthContext.Provider value={{ visitor, loading, logout, refresh }}>
      {children}
    </VisitorAuthContext.Provider>
  );
}
