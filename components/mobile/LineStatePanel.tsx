"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Code,
  Zap,
  ArrowRight,
  Clock,
  Settings,
  Lightbulb,
  Users,
  MonitorSmartphone,
  Database,
  Shield,
  GitBranch,
  Table2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LineFlowStateId,
  type FlowStateInfo,
  type LineApiEndpoint,
  type LineDbTable,
  getFlowState,
  getApiEndpointsForState,
  getDbTablesForState,
} from "@/lib/line-oa-flow-data";
import { ApiHealthList } from "@/components/mobile/ApiResponsePanel";
import type { ApiHealthResult } from "@/lib/hooks/use-line-oa";

interface LineStatePanelProps {
  currentStateId: LineFlowStateId;
  currentStepIndex: number;
  totalSteps: number;
  apiHealthResults?: ApiHealthResult[];
  apiHealthTesting?: boolean;
  onTestApis?: () => void;
}

export default function LineStatePanel({ currentStateId, currentStepIndex, totalSteps, apiHealthResults, apiHealthTesting, onTestApis }: LineStatePanelProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["state", "health", "api", "flow"]));
  const state = getFlowState(currentStateId);
  const apis = getApiEndpointsForState(currentStateId);
  const tables = getDbTablesForState(currentStateId);

  const toggle = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!state) return null;

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-300 text-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code size={14} className="text-violet-500" />
            <span className="font-bold text-white text-sm">State Panel</span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            Step {currentStepIndex + 1}/{totalSteps}
          </span>
        </div>
        {/* State badge */}
        <div className="mt-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 inline-flex items-center gap-2">
          <Zap size={10} className="text-violet-400" />
          <span className="font-mono font-bold text-violet-400 text-[11px]">{currentStateId}</span>
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">
        {/* State Object */}
        <Section title="State Info" id="state" open={openSections.has("state")} onToggle={toggle}>
          <pre className="text-[10px] font-mono text-green-400 bg-gray-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(
              {
                id: state.id,
                userType: state.userType,
                order: state.order,
                channels: state.relatedChannels,
                roles: state.roles,
                nextStates: state.nextStates,
              },
              null,
              2
            )}
          </pre>
        </Section>

        {/* Description */}
        <Section title="📋 คำอธิบาย State" id="desc" open={openSections.has("desc")} onToggle={toggle}>
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-white">{state.name}</p>
            <p className="text-[10px] text-gray-300 leading-relaxed">{state.description}</p>
          </div>
        </Section>

        {/* Triggers */}
        <Section title="⚡ Triggers" id="triggers" open={openSections.has("triggers")} onToggle={toggle}>
          <div className="space-y-1.5">
            {state.triggers.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] px-2 py-1.5 rounded bg-gray-900">
                <span className="text-amber-400 shrink-0 mt-0.5">▶</span>
                <span className="text-amber-300">{t}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Transitions / Next States */}
        <Section title="Transitions" id="transitions" open={openSections.has("transitions")} onToggle={toggle}>
          {state.nextStates.length > 0 ? (
            <div className="space-y-1.5">
              {state.nextStates.map((ns) => {
                const next = getFlowState(ns);
                return (
                  <div key={ns} className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-900 text-[10px]">
                    <span className="font-mono text-orange-400 shrink-0">{currentStateId}</span>
                    <ArrowRight size={10} className="text-gray-600 shrink-0" />
                    <span className="font-mono text-blue-400 shrink-0">{ns}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 italic">Terminal state (end of flow)</p>
          )}
        </Section>

        {/* Roles */}
        <Section title="👥 Roles" id="roles" open={openSections.has("roles")} onToggle={toggle}>
          <div className="flex flex-wrap gap-1.5">
            {state.roles.map((role) => (
              <span
                key={role}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                  role === "visitor" && "bg-green-900/50 text-green-300 border border-green-800",
                  role === "officer" && "bg-blue-900/50 text-blue-300 border border-blue-800",
                  role === "supervisor" && "bg-purple-900/50 text-purple-300 border border-purple-800",
                  role === "security" && "bg-orange-900/50 text-orange-300 border border-orange-800",
                  role === "admin" && "bg-red-900/50 text-red-300 border border-red-800",
                )}
              >
                {role}
              </span>
            ))}
          </div>
        </Section>

        {/* Channels */}
        <Section title="📱 Related Channels" id="channels" open={openSections.has("channels")} onToggle={toggle}>
          <div className="flex flex-wrap gap-1.5">
            {state.relatedChannels.map((ch) => (
              <span
                key={ch}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                  ch === "line" && "bg-[#06C755]/20 text-[#06C755] border border-[#06C755]/30",
                  ch === "kiosk" && "bg-cyan-900/50 text-cyan-300 border border-cyan-800",
                  ch === "counter" && "bg-amber-900/50 text-amber-300 border border-amber-800",
                  ch === "web" && "bg-indigo-900/50 text-indigo-300 border border-indigo-800",
                )}
              >
                {ch}
              </span>
            ))}
          </div>
          <p className="text-[9px] text-gray-600 mt-2 italic">
            {state.relatedChannels.includes("kiosk") && "สอดคล้องกับ Kiosk flow: visitor สแกน QR ที่ตู้ → "}
            {state.relatedChannels.includes("counter") && "Counter: officer ประมวลผลที่จุดรักษาความปลอดภัย → "}
            {state.relatedChannels.includes("web") && "Web: admin จัดการผ่าน dashboard"}
          </p>
        </Section>

        {/* Live API Health Check */}
        <Section title="🩺 Live API Status" id="health" open={openSections.has("health")} onToggle={toggle}>
          <ApiHealthList
            results={apiHealthResults ?? []}
            onTest={onTestApis}
            testing={apiHealthTesting}
          />
          {(!apiHealthResults || apiHealthResults.length === 0) && !apiHealthTesting && (
            <p className="text-[9px] text-gray-600 mt-1 italic">
              Click &quot;Test All APIs&quot; to check endpoint availability
            </p>
          )}
        </Section>

        {/* API Endpoints */}
        <Section title="🔌 API Endpoints" id="api" open={openSections.has("api")} onToggle={toggle}>
          {apis.length > 0 ? (
            <div className="space-y-3">
              {apis.map((api) => (
                <ApiEndpointCard key={`${api.method}-${api.path}`} api={api} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 italic">No specific API endpoints</p>
          )}
        </Section>

        {/* DB Schema */}
        <Section title="🗄️ DB Schema" id="db" open={openSections.has("db")} onToggle={toggle}>
          {tables.length > 0 ? (
            <div className="space-y-3">
              {tables.map((table) => (
                <DbTableSection key={table.name} table={table} />
              ))}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 italic mb-2">No LINE-specific tables</p>
              <p className="text-[9px] text-gray-600">Related tables:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {state.dbTables.map((t) => (
                  <code key={t} className="px-1.5 py-0.5 bg-gray-900 rounded text-[9px] text-emerald-400 border border-gray-800">
                    {t}
                  </code>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Web Settings ที่เกี่ยวข้อง */}
        <Section title="⚙️ Web Settings ที่เกี่ยวข้อง" id="settings" open={openSections.has("settings")} onToggle={toggle}>
          <div className="space-y-2">
            {state.dbTables.includes("line_oa_config") && (
              <SettingLink path="/web/settings/line-message-templates" label="ตั้งค่า LINE OA & แจ้งเตือน" desc="Channel ID, LIFF, Rich Menu, Flex Templates" />
            )}
            {state.dbTables.includes("visit_purposes") && (
              <SettingLink path="/web/settings/visit-purposes" label="วัตถุประสงค์เข้าพื้นที่" desc="show_on_line, require_approval, offer_wifi" />
            )}
            {state.dbTables.includes("notification_templates") && (
              <SettingLink path="/web/settings/line-message-templates" label="LINE Flex Message Templates" desc="แก้ไข Flex Message, variables, preview" />
            )}
            {state.dbTables.includes("approver_groups") && (
              <SettingLink path="/web/settings/approver-groups" label="กลุ่มผู้อนุมัติ" desc="ผู้อนุมัติตามแผนก+วัตถุประสงค์" />
            )}
            {state.dbTables.includes("pdpa_consents") && (
              <SettingLink path="/web/settings/pdpa-consent" label="ยินยอม PDPA" desc="ข้อความ consent, data retention days" />
            )}
            {(state.relatedChannels.includes("kiosk") || state.relatedChannels.includes("counter")) && (
              <SettingLink path="/web/settings/service-points" label="จุดบริการ (Kiosk/Counter)" desc="hardware config, allowed purposes" />
            )}
          </div>
        </Section>

        {/* Dev Notes */}
        <Section title="💡 Dev Notes" id="devnotes" open={openSections.has("devnotes")} onToggle={toggle}>
          <div className="space-y-1.5">
            <DevNote text={`LIFF SDK: liff.init({ liffId }) → liff.getProfile() → line_user_id`} highlight />
            {state.relatedChannels.includes("kiosk") && (
              <DevNote text="Kiosk integration: slip.lineLinked → ถาม 'ส่งทาง LINE' หรือ 'พิมพ์'" />
            )}
            {state.dbTables.includes("notification_logs") && (
              <DevNote text="ทุก notification ถูก log ใน notification_logs พร้อม status (sent/failed/queued)" />
            )}
            {state.dbTables.includes("notification_templates") && (
              <DevNote text="Flex Message ใช้ template จาก notification_templates.flex_json พร้อม {{variables}}" />
            )}
            {state.roles.includes("officer") && state.roles.includes("visitor") && (
              <DevNote text="★ State นี้ส่ง notification ให้ทั้ง visitor และ officer" highlight />
            )}
            <DevNote text={`Rich Menu: ${state.id.startsWith("visitor") ? "visitor menu (3 ปุ่ม)" : state.id.startsWith("officer") ? "officer menu (3 ปุ่ม)" : "new-friend menu (register + help)"}`} />
          </div>
        </Section>

        {/* LIFF / API Code Example */}
        {state.codeExample && state.codeExample.length > 0 && (
          <Section title="📱 Code Example (LIFF / API)" id="code" open={openSections.has("code")} onToggle={toggle}>
            <pre className="text-[9px] font-mono bg-gray-900 rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed max-h-[250px] overflow-y-auto">
              {state.codeExample.map((line, i) => {
                if (line.startsWith("//")) return <span key={i} className="text-gray-500">{line}{"\n"}</span>;
                if (line.startsWith("import ")) return <span key={i} className="text-purple-400">{line}{"\n"}</span>;
                if (line === "") return <span key={i}>{"\n"}</span>;
                if (line.includes("await ") || line.includes("const ") || line.includes("for ")) return <span key={i} className="text-blue-300">{line}{"\n"}</span>;
                if (line.includes("→") || line.includes("profile.")) return <span key={i} className="text-green-400">{line}{"\n"}</span>;
                return <span key={i} className="text-gray-300">{line}{"\n"}</span>;
              })}
            </pre>
          </Section>
        )}

        {/* LINE SDK Hint */}
        <Section title="LINE SDK / LIFF Hint" id="liff" open={openSections.has("liff")} onToggle={toggle}>
          <div className="px-2 py-1.5 rounded bg-gray-900 text-[10px] font-mono space-y-0.5">
            <p><span className="text-gray-500">sdk:</span> <span className="text-blue-400">@line/liff</span></p>
            <p><span className="text-gray-500">api:</span> <span className="text-green-400">LINE Messaging API v2</span></p>
            <p><span className="text-gray-500">message:</span> <span className="text-cyan-400">Flex Message / Push Message</span></p>
            <p><span className="text-gray-500">auth:</span> <span className="text-purple-400">X-Line-Signature (HMAC-SHA256)</span></p>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ===== Reusable Section =====

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

// ===== API Endpoint Card =====

function ApiEndpointCard({ api }: { api: LineApiEndpoint }) {
  const [showResponse, setShowResponse] = useState(false);

  const methodColor = {
    GET: "bg-emerald-600",
    POST: "bg-sky-600",
    PUT: "bg-amber-600",
    PATCH: "bg-orange-600",
    DELETE: "bg-red-600",
  }[api.method];

  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 p-2.5 space-y-1.5">
      <div className="flex items-start gap-2">
        <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold text-white shrink-0", methodColor)}>
          {api.method}
        </span>
        <code className="text-[10px] text-gray-200 break-all">{api.path}</code>
      </div>
      <p className="text-[9px] text-gray-500">{api.summary}</p>
      <div className="flex items-center gap-2">
        <Shield size={9} className="text-gray-600" />
        <span className={cn(
          "text-[8px] font-bold px-1.5 py-0.5 rounded",
          api.auth === "public" && "bg-green-900/50 text-green-300",
          api.auth === "user" && "bg-blue-900/50 text-blue-300",
          api.auth === "admin" && "bg-red-900/50 text-red-300",
          api.auth === "webhook" && "bg-amber-900/50 text-amber-300",
        )}>
          auth: {api.auth}
        </span>
      </div>

      {/* Request Body */}
      {api.requestBody && api.requestBody.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[8px] text-gray-600 uppercase tracking-wider">Request Body</p>
          {api.requestBody.map((p) => (
            <div key={p.name} className="flex gap-1.5 text-[9px] pl-1">
              <code className="text-sky-400">{p.name}</code>
              <code className="text-violet-400">{p.type}</code>
              {p.required && <span className="text-red-400 text-[7px]">*</span>}
            </div>
          ))}
        </div>
      )}

      {/* Response Toggle */}
      <button
        onClick={() => setShowResponse(!showResponse)}
        className="text-[8px] text-gray-500 hover:text-gray-300 flex items-center gap-1"
      >
        {showResponse ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
        Response Example
      </button>
      {showResponse && (
        <pre className="text-[8px] font-mono text-gray-400 bg-gray-950 rounded p-2 overflow-x-auto whitespace-pre max-h-[150px] overflow-y-auto">
          {api.responseExample}
        </pre>
      )}

      {/* Notes */}
      {api.notes && (
        <div className="space-y-0.5">
          {api.notes.map((n, i) => (
            <p key={i} className="text-[8px] text-amber-400/80 flex items-start gap-1">
              <span>•</span><span>{n}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== DB Table Section =====

function DbTableSection({ table }: { table: LineDbTable }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-800 transition-colors text-left"
      >
        {expanded ? <ChevronDown size={10} className="text-gray-500" /> : <ChevronRight size={10} className="text-gray-500" />}
        <Database size={10} className="text-emerald-400" />
        <code className="text-[10px] font-bold text-emerald-300">{table.name}</code>
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5">
          <p className="text-[8px] text-gray-600 mb-1.5">{table.comment}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="text-gray-600 uppercase">
                  <th className="text-left py-0.5 px-1">Column</th>
                  <th className="text-left py-0.5 px-1">Type</th>
                  <th className="text-left py-0.5 px-1">Comment</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((col) => (
                  <tr key={col.name} className="border-t border-gray-800/50">
                    <td className="py-1 px-1">
                      <code className={cn(
                        "text-[8px]",
                        col.isPrimaryKey ? "text-amber-300 font-bold" :
                        col.isForeignKey ? "text-sky-300" : "text-gray-200"
                      )}>
                        {col.isPrimaryKey && "🔑"}
                        {col.isForeignKey && "🔗"}
                        {col.name}
                      </code>
                    </td>
                    <td className="py-1 px-1">
                      <code className="text-violet-300 text-[8px]">{col.type}</code>
                    </td>
                    <td className="py-1 px-1 text-gray-500 text-[8px] max-w-[100px] truncate">{col.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Setting Link =====

function SettingLink({ path, label, desc }: { path: string; label: string; desc: string }) {
  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 p-2.5">
      <div className="flex items-center gap-2">
        <Settings size={10} className="text-amber-400 shrink-0" />
        <span className="text-[10px] font-bold text-amber-300">{label}</span>
        <span className="text-[7px] font-mono text-gray-600 ml-auto">{path}</span>
      </div>
      <p className="text-[9px] text-gray-500 mt-0.5">{desc}</p>
    </div>
  );
}

// ===== Dev Note =====

function DevNote({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-1.5 text-[9px]">
      <Lightbulb size={9} className="text-yellow-400 shrink-0 mt-0.5" />
      <span className={cn("leading-relaxed", highlight ? "text-yellow-300 font-bold" : "text-gray-400")}>{text}</span>
    </div>
  );
}
