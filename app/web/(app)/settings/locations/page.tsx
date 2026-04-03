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
  Landmark,
} from "lucide-react";
import { useBuildings, useDepartments, useCreateBuilding, useUpdateBuilding, useDeleteBuilding, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useCreateFloor, useUpdateFloor, useAllFloors, useDeleteFloor } from "@/lib/hooks";
import { Trash2 } from "lucide-react";

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
  /* ── API hooks ── */
  const { data: rawBuildings, isLoading: loadingB } = useBuildings();
  const { data: rawDepts, isLoading: loadingD } = useDepartments();
  const { data: rawFloors, isLoading: loadingF } = useAllFloors();
  const createBuildingMut = useCreateBuilding();
  const updateBuildingMut = useUpdateBuilding();
  const deleteBuildingMut = useDeleteBuilding();
  const createDeptMut = useCreateDepartment();
  const updateDeptMut = useUpdateDepartment();
  const deleteDeptMut = useDeleteDepartment();
  const createFloorMut = useCreateFloor();
  const updateFloorMut = useUpdateFloor();
  const deleteFloorMut = useDeleteFloor();

  const buildingList: any[] = Array.isArray(rawBuildings) ? rawBuildings : ((rawBuildings as any)?.buildings ?? (rawBuildings as any)?.data ?? []);
  const deptList: any[] = Array.isArray(rawDepts) ? rawDepts : ((rawDepts as any)?.departments ?? (rawDepts as any)?.data ?? []);
  const floorList: any[] = Array.isArray(rawFloors) ? rawFloors : ((rawFloors as any)?.floors ?? (rawFloors as any)?.data ?? []);

  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("locations")!;
  const flowData = getFlowByPageId("locations")!;
  const apiDoc = getApiDocByPageId("locations");
  const [activeTab, setActiveTab] = useState<"buildings" | "floors" | "departments">("buildings");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchDept, setSearchDept] = useState("");
  const [drawer, setDrawer] = useState<{
    mode: "add" | "edit";
    type: "building" | "floor" | "department";
    item?: any;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "building" | "floor" | "department"; id: number; name: string } | null>(null);

  /* dept filter */
  const filteredDepts = useMemo(() => {
    return deptList.filter((d: any) => {
      if (searchDept) {
        const q = searchDept.toLowerCase();
        if (!(d.name || "").toLowerCase().includes(q) && !(d.nameEn || "").toLowerCase().includes(q) && !String(d.id).includes(q)) return false;
      }
      return true;
    });
  }, [deptList, searchDept]);

  if (loadingB || loadingD || loadingF) return <div><Topbar title="อาคาร / ชั้น / แผนก" /><div className="p-8 text-center text-text-muted">กำลังโหลด...</div></div>;

  /* helper: get floors for a building from API data */
  const getFloorsForBuilding = (bldId: number) => {
    // Try from building.floors (nested include) first
    const bld = buildingList.find((b: any) => b.id === bldId);
    if (bld?.floors && Array.isArray(bld.floors)) return bld.floors;
    // Fallback to floorList
    return floorList.filter((f: any) => f.buildingId === bldId);
  };

  /* helper: get department IDs for a floor */
  const getFloorDeptIds = (fl: any): number[] => {
    if (fl.floorDepartments && Array.isArray(fl.floorDepartments)) {
      return fl.floorDepartments.map((fd: any) => fd.departmentId ?? fd.department?.id).filter(Boolean);
    }
    if (fl.departmentIds && Array.isArray(fl.departmentIds)) return fl.departmentIds;
    return [];
  };

  const stats = [
    { label: "อาคาร", value: buildingList.length, icon: <Building2 size={20} />, color: "text-primary", bg: "bg-primary-50" },
    { label: "ชั้น", value: floorList.length, icon: <Layers size={20} />, color: "text-info", bg: "bg-info-light" },
    { label: "แผนก / หน่วยงาน", value: deptList.length, icon: <Landmark size={20} />, color: "text-accent-600", bg: "bg-accent-50" },
    { label: "อาคารใช้งาน", value: buildingList.filter((b: any) => b.isActive !== false).length, icon: <Users size={20} />, color: "text-success", bg: "bg-success-light" },
  ];

  /* toggle active via API */
  const toggleBuildingActive = (bld: any) => {
    updateBuildingMut.mutate({ id: bld.id, isActive: !bld.isActive });
  };
  const toggleDeptActive = (dept: any) => {
    updateDeptMut.mutate({ id: dept.id, isActive: !dept.isActive });
  };

  /* delete handler */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === "building") await deleteBuildingMut.mutateAsync(confirmDelete.id);
      else if (confirmDelete.type === "floor") await deleteFloorMut.mutateAsync(confirmDelete.id);
      else if (confirmDelete.type === "department") await deleteDeptMut.mutateAsync(confirmDelete.id);
    } catch (e) { console.error("Delete error:", e); }
    setConfirmDelete(null);
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
            {buildingList.map((bld: any) => {
              const bldFloors = getFloorsForBuilding(bld.id);
              const isExpanded = expandedId === bld.id;

              return (
                <Card key={bld.id} className={cn("border shadow-sm transition-all hover:shadow-md", bld.isActive === false && "opacity-50")}>
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
                      <ActiveBadge active={bld.isActive !== false} />
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 text-sm mb-4">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Layers size={14} className="text-info" />
                        <span className="font-semibold">{bld.totalFloors ?? bldFloors.length}</span> ชั้น
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Landmark size={14} className="text-accent-600" />
                        <span className="font-semibold">
                          {new Set(bldFloors.flatMap((f: any) => getFloorDeptIds(f))).size}
                        </span>{" "}
                        แผนก
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
                      {isExpanded ? "ซ่อนรายละเอียดชั้น" : `แสดงรายละเอียดทั้ง ${bldFloors.length} ชั้น`}
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
                              <th className="text-right px-4 py-2.5 font-semibold text-text-secondary w-28">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bldFloors
                              .sort((a: any, b: any) => a.floorNumber - b.floorNumber)
                              .map((fl: any) => {
                                const flDeptIds = getFloorDeptIds(fl);
                                const flDepts = fl.floorDepartments
                                  ? fl.floorDepartments.map((fd: any) => fd.department).filter(Boolean)
                                  : deptList.filter((d: any) => flDeptIds.includes(d.id));

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
                                          flDepts.map((d: any) => (
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
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setDrawer({ mode: "edit", type: "floor", item: { ...fl, departmentIds: flDeptIds, buildingId: bld.id } })}
                                          className="text-xs gap-1"
                                        >
                                          <Pencil size={12} />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setConfirmDelete({ type: "floor", id: fl.id, name: fl.name })}
                                          className="text-xs gap-1 text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 size={12} />
                                        </Button>
                                      </div>
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
                        onClick={() => toggleBuildingActive(bld)}
                        className="gap-1 text-xs"
                      >
                        {bld.isActive !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {bld.isActive !== false ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDrawer({ mode: "edit", type: "building", item: bld })}
                        className="gap-1 text-xs"
                      >
                        <Pencil size={14} /> แก้ไข
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDelete({ type: "building", id: bld.id, name: bld.name })}
                        className="gap-1 text-xs text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> ลบ
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
                แสดงข้อมูลชั้นทั้งหมดในระบบ พร้อมแผนกที่ตั้งอยู่ในแต่ละชั้น
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
                    <th className="text-right px-5 py-3 font-semibold text-text-secondary w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {floorList
                    .slice()
                    .sort((a: any, b: any) => a.buildingId - b.buildingId || a.floorNumber - b.floorNumber)
                    .map((fl: any) => {
                      const bld = fl.building || buildingList.find((b: any) => b.id === fl.buildingId);
                      const flDeptIds = getFloorDeptIds(fl);
                      const flDepts = fl.floorDepartments
                        ? fl.floorDepartments.map((fd: any) => fd.department).filter(Boolean)
                        : deptList.filter((d: any) => flDeptIds.includes(d.id));

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
                                flDepts.map((d: any) => (
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
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDrawer({ mode: "edit", type: "floor", item: { ...fl, departmentIds: flDeptIds, buildingId: fl.buildingId ?? bld?.id } })}
                                className="gap-1 text-xs"
                              >
                                <Pencil size={12} /> แก้ไข
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDelete({ type: "floor", id: fl.id, name: fl.name })}
                                className="gap-1 text-xs text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {floorList.length === 0 && (
              <div className="text-center py-12 text-text-muted">
                <Layers size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">ยังไม่มีชั้นในระบบ</p>
              </div>
            )}
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
                      <th className="text-center px-5 py-3 font-semibold text-text-secondary w-24">สถานะ</th>
                      <th className="text-right px-5 py-3 font-semibold text-text-secondary w-36">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepts.map((dept: any) => {
                      // Get location from floorDepartments (API data)
                      const deptFloorInfo = dept.floorDepartments?.[0];
                      const deptBuilding = deptFloorInfo?.floor?.building;
                      const deptFloor = deptFloorInfo?.floor;

                      return (
                        <tr
                          key={dept.id}
                          className={cn(
                            "border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors",
                            dept.isActive === false && "opacity-50"
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
                            {deptBuilding ? (
                              <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                                <Building2 size={13} className="text-text-muted" />
                                <span>{deptBuilding.name}</span>
                                <span className="text-text-muted">·</span>
                                <MapPin size={13} className="text-text-muted" />
                                <span className="font-medium">{deptFloor?.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-text-muted italic">ยังไม่กำหนดชั้น</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <ActiveBadge active={dept.isActive !== false} />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDeptActive(dept)}
                                className="text-xs px-2"
                              >
                                {dept.isActive !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDrawer({ mode: "edit", type: "department", item: dept })}
                                className="gap-1 text-xs"
                              >
                                <Pencil size={12} /> แก้ไข
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDelete({ type: "department", id: dept.id, name: dept.name })}
                                className="gap-1 text-xs text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={12} />
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
            ? drawer.item?.name
            : undefined
        }
      >
        {drawer?.type === "building" && (
          <BuildingForm
            initial={drawer.mode === "edit" ? drawer.item : undefined}
            onSave={async (formData: any) => {
              if (drawer.mode === "edit" && drawer.item) {
                await updateBuildingMut.mutateAsync({ id: drawer.item.id, ...formData });
              } else {
                await createBuildingMut.mutateAsync(formData);
              }
              setDrawer(null);
            }}
            onCancel={() => setDrawer(null)}
            saving={createBuildingMut.isPending || updateBuildingMut.isPending}
          />
        )}
        {drawer?.type === "floor" && (
          <FloorForm
            initial={drawer.mode === "edit" ? drawer.item : undefined}
            buildings={buildingList}
            departments={deptList}
            onSave={async (formData: any) => {
              if (drawer.mode === "edit" && drawer.item) {
                await updateFloorMut.mutateAsync({ id: drawer.item.id, ...formData });
              } else {
                await createFloorMut.mutateAsync(formData);
              }
              setDrawer(null);
            }}
            onCancel={() => setDrawer(null)}
            saving={createFloorMut.isPending || updateFloorMut.isPending}
          />
        )}
        {drawer?.type === "department" && (
          <DepartmentForm
            initial={drawer.mode === "edit" ? drawer.item : undefined}
            onSave={async (formData: any) => {
              if (drawer.mode === "edit" && drawer.item) {
                await updateDeptMut.mutateAsync({ id: drawer.item.id, ...formData });
              } else {
                await createDeptMut.mutateAsync(formData);
              }
              setDrawer(null);
            }}
            onCancel={() => setDrawer(null)}
            saving={createDeptMut.isPending || updateDeptMut.isPending}
          />
        )}
      </Drawer>

      {/* ══════ Confirm Delete Dialog ══════ */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-text-primary mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-text-secondary mb-1">
              คุณต้องการลบ{confirmDelete.type === "building" ? "อาคาร" : confirmDelete.type === "floor" ? "ชั้น" : "แผนก"}นี้หรือไม่?
            </p>
            <p className="text-sm font-semibold text-text-primary mb-4">&quot;{confirmDelete.name}&quot;</p>
            <p className="text-xs text-red-500 mb-4">
              {confirmDelete.type === "building" ? "การลบอาคารจะลบชั้นและข้อมูลที่เกี่ยวข้องทั้งหมด" : "การดำเนินการนี้ไม่สามารถย้อนกลับได้"}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteBuildingMut.isPending || deleteFloorMut.isPending || deleteDeptMut.isPending}
              >
                {(deleteBuildingMut.isPending || deleteFloorMut.isPending || deleteDeptMut.isPending) ? "กำลังลบ..." : "ลบ"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}
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
  saving,
}: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [totalFloors, setTotalFloors] = useState(initial?.totalFloors?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSubmit = () => {
    onSave({ name, nameEn, totalFloors: Number(totalFloors) || 0, description });
  };

  return (
    <div className="p-6 space-y-5">
      <Input label="ชื่ออาคาร (ไทย)" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="เช่น ศูนย์ราชการ อาคาร C" />
      <Input label="ชื่ออาคาร (อังกฤษ)" value={nameEn} onChange={(e: any) => setNameEn(e.target.value)} placeholder="e.g. Government Center Building C" />
      <Input
        label="จำนวนชั้น"
        type="number"
        value={totalFloors}
        onChange={(e: any) => setTotalFloors(e.target.value)}
        placeholder="9"
        leftIcon={<Layers size={16} />}
      />
      <Input
        label="คำอธิบาย"
        value={description}
        onChange={(e: any) => setDescription(e.target.value)}
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
              <Layers size={12} /> ชั้นทั้งหมด: <strong className="text-text-primary">{initial.floors?.length ?? initial.totalFloors ?? 0}</strong>
            </div>
            <div className="flex items-center gap-1">
              <Hash size={12} /> ID: <strong className="text-text-primary">{initial.id}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={saving}>
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
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
  buildings,
  departments,
  onSave,
  onCancel,
  saving,
}: {
  initial?: any;
  buildings: any[];
  departments: any[];
  onSave: (data: any) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [selectedDepts, setSelectedDepts] = useState<number[]>(initial?.departmentIds ?? []);
  const [buildingId, setBuildingId] = useState(initial?.buildingId?.toString() ?? "");
  const [floorNumber, setFloorNumber] = useState(initial?.floorNumber?.toString() ?? "");
  const [floorName, setFloorName] = useState(initial?.name ?? "");
  const [floorNameEn, setFloorNameEn] = useState(initial?.nameEn ?? "");

  const handleSubmit = () => {
    onSave({ buildingId: Number(buildingId), floorNumber: Number(floorNumber), name: floorName, nameEn: floorNameEn, departmentIds: selectedDepts });
  };

  const toggleDept = (id: number) =>
    setSelectedDepts((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));

  return (
    <div className="p-6 space-y-5">
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block">อาคาร</label>
        <select
          value={buildingId}
          onChange={(e) => setBuildingId(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
          <option value="">เลือกอาคาร</option>
          {buildings.map((b: any) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="ลำดับชั้น"
        type="number"
        value={floorNumber}
        onChange={(e: any) => setFloorNumber(e.target.value)}
        placeholder="3"
        leftIcon={<Hash size={16} />}
      />
      <Input label="ชื่อชั้น (ไทย)" value={floorName} onChange={(e: any) => setFloorName(e.target.value)} placeholder="เช่น ชั้น 3 — สำนักงานปลัด" />
      <Input label="ชื่อชั้น (อังกฤษ)" value={floorNameEn} onChange={(e: any) => setFloorNameEn(e.target.value)} placeholder="e.g. 3F — OPS" />

      {/* Department multi-select */}
      <div>
        <label className="text-sm font-semibold text-text-primary mb-2 block flex items-center gap-1.5">
          <Landmark size={15} className="text-accent-600" /> แผนกที่ตั้งอยู่ในชั้นนี้
        </label>
        <div className="space-y-1.5 max-h-64 overflow-y-auto rounded-lg border border-border p-2">
          {departments.map((dept: any) => (
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

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={saving}>
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
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
  saving,
}: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [deptName, setDeptName] = useState(initial?.name ?? "");
  const [deptNameEn, setDeptNameEn] = useState(initial?.nameEn ?? "");

  const handleSubmit = () => {
    onSave({ name: deptName, nameEn: deptNameEn });
  };

  return (
    <div className="p-6 space-y-5">
      <Input label="ชื่อแผนก (ไทย)" value={deptName} onChange={(e: any) => setDeptName(e.target.value)} placeholder="เช่น กองกิจการท่องเที่ยว" />
      <Input label="ชื่อแผนก (อังกฤษ)" value={deptNameEn} onChange={(e: any) => setDeptNameEn(e.target.value)} placeholder="e.g. Tourism Affairs Division" />

      {/* Cross-reference */}
      {initial && (
        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
            <Info size={13} className="text-info" /> ข้อมูลที่เชื่อมโยงในระบบ
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <Hash size={12} /> ID: <strong className="text-text-primary">{initial.id}</strong>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <MapPin size={12} /> สถานที่:{" "}
              {initial.floorDepartments?.[0]?.floor?.building ? (
                <strong className="text-text-primary">
                  {initial.floorDepartments[0].floor.building.name} · {initial.floorDepartments[0].floor.name}
                </strong>
              ) : (
                <span className="italic">ยังไม่กำหนดชั้น (กำหนดได้ที่แท็บ &quot;ชั้น&quot;)</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={saving}>
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
