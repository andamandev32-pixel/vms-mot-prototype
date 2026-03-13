"use client";

import { useState, useCallback } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import {
  Database,
  Key,
  Link2,
  ChevronDown,
  ChevronUp,
  Table2,
  Rows3,
  Copy,
  Check,
  Code2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageSchema, TableDef, ColumnDef } from "@/lib/database-schema";

/* ── Column type badge color ── */
function typeBadge(type: string) {
  if (type.startsWith("VARCHAR")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (type.startsWith("INT") || type === "SERIAL") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (type === "BOOLEAN") return "bg-amber-50 text-amber-700 border-amber-200";
  if (type.startsWith("ENUM")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (type === "TEXT") return "bg-pink-50 text-pink-700 border-pink-200";
  if (type.startsWith("TIMESTAMP") || type === "DATE" || type === "TIME") return "bg-cyan-50 text-cyan-700 border-cyan-200";
  if (type === "JSON") return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

/* ── MySQL type mapping ── */
function toMysqlType(type: string): string {
  if (type === "SERIAL") return "INT AUTO_INCREMENT";
  if (type === "BOOLEAN") return "TINYINT(1)";
  if (type === "TIMESTAMP") return "TIMESTAMP";
  return type; // VARCHAR, INT, TEXT, ENUM, JSON, DATE, TIME — pass through
}

/* ── Escape MySQL string values ── */
function escapeSql(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val) || typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "\\'")}'`;
  return `'${String(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

/* ── Generate CREATE TABLE SQL ── */
function generateCreateSQL(table: TableDef): string {
  const lines: string[] = [];
  const pks: string[] = [];
  const uqs: string[] = [];

  lines.push(`-- ${table.comment}`);
  lines.push(`CREATE TABLE IF NOT EXISTS \`${table.name}\` (`);

  table.columns.forEach((col, i) => {
    let line = `  \`${col.name}\` ${toMysqlType(col.type)}`;
    if (!col.nullable) line += " NOT NULL";
    if (col.defaultValue) {
      const dv = col.defaultValue;
      if (dv === "CURRENT_TIMESTAMP") line += " DEFAULT CURRENT_TIMESTAMP";
      else if (dv === "true") line += " DEFAULT 1";
      else if (dv === "false") line += " DEFAULT 0";
      else line += ` DEFAULT '${dv}'`;
    }
    line += ` COMMENT '${col.comment.replace(/'/g, "\\'")}'`;
    if (col.isPrimaryKey) pks.push(`\`${col.name}\``);
    if (col.isUnique) uqs.push(`\`${col.name}\``);
    // trailing comma handled below
    lines.push(line + ",");
  });

  // constraints
  if (pks.length) lines.push(`  PRIMARY KEY (${pks.join(", ")}),`);
  uqs.forEach((u) => lines.push(`  UNIQUE KEY \`uq_${table.name}_${u.replace(/`/g, "")}\` (${u}),`));

  // FK constraints
  table.columns
    .filter((c) => c.isForeignKey && c.references)
    .forEach((col) => {
      const [refTable, refCol] = col.references!.split(".");
      lines.push(
        `  CONSTRAINT \`fk_${table.name}_${col.name}\` FOREIGN KEY (\`${col.name}\`) REFERENCES \`${refTable}\` (\`${refCol}\`),`
      );
    });

  // remove trailing comma from last constraint/column
  const lastIdx = lines.length - 1;
  lines[lastIdx] = lines[lastIdx].replace(/,$/, "");

  lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  return lines.join("\n");
}

/* ── Generate INSERT SQL ── */
function generateInsertSQL(table: TableDef): string {
  if (!table.seedData.length) return "";

  const cols = table.columns.map((c) => c.name);
  // Only include columns that actually appear in seed data
  const usedCols = cols.filter((c) => table.seedData.some((row) => row[c] !== undefined));
  if (!usedCols.length) return "";

  const lines: string[] = [];
  lines.push(`-- Seed data: ${table.comment}`);
  lines.push(`INSERT INTO \`${table.name}\` (${usedCols.map((c) => `\`${c}\``).join(", ")}) VALUES`);

  table.seedData.forEach((row, i) => {
    const vals = usedCols.map((c) => escapeSql(row[c]));
    const sep = i < table.seedData.length - 1 ? "," : ";";
    lines.push(`  (${vals.join(", ")})${sep}`);
  });

  return lines.join("\n");
}

/* ── Generate ALL SQL for a page ── */
function generateAllSQL(schema: PageSchema): string {
  const sections: string[] = [];
  sections.push(`-- ════════════════════════════════════════════`);
  sections.push(`-- ${schema.menuName} (${schema.menuNameEn})`);
  sections.push(`-- ════════════════════════════════════════════\n`);

  schema.tables.forEach((table) => {
    sections.push(generateCreateSQL(table));
    sections.push(""); // blank line
  });

  sections.push(`\n-- ════════════════════════════════════════════`);
  sections.push(`-- SEED DATA`);
  sections.push(`-- ════════════════════════════════════════════\n`);

  schema.tables.forEach((table) => {
    const insert = generateInsertSQL(table);
    if (insert) {
      sections.push(insert);
      sections.push("");
    }
  });

  return sections.join("\n");
}

/* ── Copy button ── */
function CopyButton({ text, label, size = "sm" }: { text: string; label?: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium transition-all",
        copied
          ? "bg-success-light text-success"
          : "bg-gray-100 text-text-secondary hover:bg-primary-50 hover:text-primary",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-2 py-1 text-[11px]"
      )}
      title={label || "คัดลอก"}
    >
      {copied ? <Check size={size === "sm" ? 13 : 11} /> : <Copy size={size === "sm" ? 13 : 11} />}
      {label && <span>{copied ? "Copied!" : label}</span>}
      {!label && copied && <span>Copied!</span>}
    </button>
  );
}

/* ── SQL Code Block ── */
function SqlCodeBlock({ sql, label }: { sql: string; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = sql.split("\n");
  const preview = lines.slice(0, 6).join("\n");
  const needsExpand = lines.length > 6;

  return (
    <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 text-gray-300">
        <span className="text-[11px] font-mono flex items-center gap-1.5">
          <Code2 size={12} />
          {label}
        </span>
        <CopyButton text={sql} size="xs" />
      </div>
      <pre className="p-3 bg-gray-900 text-gray-200 text-[11px] font-mono overflow-x-auto leading-relaxed whitespace-pre">
        {expanded || !needsExpand ? sql : preview + "\n  ..."}
      </pre>
      {needsExpand && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-1.5 bg-gray-800 text-gray-400 text-[11px] hover:text-gray-200 transition-colors"
        >
          แสดงทั้งหมด ({lines.length} lines) ▾
        </button>
      )}
    </div>
  );
}

/* ── Column row ── */
function ColumnRow({ col }: { col: ColumnDef }) {
  return (
    <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 text-sm">
      <td className="py-2 px-3 font-mono text-xs whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          {col.isPrimaryKey && <Key size={12} className="text-amber-500 shrink-0" />}
          {col.isForeignKey && <Link2 size={12} className="text-primary shrink-0" />}
          {col.isUnique && <span className="text-[10px] text-orange-500 font-bold shrink-0">UQ</span>}
          <span className={cn(col.isPrimaryKey && "font-bold text-amber-700", col.isForeignKey && "text-primary-700")}>
            {col.name}
          </span>
        </span>
      </td>
      <td className="py-2 px-3">
        <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] font-mono border", typeBadge(col.type))}>
          {col.type}
        </span>
      </td>
      <td className="py-2 px-3 text-center">
        {col.nullable ? (
          <span className="text-gray-400 text-xs">NULL</span>
        ) : (
          <span className="text-red-400 text-xs font-medium">NOT NULL</span>
        )}
      </td>
      <td className="py-2 px-3 text-xs text-text-secondary">{col.comment}</td>
      <td className="py-2 px-3 text-xs text-text-muted font-mono">
        {col.defaultValue || (col.references && (
          <span className="text-primary text-[11px]">→ {col.references}</span>
        ))}
      </td>
    </tr>
  );
}

/* ── Seed data preview ── */
function SeedDataTable({ table }: { table: TableDef }) {
  const [expanded, setExpanded] = useState(false);
  if (!table.seedData.length) return null;

  const cols = table.columns.map((c) => c.name);
  const displayRows = expanded ? table.seedData : table.seedData.slice(0, 3);

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark font-medium mb-2"
      >
        <Rows3 size={13} />
        Seed Data ({table.seedData.length} rows)
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-gray-50">
              {cols.map((c) => (
                <th key={c} className="px-2 py-1.5 text-left font-mono font-medium text-gray-600 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-blue-50/30">
                {cols.map((c) => (
                  <td key={c} className="px-2 py-1 font-mono whitespace-nowrap text-gray-700">
                    {row[c] === true ? "✅" : row[c] === false ? "❌" : row[c] === null || row[c] === undefined ? "—" : String(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!expanded && table.seedData.length > 3 && (
        <button onClick={() => setExpanded(true)} className="text-[11px] text-text-muted hover:text-primary mt-1">
          ...แสดงทั้งหมด {table.seedData.length} rows
        </button>
      )}
    </div>
  );
}

/* ── Single table card ── */
function TableCard({ table, index }: { table: TableDef; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const [showSql, setShowSql] = useState(false);

  const createSql = generateCreateSQL(table);
  const insertSql = generateInsertSQL(table);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Table2 size={16} className="text-primary" />
          <span className="font-mono font-bold text-sm text-text-primary">{table.name}</span>
          <span className="text-xs text-text-muted">({table.columns.length} cols)</span>
        </span>
        {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      {open && (
        <div className="px-4 py-3 bg-white">
          <p className="text-xs text-text-secondary mb-3 italic">{table.comment}</p>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-text-muted">
                  <th className="py-2 px-3 text-left font-medium">คอลัมน์</th>
                  <th className="py-2 px-3 text-left font-medium">ประเภท</th>
                  <th className="py-2 px-3 text-center font-medium">Null</th>
                  <th className="py-2 px-3 text-left font-medium">คำอธิบาย</th>
                  <th className="py-2 px-3 text-left font-medium">Default / Ref</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((col) => (
                  <ColumnRow key={col.name} col={col} />
                ))}
              </tbody>
            </table>
          </div>

          <SeedDataTable table={table} />

          {/* SQL toggle */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ClipboardList size={13} />
              MySQL Commands
              {showSql ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showSql && (
              <div className="space-y-2 mt-2">
                <SqlCodeBlock sql={createSql} label="CREATE TABLE" />
                {insertSql && <SqlCodeBlock sql={insertSql} label="INSERT (Seed Data)" />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Modal Component ── */
interface DatabaseSchemaModalProps {
  open: boolean;
  onClose: () => void;
  schema: PageSchema;
}

export function DatabaseSchemaModal({ open, onClose, schema }: DatabaseSchemaModalProps) {
  const allSql = generateAllSQL(schema);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`🗄️ DB Schema — ${schema.menuName}`}
      subtitle={`${schema.menuNameEn} · ${schema.tables.length} tables`}
      width="w-[720px]"
    >
      <div className="p-6 space-y-6">
        {/* Page description + Copy All SQL */}
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-primary-800">{schema.description}</p>
              <p className="text-xs text-primary-600 mt-1 font-mono">{schema.path}</p>
            </div>
            <CopyButton text={allSql} label="Copy All SQL" size="sm" />
          </div>
        </div>

        {/* Tables */}
        <div className="space-y-3">
          {schema.tables.map((table, i) => (
            <TableCard key={table.name} table={table} index={i} />
          ))}
        </div>

        {/* Relationships */}
        {schema.relationships.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-1.5">
              <Link2 size={14} className="text-primary" />
              ความสัมพันธ์ (Relationships)
            </h3>
            <div className="space-y-1.5">
              {schema.relationships.map((rel, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-text-secondary bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-primary shrink-0 mt-0.5">•</span>
                  <span className="font-mono">{rel}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h4 className="text-xs font-bold text-text-primary mb-2">Legend</h4>
          <div className="flex flex-wrap gap-3 text-[11px] text-text-secondary">
            <span className="flex items-center gap-1"><Key size={11} className="text-amber-500" /> Primary Key</span>
            <span className="flex items-center gap-1"><Link2 size={11} className="text-primary" /> Foreign Key</span>
            <span className="font-bold text-orange-500">UQ</span>
            <span>Unique</span>
            <Badge variant="pending" className="text-[10px] px-1.5 py-0">NOT NULL</Badge>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

/* ── Trigger button for Topbar area ── */
interface DbSchemaButtonProps {
  onClick: () => void;
}

export function DbSchemaButton({ onClick }: DbSchemaButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        bg-primary-50 text-primary hover:bg-primary-100 border border-primary-200
        transition-colors"
      title="ดู Database Schema"
    >
      <Database size={14} />
      <span>DB Schema</span>
    </button>
  );
}
