"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  documentTypes,
  type DocumentType,
} from "@/lib/mock-data";

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
  const [items, setItems] = useState<DocumentType[]>(documentTypes);
  const [drawer, setDrawer] = useState<{ mode: "add" | "edit"; item?: DocumentType } | null>(null);

  const totalActive = items.filter((d) => d.isActive).length;

  /* toggle active */
  const toggleActive = (id: number) => {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)));
  };

  return (
    <>
      <Topbar title="ประเภทเอกสาร / Document Types" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
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
                {items.map((doc, idx) => (
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
        </Card>
      </main>

      {/* ── Drawer ── */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.mode === "add" ? "เพิ่มประเภทเอกสาร" : "แก้ไขประเภทเอกสาร"}
        subtitle={drawer?.mode === "edit" ? drawer.item?.name : "กรอกรายละเอียดเอกสาร"}
      >
        <DocumentTypeForm initial={drawer?.item} onSave={() => setDrawer(null)} onCancel={() => setDrawer(null)} />
      </Drawer>
    </>
  );
}

/* ── Form ── */
function DocumentTypeForm({ initial, onSave, onCancel }: { initial?: DocumentType; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="p-6 space-y-5">
      <Input label="ชื่อเอกสาร (ไทย)" defaultValue={initial?.name} placeholder="เช่น บัตรประจำตัวประชาชน" />
      <Input label="ชื่อเอกสาร (อังกฤษ)" defaultValue={initial?.nameEn} placeholder="e.g. Thai National ID Card" />
      <Input label="คำอธิบาย" defaultValue={initial?.description ?? ""} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" />

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={onSave}><Save size={16} /> บันทึก</Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>ยกเลิก</Button>
      </div>
    </div>
  );
}
