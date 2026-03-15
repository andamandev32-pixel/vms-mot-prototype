"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Volume2, Monitor, Code, ArrowRight, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KioskState, StepInfo, KioskLocale } from "@/lib/kiosk/kiosk-types";
import { getActiveDevice, deviceInfoList } from "@/lib/kiosk/kiosk-device-map";
import { getAudioCue } from "@/lib/kiosk/kiosk-audio-config";

interface StatePanelProps {
  state: KioskState;
  stepInfo?: StepInfo;
  locale: KioskLocale;
  currentStepIndex: number;
  totalSteps: number;
}

export default function StatePanel({ state, stepInfo, locale, currentStepIndex, totalSteps }: StatePanelProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["state", "device", "transitions"]));
  const device = getActiveDevice(state.type, state.idMethod);
  const deviceInfo = device ? deviceInfoList.find((d) => d.id === device) : null;
  const audioCue = getAudioCue(state.type);

  const toggle = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-300 text-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code size={14} className="text-[#2E3192]" />
            <span className="font-bold text-white text-sm">State Panel</span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            Step {currentStepIndex + 1}/{totalSteps}
          </span>
        </div>
        {/* State badge */}
        <div className="mt-2 px-3 py-1.5 rounded-lg bg-[#2E3192]/10 border border-[#2E3192]/20 inline-flex items-center gap-2">
          <Zap size={10} className="text-[#2E3192]" />
          <span className="font-mono font-bold text-[#2E3192]">{state.type}</span>
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Current State JSON */}
        <Section title="State Object" id="state" open={openSections.has("state")} onToggle={toggle}>
          <pre className="text-[10px] font-mono text-green-400 bg-gray-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(
              {
                type: state.type,
                case: state.case,
                idMethod: state.idMethod,
                appointmentPath: state.appointmentPath,
                hasVisitorData: !!state.visitorData,
                hasAppointmentData: !!state.appointmentData,
                selectedPurpose: state.selectedPurpose?.name,
                wifiAccepted: state.wifiAccepted,
              },
              null,
              2
            )}
          </pre>
        </Section>

        {/* Active Device */}
        <Section title="Active Device" id="device" open={openSections.has("device")} onToggle={toggle}>
          {deviceInfo ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Monitor size={12} className="text-cyan-400" />
                <span className="font-mono text-cyan-400">{deviceInfo.id}</span>
                <span className="text-gray-500">|</span>
                <span>{deviceInfo.icon} {deviceInfo.nameEn}</span>
              </div>
              <p className="text-[10px] text-gray-500">{locale === "th" ? deviceInfo.description : deviceInfo.descriptionEn}</p>
              <div className="px-2 py-1 rounded bg-gray-900 text-[10px] font-mono text-purple-400">
                Flutter: {deviceInfo.flutterPlugin}
              </div>
            </div>
          ) : (
            <p className="text-gray-600 italic">No device active</p>
          )}
        </Section>

        {/* Audio Cue */}
        <Section title="Audio (TTS)" id="audio" open={openSections.has("audio")} onToggle={toggle}>
          {audioCue ? (
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Volume2 size={12} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-300">{audioCue.th}</p>
                  <p className="text-gray-500">{audioCue.en}</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-gray-900 text-[10px] font-mono text-purple-400">
                Flutter: flutter_tts → lang=&quot;th-TH&quot;
              </div>
            </div>
          ) : (
            <p className="text-gray-600 italic">No audio for this state</p>
          )}
        </Section>

        {/* Possible Transitions */}
        <Section title="Transitions" id="transitions" open={openSections.has("transitions")} onToggle={toggle}>
          {stepInfo?.possibleTransitions?.length ? (
            <div className="space-y-1.5">
              {stepInfo.possibleTransitions.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900 text-[10px]">
                  <span className="font-mono text-orange-400 shrink-0">{t.event}</span>
                  <ArrowRight size={10} className="text-gray-600 shrink-0" />
                  <span className="font-mono text-blue-400 shrink-0">{t.targetState}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 italic">No transitions defined</p>
          )}
        </Section>

        {/* Conditions */}
        <Section title="Conditions / Rules" id="conditions" open={openSections.has("conditions")} onToggle={toggle}>
          {stepInfo?.conditions?.length ? (
            <ul className="space-y-1">
              {(locale === "th" ? stepInfo.conditions : stepInfo.conditionsEn).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px]">
                  <span className="text-[#2E3192] shrink-0 mt-0.5">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 italic">No conditions</p>
          )}
        </Section>

        {/* Flutter Hint */}
        <Section title="Flutter / BLoC Hint" id="flutter" open={openSections.has("flutter")} onToggle={toggle}>
          {stepInfo?.flutterHint ? (
            <div className="space-y-1.5">
              <div className="px-2 py-1.5 rounded bg-gray-900 text-[10px] font-mono space-y-0.5">
                <p><span className="text-gray-500">bloc:</span> <span className="text-blue-400">{stepInfo.flutterHint.bloc}</span></p>
                <p><span className="text-gray-500">state:</span> <span className="text-green-400">{stepInfo.flutterHint.state}</span></p>
                {stepInfo.flutterHint.device && (
                  <p><span className="text-gray-500">device:</span> <span className="text-cyan-400">{stepInfo.flutterHint.device}</span></p>
                )}
                {stepInfo.flutterHint.plugin && (
                  <p><span className="text-gray-500">plugin:</span> <span className="text-purple-400">{stepInfo.flutterHint.plugin}</span></p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-600 italic">No Flutter hint</p>
          )}
        </Section>

        {/* Timeout */}
        {stepInfo?.timeoutSeconds && (
          <Section title="Timeout" id="timeout" open={openSections.has("timeout")} onToggle={toggle}>
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-red-400" />
              <span className="text-red-300">{stepInfo.timeoutSeconds}s</span>
              <span className="text-gray-500">→ TIMEOUT state</span>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  id,
  open,
  onToggle,
  children,
}: {
  title: string;
  id: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-900 transition-colors text-left"
      >
        {open ? (
          <ChevronDown size={12} className="text-gray-500" />
        ) : (
          <ChevronRight size={12} className="text-gray-500" />
        )}
        <span className={cn("font-medium", open ? "text-white" : "text-gray-400")}>{title}</span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
