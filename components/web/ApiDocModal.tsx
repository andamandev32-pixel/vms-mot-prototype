"use client";

import { useState, useCallback } from "react";
import { Drawer } from "@/components/ui/Drawer";
import {
  FileCode2, ChevronDown, ChevronUp, Copy, Check, Lock, Unlock, ShieldCheck,
  ArrowRight, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageApiDoc, ApiEndpoint } from "@/lib/api-doc-data";

/* ── Method badge color ── */
function methodColor(method: string) {
  switch (method) {
    case "GET": return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "POST": return "bg-blue-100 text-blue-700 border-blue-300";
    case "PUT": return "bg-amber-100 text-amber-700 border-amber-300";
    case "PATCH": return "bg-orange-100 text-orange-700 border-orange-300";
    case "DELETE": return "bg-red-100 text-red-700 border-red-300";
    default: return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

/* ── Auth badge ── */
function AuthBadge({ auth }: { auth: string }) {
  const config = {
    public: { label: "Public", icon: <Unlock size={10} />, cls: "bg-green-50 text-green-700 border-green-200" },
    user: { label: "User (JWT)", icon: <ShieldCheck size={10} />, cls: "bg-blue-50 text-blue-700 border-blue-200" },
    admin: { label: "Admin Only", icon: <Lock size={10} />, cls: "bg-red-50 text-red-700 border-red-200" },
  }[auth] || { label: auth, icon: null, cls: "bg-gray-50 text-gray-700 border-gray-200" };

  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border", config.cls)}>
      {config.icon} {config.label}
    </span>
  );
}

/* ── Single Endpoint Card ── */
function EndpointCard({ ep }: { ep: ApiEndpoint }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    // Build curl command
    const parts = [`curl -X ${ep.method}`];
    if (ep.auth !== "public") parts.push(`-H "Authorization: Bearer <token>"`);
    if (ep.requestBody?.length) parts.push(`-H "Content-Type: application/json"`);
    if (ep.requestBody?.length) {
      const body: Record<string, string> = {};
      ep.requestBody.forEach((p) => { body[p.name] = `<${p.type}>`; });
      parts.push(`-d '${JSON.stringify(body)}'`);
    }
    parts.push(`"https://api.example.com${ep.path}"`);
    navigator.clipboard.writeText(parts.join(" \\\n  "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [ep]);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <span className={cn("text-[11px] font-mono font-bold px-2 py-0.5 rounded border shrink-0", methodColor(ep.method))}>
          {ep.method}
        </span>
        <code className="text-xs font-mono text-text-primary flex-1 truncate">{ep.path}</code>
        <AuthBadge auth={ep.auth} />
        {expanded ? <ChevronUp size={14} className="text-text-muted shrink-0" /> : <ChevronDown size={14} className="text-text-muted shrink-0" />}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/50">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{ep.summary}</p>
            <button onClick={handleCopy} className="text-xs text-text-muted hover:text-primary flex items-center gap-1 transition-colors" title="Copy as cURL">
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              {copied ? "Copied" : "cURL"}
            </button>
          </div>

          {/* Path Params */}
          {ep.pathParams?.length ? (
            <div>
              <p className="text-[10px] uppercase font-bold text-text-muted mb-1.5">Path Parameters</p>
              <div className="space-y-1">
                {ep.pathParams.map((p) => (
                  <ParamRow key={p.name} param={p} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Query Params */}
          {ep.queryParams?.length ? (
            <div>
              <p className="text-[10px] uppercase font-bold text-text-muted mb-1.5">Query Parameters</p>
              <div className="space-y-1">
                {ep.queryParams.map((p) => (
                  <ParamRow key={p.name} param={p} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Request Body */}
          {ep.requestBody?.length ? (
            <div>
              <p className="text-[10px] uppercase font-bold text-text-muted mb-1.5">Request Body (JSON)</p>
              <div className="space-y-1">
                {ep.requestBody.map((p) => (
                  <ParamRow key={p.name} param={p} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Response Example */}
          {ep.responseExample && (
            <div>
              <p className="text-[10px] uppercase font-bold text-text-muted mb-1.5">Response Example</p>
              <pre className="bg-gray-900 text-gray-100 text-[11px] font-mono p-3 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                {ep.responseExample}
              </pre>
            </div>
          )}

          {/* Notes */}
          {ep.notes?.length ? (
            <div>
              <p className="text-[10px] uppercase font-bold text-text-muted mb-1.5">Notes</p>
              <ul className="space-y-1">
                {ep.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                    <ArrowRight size={10} className="shrink-0 mt-1 text-primary" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ── Param Row ── */
function ParamRow({ param }: { param: { name: string; type: string; required: boolean; description: string } }) {
  return (
    <div className="flex items-start gap-2 text-xs py-1 px-2 rounded-md bg-white border border-gray-100">
      <code className="font-mono font-bold text-text-primary shrink-0">{param.name}</code>
      <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1 rounded shrink-0">{param.type}</span>
      {param.required ? (
        <span className="text-[9px] font-bold text-error bg-error/10 px-1 rounded shrink-0">required</span>
      ) : (
        <span className="text-[9px] font-bold text-text-muted bg-gray-100 px-1 rounded shrink-0">optional</span>
      )}
      <span className="text-text-muted flex-1">{param.description}</span>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN MODAL
   ══════════════════════════════════════ */
interface ApiDocModalProps {
  open: boolean;
  onClose: () => void;
  apiDoc: PageApiDoc;
}

export function ApiDocModal({ open, onClose, apiDoc }: ApiDocModalProps) {
  return (
    <Drawer open={open} onClose={onClose} title={`API — ${apiDoc.menuName}`} width="xl">
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <FileCode2 size={20} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary">{apiDoc.menuName} — {apiDoc.menuNameEn}</h3>
            <p className="text-xs text-text-muted">Base URL: <code className="font-mono text-violet-600">{apiDoc.baseUrl}</code> | {apiDoc.endpoints.length} endpoints</p>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-700">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>API Doc นี้สร้างไว้สำหรับ Dev — คลิกแต่ละ endpoint เพื่อดู params, response example, และ copy เป็น cURL</span>
        </div>

        {/* Endpoints */}
        <div className="space-y-2">
          {apiDoc.endpoints.map((ep, i) => (
            <EndpointCard key={`${ep.method}-${ep.path}-${i}`} ep={ep} />
          ))}
        </div>
      </div>
    </Drawer>
  );
}

/* ── Trigger button ── */
interface ApiDocButtonProps {
  onClick: () => void;
}

export function ApiDocButton({ onClick }: ApiDocButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200
        transition-colors"
      title="ดู API Documentation"
    >
      <FileCode2 size={14} />
      API Doc
    </button>
  );
}
