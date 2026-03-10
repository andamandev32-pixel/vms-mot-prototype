"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
} from "lucide-react";
import {
  buildings,
  floors,
  accessZones,
  accessGroups,
  departments,
  departmentAccessMappings,
  accessZoneTypeLabels,
  type Building,
  type AccessGroup,
  type AccessZone,
  type AccessZoneType,
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
  const [activeTab, setActiveTab] = useState<"groups" | "zones" | "mapping">("groups");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);

  const toggleGroup = (id: string) => setExpandedGroup((p) => (p === id ? null : id));
  const toggleBuilding = (id: string) => setExpandedBuilding((p) => (p === id ? null : id));

  /* stats */
  const activeGroups = accessGroups.filter((g) => g.isActive);
  const activeZones = accessZones.filter((z) => z.isActive);
  const totalDoors = new Set(activeZones.map((z) => z.hikvisionDoorId)).size;

  return (
    <>
      <Topbar title="จัดการโซนเข้าพื้นที่ / Access Groups" />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-primary" />
              โซนเข้าพื้นที่ &amp; QR Access Groups
            </h3>
            <p className="text-sm text-text-muted mt-1">
              กำหนดอาคาร ชั้น โซน และกลุ่มสิทธิ์เข้าพื้นที่ สำหรับส่งไปสร้าง QR Code ในระบบ Hikvision Access Control
            </p>
          </div>
          <Button variant="secondary" className="h-10 shadow-sm">
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
                isExpanded={expandedGroup === group.id}
                onToggle={() => toggleGroup(group.id)}
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
                isExpanded={expandedBuilding === bld.id}
                onToggle={() => toggleBuilding(bld.id)}
              />
            ))}
          </div>
        )}

        {activeTab === "mapping" && <DepartmentMappingTable />}
      </main>
    </>
  );
}

/* ══════════════════════════════════════════════════
   ACCESS GROUP CARD
   ══════════════════════════════════════════════════ */
function AccessGroupCard({
  group,
  isExpanded,
  onToggle,
}: {
  group: AccessGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const zones = accessZones.filter((z) => group.zoneIds.includes(z.id));
  const mappedDepts = departmentAccessMappings.filter(
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
            <button className="p-2 hover:bg-primary-50 rounded-lg transition-colors text-text-muted hover:text-primary">
              <Pencil size={16} />
            </button>
            <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-text-muted hover:text-error">
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
                  const floor = floors.find((f) => f.id === zone.floorId);
                  const bld = buildings.find((b) => b.id === zone.buildingId);
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
  isExpanded,
  onToggle,
}: {
  building: Building;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const bldFloors = floors.filter((f) => f.buildingId === building.id);
  const bldZones = accessZones.filter((z) => z.buildingId === building.id);
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
                          const zoneGroups = accessGroups.filter((g) => g.zoneIds.includes(zone.id));
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
                                  <button className="p-1.5 hover:bg-primary-50 rounded-md transition-colors text-text-muted hover:text-primary">
                                    <Pencil size={14} />
                                  </button>
                                  <button className="p-1.5 hover:bg-red-50 rounded-md transition-colors text-text-muted hover:text-error">
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
function DepartmentMappingTable() {
  return (
    <Card className="border-none shadow-sm">
      <div className="px-5 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
          <Link2 size={14} className="text-primary" />
          การผูกหน่วยงาน → Access Group ({departmentAccessMappings.length} หน่วยงาน)
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
            {departmentAccessMappings.map((mapping) => {
              const dept = departments.find((d) => d.id === mapping.departmentId);
              const defaultGroup = accessGroups.find((g) => g.id === mapping.defaultAccessGroupId);
              const additionalGroups = mapping.additionalGroupIds.map((gid) => accessGroups.find((g) => g.id === gid)).filter(Boolean);
              const allGroupIds = [mapping.defaultAccessGroupId, ...mapping.additionalGroupIds];
              const totalZones = new Set(
                accessGroups.filter((g) => allGroupIds.includes(g.id)).flatMap((g) => g.zoneIds)
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
                      <button className="p-1.5 hover:bg-primary-50 rounded-md transition-colors text-text-muted hover:text-primary">
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
