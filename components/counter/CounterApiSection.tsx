"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCounterApiSpec, type CounterApiEndpoint } from "@/lib/counter/counter-api-data";
import type { CounterState } from "@/components/counter/CounterStatePanel";
import { Database, Copy, Check, AlertCircle } from "lucide-react";

interface CounterApiSectionProps {
  stateType: CounterState;
}

type TabId = "request" | "response" | "error";

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider shrink-0",
        method === "GET"
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          : "bg-green-500/20 text-green-400 border border-green-500/30"
      )}
    >
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
      title="Copy JSON"
    >
      {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
    </button>
  );
}

function JsonBlock({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <div className="relative group">
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CopyButton text={json} />
      </div>
      <pre className="text-[9px] font-mono bg-gray-900 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed max-h-[200px] overflow-y-auto">
        {colorizeJson(json)}
      </pre>
    </div>
  );
}

/** Simple JSON syntax highlight using spans */
function colorizeJson(json: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(true|false|null)|(-?\d+(?:\.\d+)?)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t${lastIndex}`} className="text-gray-500">{json.slice(lastIndex, match.index)}</span>);
    }
    if (match[1]) {
      parts.push(<span key={`k${match.index}`} className="text-cyan-400">{match[1]}</span>);
      parts.push(<span key={`c${match.index}`} className="text-gray-500">:</span>);
    } else if (match[2]) {
      parts.push(<span key={`s${match.index}`} className="text-amber-300">{match[2]}</span>);
    } else if (match[3]) {
      parts.push(<span key={`b${match.index}`} className="text-purple-400">{match[3]}</span>);
    } else if (match[4]) {
      parts.push(<span key={`n${match.index}`} className="text-purple-400">{match[4]}</span>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < json.length) {
    parts.push(<span key={`e${lastIndex}`} className="text-gray-500">{json.slice(lastIndex)}</span>);
  }

  return parts;
}

function EndpointCard({ endpoint, isOnly }: { endpoint: CounterApiEndpoint; isOnly: boolean }) {
  const [activeTab, setActiveTab] = useState<TabId>(endpoint.request ? "request" : "response");
  const hasRequest = !!endpoint.request;
  const hasError = !!endpoint.errorResponse;

  const tabs: { id: TabId; label: string; available: boolean }[] = [
    { id: "request", label: "Request", available: hasRequest },
    { id: "response", label: "Response", available: true },
    { id: "error", label: "Error", available: hasError },
  ];

  return (
    <div className={cn("space-y-2", !isOnly && "pt-2 border-t border-gray-800 first:border-t-0 first:pt-0")}>
      {/* Method + Path */}
      <div className="flex items-center gap-2">
        <MethodBadge method={endpoint.method} />
        <span className="font-mono text-[10px] text-white truncate">{endpoint.path}</span>
      </div>

      {/* Summary — Thai + English */}
      <p className="text-[10px] text-gray-400">{endpoint.summary}</p>
      <p className="text-[9px] text-gray-600">{endpoint.summaryEn}</p>

      {/* Content type hint */}
      {endpoint.contentType && (
        <span className="text-[8px] font-mono text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded">
          {endpoint.contentType}
        </span>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5">
        {tabs.filter((t) => t.available).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-2 py-1 rounded-t text-[9px] font-medium transition-colors",
              activeTab === tab.id
                ? "bg-gray-900 text-white"
                : "bg-gray-800 text-gray-500 hover:text-gray-300"
            )}
          >
            {tab.id === "error" && <AlertCircle size={8} className="inline mr-0.5 -mt-px" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "request" && endpoint.request && <JsonBlock data={endpoint.request} />}
      {activeTab === "response" && <JsonBlock data={endpoint.response} />}
      {activeTab === "error" && endpoint.errorResponse && <JsonBlock data={endpoint.errorResponse} />}

      {/* Tables */}
      {endpoint.tables.length > 0 && (
        <div className="flex items-start gap-1.5">
          <Database size={10} className="text-orange-400 shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-1">
            {endpoint.tables.map((t) => (
              <span key={t} className="text-[8px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes — Thai */}
      {endpoint.notes && endpoint.notes.length > 0 && (
        <div className="space-y-0.5">
          {endpoint.notes.map((note, i) => (
            <p key={i} className="text-[9px] text-gray-500 flex items-start gap-1.5">
              <span className="text-gray-600 shrink-0">💡</span>
              <span>{note}</span>
            </p>
          ))}
        </div>
      )}

      {/* Notes — English */}
      {endpoint.notesEn && endpoint.notesEn.length > 0 && (
        <div className="space-y-0.5 border-t border-gray-800/50 pt-1">
          {endpoint.notesEn.map((note, i) => (
            <p key={`en-${i}`} className="text-[9px] text-gray-600 flex items-start gap-1.5">
              <span className="text-gray-700 shrink-0">💡</span>
              <span>{note}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CounterApiSection({ stateType }: CounterApiSectionProps) {
  const spec = getCounterApiSpec(stateType);

  if (!spec) {
    return <p className="text-gray-600 italic text-[10px]">No API data for this state</p>;
  }

  if (!spec.hasApi) {
    return (
      <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-gray-900 border border-gray-800">
        <span className="text-gray-500 shrink-0 mt-px text-[11px]">—</span>
        <div>
          <p className="text-[10px] text-gray-400 italic">{spec.noApiReason}</p>
          {spec.noApiReasonEn && <p className="text-[9px] text-gray-600 italic mt-0.5">{spec.noApiReasonEn}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {spec.endpoints.map((ep) => (
        <EndpointCard
          key={`${ep.method}-${ep.path}`}
          endpoint={ep}
          isOnly={spec.endpoints.length === 1}
        />
      ))}
    </div>
  );
}
