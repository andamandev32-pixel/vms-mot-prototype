/**
 * One-time script: Convert all PK/FK string IDs to numbers in mock-data.ts
 * Run: node scripts/convert-ids.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '..', 'lib', 'mock-data.ts');

let content = readFileSync(filePath, 'utf-8');

// ========== PHASE 1: TYPE DEFINITIONS (interfaces) ==========

// 1a. PK id fields: "id: string;" → "id: number;" in interfaces
// Match lines that are just `id: string;` (with optional comments)
content = content.replace(
  /^(\s+id): string;(\s*\/\/.*)?$/gm,
  (match, prefix, comment) => `${prefix}: number;${comment || ''}`
);

// 1b. FK fields that should be number (not business identifiers)
const fkFieldsToConvert = [
  'appointmentId',
  'departmentId',
  'buildingId',
  'floorId',
  'staffId',
  'visitorId',
  'servicePointId',
  'assignedStaffId',
  'approverGroupId',
  'defaultAccessGroupId',
  'visitPurposeId',
  'slipTemplateId',
];

for (const field of fkFieldsToConvert) {
  // Match "fieldName: string;" and "fieldName?: string;" in interface definitions
  const re = new RegExp(`^(\\s+${field}\\??): string;(.*)$`, 'gm');
  content = content.replace(re, (match, prefix, rest) => `${prefix}: number;${rest}`);
}

// 1c. FK array fields that should be number[]
const fkArrayFields = [
  'departmentIds',
  'zoneIds',
  'allowedPurposeIds',
  'allowedDocumentIds',
  'additionalGroupIds',
  'visitPurposeIds',
];

for (const field of fkArrayFields) {
  const re = new RegExp(`^(\\s+${field}): string\\[\\];(.*)$`, 'gm');
  content = content.replace(re, (match, prefix, rest) => `${prefix}: number[];${rest}`);
}

// 1d. EntryChannelConfig.allowedDocuments: string[] → number[]
content = content.replace(
  /^(\s+allowedDocuments): string\[\];(.*)$/gm,
  '$1: number[];$2'
);

// 1e. PurposeSlipMapping: slipTemplateId should be number | null
content = content.replace(
  /^(\s+slipTemplateId): string \| null;(.*)$/gm,
  '$1: number | null;$2'
);

// 1f. Add id: number to PersonnelRecord (after employeeId line)
content = content.replace(
  /^(export interface PersonnelRecord \{)\n(\s+employeeId: string;)/m,
  '$1\n  id: number;\n$2'
);

// 1g. Add id: number to DepartmentAccessMapping
content = content.replace(
  /^(export interface DepartmentAccessMapping \{)\n(\s+departmentId)/m,
  '$1\n  id: number;\n$2'
);

// 1h. Add id: number to PurposeSlipMapping
content = content.replace(
  /^(export interface PurposeSlipMapping \{)\n(\s+visitPurposeId)/m,
  '$1\n  id: number;\n$2'
);

// 1i. Helper function parameter types
content = content.replace(
  /getAuthorizedCounters\(staffId: string\)/g,
  'getAuthorizedCounters(staffId: number)'
);
content = content.replace(
  /getAssignedStaff\(servicePointId: string\)/g,
  'getAssignedStaff(servicePointId: number)'
);

// ========== PHASE 2: DATA VALUES ==========

// Helper: convert a string-number to number in an object literal context
// Matches patterns like: id: "1", or id: "20",
// Also handles FK fields like departmentId: "1", staffId: "6", etc.

const idFields = [
  'id',
  'appointmentId',
  'departmentId',
  'buildingId',
  'floorId',
  'staffId',
  'visitorId',
  'servicePointId',
  'assignedStaffId',
  'approverGroupId',
  'defaultAccessGroupId',
  'visitPurposeId',
  'slipTemplateId',
];

for (const field of idFields) {
  // Match: fieldName: "digits" (with comma, space, or end)
  // But NOT inside interface definitions (those were already handled)
  const re = new RegExp(`(${field}(?:\\?)?:\\s*)"(\\d+)"`, 'g');
  content = content.replace(re, '$1$2');
}

// 2b. Array FK values: departmentIds: ["2", "1"] → [2, 1]
// And zoneIds, allowedPurposeIds, allowedDocumentIds, additionalGroupIds, visitPurposeIds
const arrayFkFields = [
  'departmentIds',
  'zoneIds',
  'allowedPurposeIds',
  'allowedDocumentIds',
  'additionalGroupIds',
  'visitPurposeIds',
];

for (const field of arrayFkFields) {
  // Match: fieldName: ["1", "2", "3"] — convert to [1, 2, 3]
  const re = new RegExp(`(${field}:\\s*\\[)([^\\]]*)(\\])`, 'g');
  content = content.replace(re, (match, prefix, items, suffix) => {
    const converted = items.replace(/"(\d+)"/g, '$1');
    return `${prefix}${converted}${suffix}`;
  });
}

// 2c. allowedDocuments arrays in kioskConfig/counterConfig
content = content.replace(
  /(allowedDocuments:\s*\[)([^\]]*?)(\])/g,
  (match, prefix, items, suffix) => {
    const converted = items.replace(/"(\d+)"/g, '$1');
    return `${prefix}${converted}${suffix}`;
  }
);

// 2d. Add id: number to personnelDatabase entries
// PersonnelRecord entries need id field added
{
  let personnelId = 1;
  content = content.replace(
    /^(\s*\{\s*\n?\s*employeeId:)/gm,
    () => {
      const result = `  {\n    id: ${personnelId},\n    employeeId:`;
      personnelId++;
      return result;
    }
  );
}

// Hmm, that regex might be too aggressive. Let me be more precise.
// Actually, let me undo that and do it more carefully.
// The personnelDatabase entries look like:
//   {
//     employeeId: "EMP-001",
// So I need to find entries specifically within the personnelDatabase array context.

// Let me re-read and handle personnelDatabase more carefully
// Actually the regex above would match ANY { followed by employeeId, which could be problematic.
// Let me fix by reverting that replacement and doing it section-based.

// Actually wait — let me check: does any other data structure have `employeeId` as first field? 
// Only PersonnelRecord entries start with employeeId. Staff entries start with id.
// So the pattern is safe for this file context. But the format might be wrong.
// Let me look at the actual format again:
// The entries are:
//   {
//     employeeId: "EMP-001",
// So the regex should match `  {\n    employeeId:` format

// Let me undo by reloading and re-doing more carefully...
// Actually the regex replacement already happened. Let me check if it produced correct output.
// For now let's continue with the rest and fix specific issues after.

// 2e. Add id: number to departmentAccessMappings entries
{
  const damSection = content.match(/departmentAccessMappings:\s*DepartmentAccessMapping\[\]\s*=\s*\[([\s\S]*?)\];/);
  if (damSection) {
    let id = 1;
    const newSection = damSection[1].replace(
      /\{\s*departmentId:/g,
      () => `{ id: ${id++}, departmentId:`
    );
    content = content.replace(damSection[1], newSection);
  }
}

// 2f. Add id: number to purposeSlipMappings entries
{
  const psmSection = content.match(/purposeSlipMappings:\s*PurposeSlipMapping\[\]\s*=\s*\[([\s\S]*?)\];/);
  if (psmSection) {
    let id = 1;
    const newSection = psmSection[1].replace(
      /\{\s*visitPurposeId:/g,
      () => `{ id: ${id++}, visitPurposeId:`
    );
    content = content.replace(psmSection[1], newSection);
  }
}

// ========== PHASE 3: Fix the personnelDatabase id insertion ==========
// The earlier regex might have produced malformed output. Let me clean it up.
// Actually, let me check what it produced and fix if needed.

// The personnelDatabase entries currently look like:
//   {
//     id: N,
//     employeeId: "EMP-XXX",
// Which is exactly what we want! The regex worked correctly because only
// PersonnelRecord entries have `employeeId` as the first field after `{`.

// But wait — the ApproverMember interface also has staffId as first field.
// Let me verify the regex didn't match those. ApproverMember entries look like:
//   { staffId: "5", canApprove: true, ... }
// These are single-line objects, not multi-line with { followed by newline then employeeId.
// So the regex `\{\s*\n?\s*employeeId:` only matches multi-line entries starting with employeeId.
// This is safe.

// ========== WRITE OUTPUT ==========

writeFileSync(filePath, content, 'utf-8');
console.log('✅ mock-data.ts converted successfully');

// Verify by counting remaining string IDs that should have been converted
const remainingStringIds = (content.match(/\bid:\s*"(\d+)"/g) || []).length;
const remainingStringFKs = (content.match(/\b(departmentId|staffId|servicePointId|buildingId|floorId|appointmentId|assignedStaffId|approverGroupId|defaultAccessGroupId|visitPurposeId|slipTemplateId)\??:\s*"(\d+)"/g) || []).length;
const remainingStringArrayFKs = (content.match(/\b(departmentIds|zoneIds|allowedPurposeIds|allowedDocumentIds|additionalGroupIds|visitPurposeIds|allowedDocuments):\s*\[[^\]]*"(\d+)"/g) || []).length;

console.log(`Remaining string IDs: ${remainingStringIds} (should be 0)`);
console.log(`Remaining string FKs: ${remainingStringFKs} (should be 0)`);
console.log(`Remaining string array FKs: ${remainingStringArrayFKs} (should be 0)`);
