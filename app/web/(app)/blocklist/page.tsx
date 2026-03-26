"use client";

import { useState, useMemo } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Shield, Search, Plus, X, AlertTriangle, User, Calendar, Clock,
  ChevronLeft, ChevronRight, Edit2, Trash2, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { blocklist as mockBlocklist, type BlocklistEntry } from "@/lib/mock-data";

type BlocklistType = "all" | "permanent" | "temporary";

export default function BlocklistPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("blocklist");
  const flowData = getFlowByPageId("blocklist");
  const apiDoc = getApiDocByPageId("blocklist");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<BlocklistType>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BlocklistEntry | null>(null);

  const filtered = useMemo(() => {
    let result = [...mockBlocklist];
    if (typeFilter !== "all") result = result.filter((b) => b.type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.visitor.name.toLowerCase().includes(q) ||
          b.visitor.company.toLowerCase().includes(q) ||
          b.reason.toLowerCase().includes(q)
      );
    }
    return result;
  }, [typeFilter, searchQuery]);

  const stats = {
    total: mockBlocklist.length,
    permanent: mockBlocklist.filter((b) => b.type === "permanent").length,
    temporary: mockBlocklist.filter((b) => b.type === "temporary").length,
  };

  return (
    <div>
      <Topbar title="Blocklist" />
      {schema && <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />}
      {flowData && <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />}
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Shield size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                จัดการ Blocklist — รายชื่อผู้ถูกบล็อก
                {schema && <DbSchemaButton onClick={() => setShowSchema(true)} />}
                {flowData && <FlowRulesButton onClick={() => setShowFlow(true)} />}
                {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
              </h2>
              <p className="text-sm text-text-muted">
                เพิ่ม/แก้ไข/ลบรายชื่อผู้ถูกบล็อก — ระบบจะตรวจสอบอัตโนมัติก่อนอนุญาตเข้าพื้นที่
              </p>
            </div>
          </div>
          <Button variant="secondary" className="shadow-sm" onClick={() => setShowAddModal(true)}>
            <Plus size={18} className="mr-2" />
            เพิ่มรายชื่อ
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "ทั้งหมด", value: stats.total, icon: Shield, color: "text-gray-700", bg: "bg-gray-50" },
            { label: "ถาวร (Permanent)", value: stats.permanent, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
            { label: "ชั่วคราว (Temporary)", value: stats.temporary, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ / บริษัท / เหตุผล..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as BlocklistType)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">ประเภท: ทั้งหมด</option>
              <option value="permanent">ถาวร (Permanent)</option>
              <option value="temporary">ชั่วคราว (Temporary)</option>
            </select>
            <span className="text-sm text-text-muted ml-auto">
              แสดง {filtered.length} จาก {mockBlocklist.length} รายการ
            </span>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4">ผู้ถูกบล็อก</th>
                  <th className="px-6 py-4">ประเภท</th>
                  <th className="px-6 py-4">เหตุผล</th>
                  <th className="px-6 py-4">วันหมดอายุ</th>
                  <th className="px-6 py-4">เพิ่มโดย</th>
                  <th className="px-6 py-4">วันที่เพิ่ม</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                      <Shield size={32} className="mx-auto text-text-muted/40 mb-2" />
                      <p className="text-sm">ไม่พบรายการ Blocklist</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                            {entry.visitor.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-text-primary">{entry.visitor.name}</p>
                            <p className="text-xs text-text-secondary">{entry.visitor.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {entry.type === "permanent" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                            <XCircle size={12} /> ถาวร
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                            <Clock size={12} /> ชั่วคราว
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-text-secondary text-sm max-w-[300px] truncate" title={entry.reason}>
                          {entry.reason}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm whitespace-nowrap">
                        {entry.expiryDate ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm whitespace-nowrap">
                        {entry.addedBy}
                      </td>
                      <td className="px-6 py-4 text-text-muted text-xs whitespace-nowrap">
                        {new Date(entry.addedAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors" title="แก้ไข">
                            <Edit2 size={14} />
                          </button>
                          <button className="h-8 w-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors" title="ลบ">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-text-muted">แสดง {filtered.length} รายการ</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>ก่อนหน้า</Button>
                <Button variant="outline" size="sm" disabled>ถัดไป</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
            <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
              <button onClick={() => setShowAddModal(false)} className="absolute top-3 right-3 rounded-full p-1.5 text-text-muted hover:bg-gray-100 hover:text-text-primary transition-colors">
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Shield size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">เพิ่มรายชื่อ Blocklist</h3>
                  <p className="text-xs text-text-muted">กรอกข้อมูลผู้ถูกบล็อกและเหตุผล</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">ค้นหาผู้มาติดต่อ</label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="พิมพ์ชื่อ / เลขบัตร / บริษัท..."
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">ประเภท</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 text-sm font-medium cursor-pointer">
                      <input type="radio" name="blockType" value="permanent" defaultChecked className="accent-red-600" />
                      ถาวร (Permanent)
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium cursor-pointer">
                      <input type="radio" name="blockType" value="temporary" className="accent-amber-600" />
                      ชั่วคราว (Temporary)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันหมดอายุ (สำหรับชั่วคราว)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เหตุผล</label>
                  <textarea
                    rows={3}
                    placeholder="ระบุเหตุผลในการบล็อก (อย่างน้อย 10 ตัวอักษร)"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>ยกเลิก</Button>
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  <Shield size={16} className="mr-2" />
                  เพิ่มรายชื่อ
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
