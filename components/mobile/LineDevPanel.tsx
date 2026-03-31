"use client";

import { useState } from "react";
import {
  Database,
  Code,
  GitBranch,
  Shield,
  ChevronDown,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Users,
  ArrowRight,
  Layers,
  Zap,
  Table2,
  MonitorSmartphone,
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
  lineFlowStates,
} from "@/lib/line-oa-flow-data";

// ===== Dev Panel Component =====

interface LineDevPanelProps {
  currentStateId: LineFlowStateId;
  isOpen: boolean;
  onToggle: () => void;
}

export default function LineDevPanel({ currentStateId, isOpen, onToggle }: LineDevPanelProps) {
  const [activeTab, setActiveTab] = useState<"flow" | "db" | "api">("flow");
  const state = getFlowState(currentStateId);
  const apis = getApiEndpointsForState(currentStateId);
  const tables = getDbTablesForState(currentStateId);

  if (!state) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed top-3 right-3 z-[80] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all",
          isOpen
            ? "bg-gray-800 text-white"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white animate-pulse"
        )}
      >
        {isOpen ? <EyeOff size={14} /> : <Eye size={14} />}
        {isOpen ? "Hide" : "DEV"}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={onToggle} />

          {/* Panel Content */}
          <div className="relative ml-auto w-full max-w-[420px] bg-gray-950 text-gray-100 h-full overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Code size={14} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Developer Panel</h3>
                  <p className="text-[10px] text-gray-400 leading-tight">LINE OA Flow Documentation</p>
                </div>
              </div>
              <button onClick={onToggle} className="p-1.5 hover:bg-gray-800 rounded-lg">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Current State Badge */}
            <div className="px-4 py-3 bg-violet-950/50 border-b border-violet-900/50">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={12} className="text-violet-400" />
                <span className="text-[10px] text-violet-300 uppercase font-bold tracking-wider">Current State</span>
              </div>
              <p className="text-sm font-bold text-white">{state.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{state.nameEn}</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-900 border-b border-gray-800">
              <TabButton
                active={activeTab === "flow"}
                icon={<GitBranch size={13} />}
                label="Flow & Role"
                onClick={() => setActiveTab("flow")}
              />
              <TabButton
                active={activeTab === "db"}
                icon={<Database size={13} />}
                label="DB Schema"
                onClick={() => setActiveTab("db")}
              />
              <TabButton
                active={activeTab === "api"}
                icon={<Code size={13} />}
                label="API Doc"
                onClick={() => setActiveTab("api")}
              />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "flow" && <FlowTab state={state} />}
              {activeTab === "db" && <DbTab tables={tables} />}
              {activeTab === "api" && <ApiTab apis={apis} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ===== Tab Button =====

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2",
        active ? "border-violet-500 text-violet-300 bg-violet-950/30" : "border-transparent text-gray-500 hover:text-gray-300"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ===== Flow & Role Tab =====

function FlowTab({ state }: { state: FlowStateInfo }) {
  return (
    <div className="p-4 space-y-4">
      {/* Description */}
      <Section title="Description" icon={<Layers size={13} />}>
        <p className="text-xs text-gray-300 leading-relaxed">{state.description}</p>
      </Section>

      {/* Triggers */}
      <Section title="Triggers" icon={<Zap size={13} />}>
        <ul className="space-y-1">
          {state.triggers.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
              <span className="text-amber-400 mt-0.5">&#x25B6;</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Related Roles */}
      <Section title="Roles" icon={<Users size={13} />}>
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

      {/* Related Channels */}
      <Section title="Channels" icon={<MonitorSmartphone size={13} />}>
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
      </Section>

      {/* Next States */}
      <Section title="Next States" icon={<ArrowRight size={13} />}>
        {state.nextStates.length > 0 ? (
          <div className="space-y-1.5">
            {state.nextStates.map((ns) => {
              const next = getFlowState(ns);
              return (
                <div key={ns} className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-800">
                  <ArrowRight size={12} className="text-violet-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-white">{next?.name || ns}</p>
                    <p className="text-[10px] text-gray-500">{next?.nameEn}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">End of flow (terminal state)</p>
        )}
      </Section>

      {/* Related Tables */}
      <Section title="Related DB Tables" icon={<Table2 size={13} />}>
        <div className="flex flex-wrap gap-1">
          {state.dbTables.map((t) => (
            <code key={t} className="px-2 py-0.5 bg-gray-900 rounded text-[10px] text-emerald-300 border border-gray-800">
              {t}
            </code>
          ))}
        </div>
      </Section>

      {/* API Endpoints */}
      <Section title="API Endpoints" icon={<Code size={13} />}>
        <div className="space-y-1">
          {state.apiEndpoints.map((ep) => (
            <code key={ep} className="block px-2 py-1 bg-gray-900 rounded text-[10px] text-sky-300 border border-gray-800">
              {ep}
            </code>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ===== DB Schema Tab =====

function DbTab({ tables }: { tables: LineDbTable[] }) {
  return (
    <div className="p-4 space-y-4">
      {tables.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No specific tables for this state</p>
      ) : (
        tables.map((table) => (
          <DbTableCard key={table.name} table={table} />
        ))
      )}
    </div>
  );
}

function DbTableCard({ table }: { table: LineDbTable }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 transition-colors"
      >
        {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        <Database size={13} className="text-emerald-400" />
        <code className="text-sm font-bold text-emerald-300">{table.name}</code>
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          <p className="text-[10px] text-gray-500 mb-2 px-1">{table.comment}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-gray-500 uppercase tracking-wider">
                  <th className="text-left py-1 px-1.5">Column</th>
                  <th className="text-left py-1 px-1.5">Type</th>
                  <th className="text-left py-1 px-1.5">Null</th>
                  <th className="text-left py-1 px-1.5">Comment</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((col) => (
                  <tr key={col.name} className="border-t border-gray-800/50">
                    <td className="py-1.5 px-1.5">
                      <code className={cn(
                        "text-[10px]",
                        col.isPrimaryKey ? "text-amber-300 font-bold" :
                        col.isForeignKey ? "text-sky-300" : "text-gray-200"
                      )}>
                        {col.isPrimaryKey && "🔑 "}
                        {col.isForeignKey && "🔗 "}
                        {col.name}
                      </code>
                    </td>
                    <td className="py-1.5 px-1.5">
                      <code className="text-violet-300 text-[10px]">{col.type}</code>
                    </td>
                    <td className="py-1.5 px-1.5 text-gray-500">{col.nullable ? "YES" : "NO"}</td>
                    <td className="py-1.5 px-1.5 text-gray-400 max-w-[120px] truncate">{col.comment}</td>
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

// ===== API Doc Tab =====

function ApiTab({ apis }: { apis: LineApiEndpoint[] }) {
  return (
    <div className="p-4 space-y-4">
      {apis.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No API endpoints for this state</p>
      ) : (
        apis.map((api) => (
          <ApiCard key={`${api.method}-${api.path}`} api={api} />
        ))
      )}
    </div>
  );
}

function ApiCard({ api }: { api: LineApiEndpoint }) {
  const [expanded, setExpanded] = useState(false);

  const methodColor = {
    GET: "bg-emerald-600",
    POST: "bg-sky-600",
    PUT: "bg-amber-600",
    PATCH: "bg-orange-600",
    DELETE: "bg-red-600",
  }[api.method];

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-2 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
      >
        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold text-white mt-0.5 flex-shrink-0", methodColor)}>
          {api.method}
        </span>
        <div className="flex-1 min-w-0">
          <code className="text-xs text-gray-200 block truncate">{api.path}</code>
          <p className="text-[10px] text-gray-500 mt-0.5">{api.summary}</p>
        </div>
        {expanded ? <ChevronDown size={14} className="text-gray-400 mt-1" /> : <ChevronRight size={14} className="text-gray-400 mt-1" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Auth */}
          <div className="flex items-center gap-2">
            <Shield size={11} className="text-gray-500" />
            <span className="text-[10px] text-gray-500">Auth:</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-bold",
              api.auth === "public" && "bg-green-900/50 text-green-300",
              api.auth === "user" && "bg-blue-900/50 text-blue-300",
              api.auth === "admin" && "bg-red-900/50 text-red-300",
              api.auth === "webhook" && "bg-amber-900/50 text-amber-300",
            )}>
              {api.auth}
            </span>
          </div>

          {/* Request Body */}
          {api.requestBody && api.requestBody.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Request Body</p>
              <div className="space-y-1">
                {api.requestBody.map((p) => (
                  <div key={p.name} className="flex items-start gap-2 text-[10px] bg-gray-950 rounded px-2 py-1.5">
                    <code className="text-sky-300 flex-shrink-0">{p.name}</code>
                    <code className="text-violet-300 flex-shrink-0">{p.type}</code>
                    {p.required && <span className="text-red-400 text-[8px] flex-shrink-0">*</span>}
                    <span className="text-gray-500 truncate">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Response Example</p>
            <pre className="bg-gray-950 rounded-lg p-2.5 text-[9px] text-gray-300 overflow-x-auto whitespace-pre leading-relaxed max-h-[200px] overflow-y-auto">
              {api.responseExample}
            </pre>
          </div>

          {/* Notes */}
          {api.notes && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Notes</p>
              <ul className="space-y-0.5">
                {api.notes.map((n, i) => (
                  <li key={i} className="text-[10px] text-amber-300/80 flex items-start gap-1.5">
                    <span className="text-amber-400">&#x2022;</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Section Helper =====

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-violet-400">{icon}</span>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}
