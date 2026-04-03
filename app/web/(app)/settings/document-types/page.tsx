"use client";

import { useState } from "react";
import {
  useDocumentTypes,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
} from "@/lib/hooks";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Settings,
  FileText,
  Plus,
  Pencil,
  Check,
  X,
  Info,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  documentTypes,
  type DocumentType,
} from "@/lib/mock-data";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function DocumentTypesSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("document-types")!;
  const flowData = getFlowByPageId("document-types")!;
  const apiDoc = getApiDocByPageId("document-types");
  /* API hooks */
  const { data: rawDocTypes, isLoading } = useDocumentTypes();
  const items: DocumentType[] = ((rawDocTypes as any)?.documentTypes ?? []).map((d: any) => ({ ...d, order: d.sortOrder ?? d.order })) as DocumentType[];
  const createMut = useCreateDocumentType();
  const updateMut = useUpdateDocumentType();
  const deleteMut = useDeleteDocumentType();

  const [drawer, setDrawer] = useState<{ mode: "add" | "edit"; item?: DocumentType } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalActive = items.filter((d) => d.isActive).length;

  // Pagination
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize;
  const pagedItems = items.slice(startIdx, startIdx + pageSize);
  const startRow = totalCount > 0 ? startIdx + 1 : 0;
  const endRow = Math.min(startIdx + pageSize, totalCount);
  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  /* toggle active */
  const toggleActive = async (id: number) => {
    const item = items.find((d) => d.id === id);
    if (item) {
      await updateMut.mutateAsync({ id, isActive: !item.isActive } as any);
    }
  };

  return (
    <>
      <Topbar title="ประเภทเอกสาร / Document Types" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center p-12">
          <p className="text-text-muted">กำลังโหลด...</p>
        </div>
      )}
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              ตั้งค่าประเภทเอกสาร
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h3>
            <p className="text-sm text-text-muted mt-1">กำหนดเอกสารที่ต้องใช้ในการลงทะเบียนตามวัตถุประสงค์การเข้าพื้นที่</p>
          </div>
          <Button onClick={() => setDrawer({ mode: "add" })} className="gap-2">
            <Plus size={16} /> เพิ่มประเภทเอกสาร
          </Button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
          <Info size={20} className="text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-primary-dark leading-relaxed">
            <strong>ประเภทเอกสาร</strong> กำหนดว่าผู้เยี่ยมต้องแสดงเอกสารอะไรบ้าง ตามประเภทการเข้าพื้นที่
          </div>
        </div>

        {/* Summary Card */}
        <Card className="border-0 shadow-sm w-fit">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-50 text-primary"><FileText size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{totalActive}</p>
              <p className="text-xs text-text-muted">ประเภทเอกสารที่ใช้งาน</p>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary w-8">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">ชื่อเอกสาร</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-secondary">สถานะ</th>
                  <th className="text-right px-4 py-3 font-semibold text-text-secondary">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((doc, idx) => (
                  <tr key={doc.id} className={cn("border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors", !doc.isActive && "opacity-50")}>
                    <td className="px-4 py-3 text-text-muted">{doc.order}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-text-primary">{doc.name}</p>
                        <p className="text-xs text-text-muted">{doc.nameEn}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(doc.id)} className={cn("text-xs font-medium px-2.5 py-1 rounded-full transition-colors", doc.isActive ? "bg-success-light text-success" : "bg-gray-100 text-gray-500")}>
                        {doc.isActive ? "ใช้งาน" : "ปิด"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDrawer({ mode: "edit", item: doc })} className="gap-1 text-xs">
                        <Pencil size={14} /> แก้ไข
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>แสดง</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span>รายการ / หน้า</span>
            </div>
            <span className="text-xs text-text-muted">
              {startRow}–{endRow} จาก {totalCount} รายการ
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => goTo(safeCurrentPage - 1)} disabled={safeCurrentPage <= 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-muted">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`min-w-[28px] h-7 rounded-lg text-xs font-semibold transition-colors ${p === safeCurrentPage ? "bg-primary text-white shadow-sm" : "text-text-muted hover:bg-gray-200"}`}
                >
                  {p}
                </button>
              ))}
              <button onClick={() => goTo(safeCurrentPage + 1)} disabled={safeCurrentPage >= totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-muted">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      </main>

      {/* ── Drawer ── */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "add" ? "เพิ่มประเภทเอกสาร" : "แก้ไขประเภทเอกสาร"}
        subtitle={drawer?.mode === "edit" ? drawer.item?.name : "กรอกรายละเอียดเอกสาร"}
      >
        <DocumentTypeForm
          initial={drawer?.item}
          onSave={async (formData) => {
            if (drawer?.mode === "edit" && drawer.item) {
              await updateMut.mutateAsync({ id: drawer.item.id, ...formData } as any);
            } else {
              await createMut.mutateAsync(formData as any);
            }
            setDrawer(null);
          }}
          onCancel={() => setDrawer(null)}
        />
      </Drawer>
    </>
  );
}

/* ── Form ── */
function DocumentTypeForm({ initial, onSave, onCancel }: { initial?: DocumentType; onSave: (data: Record<string, unknown>) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSubmit = () => {
    onSave({ name, nameEn, description });
  };

  return (
    <div className="p-6 space-y-5">
      <Input label="ชื่อเอกสาร (ไทย)" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="เช่น บัตรประจำตัวประชาชน" />
      <Input label="ชื่อเอกสาร (อังกฤษ)" value={nameEn} onChange={(e: any) => setNameEn(e.target.value)} placeholder="e.g. Thai National ID Card" />
      <Input label="คำอธิบาย" value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" />

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={handleSubmit}><Save size={16} /> บันทึก</Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>ยกเลิก</Button>
      </div>
    </div>
  );
}
