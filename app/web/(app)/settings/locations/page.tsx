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
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import {
  Settings,
  Building2,
  Layers,
  Users,
  Plus,
  Pencil,
  Info,
  Save,
  ChevronDown,
  ChevronUp,
  MapPin,
  Hash,
  ToggleLeft,
  ToggleRight,
  DoorOpen,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import {
  buildings,
  floors,
  departments,
  staffMembers,
  accessGroups,
  accessZones,
  departmentAccessMappings,
  getDepartmentLocation,
  type Building,
  type Floor,
  type Department,
} from "@/lib/mock-data";

/* ══════════════════════════════════════════════════
   HELPER: Active Badge
   ══════════════════════════════════════════════════ */
function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
        active ? "bg-success-light text-success" : "bg-gray-100 text-gray-400"
      )}
    >
      {active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
      {active ? "ใช้งาน" : "ปิดใช้งาน"}
    </span>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function LocationsSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("locations")!;
  const flowData = getFlowByPageId("locations")!;
  const apiDoc = getApiDocByPageId("locations");
  const [activeTab, setActiveTab] = useState<"buildings" | "floors" | "departments">("buildings");
  const [buildingList, setBuildingList] = useState<Building[]>(buildings);
  const [deptList, setDeptList] = useState<Department[]>(departments);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchDept, setSearchDept] = useState("");
  const [drawer, setDrawer] = useState<{
    mode: "add" | "edit";
    type: "building" | "floor" | "department";
    item?: Building | Floor | Department;
  } | null>(null);

  /* computed */
  const totalStaff = staffMembers.filter((s) => s.status === "active").length;
  const totalZones = accessZones.filter((z) => z.isActive).length;

  const stats = [
    { label: "อาคาร", value: buildingList.length, icon: <Building2 size={20} />, color: "text-primary", bg: "bg-primary-50" },
    { label: "ชั้น", value: floors.length, icon: <Layers size={20} />, color: "text-info", bg: "bg-info-light" },
    { label: "แผนก / หน่วยงาน", value: deptList.length, icon: <Landmark size={20} />, color: "text-accent-600", bg: "bg-accent-50" },
    { label: "บุคลากร (Active)", value: totalStaff, icon: <Users size={20} />, color: "text-success", bg: "bg-success-light" },
  ];

  /* dept filter */
  const filteredDepts = useMemo(() => {
    return deptList.filter((d) => {
      if (searchDept) {
        const q = searchDept.toLowerCase();
        if (!d.name.toLowerCase().includes(q) && !d.nameEn.toLowerCase().includes(q) && !String(d.id).includes(q)) return false;
      }
      return true;
    });
  }, [deptList, searchDept]);

  /* toggle active */
  const toggleBuildingActive = (id: number) => {
    setBuildingList((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)));
  };
  const toggleDeptActive = (id: number) => {
    setDeptList((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)));
  };

  return (
    <>
      <Topbar title="ตั้งค่าสถานที่และแผนก / Locations & Departments" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              สถานที่และแผนก
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              จัดการอาคาร ชั้น และแผนก/หน่วยงาน ที่ใช้อ้างอิงในระบบ eVMS ทั้งหมด
            </p>
          </div>
          <Button
            onClick={() =>
              setDrawer({
                mode: "add",
                type: activeTab === "buildings" ? "building" : activeTab === "floors" ? "floor" : "department",
              })
            }
            className="gap-2"
          >
            <Plus size={16} />
            {activeTab === "buildings" ? "เพิ่มอาคาร" : activeTab === "floors" ? "เพิ่มชั้น" : "เพิ่มแผนก"}
          </Button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
          <Info size={20} className="text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-primary-dark leading-relaxed">
            <strong>สถานที่และแผนก</strong> ใช้เป็นข้อมูลอ้างอิงหลักในระบบ — ทั้งการจองห้องประชุม, กำหนด Access Zone,
            จัดกลุ่มบุคลากร, Service Point และเลือกจุดหมายปลายทางของผู้เยี่ยม ข้อมูลเหล่านี้จะปรากฏใน
            <strong> ทุก Surface</strong> ของระบบ (Mobile, Web, Kiosk, Counter)
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.bg, s.color)}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{s.value}</p>
                  <p className="text-xs text-text-muted">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {([
            { key: "buildings" as const, label: "อาคาร", icon: <Building2 size={14} /> },
            { key: "departments" as const, label: "แผนก / หน่วยงาน", icon: <Landmark size={14} /> },
            { key: "floors" as const, label: "ชั้น", icon: <Layers size={14} /> },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5",
                activeTab === tab.key
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════ Tab: อาคาร ══════ */}
        {activeTab === "buildings" && (
          <div className="space-y-4">
            {buildingList.map((bld) => {
              const bldFloors = floors.filter((f) => f.buildingId === bld.id);
              const bldZones = accessZones.filter((z) => z.buildingId === bld.id && z.isActive).length;
              const isExpanded = expandedId === bld.id;

              return (
                <Card key={bld.id} className={cn("border shadow-sm transition-all hover:shadow-md", !bld.isActive && "opacity-50")}>
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
                          <Building2 size={28} />
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary text-base">{bld.name}</h4>
                          <p className="text-sm text-text-muted">{bld.nameEn}</p>
                          {bld.description && (
                            <p className="text-xs text-text-secondary mt-1">{bld.description}</p>
                          )}
                        </div>
                      </div>
                      <ActiveBadge active={bld.isActive} />
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 text-sm mb-4">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Layers size={14} className="text-info" />
                        <span className="font-semibold">{bld.totalFloors}</span> ชั้น
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Landmark size={14} className="text-accent-600" />
                        <span className="font-semibold">
                          {new Set(bldFloors.flatMap((f) => f.departmentIds)).size}
                        </span>{" "}
                        แผนก
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <DoorOpen size={14} className="text-warning" />
                        <span className="font-semibold">{bldZones}</span> โซน
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Hash size={14} className="text-text-muted" />
                        {bld.id}
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : bld.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? "ซ่อนรายละเอียดชั้น" : `แสดงรายละเอียดทั้ง ${bld.totalFloors} ชั้น`}
                    </button>

                    {/* Expanded: Floor table */}
                    {isExpanded && (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-border">
                              <th className="text-left px-4 py-2.5 font-semibold text-text-secondary w-16">ชั้น</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-text-secondary">ชื่อ / รายละเอียด</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-text-secondary">แผนกที่อยู่ในชั้น</th>
                              <th className="text-center px-4 py-2.5 font-semibold text-text-secondary w-20">โซน</th>
                              <th className="text-right px-4 py-2.5 font-semibold text-text-secondary w-20">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bldFloors
                              .sort((a, b) => a.floorNumber - b.floorNumber)
                              .map((fl) => {
                                const flDepts = departments.filter((d) => fl.departmentIds.includes(d.id));
                                const flZones = accessZones.filter((z) => z.floorId === fl.id && z.isActive).length;

                                return (
                                  <tr key={fl.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-info-light text-info font-bold text-sm">
                                        {fl.floorNumber}F
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="font-semibold text-text-primary text-sm">{fl.name}</p>
                                      <p className="text-xs text-text-muted">{fl.nameEn}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-1">
                                        {flDepts.length > 0 ? (
                                          flDepts.map((d) => (
                                            <span
                                              key={d.id}
                                              className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-50 text-accent-600"
                                            >
                                              {d.name}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-xs text-text-muted italic">— ส่วนกลาง / ไม่มีแผนกประจำ —</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                                        <DoorOpen size={12} /> {flZones}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDrawer({ mode: "edit", type: "floor", item: fl })}
                                        className="text-xs gap-1"
                                      >
                                        <Pencil size={12} />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBuildingActive(bld.id)}
                        className="gap-1 text-xs"
                      >
                        {bld.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {bld.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDrawer({ mode: "edit", type: "building", item: bld })}
                        className="gap-1 text-xs"
                      >
                        <Pencil size={14} /> แก้ไข
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {buildingList.length === 0 && (
              <div className="text-center py-16 text-text-muted">
                <Building2 size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">ยังไม่มีอาคารในระบบ</p>
              </div>
            )}
          </div>
        )}

        {/* ══════ Tab: ชั้น ══════ */}
        {activeTab === "floors" && (
          <Card className="border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-gray-50">
              <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <Layers size={16} className="text-info" />
                รายชั้นทั้งหมด — เรียงตามอาคารและลำดับชั้น
              </h4>
              <p className="text-xs text-text-muted mt-1">
                แสดงข้อมูลชั้นทั้งหมดในระบบ พร้อมแผนกที่ตั้งอยู่ในแต่ละชั้น และจำนวน Access Zone
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-border">
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary w-16">ชั้น</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">ชื่อ (ไทย)</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Name (EN)</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">อาคาร</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">แผนกในชั้น</th>
                    <th className="text-center px-5 py-3 font-semibold text-text-secondary w-20">โซน</th>
                    <th className="text-right px-5 py-3 font-semibold text-text-secondary w-20">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {floors
                    .slice()
                    .sort((a, b) => a.floorNumber - b.floorNumber)
                    .map((fl) => {
                      const bld = buildingList.find((b) => b.id === fl.buildingId);
                      const flDepts = departments.filter((d) => fl.departmentIds.includes(d.id));
                      const flZones = accessZones.filter((z) => z.floorId === fl.id && z.isActive).length;

                      return (
                        <tr key={fl.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-info-light text-info font-bold text-sm">
                              {fl.floorNumber}F
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-text-primary">{fl.name}</p>
                          </td>
                          <td className="px-5 py-3 text-text-muted">{fl.nameEn}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary">
                              <Building2 size={11} /> {bld?.name ?? fl.buildingId}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {flDepts.length > 0 ? (
                                flDepts.map((d) => (
                                  <span
                                    key={d.id}
                                    className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-50 text-accent-600"
                                  >
                                    {d.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-text-muted italic">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                              <DoorOpen size={12} /> {flZones}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDrawer({ mode: "edit", type: "floor", item: fl })}
                              className="gap-1 text-xs"
                            >
                              <Pencil size={12} /> แก้ไข
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ══════ Tab: แผนก ══════ */}
        {activeTab === "departments" && (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <SearchInput
                value={searchDept}
                onValueChange={setSearchDept}
                placeholder="ค้นหาแผนก / หน่วยงาน..."
                className="w-72"
              />
              <span className="text-xs text-text-muted ml-auto">
                แสดง {filteredDepts.length} จาก {deptList.length} แผนก
              </span>
            </div>

            {/* Department Table */}
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-border">
                      <th className="text-left px-5 py-3 font-semibold text-text-secondary w-24">รหัส</th>
                      <th className="text-left px-5 py-3 font-semibold text-text-secondary">ชื่อแผนก</th>
                      <th className="text-left px-5 py-3 font-semibold text-text-secondary">อาคาร / ชั้น</th>
                      <th className="text-center px-5 py-3 font-semibold text-text-secondary w-24">บุคลากร</th>
                      <th className="text-left px-5 py-3 font-semibold text-text-secondary">Access Group</th>
                      <th className="text-center px-5 py-3 font-semibold text-text-secondary w-24">สถานะ</th>
                      <th className="text-right px-5 py-3 font-semibold text-text-secondary w-28">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepts.map((dept) => {
                      const deptStaff = staffMembers.filter(
                        (s) => s.department.id === dept.id && s.status === "active"
                      ).length;
                      const mapping = departmentAccessMappings.find((m) => m.departmentId === dept.id);
                      const defaultGroup = mapping
                        ? accessGroups.find((g) => g.id === mapping.defaultAccessGroupId)
                        : null;
                      const additionalGroups = mapping
                        ? mapping.additionalGroupIds
                            .map((gid) => accessGroups.find((g) => g.id === gid))
                            .filter(Boolean)
                        : [];

                      return (
                        <tr
                          key={dept.id}
                          className={cn(
                            "border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors",
                            !dept.isActive && "opacity-50"
                          )}
                        >
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center text-xs font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-text-muted">
                              {dept.id}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center">
                                <Landmark size={16} />
                              </div>
                              <div>
                                <p className="font-semibold text-text-primary">{dept.name}</p>
                                <p className="text-xs text-text-muted">{dept.nameEn}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {(() => {
                              const loc = getDepartmentLocation(dept.id);
                              return loc ? (
                                <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                                  <Building2 size={13} className="text-text-muted" />
                                  <span>{loc.building}</span>
                                  <span className="text-text-muted">·</span>
                                  <MapPin size={13} className="text-text-muted" />
                                  <span className="font-medium">{loc.floor}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-text-muted italic">ยังไม่กำหนดชั้น</span>
                              );
                            })()}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={cn("text-sm font-bold", deptStaff > 0 ? "text-text-primary" : "text-text-muted")}>
                              {deptStaff}
                            </span>
                            <span className="text-xs text-text-muted ml-1">คน</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {defaultGroup && (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: defaultGroup.color + "15",
                                    color: defaultGroup.color,
                                  }}
                                >
                                  <ShieldCheck size={10} /> {defaultGroup.name}
                                </span>
                              )}
                              {additionalGroups.map((g) =>
                                g ? (
                                  <span
                                    key={g.id}
                                    className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-text-muted"
                                  >
                                    +{g.name}
                                  </span>
                                ) : null
                              )}
                              {!mapping && (
                                <span className="text-[11px] text-text-muted italic">ยังไม่กำหนด</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <ActiveBadge active={dept.isActive} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDeptActive(dept.id)}
                                className="text-xs px-2"
                              >
                                {dept.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDrawer({ mode: "edit", type: "department", item: dept })}
                                className="gap-1 text-xs"
                              >
                                <Pencil size={12} /> แก้ไข
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredDepts.length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  <Landmark size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">ไม่พบแผนกที่ตรงตามตัวกรอง</p>
                </div>
              )}
            </Card>
          </>
        )}
      </main>

      {/* ══════ Drawer ══════ */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={
          drawer?.mode === "add"
            ? drawer.type === "building"
              ? "เพิ่มอาคารใหม่"
              : drawer.type === "floor"
              ? "เพิ่มชั้นใหม่"
              : "เพิ่มแผนกใหม่"
            : drawer?.type === "building"
            ? "แก้ไขอาคาร"
            : drawer?.type === "floor"
            ? "แก้ไขข้อมูลชั้น"
            : "แก้ไขแผนก"
        }
        subtitle={
          drawer?.mode === "edit" && drawer.item
            ? "name" in drawer.item
              ? (drawer.item as Building | Department).name
              : undefined
            : undefined
        }
      >
        {drawer?.type === "building" && (
          <BuildingForm
            initial={drawer.mode === "edit" ? (drawer.item as Building) : undefined}
            onSave={() => setDrawer(null)}
            onCancel={() => setDrawer(null)}
          />
        )}
        {drawer?.type === "floor" && (
          <FloorForm
            initial={drawer.mode === "edit" ? (drawer.item as Floor) : undefined}
            onSave={() => setDrawer(null)}
            onCancel={() => setDrawer(null)}
          />
        )}
        {drawer?.type === "department" && (
          <DepartmentForm
            initial={drawer.mode === "edit" ? (drawer.item as Department) : undefined}
            onSave={() => setDrawer(null)}
            onCancel={() => setDrawer(null)}
          />
        )}
      </Drawer>
    </>
  );
}

/* ══════════════════════════════════════════════════
   FORM: Building
   ══════════════════════════════════════════════════ */
function BuildingForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Building;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-6 space-y-5">
      <Input label="ชื่ออาคาร (ไทย)" defaultValue={initial?.name} placeholder="เช่น ศูนย์ราชการ อาคาร C" />
      <Input label="ชื่ออาคาร (อังกฤษ)" defaultValue={initial?.nameEn} placeholder="e.g. Government Center Building C" />
      <Input
        label="จำนวนชั้น"
        type="number"
        defaultValue={initial?.totalFloors?.toString()}
        placeholder="9"
        leftIcon={<Layers size={16} />}
      />
      <Input
        label="คำอธิบาย"
        defaultValue={initial?.description ?? ""}
        placeholder="เพิ่มรายละเอียดอาคาร (ไม่บังคับ)"
      />

      {/* Cross–reference info */}
      {initial && (
        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
            <Info size={13} className="text-info" /> ข้อมูลที่เชื่อมโยงในระบบ
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <Layers size={12} /> ชั้นทั้งหมด: <strong className="text-text-primary">{floors.filter((f) => f.buildingId === initial.id).length}</strong>
            </div>
            <div className="flex items-center gap-1">
              <DoorOpen size={12} /> Access Zone: <strong className="text-text-primary">{accessZones.filter((z) => z.buildingId === initial.id).length}</strong>
            </div>
            <div className="flex items-center gap-1">
              <Landmark size={12} /> แผนก: <strong className="text-text-primary">{new Set(floors.filter((f) => f.buildingId === initial.id).flatMap((f) => f.departmentIds)).size}</strong>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} /> บุคลากร: <strong className="text-text-primary">{staffMembers.filter((s) => getDepartmentLocation(s.department.id)?.building === initial.name).length}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={onSave}>
          <Save size={16} /> บันทึก
        </Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FORM: Floor
   ══════════════════════════════════════════════════ */
function FloorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Floor;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [selectedDepts, setSelectedDepts] = useState<number[]>(initial?.departmentIds ?? []);

  const toggleDept = (id: number) =>
    setSelectedDepts((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));

  return (
    <div className="p-6 space-y-5">
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">อาคาร</label>
        <select
          defaultValue={initial?.buildingId ?? ""}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
          <option value="">เลือกอาคาร</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="ลำดับชั้น"
        type="number"
        defaultValue={initial?.floorNumber?.toString()}
        placeholder="3"
        leftIcon={<Hash size={16} />}
      />
      <Input label="ชื่อชั้น (ไทย)" defaultValue={initial?.name} placeholder="เช่น ชั้น 3 — สำนักงานปลัด" />
      <Input label="ชื่อชั้น (อังกฤษ)" defaultValue={initial?.nameEn} placeholder="e.g. 3F — OPS" />

      {/* Department multi-select */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block flex items-center gap-1.5">
          <Landmark size={15} className="text-accent-600" /> แผนกที่ตั้งอยู่ในชั้นนี้
        </label>
        <div className="space-y-1.5 max-h-64 overflow-y-auto rounded-lg border border-border p-2">
          {departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => toggleDept(dept.id)}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left text-sm transition-all",
                selectedDepts.includes(dept.id)
                  ? "bg-accent-50 text-accent-600 ring-1 ring-accent-200"
                  : "hover:bg-gray-50 text-text-secondary"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  selectedDepts.includes(dept.id)
                    ? "border-accent-500 bg-accent-500 text-white"
                    : "border-gray-300 bg-white"
                )}
              >
                {selectedDepts.includes(dept.id) && <span className="text-[10px]">✓</span>}
              </div>
              <span className="flex-1 font-medium text-xs">{dept.name}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-1">เลือกแล้ว {selectedDepts.length} แผนก</p>
      </div>

      {/* Cross-reference */}
      {initial && (
        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
            <Info size={13} className="text-info" /> ข้อมูลที่เชื่อมโยงในระบบ
          </p>
          <div className="text-xs text-text-muted flex items-center gap-1">
            <DoorOpen size={12} /> Access Zone ในชั้นนี้:{" "}
            <strong className="text-text-primary">{accessZones.filter((z) => z.floorId === initial.id).length}</strong>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={onSave}>
          <Save size={16} /> บันทึก
        </Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FORM: Department
   ══════════════════════════════════════════════════ */
function DepartmentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Department;
  onSave: () => void;
  onCancel: () => void;
}) {
  const mapping = initial ? departmentAccessMappings.find((m) => m.departmentId === initial.id) : null;

  return (
    <div className="p-6 space-y-5">
      <Input label="ชื่อแผนก (ไทย)" defaultValue={initial?.name} placeholder="เช่น กองกิจการท่องเที่ยว" />
      <Input label="ชื่อแผนก (อังกฤษ)" defaultValue={initial?.nameEn} placeholder="e.g. Tourism Affairs Division" />

      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">Default Access Group</label>
        <select
          defaultValue={mapping?.defaultAccessGroupId ?? ""}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
          <option value="">ยังไม่กำหนด</option>
          {accessGroups
            .filter((g) => g.isActive)
            .map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.nameEn}
              </option>
            ))}
        </select>
      </div>

      {/* Cross-reference */}
      {initial && (
        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
            <Info size={13} className="text-info" /> ข้อมูลที่เชื่อมโยงในระบบ
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <Users size={12} /> บุคลากร:{" "}
              <strong className="text-text-primary">
                {staffMembers.filter((s) => s.department.id === initial.id).length}
              </strong>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck size={12} /> Access Group:{" "}
              <strong className="text-text-primary">
                {mapping ? 1 + mapping.additionalGroupIds.length : 0}
              </strong>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <MapPin size={12} /> สถานที่:{" "}
              {(() => {
                const loc = getDepartmentLocation(initial.id);
                return loc ? (
                  <strong className="text-text-primary">{loc.building} · {loc.floor}</strong>
                ) : (
                  <span className="italic">ยังไม่กำหนดชั้น (กำหนดได้ที่แท็บ "ชั้น")</span>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={onSave}>
          <Save size={16} /> บันทึก
        </Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
