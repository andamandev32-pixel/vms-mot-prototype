/**
 * OpenAPI 3.0 Spec Generator
 * แปลงข้อมูล API documentation จาก TypeScript data sources → OpenAPI 3.0.0 JSON
 */

import { allApiDocs, type ApiEndpoint, type ApiParam } from "@/lib/api-doc-data";
import { getAllApiSpecs } from "@/lib/kiosk/kiosk-api-data";
import { getAllCounterApiSpecs } from "@/lib/counter/counter-api-data";
import { lineApiEndpoints } from "@/lib/line-oa-flow-data";

// ===== TYPES =====

interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: { url: string; description: string }[];
  tags: { name: string; description: string }[];
  paths: Record<string, Record<string, unknown>>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
}

// ===== HELPERS =====

/** Convert :param to {param} for OpenAPI path format */
function normalizePath(path: string): string {
  return path.replace(/:(\w+)/g, "{$1}");
}

/** Map TypeScript type string to OpenAPI type */
function mapType(type: string): { type: string; items?: { type: string } } {
  const t = type.toLowerCase().replace(/\s/g, "");
  if (t === "number" || t === "integer") return { type: "integer" };
  if (t === "boolean") return { type: "boolean" };
  if (t.endsWith("[]") || t.startsWith("array")) return { type: "array", items: { type: "string" } };
  if (t === "object") return { type: "object" };
  return { type: "string" };
}

/** Infer OpenAPI schema from an example value */
function inferSchema(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { type: "string" };
  if (typeof value === "string") return { type: "string" };
  if (typeof value === "number") return { type: Number.isInteger(value) ? "integer" : "number" };
  if (typeof value === "boolean") return { type: "boolean" };
  if (Array.isArray(value)) {
    if (value.length > 0) {
      return { type: "array", items: inferSchema(value[0]) };
    }
    return { type: "array", items: { type: "string" } };
  }
  if (typeof value === "object") {
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      properties[k] = inferSchema(v);
    }
    return { type: "object", properties };
  }
  return { type: "string" };
}

/** Extract path parameters from OpenAPI-formatted path */
function extractPathParams(path: string): string[] {
  const matches = path.match(/\{(\w+)\}/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
}

/** Map auth level to security requirement */
function authToSecurity(auth: string, context?: "kiosk" | "counter" | "line"): Record<string, unknown>[] {
  if (auth === "public") return [];
  if (auth === "webhook") return [{ lineSignature: [] }];
  if (context === "kiosk") return [{ kioskToken: [] }];
  if (context === "counter") return [{ staffCookie: [] }];
  if (auth === "admin") return [{ staffCookie: [] }, { staffBearer: [] }];
  // "user" — could be staff or visitor
  return [{ staffCookie: [] }, { staffBearer: [] }, { visitorCookie: [] }];
}

/** Parse a JSON string safely, return undefined on failure */
function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

// ===== PAGE ID → TAG MAPPING =====

const pageIdToTag: Record<string, string> = {
  "user-management": "users",
  "my-profile": "users",
  "auth": "auth",
  "visit-purposes": "visit-purposes",
  "locations": "locations",
  "access-zones": "access-zones",
  "approver-groups": "approver-groups",
  "staff": "staff",
  "service-points": "service-points",
  "document-types": "document-types",
  "business-hours": "business-hours",
  "notification-templates": "notification-templates",
  "visit-slips": "visit-slips",
  "pdpa-consent": "pdpa",
  "appointments": "appointments",
  "appointment-groups": "appointments",
  "search": "search",
  "blocklist": "blocklist",
  "reports": "reports",
  "dashboard": "dashboard",
  "visit-entries": "entries",
  "email-system": "email",
  "line-oa-config": "line-oa",
  "line-message-templates": "line-oa",
  "liff": "liff",
};

// ===== CONVERTERS =====

/** Convert ApiParam[] to OpenAPI parameters (query/path) */
function apiParamsToParameters(
  params: ApiParam[] | undefined,
  location: "query" | "path"
): unknown[] {
  if (!params || params.length === 0) return [];
  return params.map((p) => ({
    name: p.name,
    in: location,
    required: location === "path" ? true : p.required,
    description: p.description,
    schema: mapType(p.type),
  }));
}

/** Convert ApiParam[] to OpenAPI requestBody schema */
function apiParamsToRequestBody(params: ApiParam[] | undefined): unknown | undefined {
  if (!params || params.length === 0) return undefined;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const p of params) {
    properties[p.name] = { ...mapType(p.type), description: p.description };
    if (p.required) required.push(p.name);
  }
  return {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    },
  };
}

/** Convert example object to OpenAPI requestBody */
function objectToRequestBody(obj: Record<string, unknown> | undefined): unknown | undefined {
  if (!obj) return undefined;
  return {
    required: true,
    content: {
      "application/json": {
        schema: inferSchema(obj),
        example: obj,
      },
    },
  };
}

/** Build response object from example */
function buildResponse(example: unknown): Record<string, unknown> {
  return {
    "200": {
      description: "Successful response",
      content: {
        "application/json": {
          ...(example ? { schema: inferSchema(example), example } : { schema: { type: "object" } }),
        },
      },
    },
    "400": { description: "Bad Request" },
    "401": { description: "Unauthorized" },
    "404": { description: "Not Found" },
  };
}

// ===== MAIN GENERATOR =====

export function generateOpenAPISpec(): OpenAPISpec {
  const paths: Record<string, Record<string, unknown>> = {};
  const processed = new Set<string>(); // "METHOD /path" dedup key

  // ──── 1. General API docs (richest param info — process first) ────
  for (const doc of allApiDocs) {
    const tag = pageIdToTag[doc.pageId] || doc.pageId;
    for (const ep of doc.endpoints) {
      const path = normalizePath(ep.path);
      const method = ep.method.toLowerCase();
      const key = `${method} ${path}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const pathParams = extractPathParams(path);
      const parameters: unknown[] = [
        ...apiParamsToParameters(ep.pathParams, "path"),
        ...apiParamsToParameters(ep.queryParams, "query"),
      ];

      // Auto-add path params if not already defined
      for (const pp of pathParams) {
        if (!ep.pathParams?.some((p) => p.name === pp)) {
          parameters.push({
            name: pp,
            in: "path",
            required: true,
            schema: { type: pp.toLowerCase().includes("id") ? "integer" : "string" },
          });
        }
      }

      const responseExample = ep.responseExample ? tryParseJson(ep.responseExample) : undefined;

      const operation: Record<string, unknown> = {
        tags: [tag],
        summary: ep.summaryEn,
        description: ep.summary,
        operationId: `${method}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`,
        ...(parameters.length > 0 ? { parameters } : {}),
        ...(ep.requestBody && ep.requestBody.length > 0
          ? { requestBody: apiParamsToRequestBody(ep.requestBody) }
          : {}),
        responses: buildResponse(responseExample),
        security: authToSecurity(ep.auth),
      };

      if (ep.notes && ep.notes.length > 0) {
        operation.description = `${ep.summary}\n\n${ep.notes.join("\n")}`;
      }

      if (!paths[path]) paths[path] = {};
      paths[path][method] = operation;
    }
  }

  // ──── 2. Kiosk API specs ────
  for (const spec of getAllApiSpecs()) {
    if (!spec.hasApi) continue;
    for (const ep of spec.endpoints) {
      const path = normalizePath(ep.path);
      const method = ep.method.toLowerCase();
      const key = `${method} ${path}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const pathParams = extractPathParams(path);
      const parameters: unknown[] = pathParams.map((pp) => ({
        name: pp,
        in: "path",
        required: true,
        schema: { type: pp.toLowerCase().includes("id") ? "integer" : "string" },
      }));

      // Public kiosk endpoints: config + PDPA (no auth required)
      const isPublicEndpoint =
        (path.includes("/kiosk/") && path.includes("/config")) ||
        path.startsWith("/api/kiosk/pdpa/");

      const operation: Record<string, unknown> = {
        tags: ["kiosk"],
        summary: ep.summaryEn,
        description: ep.summary + (ep.notesEn ? `\n\n${ep.notesEn.join("\n")}` : ""),
        operationId: `kiosk_${method}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`,
        ...(parameters.length > 0 ? { parameters } : {}),
        ...(ep.request ? { requestBody: objectToRequestBody(ep.request as Record<string, unknown>) } : {}),
        responses: buildResponse(ep.response),
        security: isPublicEndpoint ? [] : authToSecurity("user", "kiosk"),
      };

      if (!paths[path]) paths[path] = {};
      paths[path][method] = operation;
    }
  }

  // ──── 3. Counter API specs ────
  for (const spec of getAllCounterApiSpecs()) {
    if (!spec.hasApi) continue;
    for (const ep of spec.endpoints) {
      const path = normalizePath(ep.path);
      const method = ep.method.toLowerCase();
      const key = `${method} ${path}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const pathParams = extractPathParams(path);
      const parameters: unknown[] = pathParams.map((pp) => ({
        name: pp,
        in: "path",
        required: true,
        schema: { type: pp.toLowerCase().includes("id") ? "integer" : "string" },
      }));

      const operation: Record<string, unknown> = {
        tags: ["counter"],
        summary: ep.summaryEn,
        description: ep.summary + (ep.notesEn ? `\n\n${ep.notesEn.join("\n")}` : ""),
        operationId: `counter_${method}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`,
        ...(parameters.length > 0 ? { parameters } : {}),
        ...(ep.request ? { requestBody: objectToRequestBody(ep.request as Record<string, unknown>) } : {}),
        responses: buildResponse(ep.response),
        security: authToSecurity("user", "counter"),
      };

      if (!paths[path]) paths[path] = {};
      paths[path][method] = operation;
    }
  }

  // ──── 4. LINE OA API endpoints ────
  for (const ep of lineApiEndpoints) {
    const path = normalizePath(ep.path);
    const method = ep.method.toLowerCase();
    const key = `${method} ${path}`;
    if (processed.has(key)) continue;
    processed.add(key);

    const pathParams = extractPathParams(path);
    const parameters: unknown[] = [
      ...pathParams.map((pp) => ({
        name: pp,
        in: "path",
        required: true,
        schema: { type: pp.toLowerCase().includes("id") ? "integer" : "string" },
      })),
      ...apiParamsToParameters(ep.queryParams, "query"),
    ];

    const responseExample = ep.responseExample ? tryParseJson(ep.responseExample) : undefined;

    const operation: Record<string, unknown> = {
      tags: ["line-oa"],
      summary: ep.summaryEn,
      description: ep.summary + (ep.notes ? `\n\n${ep.notes.join("\n")}` : ""),
      operationId: `line_${method}_${path.replace(/[^a-zA-Z0-9]/g, "_")}`,
      ...(parameters.length > 0 ? { parameters } : {}),
      ...(ep.requestBody && ep.requestBody.length > 0
        ? { requestBody: apiParamsToRequestBody(ep.requestBody) }
        : {}),
      responses: buildResponse(responseExample),
      security: authToSecurity(ep.auth, "line"),
    };

    if (!paths[path]) paths[path] = {};
    paths[path][method] = operation;
  }

  // ──── Assemble spec ────
  return {
    openapi: "3.0.0",
    info: {
      title: "eVMS API — Visitor Management System",
      version: "1.0.0",
      description:
        "ระบบจัดการผู้มาติดต่อ กระทรวงการท่องเที่ยวและกีฬา\n\n" +
        "API สำหรับทดสอบการทำงานของ Kiosk / LINE OA / Counter และระบบหลังบ้าน",
    },
    servers: [{ url: "/", description: "Current server" }],
    tags: [
      { name: "kiosk", description: "Kiosk Device API — Device Token Auth" },
      { name: "counter", description: "Counter/Service Point API — Staff Cookie Auth" },
      { name: "line-oa", description: "LINE OA Integration — Webhook & Push Message" },
      { name: "liff", description: "LIFF API — LINE Frontend Registration & Auth" },
      { name: "auth", description: "Authentication (Staff & Visitor)" },
      { name: "appointments", description: "Appointment Management" },
      { name: "entries", description: "Visit Entries (Check-in / Check-out)" },
      { name: "users", description: "User & Profile Management" },
      { name: "staff", description: "Staff Management" },
      { name: "search", description: "Search (Visitors, Appointments, Contacts)" },
      { name: "blocklist", description: "Blocklist Management" },
      { name: "service-points", description: "Service Points (Kiosk & Counter config)" },
      { name: "visit-purposes", description: "Visit Purposes & Department Rules" },
      { name: "locations", description: "Buildings, Floors, Departments" },
      { name: "access-zones", description: "Access Zone Management" },
      { name: "approver-groups", description: "Approver Groups" },
      { name: "document-types", description: "Document Types" },
      { name: "business-hours", description: "Business Hours & Holidays" },
      { name: "notification-templates", description: "Notification Templates" },
      { name: "visit-slips", description: "Visit Slip Configuration" },
      { name: "pdpa", description: "PDPA Consent" },
      { name: "email", description: "Email Configuration & Logs" },
      { name: "reports", description: "Reports & Export" },
      { name: "dashboard", description: "Dashboard & KPIs" },
    ],
    paths,
    components: {
      securitySchemes: {
        staffCookie: {
          type: "apiKey",
          in: "cookie",
          name: "evms_session",
          description: "Staff JWT session cookie",
        },
        staffBearer: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Staff JWT token (Authorization: Bearer <token>) — ได้จาก POST /api/auth/login",
        },
        visitorCookie: {
          type: "apiKey",
          in: "cookie",
          name: "evms_visitor_session",
          description: "Visitor JWT session cookie",
        },
        kioskToken: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "kvms_...",
          description: "Kiosk device token (Authorization: Bearer kvms_...)",
        },
        lineSignature: {
          type: "apiKey",
          in: "header",
          name: "X-Line-Signature",
          description: "HMAC-SHA256 signature of request body (LINE Webhook)",
        },
      },
      schemas: {},
    },
  };
}
