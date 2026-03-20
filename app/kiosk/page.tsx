"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { RotateCcw, Volume2, VolumeX, Globe, Settings, ChevronDown, ChevronUp, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// State machine
import { kioskReducer, initialKioskState } from "@/lib/kiosk/kiosk-state-machine";
import { walkinSteps, appointmentSteps } from "@/lib/kiosk/kiosk-flow-config";
import { getActiveDevice } from "@/lib/kiosk/kiosk-device-map";
import { getAudioCue, speakText, stopSpeech } from "@/lib/kiosk/kiosk-audio-config";
import { mockVisitorIdCard, mockVisitorPassport, mockVisitorThaiId, mockAppointment } from "@/lib/kiosk/kiosk-mock-data";
import { resolveKioskConfig, getKioskServicePoints, resolveWifiPassword, resolveWifiValidity, getStateConfigInfo, type ResolvedKioskConfig } from "@/lib/kiosk/kiosk-config-resolver";
import type { KioskEvent, KioskLocale, StepInfo, IdMethod, SlipData } from "@/lib/kiosk/kiosk-types";
import { maskIdNumber } from "@/lib/kiosk/kiosk-mock-data";

// UI components
import KioskFrame from "@/components/kiosk/KioskFrame";
import StatePanel from "@/components/kiosk/StatePanel";

// Screen components
import WelcomeScreen from "@/components/kiosk/screens/WelcomeScreen";
import PdpaConsentScreen from "@/components/kiosk/screens/PdpaConsentScreen";
import SelectIdMethodScreen from "@/components/kiosk/screens/SelectIdMethodScreen";
import IdVerificationScreen from "@/components/kiosk/screens/IdVerificationScreen";
import DataPreviewScreen from "@/components/kiosk/screens/DataPreviewScreen";
import SelectPurposeScreen from "@/components/kiosk/screens/SelectPurposeScreen";
import FaceCaptureScreen from "@/components/kiosk/screens/FaceCaptureScreen";
import WifiOfferScreen from "@/components/kiosk/screens/WifiOfferScreen";
import SuccessScreen from "@/components/kiosk/screens/SuccessScreen";
import KioskSettingsScreen from "@/components/kiosk/screens/KioskSettingsScreen";
import QrScanScreen from "@/components/kiosk/screens/QrScanScreen";
import AppointmentPreviewScreen from "@/components/kiosk/screens/AppointmentPreviewScreen";
import ErrorScreen from "@/components/kiosk/screens/ErrorScreen";

type DemoCase = "walkin" | "appointment";

const demoCases: { id: DemoCase; label: string; labelEn: string }[] = [
  { id: "walkin", label: "Walk-in (8 ขั้นตอน)", labelEn: "Walk-in (8 steps)" },
  { id: "appointment", label: "นัดหมาย (6 ขั้นตอน)", labelEn: "Appointment (6 steps)" },
];

function getStepsForCase(c: DemoCase): StepInfo[] {
  switch (c) {
    case "walkin": return walkinSteps;
    case "appointment": return appointmentSteps;
  }
}

function getMockVisitor(method?: IdMethod) {
  switch (method) {
    case "passport": return mockVisitorPassport;
    case "thai-id-app": return mockVisitorThaiId;
    default: return mockVisitorIdCard;
  }
}

/** Generate slip using resolved kiosk config */
function generateSlipFromConfig(
  visitor: typeof mockVisitorIdCard,
  config: ResolvedKioskConfig,
  purpose?: { name: string; nameEn: string },
  wifiAccepted?: boolean,
): SlipData {
  const now = new Date();
  const wifiPassword = resolveWifiPassword(config.wifi.passwordPattern);
  const wifiValidUntil = resolveWifiValidity(config.wifi, config.businessHours.closeTime);
  return {
    slipNumber: `eVMS-${now.getFullYear() + 543}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
    visitorName: visitor.fullNameTh || visitor.fullNameEn,
    visitorNameEn: visitor.fullNameEn,
    idNumber: maskIdNumber(visitor.idNumber),
    visitPurpose: purpose?.name || "ติดต่อราชการ",
    visitPurposeEn: purpose?.nameEn || "Official Business",
    hostName: "คุณสมศรี รักงาน",
    department: "กองกิจการท่องเที่ยว",
    accessZone: "ชั้น 3 อาคาร C",
    date: now.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
    timeIn: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    timeOut: `${config.businessHours.closeTime} น.`,
    wifi: wifiAccepted
      ? { ssid: config.wifi.ssid, password: wifiPassword, validUntil: wifiValidUntil }
      : undefined,
    qrCodeData: `eVMS-${now.getFullYear() + 543}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-0042`,
  };
}

// ===== PIN MODAL COMPONENT =====
function PinModal({
  open,
  onClose,
  onSuccess,
  correctPin,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (!open) return null;

  const handleDigit = (d: string) => {
    if (pin.length >= 5) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 5) {
      if (next === correctPin) {
        setPin("");
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => { setPin(""); setError(false); }, 800);
      }
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-[300px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[#1B2B5E]" />
            <h3 className="text-sm font-bold text-[#1B2B5E]">ป้อน PIN ผู้ดูแล</h3>
          </div>
          <button onClick={() => { setPin(""); onClose(); }} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400">กรอก PIN 5 หลักเพื่อเข้าสู่การตั้งค่า Kiosk</p>

        {/* PIN dots */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all",
                error
                  ? "border-red-500 bg-red-500"
                  : i < pin.length
                  ? "border-[#1B2B5E] bg-[#1B2B5E]"
                  : "border-gray-300"
              )}
            />
          ))}
        </div>
        {error && <p className="text-center text-[10px] text-red-500 font-medium">PIN ไม่ถูกต้อง</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k) => (
            <button
              key={k}
              onClick={() => {
                if (k === "⌫") handleDelete();
                else if (k !== "") handleDigit(k);
              }}
              disabled={k === ""}
              className={cn(
                "h-11 rounded-xl text-sm font-bold transition-all",
                k === "" ? "invisible" :
                k === "⌫" ? "bg-gray-100 text-gray-500 hover:bg-gray-200" :
                "bg-gray-50 text-[#1B2B5E] hover:bg-[#1B2B5E]/10 active:scale-95"
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function KioskDemoPage() {
  const [state, dispatch] = useReducer(kioskReducer, initialKioskState);
  const [selectedCase, setSelectedCase] = useState<DemoCase>("walkin");
  const [locale, setLocale] = useState<KioskLocale>("th");
  const [audioEnabled, setAudioEnabled] = useState(false);

  // === Kiosk Config State ===
  const kioskList = useMemo(() => getKioskServicePoints(), []);
  const [selectedKioskId, setSelectedKioskId] = useState<number>(kioskList[0]?.id ?? 1);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // === In-screen settings (inside kiosk display) ===
  const [showScreenPinModal, setShowScreenPinModal] = useState(false);
  const [showScreenSettings, setShowScreenSettings] = useState(false);
  const [screenPin, setScreenPin] = useState("");
  const [screenPinError, setScreenPinError] = useState(false);

  // Resolve kiosk config from web app settings
  const kioskConfig = useMemo(() => resolveKioskConfig(selectedKioskId), [selectedKioskId]);

  // Config info for current state
  const stateConfigInfo = useMemo(
    () => kioskConfig ? getStateConfigInfo(state.type, kioskConfig) : null,
    [state.type, kioskConfig]
  );

  const steps = useMemo(() => getStepsForCase(selectedCase), [selectedCase]);

  // Find current step index based on state type
  const currentStepIndex = useMemo(() => {
    const idx = steps.findIndex((s) => s.stateType === state.type);
    return idx >= 0 ? idx : 0;
  }, [steps, state.type]);

  const currentStep = steps[currentStepIndex];

  const activeDevice = getActiveDevice(state.type, state.idMethod);

  const fire = useCallback(
    (event: KioskEvent) => {
      dispatch(event);
      // Play audio if enabled
      if (audioEnabled) {
        const nextState = kioskReducer(state, event);
        const cue = getAudioCue(nextState.type);
        if (cue) speakText(locale === "th" ? cue.th : cue.en, locale);
      }
    },
    [state, locale, audioEnabled]
  );

  const reset = useCallback(() => {
    stopSpeech();
    dispatch({ type: "RESET" });
  }, []);

  const handleCaseChange = (c: DemoCase) => {
    setSelectedCase(c);
    reset();
  };

  // Get wifi details from config
  const wifiSsid = kioskConfig?.wifi.ssid ?? "MOTS-Guest";
  const wifiPassword = kioskConfig ? resolveWifiPassword(kioskConfig.wifi.passwordPattern) : "";
  const wifiValidUntil = kioskConfig ? resolveWifiValidity(kioskConfig.wifi, kioskConfig.businessHours.closeTime) : "16:30 น.";

  // Allowed ID methods from config
  const allowedIdMethods = kioskConfig?.allowedIdMethods.map((m) => m.id);

  // ===== Render the current screen inside KioskFrame =====
  const renderScreen = () => {
    switch (state.type) {
      case "WELCOME":
        return (
          <WelcomeScreen
            locale={locale}
            onSelectWalkin={() => fire({ type: "SELECT_WALKIN" })}
            onSelectAppointment={() => fire({ type: "SELECT_APPOINTMENT" })}
            onChangeLocale={() => setLocale(locale === "th" ? "en" : "th")}
          />
        );
      case "PDPA_CONSENT":
        return (
          <PdpaConsentScreen
            locale={locale}
            onAccept={() => fire({ type: "ACCEPT_PDPA" })}
            onDecline={() => fire({ type: "GO_BACK" })}
            retentionDays={kioskConfig?.pdpa.retentionDays}
          />
        );
      case "SELECT_ID_METHOD":
        return (
          <SelectIdMethodScreen
            locale={locale}
            onSelect={(method) => fire({ type: "CHOOSE_ID_METHOD", idMethod: method })}
            onBack={() => fire({ type: "GO_BACK" })}
            allowedMethods={allowedIdMethods}
          />
        );
      case "ID_VERIFICATION":
        return (
          <IdVerificationScreen
            locale={locale}
            method={state.idMethod || "thai-id-card"}
            onDemoRead={() => {
              const visitor = getMockVisitor(state.idMethod);
              fire({ type: "ID_READ_SUCCESS", visitorData: visitor });
            }}
            onBack={() => fire({ type: "GO_BACK" })}
            onTimeout={reset}
          />
        );
      case "DATA_PREVIEW":
        return (
          <DataPreviewScreen
            locale={locale}
            visitor={state.visitorData || mockVisitorIdCard}
            onConfirm={() => fire({ type: "CONFIRM_DATA" })}
            onBack={() => fire({ type: "GO_BACK" })}
          />
        );
      case "SELECT_PURPOSE":
        return (
          <SelectPurposeScreen
            locale={locale}
            onSelect={(purpose) => fire({ type: "SELECT_VISIT_PURPOSE", purpose })}
            onBack={() => fire({ type: "GO_BACK" })}
            purposes={kioskConfig?.purposes}
            purposeDeptMap={kioskConfig?.purposeDepartmentMap}
          />
        );
      case "FACE_CAPTURE": {
        const purposeWifi = state.selectedPurpose?.wifiEnabled ?? true;
        return (
          <FaceCaptureScreen
            locale={locale}
            wifiEnabled={purposeWifi}
            onConfirm={(wifiAccepted) => {
              fire({ type: "FACE_CONFIRMED", photo: "demo-photo-base64", wifiAccepted });
            }}
            onBack={() => fire({ type: "GO_BACK" })}
            wifiSsid={wifiSsid}
            wifiValidUntil={wifiValidUntil}
          />
        );
      }
      case "WIFI_OFFER":
        return (
          <WifiOfferScreen
            locale={locale}
            onAccept={() => fire({ type: "ACCEPT_WIFI" })}
            onDecline={() => fire({ type: "DECLINE_WIFI" })}
            preSelected={state.appointmentData?.wifiRequested}
          />
        );
      case "SUCCESS":
        return (
          <SuccessScreen
            locale={locale}
            slipData={kioskConfig
              ? generateSlipFromConfig(
                  state.visitorData || mockVisitorIdCard,
                  kioskConfig,
                  state.selectedPurpose ? { name: state.selectedPurpose.name, nameEn: state.selectedPurpose.nameEn } : undefined,
                  state.wifiAccepted,
                )
              : undefined
            }
            onDone={reset}
            lineLinked={state.lineLinked}
            printSlip={state.printSlip}
            onChoosePrint={() => fire({ type: "CHOOSE_PRINT" })}
            onSkipPrint={() => fire({ type: "SKIP_PRINT" })}
          />
        );
      case "QR_SCAN":
        return (
          <QrScanScreen
            locale={locale}
            onDemoScan={() => fire({ type: "QR_SCANNED", appointmentData: mockAppointment })}
            onSkipToId={() => fire({ type: "NO_QR_CODE" })}
            onBack={() => fire({ type: "GO_BACK" })}
          />
        );
      case "APPOINTMENT_PREVIEW":
        return (
          <AppointmentPreviewScreen
            locale={locale}
            appointment={state.appointmentData || mockAppointment}
            onConfirmCheckin={() => fire({ type: "CONFIRM_CHECKIN" })}
            onBack={() => fire({ type: "GO_BACK" })}
          />
        );
      case "APPOINTMENT_VERIFY_ID":
        return (
          <SelectIdMethodScreen
            locale={locale}
            onSelect={(method) => {
              fire({ type: "CHOOSE_ID_METHOD", idMethod: method });
              // Auto-read for appointment path
              setTimeout(() => {
                const visitor = getMockVisitor(method);
                fire({ type: "ID_READ_SUCCESS", visitorData: visitor });
              }, 300);
            }}
            onBack={() => fire({ type: "GO_BACK" })}
            allowedMethods={allowedIdMethods}
          />
        );
      case "ERROR":
        return (
          <ErrorScreen
            locale={locale}
            message={state.errorMessage}
            onRetry={() => fire({ type: "GO_BACK" })}
            onHome={reset}
          />
        );
      case "TIMEOUT":
        return (
          <ErrorScreen
            locale={locale}
            message={locale === "th" ? "หมดเวลาทำรายการ" : "Session timed out"}
            onRetry={reset}
            onHome={reset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* PIN Modal */}
      <PinModal
        open={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
          setShowConfigPanel(true);
        }}
        correctPin={kioskConfig?.servicePoint.adminPin ?? "10210"}
      />

      {/* Left sidebar: Controls + Steps */}
      <div className="w-[220px] flex flex-col bg-white border-r border-gray-200 shrink-0">
        {/* Title */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#1B2B5E] flex items-center justify-center text-white text-xs font-bold">🏛️</div>
          <div>
            <h1 className="text-sm font-bold text-[#1B2B5E]">Kiosk Demo</h1>
            <p className="text-[10px] text-gray-400">State Machine Prototype</p>
          </div>
        </div>

        {/* Kiosk Selector (after PIN unlock or always visible for dev) */}
        {showConfigPanel && (
          <div className="px-3 py-2 border-b border-gray-100 bg-amber-50/50">
            <p className="text-[9px] uppercase tracking-wider text-amber-600 font-semibold mb-1.5 flex items-center gap-1">
              <Settings size={10} /> เลือก Kiosk / Select Kiosk
            </p>
            <select
              value={selectedKioskId}
              onChange={(e) => { setSelectedKioskId(Number(e.target.value)); reset(); }}
              className="w-full px-2 py-1.5 text-[11px] rounded-lg border border-amber-200 bg-white text-[#1B2B5E] font-medium focus:border-amber-400 focus:outline-none"
            >
              {kioskList.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.serialNumber})
                </option>
              ))}
            </select>
            {kioskConfig && (
              <div className="mt-1.5 space-y-0.5 text-[9px]">
                <p className="text-gray-500">📍 {kioskConfig.servicePoint.location}</p>
                <p className={cn(
                  "font-medium",
                  kioskConfig.servicePoint.status === "online" ? "text-emerald-600" :
                  kioskConfig.servicePoint.status === "offline" ? "text-red-500" : "text-amber-600"
                )}>
                  {kioskConfig.servicePoint.status === "online" ? "🟢" : kioskConfig.servicePoint.status === "offline" ? "🔴" : "🟡"}
                  {" "}สถานะ: {kioskConfig.servicePoint.status}
                </p>
                <p className="text-gray-500">
                  ⏰ {kioskConfig.businessHours.followBusinessHours
                    ? `ตามเวลาทำการ: ${kioskConfig.businessHours.openTime}–${kioskConfig.businessHours.closeTime}`
                    : "เปิดตลอด (ไม่จำกัดเวลา)"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Case selector */}
        <div className="px-3 py-2.5 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            {demoCases.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCaseChange(c.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors text-left",
                  selectedCase === c.id
                    ? "bg-[#1B2B5E] text-white"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                {locale === "th" ? c.label : c.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: locale, audio, reset */}
        <div className="flex items-center justify-center gap-1.5 px-3 py-2 border-b border-gray-100">
          <button
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            title={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
          >
            <Globe size={13} />
          </button>
          <button
            onClick={() => {
              if (audioEnabled) stopSpeech();
              setAudioEnabled(!audioEnabled);
            }}
            className={cn(
              "w-7 h-7 rounded-md border flex items-center justify-center",
              audioEnabled ? "border-[#C8A84E] bg-[#C8A84E]/10 text-[#C8A84E]" : "border-gray-200 text-gray-400 hover:bg-gray-50"
            )}
            title={audioEnabled ? "Mute TTS" : "Enable TTS"}
          >
            {audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
          <button
            onClick={reset}
            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            title="Reset"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Vertical step navigator */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1">ขั้นตอน / Steps</p>
          <div className="flex flex-col gap-1">
            {steps.map((step, index) => {
              const isCurrent = index === currentStepIndex;
              const isPast = index < currentStepIndex;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
                    isCurrent
                      ? "bg-[#C8A84E]/10 text-[#C8A84E] border border-[#C8A84E]/30"
                      : isPast
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-gray-50 text-gray-400 border border-transparent"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    isCurrent ? "bg-[#C8A84E] text-white" : isPast ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                  )}>
                    {isPast ? "✓" : index + 1}
                  </span>
                  <span className="leading-tight">
                    {locale === "th" ? step.title : step.titleEn}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Config Rules Panel — collapsible, shows per-state config info */}
          {showConfigPanel && stateConfigInfo && (
            <div className="mt-3 border-t border-gray-100 pt-2">
              <button
                onClick={() => setShowConfigPanel((v) => !v)}
                className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-amber-600 font-semibold mb-1.5 px-1 w-full"
              >
                <Settings size={10} />
                Config Rules
                <ChevronUp size={10} className="ml-auto" />
              </button>
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-2 space-y-1">
                <p className="text-[10px] font-bold text-amber-800">{stateConfigInfo.title}</p>
                {stateConfigInfo.rules.map((rule, i) => (
                  <p key={i} className="text-[9px] text-amber-700 leading-tight">{rule}</p>
                ))}
                {stateConfigInfo.configSource.length > 0 && (
                  <div className="pt-1 border-t border-amber-200/50 mt-1">
                    <p className="text-[8px] text-amber-500 font-medium">Config Source:</p>
                    {stateConfigInfo.configSource.map((src, i) => (
                      <p key={i} className="text-[8px] text-amber-400 font-mono">{src}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Gear icon + Kiosk name */}
        <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-2">
          <button
            onClick={() => setShowPinModal(true)}
            className={cn(
              "w-7 h-7 rounded-md border flex items-center justify-center transition-all",
              showConfigPanel
                ? "border-amber-400 bg-amber-50 text-amber-600"
                : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            )}
            title="ตั้งค่า Kiosk (PIN: 10210)"
          >
            <Settings size={13} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#1B2B5E] truncate">
              {kioskConfig?.servicePoint.name ?? "KIOSK-01"}
            </p>
            <p className="text-[8px] text-gray-400 truncate">
              {kioskConfig?.servicePoint.serialNumber ?? ""}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Kiosk Frame — full height */}
      <div className="flex-1 flex items-center justify-center bg-[#F4F6FA] overflow-auto">
        <KioskFrame
          activeDevice={activeDevice}
          machineName={kioskConfig?.servicePoint.serialNumber ?? "KIOSK-01"}
          onSettingsClick={() => setShowScreenPinModal(true)}
        >
          {/* PIN Modal — inside kiosk screen */}
          {showScreenPinModal && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50" style={{ paddingBottom: "30%" }}>
              <div className="bg-white rounded-lg shadow-2xl w-[42%] max-w-[120px] p-1.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    <Lock size={6} className="text-[#1B2B5E]" />
                    <h3 className="text-[5px] font-bold text-[#1B2B5E]">{locale === "th" ? "ป้อน PIN ผู้ดูแล" : "Admin PIN"}</h3>
                  </div>
                  <button onClick={() => { setScreenPin(""); setShowScreenPinModal(false); }} className="text-gray-400 hover:text-gray-600">
                    <X size={7} />
                  </button>
                </div>
                {/* PIN dots */}
                <div className="flex justify-center gap-1.5">
                  {[0,1,2,3,4].map((i) => (
                    <div key={i} className={cn("w-[6px] h-[6px] rounded-full border transition-all", screenPinError ? "border-red-500 bg-red-500" : i < screenPin.length ? "border-[#1B2B5E] bg-[#1B2B5E]" : "border-gray-300")} />
                  ))}
                </div>
                {screenPinError && <p className="text-center text-[5px] text-red-500 font-medium">PIN ไม่ถูกต้อง</p>}
                {/* Numpad */}
                <div className="grid grid-cols-3 gap-0.5">
                  {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        if (k === "⌫") { setScreenPin((p) => p.slice(0,-1)); setScreenPinError(false); }
                        else if (k !== "" && screenPin.length < 5) {
                          const next = screenPin + k;
                          setScreenPin(next);
                          setScreenPinError(false);
                          if (next.length === 5) {
                            if (next === (kioskConfig?.servicePoint.adminPin ?? "10210")) {
                              setScreenPin(""); setShowScreenPinModal(false); setShowScreenSettings(true);
                            } else {
                              setScreenPinError(true);
                              setTimeout(() => { setScreenPin(""); setScreenPinError(false); }, 800);
                            }
                          }
                        }
                      }}
                      disabled={k === ""}
                      className={cn("h-4 rounded text-[6px] font-bold transition-all", k === "" ? "invisible" : k === "⌫" ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-gray-50 text-[#1B2B5E] hover:bg-[#1B2B5E]/10 active:scale-95")}
                    >{k}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings overlay — replaces screen when open */}
          {showScreenSettings && kioskConfig ? (
            <KioskSettingsScreen
              locale={locale}
              config={kioskConfig}
              kioskList={kioskList}
              selectedKioskId={selectedKioskId}
              onChangeKiosk={(id) => { setSelectedKioskId(id); reset(); }}
              onClose={() => setShowScreenSettings(false)}
            />
          ) : (
            renderScreen()
          )}
        </KioskFrame>
      </div>

      {/* Right: State Panel */}
      <div className="w-[340px] border-l border-gray-800 shrink-0">
        <StatePanel
          state={state}
          stepInfo={currentStep}
          locale={locale}
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
        />
      </div>
    </div>
  );
}
