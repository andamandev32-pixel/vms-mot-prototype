"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import {
  ChevronDown,
  ChevronUp,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Circle,
  Diamond,
  Square,
  Hexagon,
  CircleDot,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageFlowData, FlowChart, FlowStep, FlowConnection, ValidationRule, BusinessCondition } from "@/lib/flowchart-data";

/* ── Step type styling ── */
function stepStyle(type: FlowStep["type"]) {
  switch (type) {
    case "start":
      return { bg: "bg-success-light", border: "border-success", text: "text-success", icon: <Circle size={14} /> };
    case "end":
      return { bg: "bg-error-light", border: "border-error", text: "text-error", icon: <CircleDot size={14} /> };
    case "decision":
      return { bg: "bg-warning-light", border: "border-warning", text: "text-warning", icon: <Diamond size={14} /> };
    case "process":
      return { bg: "bg-primary-50", border: "border-primary-200", text: "text-primary", icon: <Square size={14} /> };
    case "subprocess":
      return { bg: "bg-info-light", border: "border-info", text: "text-info", icon: <Hexagon size={14} /> };
    case "io":
      return { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", icon: <ArrowRight size={14} /> };
    default:
      return { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600", icon: <Square size={14} /> };
  }
}

function stepTypeLabel(type: FlowStep["type"]) {
  switch (type) {
    case "start": return "เริ่มต้น";
    case "end": return "สิ้นสุด";
    case "decision": return "เงื่อนไข";
    case "process": return "กระบวนการ";
    case "subprocess": return "กระบวนการย่อย";
    case "io": return "Input/Output";
    default: return type;
  }
}

/* ── Flowchart visual rendering ── */
function FlowchartDiagram({ chart }: { chart: FlowChart }) {
  const [expanded, setExpanded] = useState(true);

  // Build adjacency for display
  const connectionsByFrom = new Map<string, FlowConnection[]>();
  chart.connections.forEach((c) => {
    const arr = connectionsByFrom.get(c.from) || [];
    arr.push(c);
    connectionsByFrom.set(c.from, arr);
  });

  // Find start nodes
  const targetIds = new Set(chart.connections.map((c) => c.to));
  const startNodes = chart.steps.filter((s) => !targetIds.has(s.id));

  // BFS to get ordered steps
  const visited = new Set<string>();
  const orderedSteps: FlowStep[] = [];
  const queue = startNodes.map((s) => s.id);
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const step = chart.steps.find((s) => s.id === id);
    if (step) orderedSteps.push(step);
    const conns = connectionsByFrom.get(id) || [];
    conns.forEach((c) => {
      if (!visited.has(c.to)) queue.push(c.to);
    });
  }
  // Add any missed steps
  chart.steps.forEach((s) => {
    if (!visited.has(s.id)) orderedSteps.push(s);
  });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <GitBranch size={16} className="text-primary" />
          <span className="font-bold text-sm text-text-primary">{chart.title}</span>
          {chart.titleEn && (
            <span className="text-xs text-text-muted">({chart.titleEn})</span>
          )}
        </span>
        {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      {expanded && (
        <div className="px-4 py-4 bg-white">
          {chart.description && (
            <p className="text-xs text-text-secondary mb-4 italic">{chart.description}</p>
          )}

          {/* Steps as a flow diagram */}
          <div className="space-y-2">
            {orderedSteps.map((step, idx) => {
              const style = stepStyle(step.type);
              const outConns = connectionsByFrom.get(step.id) || [];

              return (
                <div key={step.id}>
                  {/* Step box */}
                  <div className={cn(
                    "flex items-start gap-3 rounded-lg border px-4 py-3",
                    style.bg, style.border
                  )}>
                    <span className={cn("mt-0.5 shrink-0", style.text)}>{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-text-primary whitespace-pre-line">{step.label}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", style.bg, style.border, style.text)}>
                          {stepTypeLabel(step.type)}
                        </span>
                      </div>
                      {step.description && (
                        <p className="text-xs text-text-muted mt-1">{step.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Arrows to next steps */}
                  {outConns.length > 0 && idx < orderedSteps.length - 1 && (
                    <div className="flex items-center gap-2 pl-6 py-1">
                      {outConns.map((conn, ci) => (
                        <span key={ci} className="inline-flex items-center gap-1 text-xs text-text-muted">
                          <ArrowRight size={12} className="text-primary" />
                          {conn.label ? (
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              conn.condition === "invalid" || conn.label === "ไม่ผ่าน" || conn.label === "ปฏิเสธ" || conn.label === "ไม่" || conn.label === "Invalid" || conn.label === "ไม่มี" || conn.label === "ไม่ได้รับอนุมัติ" || conn.label === "ไม่มีสิทธิ์" || conn.label === "เลยเวลา"
                                ? "bg-error-light text-error border-error"
                                : "bg-success-light text-success border-success"
                            )}>
                              {conn.label}
                            </span>
                          ) : (
                            <span className="text-text-muted">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connection summary */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-[11px] text-text-muted mb-2 font-medium">Connections ({chart.connections.length})</p>
            <div className="flex flex-wrap gap-1">
              {chart.connections.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-gray-50 rounded px-2 py-1 border border-gray-100">
                  <span className="font-mono text-primary">{c.from}</span>
                  <ArrowRight size={10} />
                  <span className="font-mono text-primary">{c.to}</span>
                  {c.label && <span className="text-text-muted">({c.label})</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Validation rules section ── */
function ValidationRulesSection({ rules }: { rules: ValidationRule[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-orange-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-orange-600" />
          <span className="font-bold text-sm text-text-primary">กฎ Validation</span>
          <span className="text-xs text-text-muted">({rules.length} fields)</span>
        </span>
        {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      {expanded && (
        <div className="bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-50/50 text-xs text-text-muted border-b border-orange-100">
                  <th className="py-2.5 px-4 text-left font-medium w-[180px]">ฟิลด์</th>
                  <th className="py-2.5 px-4 text-left font-medium">เงื่อนไข Validation</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-b-0 hover:bg-orange-50/30">
                    <td className="py-3 px-4 align-top">
                      <span className="text-sm font-medium text-text-primary">{rule.field}</span>
                      {rule.fieldEn && (
                        <span className="block text-[11px] text-text-muted mt-0.5">{rule.fieldEn}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <ul className="space-y-1">
                        {rule.rules.map((r, ri) => (
                          <li key={ri} className="flex items-start gap-2 text-xs text-text-secondary">
                            <CheckCircle2 size={12} className="text-orange-500 mt-0.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
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

/* ── Business conditions section ── */
function BusinessConditionsSection({ conditions }: { conditions: BusinessCondition[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-blue-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-blue-600" />
          <span className="font-bold text-sm text-text-primary">เงื่อนไขการทำงาน</span>
          <span className="text-xs text-text-muted">({conditions.length} หัวข้อ)</span>
        </span>
        {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      {expanded && (
        <div className="p-4 bg-white space-y-4">
          {conditions.map((cond, i) => (
            <div key={i} className="rounded-lg border border-blue-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-blue-50/50 border-b border-blue-100">
                <h4 className="text-sm font-bold text-text-primary">{cond.title}</h4>
                {cond.titleEn && (
                  <span className="text-[11px] text-text-muted">{cond.titleEn}</span>
                )}
                <p className="text-xs text-text-secondary mt-1">{cond.description}</p>
              </div>
              <div className="px-4 py-3">
                <ul className="space-y-1.5">
                  {cond.conditions.map((c, ci) => (
                    <li key={ci} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Legend ── */
function FlowLegend() {
  const types: FlowStep["type"][] = ["start", "process", "decision", "subprocess", "io", "end"];
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <h4 className="text-xs font-bold text-text-primary mb-2">Legend — ประเภท Step</h4>
      <div className="flex flex-wrap gap-3">
        {types.map((t) => {
          const s = stepStyle(t);
          return (
            <span key={t} className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium", s.bg, s.border, s.text)}>
              {s.icon}
              {stepTypeLabel(t)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Modal Component ── */
interface FlowchartModalProps {
  open: boolean;
  onClose: () => void;
  flowData: PageFlowData;
}

export function FlowchartModal({ open, onClose, flowData }: FlowchartModalProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`📋 Flow & Rules — ${flowData.menuName}`}
      subtitle={`${flowData.menuNameEn} · ${flowData.flowcharts.length} flows · ${flowData.validationRules.length} validations`}
      width="w-[760px]"
    >
      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <p className="text-sm text-primary-800">{flowData.summary}</p>
          <p className="text-xs text-primary-600 mt-1 font-mono">{flowData.path}</p>
        </div>

        {/* Flowcharts */}
        <div>
          <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-1.5">
            <GitBranch size={14} className="text-primary" />
            Flowcharts ({flowData.flowcharts.length})
          </h3>
          <div className="space-y-3">
            {flowData.flowcharts.map((chart) => (
              <FlowchartDiagram key={chart.id} chart={chart} />
            ))}
          </div>
        </div>

        {/* Validation Rules */}
        {flowData.validationRules.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-orange-600" />
              กฎ Validation ({flowData.validationRules.length} fields)
            </h3>
            <ValidationRulesSection rules={flowData.validationRules} />
          </div>
        )}

        {/* Business Conditions */}
        {flowData.businessConditions.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-blue-600" />
              เงื่อนไขการทำงาน ({flowData.businessConditions.length} หัวข้อ)
            </h3>
            <BusinessConditionsSection conditions={flowData.businessConditions} />
          </div>
        )}

        {/* Legend */}
        <FlowLegend />
      </div>
    </Drawer>
  );
}

/* ── Trigger button for Topbar area ── */
interface FlowRulesButtonProps {
  onClick: () => void;
}

export function FlowRulesButton({ onClick }: FlowRulesButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200
        transition-colors"
      title="ดู Flowchart & เงื่อนไข"
    >
      <FileText size={14} />
      <span>Flow & Rules</span>
    </button>
  );
}
