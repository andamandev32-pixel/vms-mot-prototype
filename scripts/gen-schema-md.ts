import { allPageSchemas, type PageSchema, type TableDef, type ColumnDef } from "../lib/database-schema";
import * as fs from "fs";

function renderColumn(c: ColumnDef): string {
  let namePrefix = "";
  if (c.isPrimaryKey) namePrefix = "**" + c.name + "** 🔑";
  else if (c.isForeignKey) namePrefix = c.name + " 🔗";
  else if (c.isUnique) namePrefix = c.name + " 🔒";
  else namePrefix = c.name;

  const nullable = c.nullable ? "✓" : "✗";
  const def = c.defaultValue ? ` | ${c.defaultValue}` : "";
  return `| ${namePrefix} | ${c.type} | ${nullable} | ${c.comment}${def} |`;
}

function renderSeedTable(table: TableDef): string {
  if (!table.seedData || table.seedData.length === 0) return "";

  const keys = Object.keys(table.seedData[0]);
  const header = `| ${keys.join(" | ")} |`;
  const sep = `|${keys.map(() => "----").join("|")}|`;

  const maxRows = 10;
  const showRows = table.seedData.slice(0, maxRows);
  const rows = showRows.map((row) => {
    return `| ${keys.map((k) => {
      const v = row[k];
      if (v === null) return "—";
      if (v === true) return "✅";
      if (v === false) return "❌";
      if (Array.isArray(v)) return JSON.stringify(v);
      return String(v);
    }).join(" | ")} |`;
  });

  const totalLabel = table.seedData.length > maxRows
    ? `📦 Seed Data (${table.seedData.length} rows — แสดง ${maxRows} แรก)`
    : `📦 Seed Data (${table.seedData.length} rows)`;

  return `
<details>
<summary>${totalLabel}</summary>

${header}
${sep}
${rows.join("\n")}
${table.seedData.length > maxRows ? `\n*(... อีก ${table.seedData.length - maxRows} rows)*` : ""}
</details>`;
}

function renderTable(table: TableDef, sectionNum: string): string {
  const colHeader = table.columns.some((c) => c.defaultValue)
    ? `| คอลัมน์ | ประเภท | Null | คำอธิบาย | Default |
|---------|--------|------|----------|---------|`
    : `| คอลัมน์ | ประเภท | Null | คำอธิบาย |
|---------|--------|------|----------|`;

  const colRows = table.columns.map(renderColumn);

  return `### ${sectionNum} \`${table.name}\` — ${table.comment}

${colHeader}
${colRows.join("\n")}
${renderSeedTable(table)}`;
}

function renderPage(page: PageSchema, idx: number): string {
  const sectionNum = idx + 1;
  const lines: string[] = [];

  lines.push(`## ${sectionNum}. ${page.menuName}`);
  lines.push("");
  lines.push(`**เมนู:** ${page.menuName}`);
  lines.push(`**Path:** \`${page.path}\``);
  lines.push(`**คำอธิบาย:** ${page.description}`);
  lines.push("");

  page.tables.forEach((table, tIdx) => {
    lines.push(renderTable(table, `${sectionNum}.${tIdx + 1}`));
    lines.push("");
  });

  if (page.relationships.length > 0) {
    lines.push("**ความสัมพันธ์:**");
    page.relationships.forEach((r) => {
      lines.push(`- ${r}`);
    });
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

// Build the document
let totalTables = 0;
allPageSchemas.forEach((p) => (totalTables += p.tables.length));

const tocRows = allPageSchemas.map((p, i) => {
  return `| ${i + 1} | [${p.menuName}](#${i + 1}-${p.menuName.replace(/\s+/g, "-").replace(/[/()]/g, "")}) | ${p.tables.length} ตาราง | \`${p.path}\` |`;
});

const header = `# eVMS Database Schema — Settings Module

> **สำหรับ DEV**: เอกสารนี้แสดง Schema ฐานข้อมูลทั้งหมดที่ใช้ในส่วนตั้งค่า (Settings)
> ออกแบบจาก Mock-up Data ที่ใช้ใน Prototype — พร้อมตัวอย่างข้อมูล Seed
> **Auto-generated from \`lib/database-schema.ts\`** — อย่าแก้ไขไฟล์นี้โดยตรง

---

## สารบัญ

| # | เมนู | ตาราง | Path |
|---|------|-------|------|
${tocRows.join("\n")}

**รวมทั้งหมด: ${totalTables} ตาราง**

---

`;

const body = allPageSchemas.map((p, i) => renderPage(p, i)).join("");

const legend = `## Legend

| สัญลักษณ์ | ความหมาย |
|-----------|----------|
| 🔑 | Primary Key |
| 🔗 | Foreign Key |
| 🔒 | Unique Constraint |
| M:N | Many-to-Many relationship |
| ✅ / ❌ | true / false |
| ⭐ | Default value |

---

> **หมายเหตุ:** Schema นี้ออกแบบจาก Mock-up ของ Prototype สำหรับใช้สื่อสารกับทีม DEV
> สามารถดูรายละเอียด schema เต็มพร้อม seed data ได้ที่ \`lib/database-schema.ts\`
> หรือกดปุ่ม 🗄️ DB Schema ที่ header ของแต่ละหน้าตั้งค่าใน Web App
`;

const output = header + body + legend;
fs.writeFileSync("docs/database-schema.md", output, "utf8");
console.log(`Generated docs/database-schema.md — ${totalTables} tables across ${allPageSchemas.length} pages`);
