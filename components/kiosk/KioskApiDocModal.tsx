"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronRight, Copy, Check, Settings, Database, Lightbulb, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllApiSpecs, type KioskApiSpec, type KioskApiEndpoint, type ConfigSourceInfo } from "@/lib/kiosk/kiosk-api-data";
import type { KioskLocale } from "@/lib/kiosk/kiosk-types";

interface KioskApiDocModalProps {
  open: boolean;
  onClose: () => void;
  locale: KioskLocale;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PATCH: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase border shrink-0", METHOD_COLORS[method] || "bg-gray-500/20 text-gray-400 border-gray-500/30")}>
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
    </button>
  );
}

function JsonBlock({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <div className="relative group">
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CopyButton text={json} />
      </div>
      <pre className="text-[9px] font-mono bg-gray-950 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed max-h-[250px] overflow-y-auto text-gray-300">
        {json}
      </pre>
    </div>
  );
}

function EndpointBlock({ ep, locale }: { ep: KioskApiEndpoint; locale: KioskLocale }) {
  const [showReq, setShowReq] = useState(false);
  const [showRes, setShowRes] = useState(false);
  const [showErr, setShowErr] = useState(false);

  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 p-3 space-y-2">
      {/* Method + Path */}
      <div className="flex items-center gap-2 flex-wrap">
        <MethodBadge method={ep.method} />
        <span className="font-mono text-[11px] text-white font-medium">{ep.path}</span>
      </div>

      {/* Summary */}
      <p className="text-[10px] text-gray-400">{locale === "th" ? ep.summary : ep.summaryEn}</p>

      {/* Content type */}
      {ep.contentType && (
        <span className="text-[8px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded inline-block">
          Content-Type: {ep.contentType}
        </span>
      )}

      {/* Tables */}
      {ep.tables.length > 0 && (
        <div className="flex items-start gap-1.5 flex-wrap">
          <Database size={10} className="text-orange-400 shrink-0 mt-0.5" />
          {ep.tables.map((t) => (
            <span key={t} className="text-[7px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Collapsible: Request */}
      {ep.request && (
        <div>
          <button onClick={() => setShowReq(!showReq)} className="flex items-center gap-1 text-[9px] text-blue-400 hover:text-blue-300 font-medium">
            {showReq ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Request Body
          </button>
          {showReq && <JsonBlock data={ep.request} />}
        </div>
      )}

      {/* Collapsible: Response */}
      <div>
        <button onClick={() => setShowRes(!showRes)} className="flex items-center gap-1 text-[9px] text-emerald-400 hover:text-emerald-300 font-medium">
          {showRes ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Response
        </button>
        {showRes && <JsonBlock data={ep.response} />}
      </div>

      {/* Collapsible: Error */}
      {ep.errorResponse && (
        <div>
          <button onClick={() => setShowErr(!showErr)} className="flex items-center gap-1 text-[9px] text-red-400 hover:text-red-300 font-medium">
            {showErr ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Error Response
          </button>
          {showErr && <JsonBlock data={ep.errorResponse} />}
        </div>
      )}

      {/* Notes */}
      {ep.notes && ep.notes.length > 0 && (
        <div className="space-y-0.5 pt-1 border-t border-gray-800">
          {(locale === "th" ? ep.notes : ep.notesEn ?? ep.notes).map((note, i) => (
            <p key={i} className="text-[8px] text-gray-500 flex items-start gap-1">
              <span className="shrink-0">💡</span>
              <span>{note}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigSourceBlock({ src, locale }: { src: ConfigSourceInfo; locale: KioskLocale }) {
  return (
    <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <Settings size={10} className="text-amber-400 shrink-0" />
        <span className="text-[10px] font-bold text-amber-300">
          {locale === "th" ? src.settingsPage : src.settingsPageEn}
        </span>
        <span className="text-[8px] font-mono text-gray-600 ml-auto flex items-center gap-0.5">
          <ExternalLink size={7} />
          {src.settingsPath}
        </span>
      </div>
      <p className="text-[9px] text-gray-400">{locale === "th" ? src.usage : src.usageEn}</p>
      <div className="flex flex-wrap gap-1">
        {src.fields.map((f) => (
          <span key={f} className="text-[7px] font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

function StateApiSection({ spec, locale }: { spec: KioskApiSpec; locale: KioskLocale }) {
  const [open, setOpen] = useState(false);
  const hasApi = spec.hasApi && spec.endpoints.length > 0;

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
          open ? "bg-gray-900" : "bg-gray-900/50 hover:bg-gray-900"
        )}
      >
        {open ? <ChevronDown size={14} className="text-gray-500 shrink-0" /> : <ChevronRight size={14} className="text-gray-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2E3192]/20 text-[#7B7FD4] border border-[#2E3192]/30 shrink-0">
              {spec.stateType}
            </span>
            <span className="text-xs font-bold text-white truncate">
              {locale === "th" ? spec.title : spec.titleEn}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasApi && spec.endpoints.map((ep, i) => (
            <MethodBadge key={i} method={ep.method} />
          ))}
          {!hasApi && <span className="text-[8px] text-gray-600">No API</span>}
          {spec.configSources.length > 0 && (
            <span className="text-[8px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {spec.configSources.length} settings
            </span>
          )}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 py-3 space-y-4 bg-gray-950/50">
          {/* Description */}
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {locale === "th" ? spec.description : spec.descriptionEn}
          </p>

          {/* Endpoints */}
          {hasApi && (
            <div className="space-y-2">
              <h4 className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">API Endpoints</h4>
              {spec.endpoints.map((ep, i) => (
                <EndpointBlock key={i} ep={ep} locale={locale} />
              ))}
            </div>
          )}

          {!hasApi && spec.noApiReason && (
            <div className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-[10px] text-gray-500 italic">
              {locale === "th" ? spec.noApiReason : spec.noApiReasonEn}
            </div>
          )}

          {/* Config Sources */}
          {spec.configSources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[9px] uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1">
                <Settings size={9} /> Web App Settings ที่ต้องตั้งค่า
              </h4>
              {spec.configSources.map((src, i) => (
                <ConfigSourceBlock key={i} src={src} locale={locale} />
              ))}
            </div>
          )}

          {/* Dev Notes */}
          {spec.devNotes && spec.devNotes.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-800">
              <h4 className="text-[9px] uppercase tracking-wider text-yellow-500 font-semibold flex items-center gap-1">
                <Lightbulb size={9} /> Dev Notes
              </h4>
              {(locale === "th" ? spec.devNotes : spec.devNotesEn ?? spec.devNotes).map((note, i) => (
                <p key={i} className={cn(
                  "text-[9px] flex items-start gap-1.5",
                  note.startsWith("★") ? "text-yellow-300 font-medium" : "text-gray-500"
                )}>
                  <span className="shrink-0">{note.startsWith("★") ? "★" : "•"}</span>
                  <span>{note.startsWith("★") ? note.slice(2) : note}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KioskApiDocModal({ open, onClose, locale }: KioskApiDocModalProps) {
  const allSpecs = getAllApiSpecs();
  const walkinStates = ["WELCOME", "PDPA_CONSENT", "SELECT_PURPOSE", "SELECT_ID_METHOD", "ID_VERIFICATION", "DATA_PREVIEW", "FACE_CAPTURE", "SUCCESS"];
  const appointmentStates = ["WELCOME", "PDPA_CONSENT", "QR_SCAN", "APPOINTMENT_PREVIEW", "APPOINTMENT_VERIFY_ID", "FACE_CAPTURE", "WIFI_OFFER", "SUCCESS"];
  const systemStates = ["ERROR", "TIMEOUT"];

  const [activeTab, setActiveTab] = useState<"walkin" | "appointment" | "system" | "all">("all");

  if (!open) return null;

  const getFilteredSpecs = () => {
    switch (activeTab) {
      case "walkin": return allSpecs.filter((s) => walkinStates.includes(s.stateType));
      case "appointment": return allSpecs.filter((s) => appointmentStates.includes(s.stateType));
      case "system": return allSpecs.filter((s) => systemStates.includes(s.stateType));
      default: return allSpecs;
    }
  };

  const filteredSpecs = getFilteredSpecs();
  const totalEndpoints = allSpecs.reduce((sum, s) => sum + s.endpoints.length, 0);
  const totalConfigSources = allSpecs.reduce((sum, s) => sum + s.configSources.length, 0);

  const tabs = [
    { id: "all" as const, label: `ทั้งหมด (${allSpecs.length})`, labelEn: `All (${allSpecs.length})` },
    { id: "walkin" as const, label: "Walk-in Flow", labelEn: "Walk-in Flow" },
    { id: "appointment" as const, label: "Appointment Flow", labelEn: "Appointment Flow" },
    { id: "system" as const, label: "System", labelEn: "System" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-[90vw] max-w-[900px] h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              📡 Kiosk API Documentation
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {totalEndpoints} endpoints · {allSpecs.length} states · {totalConfigSources} config sources
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-5 py-2 border-b border-gray-800 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-[#2E3192] text-white"
                  : "bg-gray-900 text-gray-500 hover:text-gray-300 hover:bg-gray-800"
              )}
            >
              {locale === "th" ? tab.label : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {filteredSpecs.map((spec) => (
            <StateApiSection key={spec.stateType} spec={spec} locale={locale} />
          ))}
        </div>
      </div>
    </div>
  );
}
