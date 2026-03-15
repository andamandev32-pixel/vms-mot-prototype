"use client";

import { useState, useCallback } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";
import {
  Settings,
  Building2,
  Layers,
  QrCode,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Info,
  DoorOpen,
  MapPin,
  Link2,
  CalendarDays,
  Timer,
  Check,
  X,
  Eye,
  Save,
} from "lucide-react";
import {
  buildings as initialBuildings,
  floors as initialFloors,
  accessZones as initialAccessZones,
  accessGroups as initialAccessGroups,
  departments,
  departmentAccessMappings as initialDeptMappings,
  accessZoneTypeLabels,
  type Building,
  type AccessGroup,
  type AccessZone,
  type AccessZoneType,
  type DepartmentAccessMapping,
} from "@/lib/mock-data";

/* ── helpers ───────────────────────────────────── */
const dayLabels = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function ZoneTypeBadge({ type }: { type: AccessZoneType }) {
  const cfg = accessZoneTypeLabels[type];
  const colorMap: Record<AccessZoneType, string> = {
    office: "bg-primary-50 text-primary",
    "meeting-room": "bg-info-light text-info",
    lobby: "bg-success-light text-success",
    parking: "bg-gray-100 text-gray-600",
    common: "bg-accent-50 text-accent-600",
    restricted: "bg-error-light text-error",
    service: "bg-warning-light text-warning",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full", colorMap[type])}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */
export default function AccessZonesSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const schema = getSchemaByPageId("access-zones")!;
  const flowData = getFlowByPageId("access-zones")!;
  const [activeTab, setActiveTab] = useState<"groups" | "zones" | "mapping">("groups");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);

  /* ── Stateful data ────────────────────────────── */
  const [accessGroups, setAccessGroups] = useState<AccessGroup[]>(initialAccessGroups);
  const [accessZones, setAccessZones] = useState<AccessZone[]>(initialAccessZones);
  const [buildings] = useState<Building[]>(initialBuildings);
  const [floors] = useState(initialFloors);
  const [deptMappings, setDeptMappings] = useState<DepartmentAccessMapping[]>(initialDeptMappings);

  /* drawer state — Access Group */
  const [groupDrawer, setGroupDrawer] = useState<{ mode: "add" | "edit"; group?: AccessGroup } | null>(null);
  /* drawer state — Zone */
  const [zoneDrawer, setZoneDrawer] = useState<{ mode: "add" | "edit"; zone?: AccessZone } | null>(null);
  /* drawer state — Mapping */
  const [mappingDrawer, setMappingDrawer] = useState<{ mapping?: DepartmentAccessMapping } | null>(null);

  /* ── Delete confirm ─────────────────────────── */
  const [deleteTarget, setDeleteTarget] = useState<{ type: "group" | "zone"; id: string; name: string } | null>(null);

  const toggleGroup = (id: string) => setExpandedGroup((p) => (p === id ? null : id));
  const toggleBuilding = (id: string) => setExpandedBuilding((p) => (p === id ? null : id));

  /* ── CRUD handlers ──────────────────────────── */
  const handleSaveGroup = useCallback((group: AccessGroup, isEdit: boolean) => {
    setAccessGroups((prev) =>
      isEdit ? prev.map((g) => (g.id === group.id ? group : g)) : [...prev, group]
    );
    setGroupDrawer(null);
  }, []);

  const handleSaveZone = useCallback((zone: AccessZone, isEdit: boolean) => {
    setAccessZones((prev) =>
      isEdit ? prev.map((z) => (z.id === zone.id ? zone : z)) : [...prev, zone]
    );
    setZoneDrawer(null);
  }, []);

  const handleSaveMapping = useCallback((mapping: DepartmentAccessMapping) => {
    setDeptMappings((prev) =>
      prev.map((m) => (m.departmentId === mapping.departmentId ? mapping : m))
    );
    setMappingDrawer(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "group") {
      setAccessGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    } else {
      setAccessZones((prev) => prev.filter((z) => z.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }, [deleteTarget]);

  /* stats */
  const activeGroups = accessGroups.filter((g) => g.isActive);
  const activeZones = accessZones.filter((z) => z.isActive);
  const totalDoors = new Set(activeZones.map((z) => z.hikvisionDoorId)).size;

  return (
    <>
      <Topbar title="จัดการโซนเข้าพื้นที่ / Access Groups" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              โซนเข้าพื้นที่ &amp; QR Access Groups
              <DbSchemaButton onClick={() => setShowSchema(true)} />
              <FlowRulesButton onClick={() => setShowFlow(true)} />
            </h3>
            <p className="text-sm text-text-muted mt-1">
              กำหนดอาคาร ชั้น โซน และกลุ่มสิทธิ์เข้าพื้นที่ สำหรับส่งไปสร้าง QR Code ในระบบ Hikvision Access Control
            </p>
          </div>
          <Button variant="secondary" className="h-10 shadow-sm" onClick={() => setGroupDrawer({ mode: "add" })}>
            <Plus size={18} className="mr-2" />
            เพิ่ม Access Group
          </Button>
        </div>

        {/* Info Banner */}
        <Card className="border-none shadow-sm bg-info-light border-l-4 !border-l-info">
          <CardContent className="p-4 flex items-start gap-3">
            <Info size={20} className="text-info mt-0.5 shrink-0" />
            <div className="text-sm text-info">
              <p className="font-medium">การเชื่อมต่อ Hikvision Access Control</p>
              <ul className="mt-1.5 space-y-0.5 text-xs opacity-90 list-none">
                <li>1. กำหนด <strong>อาคาร / ชั้น / โซน</strong> พร้อม Hikvision Door ID</li>
                <li>2. สร้าง <strong>Access Group</strong> โดยรวมโซนที่ต้องการเข้าถึง → ระบบสร้าง Person Group ใน Hikvision</li>
                <li>3. ผู้เข้าเยี่ยมได้รับ <strong>QR Code</strong> ที่ผูกกับ Access Group → สแกนที่ประตู Hikvision เพื่อเข้าพื้นที่</li>
                <li>4. QR Code มี <strong>วันหมดอายุ + ตารางเวลา</strong> ตาม Access Group ที่กำหนด</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard label="Access Groups" value={activeGroups.length} sub={`เปิดใช้ จาก ${accessGroups.length}`} color="text-primary" bgColor="bg-primary-50" icon={<QrCode size={20} />} />
          <SummaryCard label="โซนเข้าพื้นที่" value={activeZones.length} sub={`จุดควบคุม ${totalDoors} ประตู`} color="text-info" bgColor="bg-info-light" icon={<MapPin size={20} />} />
          <SummaryCard label="อาคาร" value={buildings.length} sub={`${floors.length} ชั้น`} color="text-accent-600" bgColor="bg-accent-50" icon={<Building2 size={20} />} />
          <SummaryCard label="หน่วยงาน" value={departments.length} sub="ที่ผูก Access Group" color="text-success" bgColor="bg-success-light" icon={<Layers size={20} />} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { key: "groups" as const, label: "Access Groups", icon: <QrCode size={16} /> },
            { key: "zones" as const, label: "อาคาร / ชั้น / โซน", icon: <Building2 size={16} /> },
            { key: "mapping" as const, label: "หน่วยงาน → Access Group", icon: <Link2 size={16} /> },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all",
                activeTab === tab.key
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "groups" && (
          <div className="space-y-4">
            {accessGroups.map((group) => (
              <AccessGroupCard
                key={group.id}
                group={group}
                allZones={accessZones}
                allGroups={accessGroups}
                allFloors={floors}
                allBuildings={buildings}
                deptMappings={deptMappings}
                isExpanded={expandedGroup === group.id}
                onToggle={() => toggleGroup(group.id)}
                onEdit={() => setGroupDrawer({ mode: "edit", group })}
                onDelete={() => setDeleteTarget({ type: "group", id: group.id, name: group.name })}
              />
            ))}
          </div>
        )}

        {activeTab === "zones" && (
          <div className="space-y-4">
            {buildings.map((bld) => (
              <BuildingCard
                key={bld.id}
                building={bld}
                allZones={accessZones}
                allFloors={floors}
                allGroups={accessGroups}
                isExpanded={expandedBuilding === bld.id}
                onToggle={() => toggleBuilding(bld.id)}
                onEditZone={(zone) => setZoneDrawer({ mode: "edit", zone })}
                onAddZone={() => setZoneDrawer({ mode: "add" })}
                onDeleteZone={(zone) => setDeleteTarget({ type: "zone", id: zone.id, name: zone.name })}
              />
            ))}
          </div>
        )}

        {activeTab === "mapping" && (
          <DepartmentMappingTable
            mappings={deptMappings}
            allGroups={accessGroups}
            allFloors={floors}
            allBuildings={buildings}
            onEditMapping={(m) => setMappingDrawer({ mapping: m })}
          />
        )}

        {/* ─── Drawers ─────────────────────────── */}
        <AccessGroupDrawer
          data={groupDrawer}
          onClose={() => setGroupDrawer(null)}
          onSave={handleSaveGroup}
          allZones={accessZones}
          allFloors={floors}
        />
        <ZoneDrawer
          data={zoneDrawer}
          onClose={() => setZoneDrawer(null)}
          onSave={handleSaveZone}
          allBuildings={buildings}
          allFloors={floors}
        />
        <MappingDrawer
          data={mappingDrawer}
          onClose={() => setMappingDrawer(null)}
          onSave={handleSaveMapping}
          allGroups={accessGroups}
        />

        {/* ─── Delete Confirm ─────────────────── */}
        <ConfirmModal
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          variant="danger"
          title={`ลบ${deleteTarget?.type === "group" ? " Access Group" : "โซน"}`}
          titleEn={`Delete ${deleteTarget?.type === "group" ? "Access Group" : "Zone"}`}
          description={`คุณต้องการลบ "${deleteTarget?.name}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          confirmLabel="ลบ"
          cancelLabel="ยกเลิก"
        />
      </main>
    </>
  );
}

/* ══════════════════════════════════════════════════
   ACCESS GROUP CARD
   ══════════════════════════════════════════════════ */
function AccessGroupCard({
  group,
  allZones,
  allGroups,
  allFloors,
  allBuildings,
  deptMappings,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  group: AccessGroup;
  allZones: AccessZone[];
  allGroups: AccessGroup[];
  allFloors: typeof initialFloors;
  allBuildings: Building[];
  deptMappings: DepartmentAccessMapping[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const zones = allZones.filter((z) => group.zoneIds.includes(z.id));
  const mappedDepts = deptMappings.filter(
    (m) => m.defaultAccessGroupId === group.id || m.additionalGroupIds.includes(group.id)
  );

  return (
    <Card className={cn("border-none shadow-sm transition-shadow", !group.isActive && "opacity-50", isExpanded && "ring-2 ring-primary/20 shadow-md")}>
      <button type="button" className="w-full text-left" onClick={onToggle}>
        <CardContent className="p-5 flex items-center gap-4">
          {/* color dot + name */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: group.color + "20" }}>
            <QrCode size={20} style={{ color: group.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-text-primary text-base truncate">{group.name}</p>
              {group.isActive ? <Badge variant="approved">เปิดใช้</Badge> : <Badge variant="rejected">ปิดใช้</Badge>}
            </div>
            <p className="text-xs text-text-muted mt-0.5">{group.nameEn} · Hikvision: {group.hikvisionGroupId}</p>
          </div>

          {/* quick stats */}
          <div className="hidden md:flex items-center gap-5 text-xs text-text-secondary shrink-0 mr-2">
            <span className="flex items-center gap-1.5">
              <DoorOpen size={14} className="text-primary" />
              {zones.length} โซน
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-accent-600" />
              {mappedDepts.length} หน่วยงาน
            </span>
            <span className="flex items-center gap-1.5">
              <Timer size={14} className="text-info" />
              {group.validityMinutes} นาที
            </span>
          </div>

          {/* actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button className="p-2 hover:bg-primary-50 rounded-lg transition-colors text-text-muted hover:text-primary" onClick={onEdit}>
              <Pencil size={16} />
            </button>
            <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-text-muted hover:text-error" onClick={onDelete}>
              <Trash2 size={16} />
            </button>
          </div>

          <div className="shrink-0 text-text-muted">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </CardContent>
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Description + Meta */}
          <div className="px-5 py-4 bg-gray-50/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs mb-1">รายละเอียด</p>
              <p className="text-text-primary font-medium">{group.description}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">ตารางเวลาอนุญาต</p>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {dayLabels.map((d, i) => (
                    <span
                      key={i}
                      className={cn(
                        "w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center",
                        group.schedule.daysOfWeek.includes(i)
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-400"
                      )}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <Clock size={12} /> {group.schedule.startTime} – {group.schedule.endTime}
                </span>
              </div>
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">QR Code</p>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white border border-border px-2 py-1 rounded">{group.qrCodePrefix}-XXXXXXXX</span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Timer size={12} /> หมดอายุ {group.validityMinutes} นาที
                </span>
              </div>
            </div>
          </div>

          {/* Zones table */}
          <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-border">
            <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
              <DoorOpen size={14} className="text-primary" />
              โซนที่เข้าถึงได้ ({zones.length} โซน)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-gray-50/60 border-b border-border">
                <tr>
                  <th className="px-5 py-2.5">โซน</th>
                  <th className="px-5 py-2.5">อาคาร / ชั้น</th>
                  <th className="px-5 py-2.5">ประเภท</th>
                  <th className="px-5 py-2.5">Hikvision Door ID</th>
                  <th className="px-5 py-2.5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {zones.map((zone) => {
                  const floor = allFloors.find((f) => f.id === zone.floorId);
                  const bld = allBuildings.find((b) => b.id === zone.buildingId);
                  return (
                    <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-2.5 font-medium text-text-primary">{zone.name}</td>
                      <td className="px-5 py-2.5 text-text-muted text-xs">{bld?.name.split("(")[0].trim()} · {floor?.name.split("—")[0].trim()}</td>
                      <td className="px-5 py-2.5"><ZoneTypeBadge type={zone.type} /></td>
                      <td className="px-5 py-2.5 font-mono text-xs text-text-secondary">{zone.hikvisionDoorId}</td>
                      <td className="px-5 py-2.5 text-center">
                        {zone.isActive ? <Badge variant="approved">เปิด</Badge> : <Badge variant="rejected">ปิด</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mapped departments */}
          {mappedDepts.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-gray-50/40">
              <p className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
                <Building2 size={14} className="text-accent-600" />
                หน่วยงานที่ใช้ Access Group นี้
              </p>
              <div className="flex flex-wrap gap-2">
                {mappedDepts.map((m) => {
                  const dept = departments.find((d) => d.id === m.departmentId);
                  const isDefault = m.defaultAccessGroupId === group.id;
                  return (
                    <span
                      key={m.departmentId}
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border",
                        isDefault
                          ? "bg-primary-50 text-primary border-primary/20 font-medium"
                          : "bg-gray-100 text-text-secondary border-border"
                      )}
                    >
                      {dept?.name ?? m.departmentId}
                      {isDefault && <span className="text-[10px] opacity-70">(หลัก)</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   BUILDING CARD (Zones tab)
   ══════════════════════════════════════════════════ */
function BuildingCard({
  building,
  allZones,
  allFloors,
  allGroups,
  isExpanded,
  onToggle,
  onEditZone,
  onAddZone,
  onDeleteZone,
}: {
  building: Building;
  allZones: AccessZone[];
  allFloors: typeof initialFloors;
  allGroups: AccessGroup[];
  isExpanded: boolean;
  onToggle: () => void;
  onEditZone: (zone: AccessZone) => void;
  onAddZone: () => void;
  onDeleteZone: (zone: AccessZone) => void;
}) {
  const bldFloors = allFloors.filter((f) => f.buildingId === building.id);
  const bldZones = allZones.filter((z) => z.buildingId === building.id);
  const bldDepts = new Set(bldFloors.flatMap((f) => f.departmentIds));

  return (
    <Card className={cn("border-none shadow-sm transition-shadow", isExpanded && "ring-2 ring-primary/20 shadow-md")}>
      <button type="button" className="w-full text-left" onClick={onToggle}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-accent-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-primary text-base truncate">{building.name}</p>
            <p className="text-xs text-text-muted mt-0.5">{building.nameEn} · {building.description}</p>
          </div>
          <div className="hidden md:flex items-center gap-5 text-xs text-text-secondary shrink-0 mr-2">
            <span className="flex items-center gap-1.5">
              <Layers size={14} className="text-primary" />
              {bldFloors.length} ชั้น
            </span>
            <span className="flex items-center gap-1.5">
              <DoorOpen size={14} className="text-info" />
              {bldZones.length} โซน
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-accent-600" />
              {bldDepts.size} หน่วยงาน
            </span>
          </div>
          <div className="shrink-0 text-text-muted">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </CardContent>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {bldFloors.map((floor) => {
            const floorZones = bldZones.filter((z) => z.floorId === floor.id);
            const floorDepts = floor.departmentIds.map((did) => departments.find((d) => d.id === did)).filter(Boolean);

            return (
              <div key={floor.id} className="border-b border-border last:border-b-0">
                {/* Floor header */}
                <div className="px-5 py-3 bg-gray-50/60 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-xs font-bold text-primary">
                    {floor.floorNumber}F
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{floor.name}</p>
                    {floorDepts.length > 0 && (
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {floorDepts.map((d) => d!.name).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-text-muted">{floorZones.length} โซน</span>
                </div>

                {/* Zones on this floor */}
                {floorZones.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-text-secondary uppercase bg-white border-b border-border">
                        <tr>
                          <th className="px-5 py-2">โซน</th>
                          <th className="px-5 py-2">ประเภท</th>
                          <th className="px-5 py-2">Hikvision Door ID</th>
                          <th className="px-5 py-2 text-center">สถานะ</th>
                          <th className="px-5 py-2 text-center">Access Groups</th>
                          <th className="px-5 py-2 text-right">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {floorZones.map((zone) => {
                          const zoneGroups = allGroups.filter((g) => g.zoneIds.includes(zone.id));
                          return (
                            <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-2.5 font-medium text-text-primary">{zone.name}</td>
                              <td className="px-5 py-2.5"><ZoneTypeBadge type={zone.type} /></td>
                              <td className="px-5 py-2.5 font-mono text-xs text-text-secondary">{zone.hikvisionDoorId}</td>
                              <td className="px-5 py-2.5 text-center">
                                {zone.isActive ? <Badge variant="approved">เปิด</Badge> : <Badge variant="rejected">ปิด</Badge>}
                              </td>
                              <td className="px-5 py-2.5 text-center">
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  {zoneGroups.slice(0, 3).map((g) => (
                                    <span
                                      key={g.id}
                                      className="inline-block w-3 h-3 rounded-full border border-white shadow-sm"
                                      style={{ backgroundColor: g.color }}
                                      title={g.name}
                                    />
                                  ))}
                                  {zoneGroups.length > 3 && (
                                    <span className="text-[10px] text-text-muted">+{zoneGroups.length - 3}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button className="p-1.5 hover:bg-primary-50 rounded-md transition-colors text-text-muted hover:text-primary" onClick={() => onEditZone(zone)}>
                                    <Pencil size={14} />
                                  </button>
                                  <button className="p-1.5 hover:bg-red-50 rounded-md transition-colors text-text-muted hover:text-error" onClick={() => onDeleteZone(zone)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   DEPARTMENT MAPPING TABLE (Mapping tab)
   ══════════════════════════════════════════════════ */
function DepartmentMappingTable({
  mappings,
  allGroups,
  allFloors,
  allBuildings,
  onEditMapping,
}: {
  mappings: DepartmentAccessMapping[];
  allGroups: AccessGroup[];
  allFloors: typeof initialFloors;
  allBuildings: Building[];
  onEditMapping: (m: DepartmentAccessMapping) => void;
}) {
  return (
    <Card className="border-none shadow-sm">
      <div className="px-5 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
          <Link2 size={14} className="text-primary" />
          การผูกหน่วยงาน → Access Group ({mappings.length} หน่วยงาน)
        </p>
        <Button variant="outline" className="h-8 text-xs px-3">
          <Pencil size={14} className="mr-1" />
          แก้ไข Mapping
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-gray-50/60 border-b border-border">
            <tr>
              <th className="px-5 py-3">หน่วยงาน</th>
              <th className="px-5 py-3">อาคาร / ชั้น</th>
              <th className="px-5 py-3">Access Group หลัก</th>
              <th className="px-5 py-3">Access Group เพิ่มเติม</th>
              <th className="px-5 py-3 text-center">โซนรวม</th>
              <th className="px-5 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mappings.map((mapping) => {
              const dept = departments.find((d) => d.id === mapping.departmentId);
              const defaultGroup = allGroups.find((g) => g.id === mapping.defaultAccessGroupId);
              const additionalGroups = mapping.additionalGroupIds.map((gid) => allGroups.find((g) => g.id === gid)).filter(Boolean);
              const allGroupIds = [mapping.defaultAccessGroupId, ...mapping.additionalGroupIds];
              const totalZones = new Set(
                allGroups.filter((g) => allGroupIds.includes(g.id)).flatMap((g) => g.zoneIds)
              ).size;

              return (
                <tr key={mapping.departmentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-text-primary">{dept?.name ?? mapping.departmentId}</p>
                    <p className="text-[11px] text-text-muted">{dept?.nameEn}</p>
                  </td>
                  <td className="px-5 py-3.5 text-text-muted text-xs">
                    {dept ? `${dept.building} · ${dept.floor}` : "-"}
                  </td>
                  <td className="px-5 py-3.5">
                    {defaultGroup && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border" style={{ backgroundColor: defaultGroup.color + "15", color: defaultGroup.color, borderColor: defaultGroup.color + "30" }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: defaultGroup.color }} />
                        {defaultGroup.name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {additionalGroups.map((g) => (
                        <span key={g!.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-text-secondary border border-border">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g!.color }} />
                          {g!.name}
                        </span>
                      ))}
                      {additionalGroups.length === 0 && <span className="text-xs text-text-muted">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary-50 px-2 py-0.5 rounded-full">
                      <MapPin size={11} /> {totalZones}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:bg-primary-50 rounded-md transition-colors text-text-muted hover:text-primary">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 hover:bg-primary-50 rounded-md transition-colors text-text-muted hover:text-primary" onClick={() => onEditMapping(mapping)}>
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   SUMMARY CARD
   ══════════════════════════════════════════════════ */
function SummaryCard({
  label,
  value,
  sub,
  color,
  bgColor,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bgColor, color)}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="text-xs text-text-muted">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   ACCESS GROUP DRAWER (Add / Edit)
   ══════════════════════════════════════════════════ */
const dayLabelsLong = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const colorOptions = ["#6B7280", "#6A0DAD", "#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED", "#0891B2", "#BE185D"];

function AccessGroupDrawer({
  data,
  onClose,
  onSave,
  allZones,
  allFloors,
}: {
  data: { mode: "add" | "edit"; group?: AccessGroup } | null;
  onClose: () => void;
  onSave: (group: AccessGroup, isEdit: boolean) => void;
  allZones: AccessZone[];
  allFloors: typeof initialFloors;
}) {
  const group = data?.group;
  const isEdit = data?.mode === "edit";

  const [name, setName] = useState(group?.name ?? "");
  const [nameEn, setNameEn] = useState(group?.nameEn ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [color, setColor] = useState(group?.color ?? "#6A0DAD");
  const [hikvisionGroupId, setHikvisionGroupId] = useState(group?.hikvisionGroupId ?? "");
  const [qrCodePrefix, setQrCodePrefix] = useState(group?.qrCodePrefix ?? "eVMS-");
  const [validityMinutes, setValidityMinutes] = useState(group?.validityMinutes ?? 60);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(group?.zoneIds ?? []);
  const [scheduleDays, setScheduleDays] = useState<number[]>(group?.schedule.daysOfWeek ?? [1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState(group?.schedule.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(group?.schedule.endTime ?? "17:00");
  const [isActive, setIsActive] = useState(group?.isActive ?? true);

  useState(() => {
    if (group) {
      setName(group.name); setNameEn(group.nameEn); setDescription(group.description);
      setColor(group.color); setHikvisionGroupId(group.hikvisionGroupId);
      setQrCodePrefix(group.qrCodePrefix); setValidityMinutes(group.validityMinutes);
      setSelectedZoneIds(group.zoneIds); setScheduleDays(group.schedule.daysOfWeek);
      setStartTime(group.schedule.startTime); setEndTime(group.schedule.endTime);
      setIsActive(group.isActive);
    }
  });

  const toggleDay = (d: number) =>
    setScheduleDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());

  const toggleZone = (zid: string) =>
    setSelectedZoneIds((prev) => prev.includes(zid) ? prev.filter((x) => x !== zid) : [...prev, zid]);

  return (
    <Drawer
      open={data !== null}
      onClose={onClose}
      title={isEdit ? "แก้ไข Access Group" : "เพิ่ม Access Group ใหม่"}
      subtitle={isEdit ? group?.name : "กำหนดกลุ่มสิทธิ์เข้าพื้นที่ใหม่"}
      width="w-[580px]"
    >
      <div className="p-6 space-y-5">
        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">สี</label>
          <div className="flex gap-2">
            {colorOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn("w-8 h-8 rounded-full border-2 transition-all", color === c ? "border-text-primary scale-110 shadow" : "border-transparent")}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">ชื่อ (ภาษาไทย) <span className="text-error">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ผู้เยี่ยมชมทั่วไป" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">ชื่อ (English)</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="General Visitor" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">รายละเอียด</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Hikvision Group ID</label>
            <input value={hikvisionGroupId} onChange={(e) => setHikvisionGroupId(e.target.value)} placeholder="HIK-GRP-xxx" className="w-full h-10 px-3 text-sm font-mono rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">QR Code Prefix</label>
            <input value={qrCodePrefix} onChange={(e) => setQrCodePrefix(e.target.value)} placeholder="eVMS-GEN" className="w-full h-10 px-3 text-sm font-mono rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">QR หมดอายุ (นาที)</label>
          <input type="number" min={1} value={validityMinutes} onChange={(e) => setValidityMinutes(Number(e.target.value))} className="w-28 h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">ตารางเวลาอนุญาต</label>
          <div className="flex gap-1 mb-3">
            {dayLabelsLong.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={cn(
                  "flex-1 py-2 text-[11px] font-bold rounded-lg transition-all",
                  scheduleDays.includes(i) ? "bg-primary text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                )}
              >
                {dayLabels[i]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <span className="text-text-muted">ถึง</span>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        {/* Zone selection */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">โซนที่เข้าถึงได้ ({selectedZoneIds.length} โซน)</label>
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {allZones.map((z) => {
              const floor = allFloors.find((f) => f.id === z.floorId);
              return (
                <label key={z.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedZoneIds.includes(z.id)}
                    onChange={() => toggleZone(z.id)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{z.name}</p>
                    <p className="text-[11px] text-text-muted">{floor?.name.split("—")[0].trim()}</p>
                  </div>
                  <ZoneTypeBadge type={z.type} />
                </label>
              );
            })}
          </div>
        </div>

        {/* Active */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-text-primary">เปิดใช้งาน</p>
            <p className="text-xs text-text-muted">เปิดใช้ Access Group นี้</p>
          </div>
          <button type="button" onClick={() => setIsActive(!isActive)} className={cn("w-12 h-7 rounded-full transition-colors relative", isActive ? "bg-primary" : "bg-gray-300")}>
            <span className={cn("absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform", isActive ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>
      </div>

      <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-border flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button
          variant="primary"
          onClick={() => {
            const savedGroup: AccessGroup = {
              id: group?.id ?? `ag-${Date.now()}`,
              name,
              nameEn,
              description,
              color,
              hikvisionGroupId,
              qrCodePrefix,
              validityMinutes,
              zoneIds: selectedZoneIds,
              schedule: { daysOfWeek: scheduleDays, startTime, endTime },
              allowedVisitTypes: group?.allowedVisitTypes ?? ["official", "meeting"],
              isActive,
            };
            onSave(savedGroup, !!isEdit);
          }}
        >
          <Save size={16} className="mr-2" />
          {isEdit ? "บันทึกการเปลี่ยนแปลง" : "เพิ่ม Access Group"}
        </Button>
      </div>
    </Drawer>
  );
}

/* ══════════════════════════════════════════════════
   ZONE DRAWER (Add / Edit)
   ══════════════════════════════════════════════════ */
const zoneTypes: AccessZoneType[] = ["office", "meeting-room", "lobby", "parking", "common", "restricted", "service"];

function ZoneDrawer({
  data,
  onClose,
  onSave,
  allBuildings,
  allFloors,
}: {
  data: { mode: "add" | "edit"; zone?: AccessZone } | null;
  onClose: () => void;
  onSave: (zone: AccessZone, isEdit: boolean) => void;
  allBuildings: Building[];
  allFloors: typeof initialFloors;
}) {
  const zone = data?.zone;
  const isEdit = data?.mode === "edit";

  const [name, setName] = useState(zone?.name ?? "");
  const [nameEn, setNameEn] = useState(zone?.nameEn ?? "");
  const [floorId, setFloorId] = useState(zone?.floorId ?? "");
  const [buildingId, setBuildingId] = useState(zone?.buildingId ?? allBuildings[0]?.id ?? "");
  const [type, setType] = useState<AccessZoneType>(zone?.type ?? "office");
  const [hikvisionDoorId, setHikvisionDoorId] = useState(zone?.hikvisionDoorId ?? "");
  const [isActive, setIsActive] = useState(zone?.isActive ?? true);

  useState(() => {
    if (zone) {
      setName(zone.name); setNameEn(zone.nameEn); setFloorId(zone.floorId);
      setBuildingId(zone.buildingId); setType(zone.type);
      setHikvisionDoorId(zone.hikvisionDoorId); setIsActive(zone.isActive);
    }
  });

  const bldFloors = allFloors.filter((f) => f.buildingId === buildingId);

  return (
    <Drawer
      open={data !== null}
      onClose={onClose}
      title={isEdit ? "แก้ไขโซน" : "เพิ่มโซนใหม่"}
      subtitle={isEdit ? zone?.name : "กำหนดโซนเข้าพื้นที่ใหม่"}
    >
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">ชื่อโซน (ไทย) <span className="text-error">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ล็อบบี้ ชั้น 1" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">ชื่อโซน (EN)</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Lobby 1F" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">อาคาร</label>
          <select value={buildingId} onChange={(e) => { setBuildingId(e.target.value); setFloorId(""); }} className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            {allBuildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">ชั้น <span className="text-error">*</span></label>
          <select value={floorId} onChange={(e) => setFloorId(e.target.value)} className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">— เลือกชั้น —</option>
            {bldFloors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">ประเภทโซน</label>
          <div className="flex flex-wrap gap-2">
            {zoneTypes.map((zt) => {
              const cfg = accessZoneTypeLabels[zt];
              return (
                <button
                  key={zt}
                  type="button"
                  onClick={() => setType(zt)}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 text-sm transition-all",
                    type === zt ? "border-primary bg-primary-50 font-medium" : "border-border hover:border-primary/30"
                  )}
                >
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Hikvision Door ID <span className="text-error">*</span></label>
          <input value={hikvisionDoorId} onChange={(e) => setHikvisionDoorId(e.target.value)} placeholder="HIK-DOOR-C1-01" className="w-full h-10 px-3 text-sm font-mono rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-text-primary">เปิดใช้งาน</p>
            <p className="text-xs text-text-muted">เปิดใช้โซนนี้ในระบบ</p>
          </div>
          <button type="button" onClick={() => setIsActive(!isActive)} className={cn("w-12 h-7 rounded-full transition-colors relative", isActive ? "bg-primary" : "bg-gray-300")}>
            <span className={cn("absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform", isActive ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>
      </div>

      <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-border flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button
          variant="primary"
          onClick={() => {
            const savedZone: AccessZone = {
              id: zone?.id ?? `zone-${Date.now()}`,
              name,
              nameEn,
              floorId,
              buildingId,
              type,
              hikvisionDoorId,
              isActive,
            };
            onSave(savedZone, !!isEdit);
          }}
        >
          <Save size={16} className="mr-2" />
          {isEdit ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มโซน"}
        </Button>
      </div>
    </Drawer>
  );
}

/* ══════════════════════════════════════════════════
   MAPPING DRAWER (Edit Department → Access Group)
   ══════════════════════════════════════════════════ */
function MappingDrawer({
  data,
  onClose,
  onSave,
  allGroups,
}: {
  data: { mapping?: DepartmentAccessMapping } | null;
  onClose: () => void;
  onSave: (mapping: DepartmentAccessMapping) => void;
  allGroups: AccessGroup[];
}) {
  const mapping = data?.mapping;
  const dept = departments.find((d) => d.id === mapping?.departmentId);

  const [defaultGroupId, setDefaultGroupId] = useState(mapping?.defaultAccessGroupId ?? "");
  const [additionalIds, setAdditionalIds] = useState<string[]>(mapping?.additionalGroupIds ?? []);

  useState(() => {
    if (mapping) {
      setDefaultGroupId(mapping.defaultAccessGroupId);
      setAdditionalIds(mapping.additionalGroupIds);
    }
  });

  const toggleAdditional = (gid: string) =>
    setAdditionalIds((prev) => prev.includes(gid) ? prev.filter((x) => x !== gid) : [...prev, gid]);

  return (
    <Drawer
      open={data !== null}
      onClose={onClose}
      title="แก้ไข Mapping หน่วยงาน"
      subtitle={dept ? `${dept.name} (${dept.nameEn})` : ""}
    >
      <div className="p-6 space-y-5">
        {dept && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-bold text-text-primary">{dept.name}</p>
            <p className="text-xs text-text-muted">{dept.nameEn} · {dept.floor} · {dept.building}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Access Group หลัก <span className="text-error">*</span></label>
          <select value={defaultGroupId} onChange={(e) => setDefaultGroupId(e.target.value)} className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">— เลือก Access Group หลัก —</option>
            {allGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.nameEn})</option>
            ))}
          </select>
          {defaultGroupId && (
            <div className="mt-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: allGroups.find((g) => g.id === defaultGroupId)?.color }} />
              <span className="text-xs text-text-secondary">{allGroups.find((g) => g.id === defaultGroupId)?.description}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Access Group เพิ่มเติม</label>
          <div className="space-y-2">
            {allGroups.filter((g) => g.id !== defaultGroupId).map((g) => (
              <label key={g.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={additionalIds.includes(g.id)}
                  onChange={() => toggleAdditional(g.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{g.name}</p>
                  <p className="text-[11px] text-text-muted">{g.nameEn} · {g.zoneIds.length} โซน</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 bg-primary-50/50 rounded-lg border border-primary/10">
          <p className="text-xs font-medium text-text-muted mb-2">สรุป</p>
          <p className="text-sm text-text-primary">
            <strong>{dept?.name}</strong> ใช้{" "}
            <strong>{1 + additionalIds.length}</strong> Access Group
            {" "}(เข้าถึง{" "}
            {new Set(
              allGroups
                .filter((g) => g.id === defaultGroupId || additionalIds.includes(g.id))
                .flatMap((g) => g.zoneIds)
            ).size}{" "}
            โซน)
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-border flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button
          variant="primary"
          onClick={() => {
            if (mapping) {
              onSave({
                departmentId: mapping.departmentId,
                defaultAccessGroupId: defaultGroupId,
                additionalGroupIds: additionalIds,
              });
            }
          }}
        >
          <Save size={16} className="mr-2" />
          บันทึก Mapping
        </Button>
      </div>
    </Drawer>
  );
}
