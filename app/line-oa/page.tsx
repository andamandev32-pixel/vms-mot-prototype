"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, ChevronLeft, ChevronRight, Play, RotateCcw, Users, Briefcase,
  Smartphone, UserCircle, Check, X, Search, Loader2,
  User, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LineStatePanel from "@/components/mobile/LineStatePanel";
import { getMessagesForState } from "@/components/mobile/LineChatMessages";
import NewFriendRichMenu from "@/components/mobile/NewFriendRichMenu";
import { Input } from "@/components/ui/Input";
import { staffMembers, visitPurposeConfigs } from "@/lib/mock-data";
import { lookupPersonnel, type PersonnelRecord } from "@/lib/mock-data";
import {
  type LineFlowStateId,
  flowScenarios,
  getFlowState,
} from "@/lib/line-oa-flow-data";

function getMenuForState(stateId: LineFlowStateId): "new-friend" | "visitor" | "officer" | "none" {
  if (stateId === "new-friend" || stateId === "visitor-register" || stateId === "officer-register") return "new-friend";
  if (stateId.startsWith("visitor-")) return "visitor";
  if (stateId.startsWith("officer-")) return "officer";
  return "none";
}

function shouldShowLiff(stateId: LineFlowStateId): boolean {
  return ["visitor-register", "officer-register", "visitor-booking", "officer-approve-action"].includes(stateId);
}

export default function LineOaFlowPage() {
  const [scenarioId, setScenarioId] = useState("visitor-full");
  const [stateIndex, setStateIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [richMenuOpen, setRichMenuOpen] = useState(true);
  const [liffScreen, setLiffScreen] = useState<"none" | "profile" | "booking" | "history" | "requests" | "bulletin">("none");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const scenario = flowScenarios.find((s) => s.id === scenarioId)!;
  const currentStateId = scenario.stateSequence[stateIndex];
  const currentState = getFlowState(currentStateId);
  const menuType = getMenuForState(currentStateId);
  const totalSteps = scenario.stateSequence.length;
  const showLiff = shouldShowLiff(currentStateId);

  // Reset liffScreen when state changes
  useEffect(() => { setLiffScreen("none"); }, [stateIndex, scenarioId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stateIndex, scenarioId]);

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

  // Rich menu height
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
            <p className="text-[10px] text-gray-400">Flow Simulation</p>
          </div>
        </div>

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

            {/* ===== Rich Menu (collapsible, bottom inside phone) ===== */}
            {menuType === "new-friend" && (
              <div className="absolute bottom-0 left-0 right-0 z-40">
                <NewFriendRichMenu onRegister={goNext} />
              </div>
            )}

            {menuType === "visitor" && (
              <div className="absolute bottom-0 left-0 right-0 z-40">
                <VisitorRichMenu
                  isOpen={richMenuOpen}
                  onToggle={() => setRichMenuOpen(!richMenuOpen)}
                  onMenuAction={(action) => setLiffScreen(action as any)}
                />
              </div>
            )}

            {menuType === "officer" && (
              <div className="absolute bottom-0 left-0 right-0 z-40">
                <OfficerRichMenu
                  isOpen={richMenuOpen}
                  onToggle={() => setRichMenuOpen(!richMenuOpen)}
                  onMenuAction={(action) => setLiffScreen(action as any)}
                />
              </div>
            )}

            {/* ===== LIFF Overlay (form states — slides up inside LINE chat) ===== */}
            {showLiff && (
              <div className="absolute inset-0 z-50 flex flex-col" style={{ top: "70px" }}>
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative mt-auto bg-white rounded-t-[1rem] max-h-[80%] overflow-y-auto shadow-2xl">
                  <LiffOverlay stateId={currentStateId} onSubmit={goNext} />
                </div>
              </div>
            )}

            {/* ===== LIFF Screen (from Rich Menu action) ===== */}
            {liffScreen !== "none" && (
              <div className="absolute inset-0 z-50 flex flex-col" style={{ top: "70px" }}>
                <div className="absolute inset-0 bg-black/30" onClick={() => setLiffScreen("none")} />
                <div className="relative mt-auto bg-white rounded-t-[1rem] max-h-[80%] overflow-y-auto shadow-2xl">
                  <LiffMenuScreen screen={liffScreen} onClose={() => setLiffScreen("none")} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Right: State Panel ===== */}
      <div className="w-[340px] border-l border-gray-800 shrink-0">
        <LineStatePanel currentStateId={currentStateId} currentStepIndex={stateIndex} totalSteps={totalSteps} />
      </div>
    </div>
  );
}

// ===== Rich Menu: Visitor (collapsible) =====

function VisitorRichMenu({ isOpen, onToggle, onMenuAction }: { isOpen: boolean; onToggle: () => void; onMenuAction: (action: string) => void }) {
  return (
    <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-200 overflow-hidden">
      {/* Toggle bar */}
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

// ===== Rich Menu: Officer (collapsible) =====

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

// ===== LIFF Menu Screens (from Rich Menu taps) =====

function LiffMenuScreen({ screen, onClose }: { screen: string; onClose: () => void }) {
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
        {screen === "profile" && <ProfileScreen />}
        {screen === "booking" && <BookingMenuScreen />}
        {screen === "history" && <HistoryScreen />}
        {screen === "requests" && <RequestsScreen />}
        {screen === "bulletin" && <BulletinScreen />}
      </div>
    </>
  );
}

function ProfileScreen() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"><UserCircle size={28} className="text-primary" /></div>
        <div>
          <p className="text-sm font-bold">พุทธิพงษ์ คาดสนิท</p>
          <p className="text-[10px] text-text-muted">บริษัท สยามเทค จำกัด</p>
          <p className="text-[10px] text-[#06C755] font-medium">✓ LINE Connected</p>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
        <div className="flex justify-between"><span className="text-text-muted">เบอร์โทร</span><span className="font-medium">081-302-5678</span></div>
        <div className="flex justify-between"><span className="text-text-muted">อีเมล</span><span className="font-medium">puttipong@siamtech.co.th</span></div>
        <div className="flex justify-between"><span className="text-text-muted">ลงทะเบียน</span><span className="font-medium">30 มี.ค. 2569</span></div>
        <div className="flex justify-between"><span className="text-text-muted">สถานะ</span><span className="font-medium text-[#06C755]">Active</span></div>
      </div>
      <button className="w-full h-10 bg-primary text-white font-bold rounded-xl text-sm">แก้ไขข้อมูล</button>
    </div>
  );
}

function BookingMenuScreen() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-primary">นัดหมายของคุณ</p>
      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold text-[#06C755]">นัดหมายถัดไป</span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold">อนุมัติแล้ว</span>
        </div>
        <p className="text-sm font-bold">2 เม.ย. 2569 | 10:00 - 11:00</p>
        <p className="text-[10px] text-text-muted">คุณสมชาย รักชาติ • สำนักนโยบายฯ</p>
      </div>
      <button className="w-full h-10 bg-[#06C755] text-white font-bold rounded-xl text-sm">+ สร้างนัดหมายใหม่</button>
    </div>
  );
}

function HistoryScreen() {
  const items = [
    { date: "28 มี.ค. 69", place: "อาคาร C ชั้น 4", status: "Checked-out", color: "text-gray-500" },
    { date: "20 มี.ค. 69", place: "อาคาร C ชั้น 3", status: "Completed", color: "text-green-600" },
    { date: "15 มี.ค. 69", place: "อาคาร C ชั้น 6", status: "Cancelled", color: "text-red-500" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-primary">ประวัติการเยือน</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs font-bold">{item.place}</p>
            <p className="text-[10px] text-text-muted">{item.date}</p>
          </div>
          <span className={cn("text-[10px] font-bold", item.color)}>{item.status}</span>
        </div>
      ))}
    </div>
  );
}

function RequestsScreen() {
  const items = [
    { name: "พุทธิพงษ์ คาดสนิท", company: "สยามเทค", type: "ติดต่อราชการ", date: "2 เม.ย.", status: "รอดำเนินการ", color: "text-amber-600" },
    { name: "สมศักดิ์ จริงใจ", company: "ABC Co.", type: "ประชุม", date: "3 เม.ย.", status: "อนุมัติแล้ว", color: "text-green-600" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-primary">คำขอนัดหมาย</p>
      {items.map((item, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-1">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold">{item.name}</p>
            <span className={cn("text-[9px] font-bold", item.color)}>{item.status}</span>
          </div>
          <p className="text-[10px] text-text-muted">{item.company} • {item.type} • {item.date}</p>
        </div>
      ))}
    </div>
  );
}

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
    </div>
  );
}

// ===== LIFF Overlay (for form states) =====

function LiffOverlay({ stateId, onSubmit }: { stateId: LineFlowStateId; onSubmit: () => void }) {
  switch (stateId) {
    case "visitor-register": return <LiffVisitorRegister onSubmit={onSubmit} />;
    case "officer-register": return <LiffOfficerRegister onSubmit={onSubmit} />;
    case "visitor-booking": return <LiffBooking onSubmit={onSubmit} />;
    case "officer-approve-action": return <LiffApproveAction onSubmit={onSubmit} />;
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

function LiffVisitorRegister({ onSubmit }: { onSubmit: () => void }) {
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
          <Input label="ชื่อ" defaultValue="พุทธิพงษ์" />
          <Input label="นามสกุล" defaultValue="คาดสนิท" />
        </div>
        <Input label="เบอร์โทรศัพท์" defaultValue="081-302-5678" />
        <Input label="อีเมล" placeholder="email@example.com" />
        <Input label="บริษัท" defaultValue="บริษัท สยามเทค จำกัด" />
        <button onClick={onSubmit} className="w-full h-11 bg-[#06C755] text-white font-bold rounded-xl text-sm active:scale-[0.98]">ลงทะเบียน</button>
      </div>
    </>
  );
}

function LiffOfficerRegister({ onSubmit }: { onSubmit: () => void }) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<PersonnelRecord | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const handleSearch = () => {
    if (!query.trim()) return;
    setSearching(true); setError("");
    setTimeout(() => {
      const result = lookupPersonnel(query);
      if (result) { setFound(result); } else { setError("ไม่พบข้อมูลพนักงาน"); }
      setSearching(false);
    }, 600);
  };
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
            <Input placeholder="EMP-007" value={query} onChange={(e) => { setQuery(e.target.value); setFound(null); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }} className="flex-1" />
            <button onClick={handleSearch} disabled={!query.trim() || searching}
              className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                query.trim() && !searching ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
          {error && <p className="text-xs text-error mt-1">{error}</p>}
        </div>
        {found && (
          <>
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2 mb-1"><Check size={14} className="text-[#06C755]" /><span className="text-xs font-bold text-[#06C755]">พบข้อมูล</span></div>
              <p className="text-xs"><span className="text-text-muted">ชื่อ:</span> {found.firstName} {found.lastName}</p>
              <p className="text-xs"><span className="text-text-muted">ตำแหน่ง:</span> {found.position}</p>
              <p className="text-xs"><span className="text-text-muted">สังกัด:</span> {found.departmentName}</p>
            </div>
            <Input label="เบอร์โทร" placeholder="0XX-XXX-XXXX" />
            <button onClick={onSubmit} className="w-full h-11 bg-[#06C755] text-white font-bold rounded-xl text-sm active:scale-[0.98]">ลงทะเบียน</button>
          </>
        )}
      </div>
    </>
  );
}

function LiffBooking({ onSubmit }: { onSubmit: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedHost, setSelectedHost] = useState<typeof staffMembers[0] | null>(null);
  const [hostSearch, setHostSearch] = useState("");
  const [agreed, setAgreed] = useState(false);
  const visitTypes = visitPurposeConfigs.filter(c => c.isActive && c.showOnLine).sort((a, b) => a.order - b.order);
  const filteredHosts = hostSearch.length >= 1 ? staffMembers.filter(s => s.role !== "security" && (s.name.includes(hostSearch) || s.department.name.includes(hostSearch))).slice(0, 4) : [];

  return (
    <>
      <LiffHeader title="บันทึกนัดหมาย" subtitle={`ขั้นตอนที่ ${step}/4`} />
      <div className="px-4 py-3">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex mb-3">
          {[1,2,3,4].map(s => <div key={s} className={cn("flex-1 transition-all", s <= step ? "bg-[#06C755]" : "")} />)}
        </div>

        {step === 1 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-primary mb-1">เลือกวัตถุประสงค์</h3>
            {visitTypes.map(vt => (
              <button key={vt.id} onClick={() => setSelectedType(String(vt.id))}
                className={cn("w-full flex items-center p-2.5 rounded-xl border-2 text-left transition-all",
                  selectedType === String(vt.id) ? "border-[#06C755] bg-green-50" : "border-border")}>
                <span className="text-lg mr-2">{vt.icon}</span>
                <div className="flex-1"><p className="text-[11px] font-bold">{vt.name}</p><p className="text-[9px] text-text-muted">{vt.nameEn}</p></div>
                {selectedType === String(vt.id) && <Check size={14} className="text-[#06C755]" />}
              </button>
            ))}
            <button onClick={() => selectedType && setStep(2)} disabled={!selectedType}
              className="w-full h-9 bg-[#06C755] text-white font-bold rounded-xl text-xs mt-2 disabled:opacity-40">ถัดไป</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-primary mb-1">วัน เวลา ผู้รับพบ</h3>
            <div className="bg-gray-50 p-2.5 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-center mb-1.5">เมษายน 2569</p>
              <div className="grid grid-cols-7 text-center text-[8px] text-text-muted mb-0.5">{["อา","จ","อ","พ","พฤ","ศ","ส"].map(d => <span key={d}>{d}</span>)}</div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {[0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map((d,i) =>
                  d === 0 ? <span key={`e-${i}`} /> :
                  <button key={d} onClick={() => setSelectedDate(d)} disabled={d < 2}
                    className={cn("w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[9px]",
                      selectedDate === d ? "bg-[#06C755] text-white font-bold" : d < 2 ? "text-gray-300" : "hover:bg-gray-200")}>{d}</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-bold text-text-secondary block mb-0.5">เริ่ม</label><select className="w-full h-8 px-2 rounded-lg border border-border text-[10px]"><option>10:00</option><option>10:30</option></select></div>
              <div><label className="text-[9px] font-bold text-text-secondary block mb-0.5">สิ้นสุด</label><select className="w-full h-8 px-2 rounded-lg border border-border text-[10px]"><option>11:00</option><option>11:30</option></select></div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-text-secondary block mb-0.5">ผู้รับพบ</label>
              {selectedHost ? (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center"><User size={12} className="text-primary" /></div>
                  <div className="flex-1"><p className="text-[10px] font-bold">{selectedHost.name}</p><p className="text-[8px] text-text-muted">{selectedHost.department.name}</p></div>
                  <button onClick={() => setSelectedHost(null)} className="text-[9px] text-primary font-bold">เปลี่ยน</button>
                </div>
              ) : (
                <div className="relative">
                  <Input placeholder="ค้นหาเจ้าหน้าที่" leftIcon={<Search size={12} />} value={hostSearch} onChange={e => setHostSearch(e.target.value)} />
                  {filteredHosts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-30 max-h-[120px] overflow-y-auto">
                      {filteredHosts.map(s => (
                        <button key={s.id} onClick={() => { setSelectedHost(s); setHostSearch(""); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left border-b last:border-0">
                          <p className="text-[10px] font-bold">{s.name}</p><p className="text-[8px] text-text-muted">{s.department.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => selectedDate && selectedHost && setStep(3)} disabled={!selectedDate || !selectedHost}
              className="w-full h-9 bg-[#06C755] text-white font-bold rounded-xl text-xs disabled:opacity-40">ถัดไป</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-primary mb-1">รายละเอียดเพิ่มเติม</h3>
            <Input label="เบอร์โทร" defaultValue="081-302-5678" />
            <Input label="อีเมล (ถ้ามี)" placeholder="email@example.com" />
            <div><label className="block text-[9px] font-medium uppercase text-text-secondary mb-0.5">วัตถุประสงค์</label>
              <textarea className="w-full rounded-xl border border-border p-2 text-[10px] h-14 resize-none" placeholder="ระบุวัตถุประสงค์..." /></div>
            <button onClick={() => setStep(4)} className="w-full h-9 bg-[#06C755] text-white font-bold rounded-xl text-xs">ถัดไป</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-primary mb-1">ตรวจสอบและยืนยัน</h3>
            <div className="bg-gray-50 rounded-xl p-2.5 space-y-1 text-[10px] border border-border">
              <div className="flex justify-between"><span className="text-text-muted">วัตถุประสงค์</span><span className="font-bold">ติดต่อราชการ</span></div>
              <div className="flex justify-between"><span className="text-text-muted">วันที่</span><span className="font-bold">{selectedDate} เม.ย. 2569</span></div>
              <div className="flex justify-between"><span className="text-text-muted">เวลา</span><span className="font-bold">10:00 - 11:00</span></div>
              <div className="flex justify-between"><span className="text-text-muted">ผู้รับพบ</span><span className="font-bold">{selectedHost?.name || "-"}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">สถานที่</span><span className="font-bold">{selectedHost?.department.building} {selectedHost?.department.floor}</span></div>
            </div>
            <div onClick={() => setAgreed(!agreed)} className={cn("flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer", agreed ? "bg-green-50 border-green-200" : "border-gray-200")}>
              <div className={cn("mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0", agreed ? "bg-[#06C755] border-[#06C755]" : "border-gray-300")}>
                {agreed && <Check size={10} className="text-white" />}
              </div>
              <p className="text-[9px] text-text-primary leading-snug">ยืนยันข้อมูลถูกต้อง และยินยอม PDPA</p>
            </div>
            <button onClick={onSubmit} disabled={!agreed} className="w-full h-9 bg-[#06C755] text-white font-bold rounded-xl text-xs disabled:opacity-40">ยืนยันและส่งคำขอ</button>
          </div>
        )}
      </div>
    </>
  );
}

function LiffApproveAction({ onSubmit }: { onSubmit: () => void }) {
  return (
    <>
      <LiffHeader title="อนุมัตินัดหมาย" subtitle="Approve Appointment" />
      <div className="px-4 py-4 space-y-3">
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs border border-border">
          <div className="flex justify-between"><span className="text-text-muted">Booking</span><span className="font-bold text-primary">#eVMS-20260402-1042</span></div>
          <div className="flex justify-between"><span className="text-text-muted">ผู้ขอ</span><span className="font-bold">พุทธิพงษ์ คาดสนิท</span></div>
          <div className="flex justify-between"><span className="text-text-muted">วัตถุประสงค์</span><span className="font-bold">🏛️ ติดต่อราชการ</span></div>
          <div className="flex justify-between"><span className="text-text-muted">วันที่</span><span className="font-bold">2 เม.ย. 2569 | 10:00 - 11:00</span></div>
        </div>
        <textarea className="w-full rounded-xl border border-border p-2 text-xs h-12 resize-none" placeholder="หมายเหตุ (ถ้ามี)..." />
        <button onClick={onSubmit} className="w-full h-10 bg-[#06C755] text-white font-bold rounded-xl text-sm active:scale-[0.98]">✅ อนุมัติ</button>
        <button className="w-full h-10 bg-red-500 text-white font-bold rounded-xl text-sm active:scale-[0.98]">❌ ปฏิเสธ</button>
      </div>
    </>
  );
}
