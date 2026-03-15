"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import Topbar from "@/components/web/Topbar";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Drawer } from "@/components/ui/Drawer";
import {
  Search, Plus, Check, X, Eye, Download, Upload, Trash2, AlertTriangle,
  Users, UserPlus, Building2, Wifi, WifiOff, FileSpreadsheet, ChevronDown, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  appointments as mockAppointments,
  staffMembers,
  departments,
  blocklist,
  visitPurposeConfigs,
  type Appointment,
  type EntryMode,
  visitTypes,
} from "@/lib/mock-data";

// ===== Tab definition =====
type TabFilter = "all" | "visitor" | "staff";
const tabs: { key: TabFilter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "visitor", label: "Visitor ลงทะเบียน" },
  { key: "staff", label: "เจ้าหน้าที่สร้าง" },
];

// ===== Companion entry =====
interface CompanionEntry {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  isBlacklisted?: boolean;
}

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Appointment | null>(null);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let result = [...mockAppointments];

    // Tab filter
    if (activeTab === "visitor") result = result.filter(a => a.createdBy === "visitor");
    if (activeTab === "staff") result = result.filter(a => a.createdBy === "staff");

    // Status filter
    if (statusFilter !== "all") result = result.filter(a => a.status === statusFilter);

    // Date filter
    if (dateFilter) result = result.filter(a => a.date === dateFilter);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.visitor.name.toLowerCase().includes(q) ||
        a.visitor.company.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.host.name.toLowerCase().includes(q) ||
        a.purpose.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeTab, statusFilter, dateFilter, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("");
  };

  return (
    <>
      <Topbar title="การนัดหมาย" />
      <main className="flex-1 p-6 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab.label}
              <span className={cn(
                "ml-2 text-xs px-1.5 py-0.5 rounded-full",
                activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-gray-200 text-text-muted"
              )}>
                {tab.key === "all" ? mockAppointments.length :
                  tab.key === "visitor" ? mockAppointments.filter(a => a.createdBy === "visitor").length :
                    mockAppointments.filter(a => a.createdBy === "staff").length}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full md:w-auto">
              <Input
                placeholder="ค้นหาชื่อ / รหัสนัดหมาย / บริษัท / ผู้พบ"
                leftIcon={<Search size={18} />}
                className="h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ไม่อนุมัติ</option>
                <option value="checked-in">เข้าพื้นที่แล้ว</option>
                <option value="checked-out">ออกแล้ว</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary text-text-muted"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="ghost" className="h-10 px-4 text-text-muted" onClick={clearFilters}>ล้างตัวกรอง</Button>
            </div>
            <div className="ml-auto">
              <Button variant="secondary" className="h-10 shadow-sm" onClick={() => setShowModal(true)}>
                <Plus size={18} className="mr-2" />
                สร้างนัดหมาย
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4">ผู้มาติดต่อ</th>
                  <th className="px-6 py-4">วัตถุประสงค์</th>
                  <th className="px-6 py-4">ประเภทการเข้า</th>
                  <th className="px-6 py-4">วันนัดหมาย</th>
                  <th className="px-6 py-4">ผู้พบ / สถานที่</th>
                  <th className="px-6 py-4">ผู้ติดตาม</th>
                  <th className="px-6 py-4">สร้างโดย</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAppointments.map((apt) => (
                  <AppointmentRow key={apt.id} apt={apt} onView={() => setShowDetailModal(apt)} />
                ))}
                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-text-muted">
                      ไม่พบรายการนัดหมายที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-text-muted">แสดง {filteredAppointments.length} จากทั้งหมด {mockAppointments.length} รายการ</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>ก่อนหน้า</Button>
                <Button variant="outline" size="sm">ถัดไป</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Create Appointment Drawer */}
      <CreateAppointmentDrawer open={showModal} onClose={() => setShowModal(false)} />

      {/* Appointment Detail Modal */}
      {showDetailModal && (
        <AppointmentDetailModal appointment={showDetailModal} onClose={() => setShowDetailModal(null)} />
      )}
    </>
  );
}

// ===== Appointment Row =====
function AppointmentRow({ apt, onView }: { apt: Appointment; onView: () => void }) {
  const purposeConfig = visitPurposeConfigs.find(p => {
    const typeMap: Record<string, string> = {
      official: "1", meeting: "2", document: "3", contractor: "4", delivery: "7", other: "8"
    };
    return p.id === typeMap[apt.type];
  });
  const typeName = purposeConfig?.name ?? visitTypes[apt.type]?.label ?? apt.type;

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {apt.visitor.name[0]}
          </div>
          <div>
            <p className="font-bold text-text-primary">{apt.visitor.name}</p>
            <p className="text-xs text-text-secondary">{apt.visitor.company}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-text-primary">{typeName}</p>
        <p className="text-xs text-text-muted truncate max-w-[180px]">{apt.purpose}</p>
      </td>
      <td className="px-6 py-4">
        {apt.entryMode === "period" ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
            <Calendar size={11} />
            ช่วงเวลา
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            🔹 ครั้งเดียว
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        {apt.entryMode === "period" && apt.dateEnd ? (
          <>
            <p className="font-medium text-text-primary">{apt.date} — {apt.dateEnd}</p>
            <p className="text-xs text-text-muted">{apt.timeStart} - {apt.timeEnd} น.</p>
          </>
        ) : (
          <>
            <p className="font-medium text-text-primary">{apt.date}</p>
            <p className="text-xs text-text-muted">{apt.timeStart} - {apt.timeEnd} น.</p>
          </>
        )}
      </td>
      <td className="px-6 py-4">
        <p className="text-text-primary">{apt.host.name}</p>
        <p className="text-xs text-text-muted">{apt.area} • {apt.floor}</p>
      </td>
      <td className="px-6 py-4">
        {apt.companions > 0 ? (
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-text-muted" />
            <span className="text-text-primary">{apt.companions} คน</span>
            {apt.companionNames && apt.companionNames.length > 0 && (
              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">ระบุชื่อ</span>
            )}
          </div>
        ) : (
          <span className="text-text-muted">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
          apt.createdBy === "staff" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
        )}>
          {apt.createdBy === "staff" ? <UserPlus size={12} /> : <Users size={12} />}
          {apt.createdBy === "staff" ? "เจ้าหน้าที่" : "Visitor"}
        </span>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={apt.status} size="sm" />
        {apt.approvedBy && <p className="text-[10px] text-text-muted mt-1">โดย: {apt.approvedBy}</p>}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {apt.status === "pending" && (
            <>
              <button className="h-8 w-8 rounded-full bg-green-50 text-success hover:bg-success hover:text-white flex items-center justify-center transition-colors border border-green-200" title="อนุมัติ">
                <Check size={16} />
              </button>
              <button className="h-8 w-8 rounded-full bg-red-50 text-error hover:bg-error hover:text-white flex items-center justify-center transition-colors border border-red-200" title="ปฏิเสธ">
                <X size={16} />
              </button>
            </>
          )}
          <button onClick={onView} className="h-8 w-8 rounded-full bg-gray-50 text-text-muted hover:bg-white hover:text-primary hover:shadow-sm flex items-center justify-center transition-colors border border-gray-200" title="ดูรายละเอียด">
            <Eye size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ===== Appointment Detail Modal =====
function AppointmentDetailModal({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 rounded-full p-1.5 text-text-muted hover:bg-gray-100 hover:text-text-primary transition-colors">
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-bold text-text-primary mb-1">รายละเอียดนัดหมาย</h2>
        <p className="text-xs text-text-muted mb-4 font-mono">{appointment.code}</p>

        <div className="space-y-3">
          <DetailSection title="ผู้มาติดต่อ">
            <DetailRow label="ชื่อ" value={appointment.visitor.name} />
            <DetailRow label="บริษัท" value={appointment.visitor.company} />
            <DetailRow label="โทรศัพท์" value={appointment.visitor.phone} />
          </DetailSection>

          <DetailSection title="รายละเอียดนัดหมาย">
            <DetailRow label="วัตถุประสงค์" value={appointment.purpose} />
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-text-secondary flex-shrink-0">ประเภทการเข้า</span>
              {appointment.entryMode === "period" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  <Calendar size={11} />
                  ช่วงเวลา
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  🔹 ครั้งเดียว
                </span>
              )}
            </div>
            {appointment.entryMode === "period" && appointment.dateEnd ? (
              <>
                <DetailRow label="วันเริ่ม" value={appointment.date} />
                <DetailRow label="วันสิ้นสุด" value={appointment.dateEnd} />
                <DetailRow label="เวลา" value={`${appointment.timeStart} - ${appointment.timeEnd}`} />
              </>
            ) : (
              <>
                <DetailRow label="วันที่" value={appointment.date} />
                <DetailRow label="เวลา" value={`${appointment.timeStart} - ${appointment.timeEnd}`} />
              </>
            )}
            <DetailRow label="ผู้พบ" value={appointment.host.name} />
            <DetailRow label="สถานที่" value={`${appointment.area} ${appointment.floor}`} />
          </DetailSection>

          {appointment.companions > 0 && (
            <DetailSection title="ผู้ติดตาม">
              <DetailRow label="จำนวน" value={`${appointment.companions} คน`} />
              {appointment.companionNames && appointment.companionNames.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-text-secondary font-medium">รายชื่อ:</p>
                  {appointment.companionNames.map((name, i) => (
                    <p key={i} className="text-sm text-text-primary pl-3">• {name}</p>
                  ))}
                </div>
              )}
            </DetailSection>
          )}

          {appointment.offerWifi && (
            <DetailSection title="WiFi">
              <div className="flex items-center gap-2 text-sm">
                <Wifi size={14} className="text-primary" />
                <span className="text-primary font-medium">เสนอ WiFi ให้ผู้มาติดต่อ</span>
              </div>
              {appointment.wifiUsername && (
                <>
                  <DetailRow label="Username" value={appointment.wifiUsername} />
                  <DetailRow label="Password" value={appointment.wifiPassword ?? "-"} />
                </>
              )}
            </DetailSection>
          )}

          <DetailSection title="สถานะ">
            <div className="flex items-center gap-2">
              <StatusBadge status={appointment.status} />
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                appointment.createdBy === "staff" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
              )}>
                สร้างโดย: {appointment.createdBy === "staff" ? "เจ้าหน้าที่" : "Visitor"}
              </span>
            </div>
            {appointment.approvedBy && <DetailRow label="อนุมัติโดย" value={appointment.approvedBy} />}
            {appointment.rejectedReason && <DetailRow label="เหตุผลปฏิเสธ" value={appointment.rejectedReason} />}
          </DetailSection>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>ปิด</Button>
        </div>
      </div>
    </div>
  );
}

// ===== Create Appointment Drawer =====
function CreateAppointmentDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPurposeId, setSelectedPurposeId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [hostSearch, setHostSearch] = useState("");
  const [selectedHost, setSelectedHost] = useState<typeof staffMembers[0] | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>("single");
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:00");
  const [offerWifiChecked, setOfferWifiChecked] = useState(false);

  // Companion mode
  const [companionMode, setCompanionMode] = useState<"count" | "names">("count");
  const [companionCount, setCompanionCount] = useState(0);
  const [companionList, setCompanionList] = useState<CompanionEntry[]>([]);

  // Blacklist alerts
  const [blacklistAlerts, setBlacklistAlerts] = useState<string[]>([]);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WiFi eligibility
  const selectedPurpose = visitPurposeConfigs.find(p => p.id === selectedPurposeId);
  const allowedModes = selectedPurpose?.allowedEntryModes ?? ["single"];
  const wifiEligible = selectedPurpose?.departmentRules.some(r =>
    (selectedDeptId ? r.departmentId === selectedDeptId : true) && r.offerWifi
  ) ?? false;

  // Host search
  const filteredHosts = useMemo(() => {
    if (hostSearch.length < 1) return [];
    return staffMembers.filter(s =>
      s.role !== "security" && (
        s.name.includes(hostSearch) ||
        s.nameEn.toLowerCase().includes(hostSearch.toLowerCase()) ||
        s.department.name.includes(hostSearch)
      )
    ).slice(0, 5);
  }, [hostSearch]);

  // Blacklist check function
  const checkBlacklist = useCallback((name: string): boolean => {
    const nameLower = name.toLowerCase().trim();
    return blocklist.some(entry => {
      const blockedName = entry.visitor.name.toLowerCase();
      return blockedName.includes(nameLower) || nameLower.includes(blockedName);
    });
  }, []);

  // Check primary visitor blacklist
  const checkPrimaryBlacklist = useCallback(() => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName || fullName === " ") return;
    const alerts: string[] = [];
    if (checkBlacklist(fullName)) {
      alerts.push(`⚠️ "${fullName}" อยู่ในรายชื่อ Blacklist!`);
    }
    // Check companion names too
    companionList.forEach(c => {
      const cName = `${c.firstName} ${c.lastName}`.trim();
      if (cName && checkBlacklist(cName)) {
        alerts.push(`⚠️ ผู้ติดตาม "${cName}" อยู่ในรายชื่อ Blacklist!`);
      }
    });
    setBlacklistAlerts(alerts);
  }, [firstName, lastName, companionList, checkBlacklist]);

  // Add companion manually
  const addCompanion = () => {
    setCompanionList(prev => [...prev, {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
    }]);
  };

  // Remove companion
  const removeCompanion = (id: string) => {
    setCompanionList(prev => prev.filter(c => c.id !== id));
  };

  // Update companion
  const updateCompanion = (id: string, field: keyof CompanionEntry, value: string) => {
    setCompanionList(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      // Check blacklist for this companion
      if (field === "firstName" || field === "lastName") {
        const cName = `${field === "firstName" ? value : c.firstName} ${field === "lastName" ? value : c.lastName}`.trim();
        updated.isBlacklisted = cName.length > 2 ? checkBlacklist(cName) : false;
      }
      return updated;
    }));
  };

  // Download Excel template (CSV)
  const downloadTemplate = () => {
    const BOM = "\uFEFF";
    const headers = "ชื่อ,นามสกุล,บริษัท/หน่วยงาน,เบอร์โทร";
    const sample1 = "สมศักดิ์,จริงใจ,บริษัท ABC จำกัด,081-234-5678";
    const sample2 = "Jane,Doe,World Tourism Org,092-345-6789";
    const csv = BOM + [headers, sample1, sample2].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companion_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import from CSV/Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      // Skip header line
      const dataLines = lines.slice(1);
      const newCompanions: CompanionEntry[] = dataLines.map((line, idx) => {
        const cols = line.split(",").map(c => c.trim());
        const cFirstName = cols[0] || "";
        const cLastName = cols[1] || "";
        const fullName = `${cFirstName} ${cLastName}`.trim();
        return {
          id: `import-${Date.now()}-${idx}`,
          firstName: cFirstName,
          lastName: cLastName,
          company: cols[2] || "",
          phone: cols[3] || "",
          isBlacklisted: fullName.length > 2 ? checkBlacklist(fullName) : false,
        };
      }).filter(c => c.firstName || c.lastName);
      setCompanionList(prev => [...prev, ...newCompanions]);
      setCompanionMode("names");
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Save handler (prototype: just close)
  const handleSave = () => {
    checkPrimaryBlacklist();
    onClose();
  };

  // Active visit purposes
  const activePurposes = visitPurposeConfigs.filter(p => p.isActive);

  // Department options based on selected purpose
  const deptOptions = selectedPurpose
    ? selectedPurpose.departmentRules.filter(r => r.isActive).map(r => {
      const dept = departments.find(d => d.id === r.departmentId);
      return dept ? { id: dept.id, name: dept.name, floor: dept.floor } : null;
    }).filter(Boolean)
    : [];

  // Handle purpose change — auto-select entry mode
  const handlePurposeChange = (purposeId: string) => {
    setSelectedPurposeId(purposeId);
    setSelectedDeptId("");
    const purpose = visitPurposeConfigs.find(p => p.id === purposeId);
    const modes = purpose?.allowedEntryModes ?? ["single"];
    if (modes.length === 1) {
      setEntryMode(modes[0]);
    } else if (!modes.includes(entryMode)) {
      setEntryMode(modes[0]);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="สร้างนัดหมายใหม่"
      subtitle="เจ้าหน้าที่สร้างนัดหมายให้ผู้จะมาติดต่อ"
      width="w-[640px]"
    >
      <div className="p-6 space-y-6">

          {/* Blacklist Alerts */}
          {blacklistAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-error font-bold text-sm mb-1">
                <AlertTriangle size={16} />
                แจ้งเตือน Blacklist
              </div>
              {blacklistAlerts.map((alert, i) => (
                <p key={i} className="text-sm text-red-700">{alert}</p>
              ))}
            </div>
          )}

          {/* Section 1: Primary Visitor Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Users size={16} />
              ข้อมูลผู้ติดต่อหลัก
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ชื่อ"
                placeholder="ระบุชื่อ"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={checkPrimaryBlacklist}
              />
              <Input
                label="นามสกุล"
                placeholder="ระบุนามสกุล"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={checkPrimaryBlacklist}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="บริษัท / หน่วยงาน"
                placeholder="ระบุสังกัด (ถ้ามี)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <Input
                label="เบอร์โทรศัพท์"
                placeholder="0XX-XXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Purpose & Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Building2 size={16} />
              วัตถุประสงค์และสถานที่
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วัตถุประสงค์การมา</label>
                <div className="relative">
                  <select
                    value={selectedPurposeId}
                    onChange={(e) => handlePurposeChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary appearance-none pr-8"
                  >
                    <option value="">-- เลือกวัตถุประสงค์ --</option>
                    {activePurposes.map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">หน่วยงาน / สถานที่</label>
                <div className="relative">
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    disabled={!selectedPurposeId}
                    className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary appearance-none pr-8 disabled:opacity-50"
                  >
                    <option value="">-- เลือกหน่วยงาน --</option>
                    {deptOptions.map(d => d && (
                      <option key={d.id} value={d.id}>{d.name} ({d.floor})</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Host search */}
            <div>
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">ผู้ติดต่อ (เจ้าหน้าที่ผู้รับพบ)</label>
              {selectedHost ? (
                <div className="bg-primary-50 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary">{selectedHost.name}</p>
                    <p className="text-[11px] text-text-muted truncate">{selectedHost.position} • {selectedHost.department.name}</p>
                  </div>
                  <button onClick={() => setSelectedHost(null)} className="text-xs text-primary font-bold px-2 py-1 hover:bg-primary/10 rounded-lg">
                    เปลี่ยน
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="ค้นหาชื่อเจ้าหน้าที่ หรือหน่วยงาน"
                    leftIcon={<Search size={16} />}
                    value={hostSearch}
                    onChange={(e) => setHostSearch(e.target.value)}
                  />
                  {filteredHosts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-30 max-h-[200px] overflow-y-auto">
                      {filteredHosts.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedHost(s); setHostSearch(""); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-border last:border-0 text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary">{s.name}</p>
                            <p className="text-[11px] text-text-muted">{s.position} • {s.department.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Entry Mode Selection */}
            {selectedPurposeId && (
              <div className="space-y-3">
                <label className="block text-xs font-medium uppercase text-text-secondary">ประเภทการเข้าพื้นที่</label>
                <div className="flex gap-2">
                  {allowedModes.includes("single") && (
                    <button
                      onClick={() => setEntryMode("single")}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all text-left",
                        entryMode === "single"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-text-secondary hover:border-primary/30"
                      )}
                    >
                      <span className="flex items-center gap-2">🔹 ขออนุญาตแบบ 1 ครั้ง</span>
                      <p className="text-[10px] mt-0.5 font-normal opacity-70">กำหนดวันที่ เวลาเริ่ม และเวลาสิ้นสุด</p>
                    </button>
                  )}
                  {allowedModes.includes("period") && (
                    <button
                      onClick={() => setEntryMode("period")}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all text-left",
                        entryMode === "period"
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-border text-text-secondary hover:border-purple-300"
                      )}
                    >
                      <span className="flex items-center gap-2"><Calendar size={14} /> ขออนุญาตตามช่วงเวลา</span>
                      <p className="text-[10px] mt-0.5 font-normal opacity-70">กำหนดวันเวลาเริ่ม และวันเวลาสิ้นสุด</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Date & Time — Single mode */}
            {entryMode === "single" && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันที่นัดหมาย</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาเริ่ม</label>
                  <input
                    type="time"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาสิ้นสุด</label>
                  <input
                    type="time"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Date & Time — Period mode */}
            {entryMode === "period" && (
              <div className="space-y-3 bg-purple-50/50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                  <Calendar size={14} />
                  กำหนดช่วงเวลาเข้าพื้นที่
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันเริ่มต้น</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วันสิ้นสุด</label>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาเริ่ม</label>
                    <input
                      type="time"
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">เวลาสิ้นสุด</label>
                    <input
                      type="time"
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* WiFi Offer */}
            {wifiEligible && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Wifi size={18} className="text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">เสนอ WiFi ให้ผู้มาติดต่อ</p>
                  <p className="text-[11px] text-blue-600">ประเภทการมานี้รองรับการให้ WiFi</p>
                </div>
                <button
                  onClick={() => setOfferWifiChecked(!offerWifiChecked)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    offerWifiChecked ? "bg-primary" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                    offerWifiChecked ? "translate-x-5.5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            )}
            {!wifiEligible && selectedPurposeId && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <WifiOff size={18} className="text-gray-400" />
                <p className="text-sm text-text-muted">ประเภทการมานี้ไม่มีการเสนอ WiFi</p>
              </div>
            )}
          </div>

          {/* Section 3: Companions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <UserPlus size={16} />
              ผู้ติดตาม
            </h3>

            {/* Mode selection */}
            <div className="flex gap-2">
              <button
                onClick={() => setCompanionMode("count")}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all",
                  companionMode === "count"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-text-secondary hover:border-primary/30"
                )}
              >
                ระบุจำนวนเท่านั้น
                <p className="text-[10px] mt-0.5 font-normal opacity-70">เฉพาะผู้ติดต่อหลัก check-in ได้</p>
              </button>
              <button
                onClick={() => setCompanionMode("names")}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all",
                  companionMode === "names"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-text-secondary hover:border-primary/30"
                )}
              >
                ระบุรายชื่อผู้ติดตาม
                <p className="text-[10px] mt-0.5 font-normal opacity-70">ทุกคนที่ระบุ check-in แยกกันได้</p>
              </button>
            </div>

            {companionMode === "count" && (
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                <label className="text-sm text-text-primary font-medium">จำนวนผู้ติดตาม</label>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={() => setCompanionCount(Math.max(0, companionCount - 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <span className="text-lg">−</span>
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{companionCount}</span>
                  <button
                    onClick={() => setCompanionCount(Math.min(50, companionCount + 1))}
                    className="w-9 h-9 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-lg">+</span>
                  </button>
                </div>
              </div>
            )}

            {companionMode === "names" && (
              <div className="space-y-3">
                {/* Excel Import/Export buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download size={14} className="mr-1.5" />
                    ดาวน์โหลดแบบฟอร์ม
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} className="mr-1.5" />
                    นำเข้าจากไฟล์ Excel/CSV
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="ghost" size="sm" onClick={addCompanion} className="ml-auto text-primary">
                    <Plus size={14} className="mr-1" />
                    เพิ่มรายชื่อ
                  </Button>
                </div>

                {/* Companion table */}
                {companionList.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-text-secondary">
                        <tr>
                          <th className="px-3 py-2 text-left w-8">#</th>
                          <th className="px-3 py-2 text-left">ชื่อ</th>
                          <th className="px-3 py-2 text-left">นามสกุล</th>
                          <th className="px-3 py-2 text-left">บริษัท</th>
                          <th className="px-3 py-2 text-left">เบอร์โทร</th>
                          <th className="px-3 py-2 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {companionList.map((c, idx) => (
                          <tr key={c.id} className={cn(c.isBlacklisted && "bg-red-50")}>
                            <td className="px-3 py-2 text-text-muted">{idx + 1}</td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                value={c.firstName}
                                onChange={(e) => updateCompanion(c.id, "firstName", e.target.value)}
                                placeholder="ชื่อ"
                                className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                value={c.lastName}
                                onChange={(e) => updateCompanion(c.id, "lastName", e.target.value)}
                                placeholder="นามสกุล"
                                className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                value={c.company || ""}
                                onChange={(e) => updateCompanion(c.id, "company", e.target.value)}
                                placeholder="บริษัท"
                                className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                value={c.phone || ""}
                                onChange={(e) => updateCompanion(c.id, "phone", e.target.value)}
                                placeholder="เบอร์โทร"
                                className="w-full h-8 px-2 rounded border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              <div className="flex items-center gap-1 justify-center">
                                {c.isBlacklisted && (
                                  <span title="อยู่ใน Blacklist"><AlertTriangle size={14} className="text-error" /></span>
                                )}
                                <button
                                  onClick={() => removeCompanion(c.id)}
                                  className="h-7 w-7 rounded-full text-text-muted hover:bg-red-50 hover:text-error flex items-center justify-center transition-colors"
                                  title="ลบ"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {companionList.length === 0 && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <FileSpreadsheet size={32} className="mx-auto text-text-muted mb-2" />
                    <p className="text-sm text-text-muted">ยังไม่มีรายชื่อผู้ติดตาม</p>
                    <p className="text-xs text-text-muted mt-1">เพิ่มด้วยมือ หรือ นำเข้าจากไฟล์ Excel/CSV</p>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-border flex items-center justify-between bg-white">
          <div className="text-xs text-text-muted">
            {companionMode === "names" && companionList.length > 0 && (
              <span>ผู้ติดตาม {companionList.length} คน{companionList.some(function(c) { return c.isBlacklisted; }) && " • ⚠️ พบ Blacklist"}</span>
            )}
            {companionMode === "count" && companionCount > 0 && (
              <span>ผู้ติดตาม {companionCount} คน (ไม่ระบุชื่อ)</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button variant="primary" onClick={handleSave}>
              <Check size={16} className="mr-1.5" />
              บันทึกนัดหมาย
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ===== Shared Detail Components =====
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-text-secondary flex-shrink-0">{label}</span>
      <span className="text-text-primary font-medium text-right">{value}</span>
    </div>
  );
}
