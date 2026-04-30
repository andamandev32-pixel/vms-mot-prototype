"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, ChevronLeft, ChevronRight, Play, RotateCcw, Users, Briefcase,
  Smartphone, UserCircle, Check, X, Search, Loader2,
  User, ChevronDown, ChevronUp, Code2, LogIn, LogOut, Eye, EyeOff,
  AlertTriangle, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useLiff } from "@/lib/liff/use-liff";
import LineStatePanel from "@/components/mobile/LineStatePanel";
import { getMessagesForState } from "@/components/mobile/LineChatMessages";
import NewFriendRichMenu from "@/components/mobile/NewFriendRichMenu";
import { Input } from "@/components/ui/Input";
import { ApiResponsePanel } from "@/components/mobile/ApiResponsePanel";
import {
  useVisitorMe,
  useStaffMe,
  useVisitorLogin,
  useStaffLogin,
  useVisitorRegister,
  useCheckStaff,
  useVisitPurposesForLine,
  useDepartmentsForLine,
  useStaffSearch,
  useCreateBooking,
  useMyAppointments,
  useManualApiHealthCheck,
  type ApiCallLog,
} from "@/lib/hooks/use-line-oa";
import { useApproveAppointment, useRejectAppointment } from "@/lib/hooks/use-appointments";
import { getDepartmentLocation } from "@/lib/mock-data";
import {
  type LineFlowStateId,
  flowScenarios,
  getFlowState,
} from "@/lib/line-oa-flow-data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMenuForState(stateId: LineFlowStateId): "new-friend" | "visitor" | "officer" | "none" {
  if (stateId === "new-friend" || stateId === "visitor-register" || stateId === "officer-register") return "new-friend";
  if (stateId.startsWith("visitor-")) return "visitor";
  if (stateId.startsWith("officer-")) return "officer";
  return "none";
}

function shouldShowLiff(stateId: LineFlowStateId): boolean {
  return ["visitor-register", "officer-register", "visitor-booking", "officer-approve-action"].includes(stateId);
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function LineOaFlowPage() {
  const [scenarioId, setScenarioId] = useState("visitor-full");
  const [stateIndex, setStateIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [richMenuOpen, setRichMenuOpen] = useState(true);
  const [liffScreen, setLiffScreen] = useState<"none" | "profile" | "booking" | "history" | "requests" | "bulletin">("none");
  const [devMode, setDevMode] = useState(false);
  const [lastApiLog, setLastApiLog] = useState<ApiCallLog | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Auth state detection
  const { data: visitorUser, refetch: refetchVisitor } = useVisitorMe();
  const { data: staffUser, refetch: refetchStaff } = useStaffMe();

  const scenario = flowScenarios.find((s) => s.id === scenarioId)!;
  const currentStateId = scenario.stateSequence[stateIndex];
  const currentState = getFlowState(currentStateId);
  const menuType = getMenuForState(currentStateId);
  const totalSteps = scenario.stateSequence.length;
  const showLiff = shouldShowLiff(currentStateId);

  // LIFF (LINE Login) — auto-exchange access token เป็น session cookie
  const queryClient = useQueryClient();
  const liff = useLiff();
  const [liffAuthState, setLiffAuthState] = useState<"idle" | "authing" | "ok" | "error" | "skipped" | "simulated">("idle");
  const [liffAuthError, setLiffAuthError] = useState<string | null>(null);

  useEffect(() => {
    // ถ้ามี session อยู่แล้ว → mark ok
    if (visitorUser || staffUser) {
      setLiffAuthState((s) => (s === "simulated" ? "simulated" : "ok"));
      return;
    }
    // เปิดนอก LINE หรือไม่มี LIFF ID → ข้าม (fallback ไป Login button)
    if (liff.loading) return;
    if (!liff.accessToken) {
      setLiffAuthState("skipped");
      return;
    }
    if (liffAuthState !== "idle") return;

    setLiffAuthState("authing");
    fetch("/api/liff/auth", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineAccessToken: liff.accessToken }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setLiffAuthState("ok");
          setLiffAuthError(null);
          // invalidate ทุก query เพื่อให้ refetch ด้วย session cookie ใหม่
          queryClient.invalidateQueries();
          refetchVisitor();
          refetchStaff();
        } else {
          setLiffAuthState("error");
          setLiffAuthError(json.error?.message || "LIFF auth failed");
        }
      })
      .catch((err) => {
        setLiffAuthState("error");
        setLiffAuthError(err instanceof Error ? err.message : "Network error");
      });
  }, [liff.loading, liff.accessToken, visitorUser, staffUser, liffAuthState, queryClient, refetchVisitor, refetchStaff]);

  // Auto Demo Login: จำลอง LIFF auth เมื่อผ่านขั้นลงทะเบียนแล้ว (order >= 3)
  // — ในความจริง user ผ่าน LINE Login มาแล้วตั้งแต่ register ไม่ต้อง login ซ้ำ
  // — แต่ใน demo บน browser ไม่มี LIFF runtime → simulate ด้วย seed credentials
  const [simulating, setSimulating] = useState(false);
  useEffect(() => {
    if (simulating) return;
    if (visitorUser || staffUser) return;
    if (!currentState) return;
    if (currentState.order < 3) return; // ยังไม่ถึงขั้นลงทะเบียนสำเร็จ
    if (liff.loading) return;
    if (liff.accessToken) return; // มี LIFF runtime จริง — ใช้ /api/liff/auth แทน
    if (liffAuthState === "authing") return;

    setSimulating(true);
    const isVisitorFlow = currentState.userType === "visitor";
    // ใช้ unified login endpoint — รองรับทั้ง visitor และ staff role ผ่าน usernameOrEmail
    const usernameOrEmail = isVisitorFlow ? "wichai@siamtech.co.th" : "somsri.r";

    fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password: "pass1234" }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setLiffAuthState("simulated");
          setLiffAuthError(null);
          queryClient.invalidateQueries();
          refetchVisitor();
          refetchStaff();
        } else {
          setLiffAuthError(json.error?.message || "Demo auto-login failed");
        }
      })
      .catch((err) => {
        setLiffAuthError(err instanceof Error ? err.message : "Network error");
      })
      .finally(() => setSimulating(false));
  }, [currentState, visitorUser, staffUser, liff.loading, liff.accessToken, liffAuthState, simulating, queryClient, refetchVisitor, refetchStaff]);

  // API Health
  const apiHealth = useManualApiHealthCheck();

  useEffect(() => { setLiffScreen("none"); }, [stateIndex, scenarioId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [stateIndex, scenarioId]);

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setStateIndex((prev) => {
          if (prev >= totalSteps - 1) { setIsAutoPlaying(false); return prev; }
          return prev + 1;
        });
      }, 3000);
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isAutoPlaying, totalSteps]);

  const goNext = useCallback(() => {
    if (stateIndex < totalSteps - 1) setStateIndex((i) => i + 1);
  }, [stateIndex, totalSteps]);

  const goPrev = useCallback(() => {
    if (stateIndex > 0) setStateIndex((i) => i - 1);
  }, [stateIndex]);

  const reset = () => { setStateIndex(0); setIsAutoPlaying(false); };

  const handleCaseChange = (id: string) => {
    setScenarioId(id); setStateIndex(0); setIsAutoPlaying(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const richMenuH = richMenuOpen ? 120 : 32;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== Left sidebar ===== */}
      <div className="w-[220px] flex flex-col bg-white border-r border-gray-200 shrink-0">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#06C755] flex items-center justify-center text-white text-xs font-bold">
            <Smartphone size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#06C755]">LINE OA Demo</h1>
            <p className="text-[10px] text-gray-400">LIFF + Real API</p>
          </div>
        </div>

        {/* Scenario Picker */}
        <div className="px-3 py-2.5 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            {flowScenarios.map((s) => (
              <button key={s.id} onClick={() => handleCaseChange(s.id)}
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors text-left",
                  scenarioId === s.id ? "bg-[#06C755] text-white" : "text-gray-500 hover:bg-gray-50")}>
                {s.userType === "visitor" ? <Users size={11} /> : <Briefcase size={11} />}
                <span className="truncate">{s.userType === "visitor" ? "Visitor Full (11 ขั้นตอน)" : "Officer Full (7 ขั้นตอน)"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-1.5 px-3 py-2 border-b border-gray-100">
          {[
            { icon: <Play size={13} />, action: () => setIsAutoPlaying(!isAutoPlaying), active: isAutoPlaying, title: "Auto-play" },
            { icon: <RotateCcw size={13} />, action: reset, title: "Reset" },
            { icon: <ChevronLeft size={13} />, action: goPrev, disabled: stateIndex === 0, title: "Prev" },
            { icon: <ChevronRight size={13} />, action: goNext, disabled: stateIndex >= totalSteps - 1, title: "Next" },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} disabled={btn.disabled}
              className={cn("w-7 h-7 rounded-md border flex items-center justify-center transition-all disabled:opacity-30",
                btn.active ? "border-green-400 bg-green-50 text-green-600" : "border-gray-200 text-gray-400 hover:bg-gray-50")}
              title={btn.title}>{btn.icon}</button>
          ))}
        </div>

        {/* Auth Section */}
        <AuthPanel
          visitorUser={visitorUser}
          staffUser={staffUser}
          liffStatus={{
            isReady: liff.isReady,
            isLoggedIn: liff.isLoggedIn,
            isInClient: liff.isInClient,
            displayName: liff.profile?.displayName ?? null,
            initError: liff.error,
            authState: liffAuthState,
            authError: liffAuthError,
          }}
          onRefresh={() => { refetchVisitor(); refetchStaff(); }}
        />

        {/* Dev Mode Toggle */}
        <div className="px-3 py-2 border-b border-gray-100">
          <button
            onClick={() => setDevMode(!devMode)}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-colors",
              devMode ? "bg-purple-100 text-purple-700 border border-purple-200" : "text-gray-400 hover:bg-gray-50 border border-transparent"
            )}
          >
            <Code2 size={11} />
            <span>Dev Mode</span>
            {devMode ? <Eye size={10} className="ml-auto" /> : <EyeOff size={10} className="ml-auto" />}
          </button>
        </div>

        {/* Step List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1">ขั้นตอน / Steps</p>
          <div className="flex flex-col gap-1">
            {scenario.stateSequence.map((sid, index) => {
              const s = getFlowState(sid);
              const isCurrent = index === stateIndex;
              const isPast = index < stateIndex;
              return (
                <button key={sid} onClick={() => setStateIndex(index)}
                  className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-left",
                    isCurrent ? "bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/30"
                    : isPast ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-gray-50 text-gray-400 border border-transparent")}>
                  <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    isCurrent ? "bg-[#06C755] text-white" : isPast ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500")}>
                    {isPast ? "✓" : index + 1}
                  </span>
                  <span className="leading-tight truncate">{s?.name?.replace(/ \(.*\)/, "") || sid}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#06C755]/10 flex items-center justify-center"><Shield size={13} className="text-[#06C755]" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#06C755] truncate">eVMES MOT</p>
            <p className="text-[8px] text-gray-400">LINE Official Account</p>
          </div>
        </div>
      </div>

      {/* ===== Center: LINE Phone Frame ===== */}
      <div className="flex-1 flex items-center justify-center bg-[#F4F6FA] overflow-auto">
        <div className="w-[380px] h-[700px] relative flex flex-col">
          <div className="w-full h-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border-[3px] border-gray-900 flex flex-col relative">

            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[24px] bg-gray-900 rounded-b-2xl z-[60] flex items-center justify-center">
              <div className="w-[40px] h-[4px] bg-gray-700 rounded-full" />
            </div>

            {/* Status bar */}
            <div className="bg-[#506D7B] px-4 pt-7 pb-0 flex items-center justify-between text-white/60 text-[9px]">
              <span>9:41</span>
              <div className="flex items-center gap-1"><span>●●●</span><span>WiFi</span><span>100%</span></div>
            </div>

            {/* LINE Chat Header */}
            <div className="bg-[#506D7B] text-white flex items-center gap-2.5 px-3 py-2 shadow-md z-30 flex-shrink-0">
              <button className="text-white/80">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shadow"><Shield size={11} className="text-white" /></div>
              <div className="flex-1"><h1 className="text-xs font-bold">eVMES MOT</h1></div>
              <div className="flex items-center gap-2 text-white/60">
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M12 12L15.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M3 5H15M3 9H15M3 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 bg-[#7494A5]"
              style={{ paddingBottom: menuType !== "none" ? `${richMenuH + 10}px` : "40px" }}>
              <div className="flex justify-center mb-3">
                <span className="text-[9px] text-white/60 bg-black/15 rounded-full px-2.5 py-0.5">
                  {currentState?.order && currentState.order <= 11 ? "วันนี้" : "2 เม.ย. 2569"}
                </span>
              </div>
              {getMessagesForState(currentStateId, goNext)}
              <div ref={chatEndRef} />
            </div>

            {/* Rich Menus */}
            {menuType === "new-friend" && (
              <div className="absolute bottom-0 left-0 right-0 z-40">
                <NewFriendRichMenu onRegister={goNext} />
              </div>
            )}
            {menuType === "visitor" && (
              <div className="absolute bottom-0 left-0 right-0 z-40">
                <VisitorRichMenu isOpen={richMenuOpen} onToggle={() => setRichMenuOpen(!richMenuOpen)} onMenuAction={(action) => setLiffScreen(action as typeof liffScreen)} />
              </div>
            )}
            {menuType === "officer" && (
              <div className="absolute bottom-0 left-0 right-0 z-40">
                <OfficerRichMenu isOpen={richMenuOpen} onToggle={() => setRichMenuOpen(!richMenuOpen)} onMenuAction={(action) => setLiffScreen(action as typeof liffScreen)} />
              </div>
            )}

            {/* LIFF Overlay (form states) */}
            {showLiff && (
              <div className="absolute inset-0 z-50 flex flex-col" style={{ top: "70px" }}>
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative mt-auto bg-white rounded-t-[1rem] max-h-[80%] overflow-y-auto shadow-2xl">
                  <LiffOverlay stateId={currentStateId} onSubmit={goNext} devMode={devMode} onApiLog={setLastApiLog} />
                </div>
              </div>
            )}

            {/* LIFF Screen (from Rich Menu action) */}
            {liffScreen !== "none" && (
              <div className="absolute inset-0 z-50 flex flex-col" style={{ top: "70px" }}>
                <div className="absolute inset-0 bg-black/30" onClick={() => setLiffScreen("none")} />
                <div className="relative mt-auto bg-white rounded-t-[1rem] max-h-[80%] overflow-y-auto shadow-2xl">
                  <LiffMenuScreen screen={liffScreen} onClose={() => setLiffScreen("none")} devMode={devMode} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Right: State Panel ===== */}
      <div className="w-[340px] border-l border-gray-800 shrink-0">
        <LineStatePanel
          currentStateId={currentStateId}
          currentStepIndex={stateIndex}
          totalSteps={totalSteps}
          apiHealthResults={apiHealth.results}
          apiHealthTesting={apiHealth.testing}
          onTestApis={() => apiHealth.testEndpoints(currentStateId)}
        />
      </div>
    </div>
  );
}

// ===== Auth Panel =====

function AuthPanel({
  visitorUser,
  staffUser,
  liffStatus,
  onRefresh,
}: {
  visitorUser: unknown;
  staffUser: unknown;
  liffStatus: {
    isReady: boolean;
    isLoggedIn: boolean;
    isInClient: boolean;
    displayName: string | null;
    initError: string | null;
    authState: "idle" | "authing" | "ok" | "error" | "skipped" | "simulated";
    authError: string | null;
  };
  onRefresh: () => void;
}) {
  const [showLogin, setShowLogin] = useState(false);
  const [loginTab, setLoginTab] = useState<"visitor" | "staff">("visitor");
  const [loginForm, setLoginForm] = useState({ username: "", email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const visitorLogin = useVisitorLogin();
  const staffLogin = useStaffLogin();

  const vUser = visitorUser as { id: number; firstName?: string; lastName?: string; email?: string } | null;
  const sUser = staffUser as { id: number; name?: string; role?: string; departmentName?: string } | null;

  const handleLogin = async () => {
    setLoginError("");
    try {
      if (loginTab === "visitor") {
        await visitorLogin.mutateAsync({ email: loginForm.email, password: loginForm.password });
      } else {
        await staffLogin.mutateAsync({ username: loginForm.username, password: loginForm.password });
      }
      setShowLogin(false);
      setLoginForm({ username: "", email: "", password: "" });
      onRefresh();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      await fetch("/api/auth/visitor/logout", { method: "POST", credentials: "same-origin" });
    } catch { /* ignore */ }
    onRefresh();
  };

  const [demoLoading, setDemoLoading] = useState<"visitor" | "staff" | null>(null);
  const handleDemoLogin = async (kind: "visitor" | "staff") => {
    setLoginError("");
    setDemoLoading(kind);
    try {
      // ใช้ unified login endpoint รองรับทั้ง visitor และ staff role
      const usernameOrEmail = kind === "visitor" ? "wichai@siamtech.co.th" : "somsri.r";
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password: "pass1234" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Demo login failed");
      onRefresh();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="px-3 py-2 border-b border-gray-100">
      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Session</p>
      <div className="space-y-1">
        {/* LIFF status — LINE Login */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <div className={cn("w-2 h-2 rounded-full shrink-0",
            liffStatus.authState === "ok" ? "bg-[#06C755]" :
            liffStatus.authState === "simulated" ? "bg-purple-500" :
            liffStatus.authState === "authing" ? "bg-yellow-400 animate-pulse" :
            liffStatus.authState === "error" ? "bg-red-500" :
            "bg-gray-300")} />
          <span className="text-gray-500">LIFF:</span>
          <span className={cn("font-medium truncate",
            liffStatus.authState === "ok" ? "text-[#06C755]" :
            liffStatus.authState === "simulated" ? "text-purple-600" :
            liffStatus.authState === "error" ? "text-red-600" :
            "text-gray-400")} title={liffStatus.authError || liffStatus.initError || undefined}>
            {liffStatus.authState === "authing" ? "Authenticating..." :
             liffStatus.authState === "ok" ? (liffStatus.displayName ? `✓ ${liffStatus.displayName}` : "✓ Authenticated") :
             liffStatus.authState === "simulated" ? "✓ Simulated (demo)" :
             liffStatus.authState === "error" ? `✗ ${liffStatus.authError || "Auth failed"}` :
             liffStatus.initError ? "Not configured" :
             !liffStatus.isLoggedIn ? "Not in LINE" :
             "—"}
          </span>
        </div>
        {/* Visitor session */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <div className={cn("w-2 h-2 rounded-full shrink-0", vUser ? "bg-green-500" : "bg-gray-300")} />
          <span className="text-gray-500">Visitor:</span>
          <span className={cn("font-medium truncate", vUser ? "text-green-700" : "text-gray-400")}>
            {vUser ? `${vUser.firstName || ""} ${vUser.lastName || ""}`.trim() || vUser.email || `#${vUser.id}` : "No session"}
          </span>
        </div>
        {/* Staff session */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <div className={cn("w-2 h-2 rounded-full shrink-0", sUser ? "bg-blue-500" : "bg-gray-300")} />
          <span className="text-gray-500">Staff:</span>
          <span className={cn("font-medium truncate", sUser ? "text-blue-700" : "text-gray-400")}>
            {sUser ? `${sUser.name || ""} (${sUser.role})` : "No session"}
          </span>
        </div>
      </div>

      {/* Quick Demo Login — กดปุ่มเดียว login ด้วย seed user (สำหรับ demo บน browser) */}
      {!vUser && !sUser && (
        <div className="flex gap-1 mt-1.5">
          <button
            onClick={() => handleDemoLogin("visitor")}
            disabled={demoLoading !== null}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-bold bg-[#06C755] hover:bg-[#05B048] text-white transition-colors disabled:opacity-50">
            {demoLoading === "visitor" ? <Loader2 size={9} className="animate-spin" /> : <Users size={9} />}
            Demo Visitor
          </button>
          <button
            onClick={() => handleDemoLogin("staff")}
            disabled={demoLoading !== null}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-bold bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50">
            {demoLoading === "staff" ? <Loader2 size={9} className="animate-spin" /> : <Briefcase size={9} />}
            Demo Staff
          </button>
        </div>
      )}

      <div className="flex gap-1 mt-1.5">
        <button onClick={() => setShowLogin(!showLogin)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
          <LogIn size={9} /> Login
        </button>
        {(vUser || sUser) && (
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-medium bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
            <LogOut size={9} /> Logout
          </button>
        )}
        <button onClick={onRefresh}
          className="flex items-center justify-center px-1.5 py-1 rounded text-[9px] bg-gray-100 hover:bg-gray-200 text-gray-400 transition-colors">
          <RefreshCw size={9} />
        </button>
      </div>

      {/* Login Form */}
      {showLogin && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
          <div className="flex gap-1">
            {(["visitor", "staff"] as const).map((tab) => (
              <button key={tab} onClick={() => setLoginTab(tab)}
                className={cn("flex-1 py-1 rounded text-[9px] font-bold transition-colors",
                  loginTab === tab ? "bg-[#06C755] text-white" : "bg-gray-200 text-gray-500")}>
                {tab === "visitor" ? "Visitor" : "Staff"}
              </button>
            ))}
          </div>
          {loginTab === "visitor" ? (
            <input type="text" placeholder="Email" value={loginForm.email}
              onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-2 py-1 rounded border border-gray-200 text-[10px]" />
          ) : (
            <input type="text" placeholder="Username" value={loginForm.username}
              onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full px-2 py-1 rounded border border-gray-200 text-[10px]" />
          )}
          <input type="password" placeholder="Password" value={loginForm.password}
            onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full px-2 py-1 rounded border border-gray-200 text-[10px]" />
          {loginError && <p className="text-[9px] text-red-500">{loginError}</p>}
          <button onClick={handleLogin}
            disabled={visitorLogin.isPending || staffLogin.isPending}
            className="w-full py-1 rounded bg-[#06C755] text-white text-[10px] font-bold disabled:opacity-50">
            {visitorLogin.isPending || staffLogin.isPending ? "Logging in..." : "Login"}
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Rich Menu: Visitor =====

function VisitorRichMenu({ isOpen, onToggle, onMenuAction }: { isOpen: boolean; onToggle: () => void; onMenuAction: (action: string) => void }) {
  return (
    <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-200 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-primary-600 to-primary-800 rounded-sm flex items-center justify-center"><span className="text-[6px] font-bold text-white">V</span></div>
          <span className="text-[9px] font-semibold text-primary-800">eVMES MOT</span>
          <span className="text-[8px] text-text-muted">Visitor Menu</span>
        </div>
        {isOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronUp size={12} className="text-gray-400" />}
      </button>
      {isOpen && (
        <div className="grid grid-cols-3 gap-[1px] bg-gray-200">
          {[
            { icon: "👤", label: "ข้อมูลส่วนตัว", sub: "Profile", action: "profile" },
            { icon: "📅", label: "บันทึกนัดหมาย", sub: "Booking", action: "booking" },
            { icon: "📋", label: "ประวัติ", sub: "History", action: "history" },
          ].map((item) => (
            <button key={item.label} onClick={() => onMenuAction(item.action)}
              className="bg-white flex flex-col items-center justify-center py-3 px-1 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <span className="text-xl mb-0.5">{item.icon}</span>
              <p className="text-[9px] font-bold text-text-primary text-center">{item.label}</p>
              <p className="text-[7px] text-text-muted">{item.sub}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Rich Menu: Officer =====

function OfficerRichMenu({ isOpen, onToggle, onMenuAction }: { isOpen: boolean; onToggle: () => void; onMenuAction: (action: string) => void }) {
  return (
    <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-200 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-primary-600 to-primary-800 rounded-sm flex items-center justify-center"><span className="text-[6px] font-bold text-white">O</span></div>
          <span className="text-[9px] font-semibold text-primary-800">eVMES MOT</span>
          <span className="text-[8px] text-text-muted">Officer Menu</span>
        </div>
        {isOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronUp size={12} className="text-gray-400" />}
      </button>
      {isOpen && (
        <div className="grid grid-cols-3 gap-[1px] bg-gray-200">
          {[
            { icon: "👤", label: "ข้อมูลส่วนตัว", sub: "Profile", action: "profile" },
            { icon: "📑", label: "คำขอนัดหมาย", sub: "Requests", action: "requests" },
            { icon: "📢", label: "ประกาศ", sub: "Bulletin", action: "bulletin" },
          ].map((item) => (
            <button key={item.label} onClick={() => onMenuAction(item.action)}
              className="bg-white flex flex-col items-center justify-center py-3 px-1 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <span className="text-xl mb-0.5">{item.icon}</span>
              <p className="text-[9px] font-bold text-text-primary text-center">{item.label}</p>
              <p className="text-[7px] text-text-muted">{item.sub}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== LIFF Menu Screens (Rich Menu action screens) =====

function LiffMenuScreen({ screen, onClose, devMode }: { screen: string; onClose: () => void; devMode: boolean }) {
  return (
    <>
      <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-2.5 border-b border-gray-100 rounded-t-[1rem]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center"><Shield size={12} className="text-white" /></div>
          <span className="text-xs font-bold text-text-primary">
            {screen === "profile" && "ข้อมูลส่วนบุคคล"}
            {screen === "booking" && "บันทึกนัดหมาย"}
            {screen === "history" && "ประวัติการเยือน"}
            {screen === "requests" && "คำขอนัดหมาย"}
            {screen === "bulletin" && "ประกาศ / Bulletin"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-green-100 rounded-full text-[8px] font-bold text-[#06C755]">LIFF</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100"><X size={14} className="text-gray-400" /></button>
        </div>
      </div>
      <div className="px-4 py-4">
        {screen === "profile" && <ProfileScreen devMode={devMode} />}
        {screen === "booking" && <BookingMenuScreen devMode={devMode} />}
        {screen === "history" && <HistoryScreen devMode={devMode} />}
        {screen === "requests" && <RequestsScreen devMode={devMode} />}
        {screen === "bulletin" && <BulletinScreen />}
      </div>
    </>
  );
}

// ===== Profile Screen — Real API =====

function ProfileScreen({ devMode }: { devMode: boolean }) {
  const { data: visitor, isLoading: vLoading, error: vError } = useVisitorMe();
  const { data: staff, isLoading: sLoading, error: sError } = useStaffMe();

  const vUser = visitor as { id: number; firstName?: string; lastName?: string; phone?: string; email?: string; company?: string; lineUserId?: string } | null;
  const sUser = staff as { id: number; name?: string; role?: string; departmentName?: string; email?: string } | null;

  const isLoading = vLoading || sLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-primary" /></div>;
  }

  if (!vUser && !sUser) {
    return (
      <div className="text-center py-6 space-y-2">
        <AlertTriangle size={24} className="text-yellow-500 mx-auto" />
        <p className="text-sm font-bold text-gray-700">ยังไม่ได้ Login</p>
        <p className="text-[10px] text-gray-500">กรุณา Login ที่ sidebar ซ้ายมือก่อน</p>
        {devMode && (
          <div className="mt-2 p-2 bg-gray-100 rounded-lg text-[9px] text-left">
            <p className="font-bold text-gray-600">API Endpoints:</p>
            <p className="text-gray-500 font-mono">GET /api/auth/visitor/me</p>
            <p className="text-gray-500 font-mono">GET /api/auth/me</p>
            <p className="text-red-500 mt-1">Status: No active session</p>
          </div>
        )}
      </div>
    );
  }

  if (vUser) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"><UserCircle size={28} className="text-primary" /></div>
          <div>
            <p className="text-sm font-bold">{vUser.firstName} {vUser.lastName}</p>
            <p className="text-[10px] text-text-muted">{vUser.company || "ไม่ระบุบริษัท"}</p>
            <p className={cn("text-[10px] font-medium", vUser.lineUserId ? "text-[#06C755]" : "text-gray-400")}>
              {vUser.lineUserId ? "✓ LINE Connected" : "✗ LINE Not Connected"}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-text-muted">เบอร์โทร</span><span className="font-medium">{vUser.phone || "-"}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">อีเมล</span><span className="font-medium">{vUser.email || "-"}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">สถานะ</span><span className="font-medium text-[#06C755]">Active</span></div>
        </div>
        {devMode && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-[9px]">
            <p className="font-bold text-green-700">API: GET /api/auth/visitor/me</p>
            <p className="text-green-600">Status: 200 OK</p>
          </div>
        )}
        <button className="w-full h-10 bg-primary text-white font-bold rounded-xl text-sm">แก้ไขข้อมูล</button>
      </div>
    );
  }

  if (sUser) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><Briefcase size={28} className="text-blue-600" /></div>
          <div>
            <p className="text-sm font-bold">{sUser.name}</p>
            <p className="text-[10px] text-text-muted">{sUser.departmentName || "-"}</p>
            <p className="text-[10px] text-blue-600 font-medium">Role: {sUser.role}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-text-muted">อีเมล</span><span className="font-medium">{sUser.email || "-"}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Role</span><span className="font-medium">{sUser.role}</span></div>
        </div>
        {devMode && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[9px]">
            <p className="font-bold text-blue-700">API: GET /api/auth/me</p>
            <p className="text-blue-600">Status: 200 OK</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ===== Booking Menu Screen — Real API =====

function BookingMenuScreen({ devMode }: { devMode: boolean }) {
  const { data, isLoading, error } = useMyAppointments({ status: "approved", limit: 5 });
  const appointments = (data as { items?: unknown[] })?.items ?? (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-primary">นัดหมายของคุณ</p>
      {isLoading && <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-primary" /></div>}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-600">
          <p className="font-bold">Error fetching appointments</p>
          <p>{error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      )}
      {!isLoading && !error && appointments.length === 0 && (
        <div className="text-center py-4 text-[10px] text-gray-500">ยังไม่มีนัดหมาย</div>
      )}
      {(appointments as Array<{ id: number; code?: string; date?: string; timeStart?: string; timeEnd?: string; status?: string; hostStaffName?: string; departmentName?: string }>).slice(0, 3).map((apt) => (
        <div key={apt.id} className="bg-green-50 border border-green-200 rounded-xl p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-[#06C755]">{apt.code || `#${apt.id}`}</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold">{apt.status}</span>
          </div>
          <p className="text-sm font-bold">{apt.date} | {apt.timeStart} - {apt.timeEnd}</p>
          <p className="text-[10px] text-text-muted">{apt.hostStaffName} • {apt.departmentName}</p>
        </div>
      ))}
      {devMode && (
        <div className="p-2 bg-gray-100 rounded-lg text-[9px]">
          <p className="font-bold text-gray-600">API: GET /api/appointments?status=approved&limit=5</p>
          <p className={error ? "text-red-500" : "text-green-600"}>
            {error ? `Error: ${error instanceof Error ? error.message : "Unknown"}` : `OK — ${appointments.length} items`}
          </p>
        </div>
      )}
      <button className="w-full h-10 bg-[#06C755] text-white font-bold rounded-xl text-sm">+ สร้างนัดหมายใหม่</button>
    </div>
  );
}

// ===== History Screen — Real API =====

function HistoryScreen({ devMode }: { devMode: boolean }) {
  const { data, isLoading, error } = useMyAppointments({ limit: 10 });
  const appointments = (data as { items?: unknown[] })?.items ?? (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-primary">ประวัติการเยือน</p>
      {isLoading && <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-primary" /></div>}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-600">
          <p>{error instanceof Error ? error.message : "Error loading history"}</p>
        </div>
      )}
      {!isLoading && !error && appointments.length === 0 && (
        <div className="text-center py-4 text-[10px] text-gray-500">ยังไม่มีประวัติ</div>
      )}
      {(appointments as Array<{ id: number; date?: string; departmentName?: string; status?: string }>).slice(0, 5).map((apt) => (
        <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs font-bold">{apt.departmentName || "-"}</p>
            <p className="text-[10px] text-text-muted">{apt.date}</p>
          </div>
          <span className={cn("text-[10px] font-bold",
            apt.status === "completed" || apt.status === "checked-out" ? "text-green-600"
            : apt.status === "cancelled" ? "text-red-500" : "text-gray-500"
          )}>{apt.status}</span>
        </div>
      ))}
      {devMode && (
        <div className="p-2 bg-gray-100 rounded-lg text-[9px]">
          <p className="font-bold text-gray-600">API: GET /api/appointments?limit=10</p>
          <p className={error ? "text-red-500" : "text-green-600"}>
            {error ? "Error" : `OK — ${appointments.length} items`}
          </p>
        </div>
      )}
    </div>
  );
}

// ===== Requests Screen — Real API =====

function RequestsScreen({ devMode }: { devMode: boolean }) {
  const { data, isLoading, error } = useMyAppointments({ status: "pending", limit: 10 });
  const appointments = (data as { items?: unknown[] })?.items ?? (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-primary">คำขอนัดหมาย</p>
      {isLoading && <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-primary" /></div>}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-600">
          <p>{error instanceof Error ? error.message : "Error loading requests"}</p>
        </div>
      )}
      {!isLoading && !error && appointments.length === 0 && (
        <div className="text-center py-4 text-[10px] text-gray-500">ไม่มีคำขอที่รอดำเนินการ</div>
      )}
      {(appointments as Array<{ id: number; visitorName?: string; company?: string; purposeName?: string; date?: string; status?: string }>).map((apt) => (
        <div key={apt.id} className="p-3 bg-gray-50 rounded-xl space-y-1">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold">{apt.visitorName || `#${apt.id}`}</p>
            <span className={cn("text-[9px] font-bold",
              apt.status === "pending" ? "text-amber-600" : apt.status === "approved" ? "text-green-600" : "text-red-500"
            )}>{apt.status}</span>
          </div>
          <p className="text-[10px] text-text-muted">{apt.company} • {apt.purposeName} • {apt.date}</p>
        </div>
      ))}
      {devMode && (
        <div className="p-2 bg-gray-100 rounded-lg text-[9px]">
          <p className="font-bold text-gray-600">API: GET /api/appointments?status=pending&limit=10</p>
          <p className={error ? "text-red-500" : "text-green-600"}>
            {error ? "Error" : `OK — ${appointments.length} items`}
          </p>
        </div>
      )}
    </div>
  );
}

// ===== Bulletin Screen — Mock (no API) =====

function BulletinScreen() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-primary">ประกาศ / Bulletin</p>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs font-bold text-amber-700">📢 แจ้งปิดปรับปรุง Kiosk K-02</p>
        <p className="text-[10px] text-amber-600 mt-1">วันที่ 5-6 เม.ย. 2569 กรุณาใช้ K-01 หรือ Counter แทน</p>
        <p className="text-[8px] text-amber-500 mt-1">29 มี.ค. 2569</p>
      </div>
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs font-bold text-blue-700">📋 อัปเดตนโยบาย PDPA</p>
        <p className="text-[10px] text-blue-600 mt-1">มีการปรับปรุงข้อความยินยอม PDPA ใหม่ มีผลตั้งแต่ 1 เม.ย. 2569</p>
        <p className="text-[8px] text-blue-500 mt-1">27 มี.ค. 2569</p>
      </div>
      <div className="p-2 bg-gray-100 rounded-lg text-[9px]">
        <p className="font-bold text-gray-500">API: Not yet implemented</p>
        <p className="text-gray-400">Bulletin board API is planned for future release</p>
      </div>
    </div>
  );
}

// ===== LIFF Overlay Router =====

function LiffOverlay({ stateId, onSubmit, devMode, onApiLog }: { stateId: LineFlowStateId; onSubmit: () => void; devMode: boolean; onApiLog: (log: ApiCallLog) => void }) {
  switch (stateId) {
    case "visitor-register": return <LiffVisitorRegister onSubmit={onSubmit} devMode={devMode} onApiLog={onApiLog} />;
    case "officer-register": return <LiffOfficerRegister onSubmit={onSubmit} devMode={devMode} onApiLog={onApiLog} />;
    case "visitor-booking": return <LiffBooking onSubmit={onSubmit} devMode={devMode} onApiLog={onApiLog} />;
    case "officer-approve-action": return <LiffApproveAction onSubmit={onSubmit} devMode={devMode} onApiLog={onApiLog} />;
    default: return null;
  }
}

function LiffHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-2.5 border-b border-gray-100 rounded-t-[1rem]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center"><Shield size={12} className="text-white" /></div>
        <div><span className="text-xs font-bold text-text-primary">{title}</span><p className="text-[9px] text-text-muted">{subtitle}</p></div>
      </div>
      <span className="px-1.5 py-0.5 bg-green-100 rounded-full text-[8px] font-bold text-[#06C755]">LIFF</span>
    </div>
  );
}

// ===== LIFF: Visitor Register — Real API =====

function LiffVisitorRegister({ onSubmit, devMode, onApiLog }: { onSubmit: () => void; devMode: boolean; onApiLog: (log: ApiCallLog) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", company: "", idNumber: "", username: "", password: "" });
  const [apiResult, setApiResult] = useState<{ success: boolean; message: string; log?: ApiCallLog } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setApiResult(null);
    setSubmitting(true);
    const start = performance.now();
    const requestBody = {
      userType: "visitor",
      username: form.username.trim() || undefined,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      company: form.company,
      idNumber: form.idNumber,
      idType: "thai-id",
      lineAccessToken: "LIFF_DEMO",
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const latencyMs = Math.round(performance.now() - start);
      const json = await res.json();
      const log: ApiCallLog = {
        id: `reg-${Date.now()}`, method: "POST", url: "/api/auth/register",
        requestBody, responseStatus: res.status,
        responseBody: json, latencyMs, timestamp: Date.now(),
      };
      onApiLog(log);
      if (json.success) {
        setApiResult({ success: true, message: "ลงทะเบียนสำเร็จ! สามารถใช้ username/password เข้า Web App ได้", log });
        setTimeout(() => onSubmit(), 1500);
      } else {
        setApiResult({ success: false, message: json.error?.message || "Registration failed", log });
      }
    } catch (err) {
      const log: ApiCallLog = {
        id: `reg-${Date.now()}`, method: "POST", url: "/api/auth/register",
        requestBody, error: err instanceof Error ? err.message : "Network error",
        latencyMs: Math.round(performance.now() - start), timestamp: Date.now(),
      };
      onApiLog(log);
      setApiResult({ success: false, message: err instanceof Error ? err.message : "Network error", log });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const canSubmit = form.firstName && form.lastName && form.phone && form.email && form.idNumber && form.password.length >= 8;

  return (
    <>
      <LiffHeader title="ลงทะเบียนผู้มาติดต่อ" subtitle="Visitor Registration" />
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-[#06C755] flex items-center justify-center"><UserCircle size={20} className="text-white" /></div>
          <div><p className="text-sm font-bold">ผู้มาติดต่อ / Visitor</p><p className="text-[10px] text-text-muted">บุคคลภายนอก</p></div>
          <Check size={18} className="text-[#06C755] ml-auto" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="ชื่อ" placeholder="ชื่อจริง" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
          <Input label="นามสกุล" placeholder="นามสกุล" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
        </div>
        <Input label="เลขบัตรประชาชน" placeholder="1-XXXX-XXXXX-XX-X" value={form.idNumber} onChange={(e) => updateField("idNumber", e.target.value)} />
        <Input label="เบอร์โทรศัพท์" placeholder="0XX-XXX-XXXX" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
        <Input label="อีเมล" placeholder="email@example.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
        <Input label="บริษัท" placeholder="ชื่อบริษัท/หน่วยงาน" value={form.company} onChange={(e) => updateField("company", e.target.value)} />

        <div className="pt-1 border-t border-gray-100">
          <p className="text-[10px] text-text-muted mb-2 font-medium">สำหรับเข้าสู่ระบบ Web App</p>
          <Input label="ชื่อผู้ใช้ (Username)" placeholder="visitor_username" value={form.username} onChange={(e) => updateField("username", e.target.value)} />
          <div className="mt-2">
            <Input label="รหัสผ่าน (Password)" placeholder="อย่างน้อย 8 ตัวอักษร" type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} />
            {form.password && form.password.length < 8 && (
              <p className="text-[9px] text-red-500 mt-0.5">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
            )}
          </div>
        </div>

        {apiResult && (
          <div className={cn("p-2.5 rounded-xl text-[10px] border", apiResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600")}>
            <div className="flex items-center gap-1.5">
              {apiResult.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              <span className="font-bold">{apiResult.message}</span>
            </div>
          </div>
        )}

        {devMode && apiResult?.log && <ApiResponsePanel log={apiResult.log} />}

        <button onClick={handleSubmit} disabled={submitting || !canSubmit}
          className="w-full h-11 bg-[#06C755] text-white font-bold rounded-xl text-sm active:scale-[0.98] disabled:opacity-50">
          {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "ลงทะเบียน"}
        </button>

        {devMode && (
          <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-[9px]">
            <p className="font-bold text-purple-700">POST /api/auth/register</p>
            <p className="text-purple-600 font-mono mt-0.5">Body: {`{ userType, username, password, firstName, lastName, phone, email, company, idNumber, idType }`}</p>
          </div>
        )}
      </div>
    </>
  );
}

// ===== LIFF: Officer Register — Real API =====

function LiffOfficerRegister({ onSubmit, devMode, onApiLog }: { onSubmit: () => void; devMode: boolean; onApiLog: (log: ApiCallLog) => void }) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ id: number; firstName: string; lastName: string; firstNameEn?: string; lastNameEn?: string; position: string; departmentId: number; departmentName: string; employeeId: string; email?: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [apiResult, setApiResult] = useState<{ success: boolean; message: string; log?: ApiCallLog } | null>(null);
  const checkStaff = useCheckStaff();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    setFound(null);
    const start = performance.now();
    try {
      const res = await fetch("/api/auth/check-staff", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const latencyMs = Math.round(performance.now() - start);
      const json = await res.json();
      const log: ApiCallLog = {
        id: `check-${Date.now()}`, method: "POST", url: "/api/auth/check-staff",
        requestBody: { query: query.trim() }, responseStatus: res.status,
        responseBody: json, latencyMs, timestamp: Date.now(),
      };
      onApiLog(log);
      if (json.success && json.data?.personnel) {
        const p = json.data.personnel;
        setFound(p);
        if (p.email) setEmail(p.email);
        if (p.employeeId) setUsername(p.employeeId.toLowerCase().replace(/[^a-z0-9]/g, ""));
      } else {
        setError(json.error?.message || "ไม่พบข้อมูลพนักงาน");
      }
      if (devMode) setApiResult({ success: json.success, message: json.success ? "Found" : json.error?.message || "Not found", log });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSearching(false);
    }
  };

  const handleRegister = async () => {
    if (!found) return;
    setSubmitting(true);
    const start = performance.now();
    const requestBody = {
      userType: "staff",
      username: username.trim() || undefined,
      password,
      firstName: found.firstName,
      lastName: found.lastName,
      phone,
      email: email.trim(),
      employeeId: found.employeeId,
      departmentId: found.departmentId,
      position: found.position,
      lineAccessToken: "LIFF_DEMO",
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const latencyMs = Math.round(performance.now() - start);
      const json = await res.json();
      const log: ApiCallLog = {
        id: `officer-reg-${Date.now()}`, method: "POST", url: "/api/auth/register",
        requestBody, responseStatus: res.status,
        responseBody: json, latencyMs, timestamp: Date.now(),
      };
      onApiLog(log);
      if (json.success) {
        setApiResult({ success: true, message: "ลงทะเบียนสำเร็จ! สามารถใช้ username/password เข้า Web App ได้", log });
        setTimeout(() => onSubmit(), 1500);
      } else {
        setApiResult({ success: false, message: json.error?.message || "Registration failed", log });
      }
    } catch (err) {
      setApiResult({ success: false, message: err instanceof Error ? err.message : "Error" });
    } finally {
      setSubmitting(false);
    }
  };

  const canRegister = found && phone && email && password.length >= 8;

  return (
    <>
      <LiffHeader title="ลงทะเบียนพนักงาน" subtitle="Officer Registration" />
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Briefcase size={20} className="text-white" /></div>
          <div><p className="text-sm font-bold">พนักงาน / Officer</p><p className="text-[10px] text-text-muted">เจ้าหน้าที่ กท.กก.</p></div>
          <Check size={18} className="text-primary ml-auto" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">รหัสพนักงาน / เลขบัตร</label>
          <div className="flex gap-2">
            <Input placeholder="EMP-007 / 1-XXXX-XXXXX-XX-X" value={query} onChange={(e) => { setQuery(e.target.value); setFound(null); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }} className="flex-1" />
            <button onClick={handleSearch} disabled={!query.trim() || searching}
              className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                query.trim() && !searching ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        {devMode && apiResult?.log && <ApiResponsePanel log={apiResult.log} compact />}

        {found && (
          <>
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2 mb-1"><Check size={14} className="text-[#06C755]" /><span className="text-xs font-bold text-[#06C755]">พบข้อมูล</span></div>
              <p className="text-xs"><span className="text-text-muted">ชื่อ:</span> {found.firstName} {found.lastName}</p>
              <p className="text-xs"><span className="text-text-muted">ตำแหน่ง:</span> {found.position}</p>
              <p className="text-xs"><span className="text-text-muted">สังกัด:</span> {found.departmentName}</p>
            </div>

            <Input label="เบอร์โทร" placeholder="0XX-XXX-XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="อีเมล" placeholder="email@mots.go.th" value={email} onChange={(e) => setEmail(e.target.value)} />

            <div className="pt-1 border-t border-gray-100">
              <p className="text-[10px] text-text-muted mb-2 font-medium">สำหรับเข้าสู่ระบบ Web App</p>
              <Input label="ชื่อผู้ใช้ (Username)" placeholder="officer_username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <div className="mt-2">
                <Input label="รหัสผ่าน (Password)" placeholder="อย่างน้อย 8 ตัวอักษร" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                {password && password.length < 8 && (
                  <p className="text-[9px] text-red-500 mt-0.5">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
                )}
              </div>
            </div>

            {apiResult && (
              <div className={cn("p-2.5 rounded-xl text-[10px] border", apiResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600")}>
                <div className="flex items-center gap-1.5">
                  {apiResult.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span className="font-bold">{apiResult.message}</span>
                </div>
              </div>
            )}

            <button onClick={handleRegister} disabled={submitting || !canRegister}
              className="w-full h-11 bg-[#06C755] text-white font-bold rounded-xl text-sm active:scale-[0.98] disabled:opacity-50">
              {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "ลงทะเบียน"}
            </button>
          </>
        )}

        {devMode && (
          <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-[9px]">
            <p className="font-bold text-purple-700">Step 1: POST /api/auth/check-staff</p>
            <p className="font-bold text-purple-700">Step 2: POST /api/auth/register</p>
            <p className="text-purple-600 font-mono mt-0.5">Body: {`{ userType: "staff", username, password, employeeId, departmentId, position, ... }`}</p>
          </div>
        )}
      </div>
    </>
  );
}

// ===== LIFF: Booking — Real API =====

function LiffBooking({ onSubmit, devMode, onApiLog }: { onSubmit: () => void; devMode: boolean; onApiLog: (log: ApiCallLog) => void }) {
  const liff = useLiff();
  const { data: visitorUser } = useVisitorMe();
  const { data: staffUser } = useStaffMe();
  const hasSession = Boolean(visitorUser || staffUser);
  // ถ้าเปิดใน LINE และยังไม่มี session → กำลังรอ LIFF auth จาก root component
  const liffAuthing = !hasSession && liff.isReady && liff.isLoggedIn && Boolean(liff.accessToken);
  // ถ้าเปิดนอก LINE และยังไม่มี session → root effect กำลัง simulate LIFF auto-login
  // (ดู Auto Demo Login useEffect ใน LineOaFlowPage) — แสดง spinner รอจนกว่า session จะมา
  const simulatingLiff = !hasSession && !liffAuthing && !liff.accessToken;

  // ===== Types ของ rule และ purpose จาก /api/visit-purposes =====
  type DepartmentRule = {
    id: number;
    departmentId: number;
    requirePersonName: boolean;
    requireApproval: boolean;
    acceptFromLine?: boolean;
    isActive?: boolean;
    department?: { id: number; name: string; nameEn?: string };
  };
  type PurposeWithRules = {
    id: number;
    name: string;
    nameEn?: string;
    icon?: string;
    isActive?: boolean;
    showOnLine?: boolean;
    departmentRules?: DepartmentRule[];
  };

  const [step, setStep] = useState(1);
  const [selectedPurpose, setSelectedPurpose] = useState<PurposeWithRules | null>(null);
  const [selectedDept, setSelectedDept] = useState<{ id: number; name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedHost, setSelectedHost] = useState<{ id: number; name: string; department?: { name: string; id: number } } | null>(null);
  const [hostSearch, setHostSearch] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [timeStart, setTimeStart] = useState("10:00");
  const [timeEnd, setTimeEnd] = useState("11:00");
  const [purposeText, setPurposeText] = useState("");
  const [bookingResult, setBookingResult] = useState<{ success: boolean; message: string; code?: string; log?: ApiCallLog } | null>(null);

  // Real API queries
  const { data: purposesData, isLoading: purposesLoading, error: purposesError } = useVisitPurposesForLine();
  const { data: staffData } = useStaffSearch(hostSearch);

  // API response shape: apiFetch คืน json.data → ต้อง unwrap key ตาม endpoint
  // /api/visit-purposes → { visitPurposes: [...] }
  // /api/staff → { staff: [...] }
  const purposes = (Array.isArray(purposesData) ? purposesData :
    ((purposesData as { visitPurposes?: unknown[]; items?: unknown[] })?.visitPurposes
      ?? (purposesData as { items?: unknown[] })?.items
      ?? [])) as PurposeWithRules[];
  const staffResults = Array.isArray(staffData) ? staffData :
    ((staffData as { staff?: unknown[]; items?: unknown[] })?.staff
      ?? (staffData as { items?: unknown[] })?.items
      ?? []);

  // Filter purposes ที่ active + showOnLine + มีกฎ acceptFromLine ที่ active อย่างน้อย 1 dept
  const visiblePurposes = purposes.filter((p) => {
    if (p.isActive === false) return false;
    if (p.showOnLine === false) return false;
    const lineRules = (p.departmentRules ?? []).filter((r) => r.isActive !== false && r.acceptFromLine !== false);
    return lineRules.length > 0;
  });

  // Department options ของ purpose ที่เลือก (filter จาก rules ที่ acceptFromLine + active)
  const availableDeptRules: DepartmentRule[] = (selectedPurpose?.departmentRules ?? [])
    .filter((r) => r.isActive !== false && r.acceptFromLine !== false && r.department);

  // Rule ปัจจุบัน (purpose+department ที่เลือก) — ใช้ตัดสิน requirePersonName / requireApproval
  const currentRule: DepartmentRule | null = selectedDept
    ? (availableDeptRules.find((r) => r.departmentId === selectedDept.id) ?? null)
    : null;

  const requirePersonName = currentRule?.requirePersonName === true;
  const requireApproval = currentRule?.requireApproval === true;

  const handleBook = async () => {
    if (!selectedPurpose || !selectedDept || !selectedDate) return;
    if (requirePersonName && !selectedHost) return;
    const dateStr = `2569-04-${String(selectedDate).padStart(2, "0")}`;
    const body = {
      visitPurposeId: selectedPurpose.id,
      departmentId: selectedDept.id,
      date: dateStr,
      timeStart,
      timeEnd,
      hostStaffId: requirePersonName ? selectedHost?.id : null,
      purpose: purposeText,
      channel: "line",
    };

    const start = performance.now();
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const latencyMs = Math.round(performance.now() - start);
      const json = await res.json();
      const log: ApiCallLog = {
        id: `book-${Date.now()}`, method: "POST", url: "/api/appointments",
        requestBody: body, responseStatus: res.status,
        responseBody: json, latencyMs, timestamp: Date.now(),
      };
      onApiLog(log);
      if (json.success) {
        setBookingResult({ success: true, message: "จองสำเร็จ!", code: json.data?.code, log });
        setTimeout(() => onSubmit(), 1500);
      } else {
        setBookingResult({ success: false, message: json.error?.message || "Booking failed", log });
      }
    } catch (err) {
      setBookingResult({ success: false, message: err instanceof Error ? err.message : "Error" });
    }
  };

  if (liffAuthing || simulatingLiff) {
    const isSimulated = simulatingLiff;
    return (
      <>
        <LiffHeader
          title="บันทึกนัดหมาย"
          subtitle={isSimulated ? "จำลอง LINE Login (Demo)" : "กำลังยืนยันตัวตนผ่าน LINE"}
        />
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <Loader2 size={28} className="animate-spin text-[#06C755] mb-3" />
          <p className="text-xs font-bold text-gray-700">
            {isSimulated ? "กำลังจำลอง LIFF Auto-Login" : "กำลัง Login ผ่าน LINE"}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {isSimulated
              ? "Demo บน browser — ระบบกำลัง login ด้วย seed user ที่ลงทะเบียนไว้"
              : "ระบบกำลังแลก LINE access token เป็น session"}
          </p>
          {devMode && (
            <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg text-[9px] text-left w-full">
              <p className="font-bold text-purple-700">
                {isSimulated ? "POST /api/auth/visitor/login (simulated)" : "POST /api/liff/auth"}
              </p>
              <p className="text-purple-600 font-mono">
                {isSimulated ? "Body: { email, password } — seed credentials" : "Body: { lineAccessToken }"}
              </p>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <LiffHeader title="บันทึกนัดหมาย" subtitle={`ขั้นตอนที่ ${step}/4`} />
      <div className="px-4 py-3">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex mb-3">
          {[1, 2, 3, 4].map((s) => <div key={s} className={cn("flex-1 transition-all", s <= step ? "bg-[#06C755]" : "")} />)}
        </div>

        {/* Step 1: Purpose Selection — Real API + filter acceptFromLine */}
        {step === 1 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-primary mb-1">เลือกวัตถุประสงค์</h3>
            {purposesLoading && <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-primary" /></div>}
            {purposesError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-600">
                <p className="font-bold">Error loading purposes</p>
                <p>{purposesError instanceof Error ? purposesError.message : "Unknown error"}</p>
              </div>
            )}
            {!purposesLoading && visiblePurposes.length === 0 && !purposesError && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-xl text-[10px] text-yellow-700">
                ไม่มีวัตถุประสงค์ที่เปิดให้จองผ่าน LINE
              </div>
            )}
            {visiblePurposes.map((vt) => {
              const lineRules = (vt.departmentRules ?? []).filter((r) => r.isActive !== false && r.acceptFromLine !== false);
              const deptCount = lineRules.length;
              return (
                <button key={vt.id} onClick={() => { setSelectedPurpose(vt); setSelectedDept(null); setSelectedHost(null); }}
                  className={cn("w-full flex items-center p-2.5 rounded-xl border-2 text-left transition-all",
                    selectedPurpose?.id === vt.id ? "border-[#06C755] bg-green-50" : "border-gray-200")}>
                  <span className="text-lg mr-2">{vt.icon || "📋"}</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold">{vt.name}</p>
                    <p className="text-[9px] text-text-muted">{vt.nameEn} · รองรับ {deptCount} แผนก</p>
                  </div>
                  {selectedPurpose?.id === vt.id && <Check size={14} className="text-[#06C755]" />}
                </button>
              );
            })}
            {devMode && (
              <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-[9px]">
                <p className="font-bold text-purple-700">API: GET /api/visit-purposes?channel=line</p>
                <p className={purposesError ? "text-red-500" : "text-green-600"}>
                  {purposesError ? "Error" : `OK — ${visiblePurposes.length}/${purposes.length} ผ่าน filter (acceptFromLine)`}
                </p>
              </div>
            )}
            <button onClick={() => selectedPurpose && setStep(2)} disabled={!selectedPurpose}
              className="w-full h-9 bg-[#06C755] text-white font-bold rounded-xl text-xs mt-2 disabled:opacity-40">ถัดไป</button>
          </div>
        )}

        {/* Step 2: Department + Date/Time + Host (conditional ตาม rule) */}
        {step === 2 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-primary mb-1">เลือกแผนก วัน เวลา</h3>

            {/* Department Selection */}
            <div>
              <label className="text-[9px] font-bold text-text-secondary block mb-0.5">แผนก</label>
              {availableDeptRules.length === 0 ? (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-xl text-[10px] text-yellow-700">
                  ไม่มีแผนกที่เปิดรับวัตถุประสงค์นี้ผ่าน LINE
                </div>
              ) : (
                <select
                  value={selectedDept?.id ?? ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const r = availableDeptRules.find((x) => x.departmentId === id);
                    if (r?.department) {
                      setSelectedDept({ id: r.department.id, name: r.department.name });
                      setSelectedHost(null); // reset host เมื่อเปลี่ยนแผนก
                    } else {
                      setSelectedDept(null);
                    }
                  }}
                  className="w-full h-8 px-2 rounded-lg border border-gray-200 text-[10px] bg-white"
                >
                  <option value="">-- เลือกแผนก --</option>
                  {availableDeptRules.map((r) => (
                    <option key={r.id} value={r.departmentId}>{r.department?.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Rule badge — แสดงทันทีหลังเลือกแผนก */}
            {currentRule && (
              <div className="space-y-1.5">
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] border",
                  requireApproval ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-green-50 border-green-200 text-green-700")}>
                  {requireApproval ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                  <span className="font-bold">{requireApproval ? "ต้องรอเจ้าหน้าที่อนุมัติ" : "อนุมัติอัตโนมัติ"}</span>
                </div>
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] border",
                  requirePersonName ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600")}>
                  <User size={12} />
                  <span className="font-bold">
                    {requirePersonName ? "ต้องระบุผู้รับพบ" : "ไม่ต้องระบุผู้รับพบ (ติดต่อแผนก)"}
                  </span>
                </div>
              </div>
            )}

            {/* Date / Time / Host (เปิดเฉพาะหลังเลือกแผนกแล้ว) */}
            {selectedDept && (
              <>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-bold text-center mb-1.5">เมษายน 2569</p>
                  <div className="grid grid-cols-7 text-center text-[8px] text-text-muted mb-0.5">{["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => <span key={d}>{d}</span>)}</div>
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {[0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((d, i) =>
                      d === 0 ? <span key={`e-${i}`} /> :
                        <button key={d} onClick={() => setSelectedDate(d)} disabled={d < 2}
                          className={cn("w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[9px]",
                            selectedDate === d ? "bg-[#06C755] text-white font-bold" : d < 2 ? "text-gray-300" : "hover:bg-gray-200")}>{d}</button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-text-secondary block mb-0.5">เริ่ม</label>
                    <select value={timeStart} onChange={(e) => setTimeStart(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg border border-gray-200 text-[10px]">
                      {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-text-secondary block mb-0.5">สิ้นสุด</label>
                    <select value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg border border-gray-200 text-[10px]">
                      {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Host search — แสดงเฉพาะ requirePersonName=true */}
                {requirePersonName && (
                  <div>
                    <label className="text-[9px] font-bold text-text-secondary block mb-0.5">ผู้รับพบ <span className="text-red-500">*</span></label>
                    {selectedHost ? (
                      <div className="bg-primary-50 border border-primary-200 rounded-xl p-2 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center"><User size={12} className="text-primary" /></div>
                        <div className="flex-1"><p className="text-[10px] font-bold">{selectedHost.name}</p><p className="text-[8px] text-text-muted">{selectedHost.department?.name}</p></div>
                        <button onClick={() => setSelectedHost(null)} className="text-[9px] text-primary font-bold">เปลี่ยน</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input placeholder="ค้นหาเจ้าหน้าที่ (Real API)" leftIcon={<Search size={12} />} value={hostSearch} onChange={(e) => setHostSearch(e.target.value)} />
                        {(staffResults as Array<{ id: number; name?: string; firstName?: string; lastName?: string; department?: { name: string; id: number } }>).length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-30 max-h-[120px] overflow-y-auto">
                            {(staffResults as Array<{ id: number; name?: string; firstName?: string; lastName?: string; department?: { name: string; id: number } }>).slice(0, 5).map((s) => (
                              <button key={s.id} onClick={() => { setSelectedHost({ id: s.id, name: s.name || `${s.firstName} ${s.lastName}`, department: s.department }); setHostSearch(""); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left border-b last:border-0">
                                <p className="text-[10px] font-bold">{s.name || `${s.firstName} ${s.lastName}`}</p>
                                <p className="text-[8px] text-text-muted">{s.department?.name}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {devMode && (
              <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-[9px] space-y-0.5">
                <p className="font-bold text-purple-700">Rule lookup (purpose+department)</p>
                <p className="text-purple-600 font-mono">
                  {currentRule
                    ? `requirePersonName=${currentRule.requirePersonName}, requireApproval=${currentRule.requireApproval}`
                    : "(เลือกแผนกเพื่อโหลด rule)"}
                </p>
                {requirePersonName && <p className="text-purple-600 font-mono">GET /api/staff?search={hostSearch} → {(staffResults as unknown[]).length} results</p>}
              </div>
            )}
            <button
              onClick={() => setStep(3)}
              disabled={!selectedDept || !selectedDate || (requirePersonName && !selectedHost)}
              className="w-full h-9 bg-[#06C755] text-white font-bold rounded-xl text-xs disabled:opacity-40">ถัดไป</button>
          </div>
        )}

        {/* Step 3: Additional Details */}
        {step === 3 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-primary mb-1">รายละเอียดเพิ่มเติม</h3>
            <div>
              <label className="block text-[9px] font-medium uppercase text-text-secondary mb-0.5">วัตถุประสงค์เพิ่มเติม</label>
              <textarea className="w-full rounded-xl border border-gray-200 p-2 text-[10px] h-14 resize-none"
                placeholder="ระบุวัตถุประสงค์..."
                value={purposeText} onChange={(e) => setPurposeText(e.target.value)} />
            </div>
            <button onClick={() => setStep(4)} className="w-full h-9 bg-[#06C755] text-white font-bold rounded-xl text-xs">ถัดไป</button>
          </div>
        )}

        {/* Step 4: Confirm & Book — Real API */}
        {step === 4 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-primary mb-1">ตรวจสอบและยืนยัน</h3>

            {/* Approval badge ตาม rule */}
            {currentRule && (
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] border",
                requireApproval ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-green-50 border-green-200 text-green-700")}>
                {requireApproval ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                <span className="font-bold">
                  {requireApproval ? "นัดหมายนี้ต้องรอเจ้าหน้าที่อนุมัติ" : "นัดหมายนี้จะอนุมัติอัตโนมัติเมื่อยืนยัน"}
                </span>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-2.5 space-y-1 text-[10px] border border-gray-200">
              <div className="flex justify-between"><span className="text-text-muted">วัตถุประสงค์</span><span className="font-bold">{selectedPurpose?.name}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">แผนก</span><span className="font-bold">{selectedDept?.name || "-"}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">วันที่</span><span className="font-bold">{selectedDate} เม.ย. 2569</span></div>
              <div className="flex justify-between"><span className="text-text-muted">เวลา</span><span className="font-bold">{timeStart} - {timeEnd}</span></div>
              <div className="flex justify-between">
                <span className="text-text-muted">ผู้รับพบ</span>
                <span className="font-bold">
                  {requirePersonName ? (selectedHost?.name || "-") : <span className="text-gray-400 font-normal">ไม่ระบุ (ติดต่อแผนก)</span>}
                </span>
              </div>
              {purposeText && (
                <div className="pt-1 border-t border-gray-200">
                  <p className="text-text-muted mb-0.5">หมายเหตุ</p>
                  <p className="text-[9px]">{purposeText}</p>
                </div>
              )}
            </div>
            <div onClick={() => setAgreed(!agreed)} className={cn("flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer", agreed ? "bg-green-50 border-green-200" : "border-gray-200")}>
              <div className={cn("mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0", agreed ? "bg-[#06C755] border-[#06C755]" : "border-gray-300")}>
                {agreed && <Check size={10} className="text-white" />}
              </div>
              <p className="text-[9px] text-text-primary leading-snug">ยืนยันข้อมูลถูกต้อง และยินยอม PDPA</p>
            </div>

            {bookingResult && (
              <div className={cn("p-2.5 rounded-xl text-[10px] border", bookingResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600")}>
                <div className="flex items-center gap-1.5">
                  {bookingResult.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span className="font-bold">{bookingResult.message}</span>
                  {bookingResult.code && <span className="text-[#06C755] font-mono ml-1">{bookingResult.code}</span>}
                </div>
              </div>
            )}

            {devMode && bookingResult?.log && <ApiResponsePanel log={bookingResult.log} />}

            <button onClick={handleBook} disabled={!agreed}
              className="w-full h-9 bg-[#06C755] text-white font-bold rounded-xl text-xs disabled:opacity-40">ยืนยันและส่งคำขอ</button>

            {devMode && (
              <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-[9px]">
                <p className="font-bold text-purple-700">POST /api/appointments</p>
                <p className="text-purple-600 font-mono mt-0.5">{`{ visitPurposeId, departmentId, date, timeStart, timeEnd, hostStaffId, channel: "line" }`}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ===== LIFF: Approve Action — Real API =====

function LiffApproveAction({ onSubmit, devMode, onApiLog }: { onSubmit: () => void; devMode: boolean; onApiLog: (log: ApiCallLog) => void }) {
  const { data: pendingData, isLoading } = useMyAppointments({ status: "pending", limit: 5 });
  const [notes, setNotes] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string; log?: ApiCallLog } | null>(null);

  const appointments = (pendingData as { items?: unknown[] })?.items ??
    (Array.isArray(pendingData) ? pendingData : []);
  const selected = (appointments as Array<{ id: number; code?: string; visitorName?: string; purposeName?: string; date?: string; timeStart?: string; timeEnd?: string }>)
    .find((a) => a.id === selectedId) || (appointments as Array<{ id: number }>)[0];

  const handleAction = async (action: "approve" | "reject") => {
    const id = selected?.id;
    if (!id) return;
    const start = performance.now();
    const url = `/api/appointments/${id}/${action}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const latencyMs = Math.round(performance.now() - start);
      const json = await res.json();
      const log: ApiCallLog = {
        id: `${action}-${Date.now()}`, method: "POST", url,
        requestBody: { notes }, responseStatus: res.status,
        responseBody: json, latencyMs, timestamp: Date.now(),
      };
      onApiLog(log);
      if (json.success) {
        setActionResult({ success: true, message: action === "approve" ? "อนุมัติสำเร็จ!" : "ปฏิเสธแล้ว", log });
        setTimeout(() => onSubmit(), 1200);
      } else {
        setActionResult({ success: false, message: json.error?.message || `${action} failed`, log });
      }
    } catch (err) {
      setActionResult({ success: false, message: err instanceof Error ? err.message : "Error" });
    }
  };

  return (
    <>
      <LiffHeader title="อนุมัตินัดหมาย" subtitle="Approve Appointment" />
      <div className="px-4 py-4 space-y-3">
        {isLoading && <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-primary" /></div>}

        {!isLoading && !selected && (
          <div className="text-center py-6 space-y-2">
            <AlertTriangle size={24} className="text-yellow-500 mx-auto" />
            <p className="text-sm font-bold text-gray-700">ไม่มีนัดหมายรออนุมัติ</p>
            <p className="text-[10px] text-gray-500">ไม่พบ pending appointments ในระบบ</p>
            {devMode && (
              <div className="p-2 bg-gray-100 rounded-lg text-[9px] text-left">
                <p className="font-bold text-gray-600">API: GET /api/appointments?status=pending</p>
                <p className="text-gray-500">0 results</p>
              </div>
            )}
          </div>
        )}

        {selected && (
          <>
            {/* Appointment selector if multiple */}
            {(appointments as unknown[]).length > 1 && (
              <div className="flex gap-1 overflow-x-auto pb-1">
                {(appointments as Array<{ id: number; code?: string }>).map((a) => (
                  <button key={a.id} onClick={() => setSelectedId(a.id)}
                    className={cn("px-2 py-1 rounded-full text-[9px] font-bold whitespace-nowrap border",
                      (selected as { id: number }).id === a.id ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-500")}>
                    {a.code || `#${a.id}`}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs border border-gray-200">
              <div className="flex justify-between"><span className="text-text-muted">Booking</span><span className="font-bold text-primary">{(selected as { code?: string }).code || `#${(selected as { id: number }).id}`}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">ผู้ขอ</span><span className="font-bold">{(selected as { visitorName?: string }).visitorName || "-"}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">วัตถุประสงค์</span><span className="font-bold">{(selected as { purposeName?: string }).purposeName || "-"}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">วันที่</span><span className="font-bold">{(selected as { date?: string }).date} | {(selected as { timeStart?: string }).timeStart} - {(selected as { timeEnd?: string }).timeEnd}</span></div>
            </div>

            <textarea className="w-full rounded-xl border border-gray-200 p-2 text-xs h-12 resize-none"
              placeholder="หมายเหตุ (ถ้ามี)..."
              value={notes} onChange={(e) => setNotes(e.target.value)} />

            {actionResult && (
              <div className={cn("p-2.5 rounded-xl text-[10px] border", actionResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600")}>
                <div className="flex items-center gap-1.5">
                  {actionResult.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span className="font-bold">{actionResult.message}</span>
                </div>
              </div>
            )}

            {devMode && actionResult?.log && <ApiResponsePanel log={actionResult.log} />}

            <button onClick={() => handleAction("approve")} className="w-full h-10 bg-[#06C755] text-white font-bold rounded-xl text-sm active:scale-[0.98]">✅ อนุมัติ</button>
            <button onClick={() => handleAction("reject")} className="w-full h-10 bg-red-500 text-white font-bold rounded-xl text-sm active:scale-[0.98]">❌ ปฏิเสธ</button>

            {devMode && (
              <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-[9px]">
                <p className="font-bold text-purple-700">Approve: POST /api/appointments/:id/approve</p>
                <p className="font-bold text-purple-700">Reject: POST /api/appointments/:id/reject</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
