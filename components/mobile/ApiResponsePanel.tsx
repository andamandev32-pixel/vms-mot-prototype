"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check, Clock, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiCallLog, ApiHealthResult } from "@/lib/hooks/use-line-oa";

// ---------------------------------------------------------------------------
// API Response Panel — shown in dev mode after each API call
// ---------------------------------------------------------------------------

interface ApiResponsePanelProps {
  log: ApiCallLog | null;
  isLoading?: boolean;
  compact?: boolean;
}

export function ApiResponsePanel({ log, isLoading, compact }: ApiResponsePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!log && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="mt-2 p-2 bg-gray-900 rounded-lg border border-gray-700 text-[10px]">
        <div className="flex items-center gap-2 text-blue-400">
          <Loader2 size={10} className="animate-spin" />
          <span>Calling API...</span>
        </div>
      </div>
    );
  }

  if (!log) return null;

  const isSuccess = log.responseStatus && log.responseStatus >= 200 && log.responseStatus < 300;
  const isAuthError = log.responseStatus === 401 || log.responseStatus === 403;
  const statusColor = isSuccess ? "text-green-400" : isAuthError ? "text-yellow-400" : "text-red-400";

  const handleCopy = () => {
    const curlCmd = `curl -X ${log.method} '${log.url}'${
      log.requestBody ? ` -H 'Content-Type: application/json' -d '${JSON.stringify(log.requestBody)}'` : ""
    }`;
    navigator.clipboard.writeText(curlCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (compact) {
    return (
      <div className={cn("mt-1.5 px-2 py-1 rounded-md text-[9px] font-mono flex items-center gap-2",
        isSuccess ? "bg-green-950/40 text-green-400 border border-green-900/50"
        : isAuthError ? "bg-yellow-950/40 text-yellow-400 border border-yellow-900/50"
        : "bg-red-950/40 text-red-400 border border-red-900/50"
      )}>
        <span className="font-bold">{log.responseStatus}</span>
        <span className="text-gray-500">{log.method}</span>
        <span className="truncate flex-1 text-gray-400">{log.url}</span>
        {log.latencyMs && <span className="text-gray-500 shrink-0">{log.latencyMs}ms</span>}
      </div>
    );
  }

  return (
    <div className="mt-2 bg-gray-900 rounded-lg border border-gray-700 text-[10px] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-800/50 transition-colors"
      >
        {expanded ? <ChevronDown size={10} className="text-gray-500" /> : <ChevronRight size={10} className="text-gray-500" />}
        <span className={cn("font-bold font-mono", statusColor)}>{log.responseStatus || "ERR"}</span>
        <span className="text-gray-500 font-mono">{log.method}</span>
        <span className="text-gray-400 font-mono truncate flex-1 text-left">{log.url}</span>
        {log.latencyMs != null && (
          <span className="flex items-center gap-0.5 text-gray-500 shrink-0">
            <Clock size={8} />
            {log.latencyMs}ms
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          className="p-0.5 hover:bg-gray-700 rounded"
          title="Copy as cURL"
        >
          {copied ? <Check size={9} className="text-green-400" /> : <Copy size={9} className="text-gray-500" />}
        </button>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-800 px-2.5 py-2 space-y-2">
          {log.requestBody != null && (
            <div>
              <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Request Body</p>
              <pre className="bg-gray-950 rounded p-1.5 text-gray-300 font-mono overflow-x-auto max-h-[120px] overflow-y-auto text-[9px] leading-relaxed">
                {JSON.stringify(log.requestBody, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <p className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Response</p>
            <pre className={cn("rounded p-1.5 font-mono overflow-x-auto max-h-[150px] overflow-y-auto text-[9px] leading-relaxed",
              isSuccess ? "bg-green-950/30 text-green-300" : "bg-red-950/30 text-red-300"
            )}>
              {log.responseBody ? JSON.stringify(log.responseBody, null, 2) : log.error || "No response"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Health Badge — small inline indicator
// ---------------------------------------------------------------------------

interface ApiHealthBadgeProps {
  result: ApiHealthResult;
  showLabel?: boolean;
}

export function ApiHealthBadge({ result, showLabel }: ApiHealthBadgeProps) {
  const config = {
    ok: { color: "bg-green-500", textColor: "text-green-600", label: "OK", icon: CheckCircle2 },
    error: { color: "bg-red-500", textColor: "text-red-600", label: "Error", icon: XCircle },
    "auth-required": { color: "bg-yellow-500", textColor: "text-yellow-600", label: "Auth", icon: AlertCircle },
    pending: { color: "bg-blue-500 animate-pulse", textColor: "text-blue-600", label: "Testing...", icon: Loader2 },
    untested: { color: "bg-gray-400", textColor: "text-gray-500", label: "Untested", icon: Clock },
  }[result.status];

  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1">
      <div className={cn("w-2 h-2 rounded-full shrink-0", config.color)} />
      {showLabel && (
        <span className={cn("text-[9px] font-medium", config.textColor)}>
          {result.statusCode ? `${result.statusCode}` : config.label}
          {result.latencyMs != null && <span className="text-gray-400 ml-0.5">{result.latencyMs}ms</span>}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Health Summary — compact row of dots for sidebar
// ---------------------------------------------------------------------------

interface ApiHealthSummaryProps {
  results: ApiHealthResult[];
  loading?: boolean;
}

export function ApiHealthSummary({ results, loading }: ApiHealthSummaryProps) {
  if (!results.length && !loading) return null;

  const counts = {
    ok: results.filter(r => r.status === "ok").length,
    error: results.filter(r => r.status === "error").length,
    auth: results.filter(r => r.status === "auth-required").length,
    pending: results.filter(r => r.status === "pending").length,
  };

  return (
    <div className="flex items-center gap-1.5">
      {loading && <Loader2 size={10} className="animate-spin text-blue-400" />}
      <div className="flex gap-0.5">
        {results.map((r, i) => (
          <div
            key={i}
            className={cn("w-2 h-2 rounded-full", {
              "bg-green-500": r.status === "ok",
              "bg-red-500": r.status === "error",
              "bg-yellow-500": r.status === "auth-required",
              "bg-blue-500 animate-pulse": r.status === "pending",
              "bg-gray-400": r.status === "untested",
            })}
            title={`${r.endpoint}: ${r.status}${r.statusCode ? ` (${r.statusCode})` : ""}${r.latencyMs ? ` ${r.latencyMs}ms` : ""}`}
          />
        ))}
      </div>
      <span className="text-[9px] text-gray-500">
        {counts.ok}/{results.length}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Health List — detailed list for right panel
// ---------------------------------------------------------------------------

interface ApiHealthListProps {
  results: ApiHealthResult[];
  onTest?: () => void;
  testing?: boolean;
}

export function ApiHealthList({ results, onTest, testing }: ApiHealthListProps) {
  return (
    <div className="space-y-1">
      {onTest && (
        <button
          onClick={onTest}
          disabled={testing}
          className={cn(
            "w-full px-2 py-1 rounded text-[10px] font-bold transition-colors",
            testing
              ? "bg-blue-900/30 text-blue-400 cursor-wait"
              : "bg-green-900/30 text-green-400 hover:bg-green-900/50"
          )}
        >
          {testing ? "Testing..." : "Test All APIs"}
        </button>
      )}
      {results.map((r, i) => (
        <div key={i} className="flex items-center gap-2 px-1.5 py-1 rounded bg-gray-900/50">
          <ApiHealthBadge result={r} />
          <span className="text-[9px] text-gray-400 font-mono truncate flex-1">{r.endpoint}</span>
          {r.latencyMs != null && (
            <span className="text-[8px] text-gray-600 shrink-0">{r.latencyMs}ms</span>
          )}
        </div>
      ))}
      {results.length === 0 && (
        <p className="text-[9px] text-gray-600 text-center py-2">No endpoints for this state</p>
      )}
    </div>
  );
}
