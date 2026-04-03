"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useVisitorAuth } from "@/components/providers/VisitorAuthProvider";
import {
  ChevronLeft, ChevronRight, Check, Clock, Search, Users, FileText, Wrench, MapPin,
  CalendarDays, Building2, User, Loader2, AlertCircle, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ===== Types =====

interface VisitPurpose {
  id: number;
  name: string;
  nameEn: string;
  icon: string | null;
  allowedEntryModes: string;
  departmentRules: DeptRule[];
}

interface DeptRule {
  id: number;
  departmentId: number;
  requirePersonName: boolean;
  requireApproval: boolean;
  acceptFromWeb: boolean;
  isActive: boolean;
  department: { id: number; name: string; nameEn: string };
}

interface StaffMember {
  id: number;
  name: string;
  nameEn: string;
  position: string;
  department: { id: number; name: string };
}

// ===== Component =====

export default function VisitorBookingPage() {
  const router = useRouter();
  const { visitor, loading: authLoading } = useVisitorAuth();

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1: Purpose
  const [purposes, setPurposes] = useState<VisitPurpose[]>([]);
  const [selectedPurpose, setSelectedPurpose] = useState<VisitPurpose | null>(null);

  // Step 2: Date/Time/Dept/Host
  const [selectedDeptRule, setSelectedDeptRule] = useState<DeptRule | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [hostSearch, setHostSearch] = useState("");
  const [staffResults, setStaffResults] = useState<StaffMember[]>([]);
  const [selectedHost, setSelectedHost] = useState<StaffMember | null>(null);
  const [searchingStaff, setSearchingStaff] = useState(false);

  // Step 3: Details
  const [companionCount, setCompanionCount] = useState(0);
  const [purposeNote, setPurposeNote] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentQty, setEquipmentQty] = useState("1");
  const [notes, setNotes] = useState("");

  // Step 4: Confirm
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Loading states
  const [loadingPurposes, setLoadingPurposes] = useState(true);

  // ═══ Load visit purposes ═══
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/visit-purposes");
        const json = await res.json();
        if (json.success) {
          // Filter: showOnWeb && isActive, and has at least one dept rule with acceptFromWeb
          const filtered = (json.data.visitPurposes as VisitPurpose[]).filter(
            (p) => p.departmentRules.some((r) => r.acceptFromWeb && r.isActive)
          );
          setPurposes(filtered);
        }
      } catch (e) {
        console.error("Failed to load purposes:", e);
      } finally {
        setLoadingPurposes(false);
      }
    }
    load();
  }, []);

  // ═══ Staff search (debounced) ═══
  useEffect(() => {
    if (!hostSearch.trim() || hostSearch.length < 2 || !selectedDeptRule) {
      setStaffResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingStaff(true);
      try {
        const params = new URLSearchParams({ search: hostSearch, departmentId: String(selectedDeptRule.departmentId), limit: "5" });
        const res = await fetch(`/api/staff?${params}`);
        const json = await res.json();
        if (json.success) {
          setStaffResults(json.data.staff || []);
        }
      } catch { /* ignore */ }
      setSearchingStaff(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [hostSearch, selectedDeptRule]);

  // ═══ Derived ═══
  const deptOptions = useMemo(() => {
    if (!selectedPurpose) return [];
    return selectedPurpose.departmentRules.filter((r) => r.acceptFromWeb && r.isActive);
  }, [selectedPurpose]);

  // Time slot generation
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 8; h <= 16; h++) {
      for (const m of ["00", "30"]) {
        if (h === 16 && m === "30") continue;
        slots.push(`${String(h).padStart(2, "0")}:${m}`);
      }
    }
    return slots;
  }, []);

  const endTimeSlots = useMemo(() => {
    if (!timeStart) return timeSlots;
    return timeSlots.filter((t) => t > timeStart);
  }, [timeStart, timeSlots]);

  // Minimum date = tomorrow
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  // ═══ Step validation ═══
  const canProceed = useMemo(() => {
    if (step === 1) return !!selectedPurpose;
    if (step === 2) {
      const hasBasics = !!selectedDeptRule && !!selectedDate && !!timeStart && !!timeEnd;
      if (!hasBasics) return false;
      if (selectedDeptRule?.requirePersonName && !selectedHost) return false;
      return true;
    }
    if (step === 3) return !!purposeNote.trim();
    if (step === 4) return agreed;
    return false;
  }, [step, selectedPurpose, selectedDeptRule, selectedDate, timeStart, timeEnd, selectedHost, purposeNote, agreed]);

  // ═══ Submit ═══
  const handleSubmit = async () => {
    if (!visitor || !selectedPurpose || !selectedDeptRule) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        visitorId: visitor.id,
        visitPurposeId: selectedPurpose.id,
        departmentId: selectedDeptRule.departmentId,
        hostStaffId: selectedHost?.id || null,
        type: selectedPurpose.nameEn.toLowerCase().replace(/[^a-z]/g, "-").slice(0, 30) || "general",
        entryMode: "single",
        date: selectedDate,
        timeStart,
        timeEnd,
        purpose: purposeNote.trim(),
        companions: companionCount,
        equipment: equipmentName.trim() ? [{ name: equipmentName.trim(), quantity: parseInt(equipmentQty) || 1 }] : [],
        notes: notes.trim() || undefined,
        channel: "web",
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        const code = json.data.appointment.bookingCode;
        const status = json.data.appointment.status;
        router.push(`/visitor/booking-status?code=${encodeURIComponent(code)}&status=${status}`);
      } else {
        setSubmitError(json.error?.message || "สร้างนัดหมายไม่สำเร็จ");
      }
    } catch {
      setSubmitError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  // ═══ Render ═══
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {["เลือกวัตถุประสงค์", "วัน/เวลา/กรม", "รายละเอียด", "ยืนยัน"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i + 1 < step
                  ? "bg-primary text-white"
                  : i + 1 === step
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : "bg-gray-100 text-text-muted"
              }`}>
                {i + 1 < step ? <Check size={16} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${
                i + 1 <= step ? "text-primary" : "text-text-muted"
              }`}>{label}</span>
              {i < 3 && <div className={`w-6 sm:w-12 h-0.5 ${i + 1 < step ? "bg-primary" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Step 1: Visit Purpose ═══ */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">เลือกวัตถุประสงค์การเข้าพบ</h2>
          <p className="text-sm text-text-secondary">กรุณาเลือกวัตถุประสงค์ที่ต้องการ</p>

          {loadingPurposes ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {purposes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPurpose(p);
                    setSelectedDeptRule(null);
                    setSelectedHost(null);
                  }}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                    selectedPurpose?.id === p.id
                      ? "border-primary bg-primary-50 ring-2 ring-primary/30"
                      : "border-gray-200 bg-white hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{p.icon || "📋"}</span>
                  <div>
                    <p className="font-semibold text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-muted">{p.nameEn}</p>
                    <p className="text-xs text-text-muted mt-1">{p.departmentRules.filter((r) => r.acceptFromWeb && r.isActive).length} กรม/สำนัก</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Step 2: Date/Time/Department/Host ═══ */}
      {step === 2 && selectedPurpose && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-text-primary">เลือกวัน เวลา และหน่วยงาน</h2>

          {/* Department select */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">หน่วยงานที่ต้องการติดต่อ</label>
            <div className="grid grid-cols-1 gap-2">
              {deptOptions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setSelectedDeptRule(r); setSelectedHost(null); setHostSearch(""); }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedDeptRule?.id === r.id
                      ? "border-primary bg-primary-50"
                      : "border-gray-200 bg-white hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-primary" />
                    <span className="text-sm font-medium">{r.department.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.requireApproval ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium flex items-center gap-1">
                        <Clock size={10} /> ต้องรออนุมัติ
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
                        <Check size={10} /> อนุมัติอัตโนมัติ
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">วันที่ต้องการเข้าพบ</label>
            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">เวลาเริ่ม</label>
              <select
                value={timeStart}
                onChange={(e) => { setTimeStart(e.target.value); if (timeEnd && e.target.value >= timeEnd) setTimeEnd(""); }}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary text-sm outline-none transition-all"
              >
                <option value="">เลือก</option>
                {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">เวลาสิ้นสุด</label>
              <select
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary text-sm outline-none transition-all"
              >
                <option value="">เลือก</option>
                {endTimeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Host search (conditional) */}
          {selectedDeptRule?.requirePersonName && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                ผู้ที่ต้องการพบ <span className="text-error">*</span>
              </label>
              {selectedHost ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-primary bg-primary-50">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium">{selectedHost.name}</p>
                      <p className="text-xs text-text-muted">{selectedHost.position} — {selectedHost.department.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedHost(null); setHostSearch(""); }}
                    className="text-xs text-primary hover:text-primary-dark"
                  >เปลี่ยน</button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="ค้นหาชื่อเจ้าหน้าที่..."
                    leftIcon={<Search size={16} />}
                    className="h-11 bg-gray-50 border-gray-200"
                    value={hostSearch}
                    onChange={(e) => setHostSearch(e.target.value)}
                  />
                  {(searchingStaff || staffResults.length > 0) && hostSearch.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 max-h-48 overflow-y-auto">
                      {searchingStaff ? (
                        <div className="p-3 text-center text-sm text-text-muted"><Loader2 size={16} className="animate-spin inline mr-1" /> กำลังค้นหา...</div>
                      ) : staffResults.length === 0 ? (
                        <div className="p-3 text-center text-sm text-text-muted">ไม่พบเจ้าหน้าที่</div>
                      ) : (
                        staffResults.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => { setSelectedHost(s); setHostSearch(""); setStaffResults([]); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                          >
                            <User size={14} className="text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{s.name}</p>
                              <p className="text-xs text-text-muted">{s.position} — {s.department.name}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedDeptRule && !selectedDeptRule.requirePersonName && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <Shield size={16} className="text-blue-600" />
              <p className="text-xs text-blue-700">ไม่ต้องระบุผู้ที่จะพบ (ติดต่อแผนกโดยตรง)</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ Step 3: Details ═══ */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-text-primary">รายละเอียดเพิ่มเติม</h2>

          {/* Purpose note */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              เรื่องที่ต้องการติดต่อ <span className="text-error">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="กรุณาระบุเรื่องที่ต้องการติดต่อ..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all resize-none"
              value={purposeNote}
              onChange={(e) => setPurposeNote(e.target.value)}
            />
          </div>

          {/* Companions */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Users size={14} className="inline mr-1" />
              จำนวนผู้ติดตาม (ไม่รวมตัวท่าน)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCompanionCount(Math.max(0, companionCount - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
              >−</button>
              <span className="text-lg font-bold w-8 text-center">{companionCount}</span>
              <button
                type="button"
                onClick={() => setCompanionCount(Math.min(10, companionCount + 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
              >+</button>
              <span className="text-xs text-text-muted">คน</span>
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Wrench size={14} className="inline mr-1" />
              อุปกรณ์ที่นำเข้า (ถ้ามี)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  placeholder="ชื่ออุปกรณ์"
                  className="h-10 bg-gray-50 border-gray-200"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                />
              </div>
              <Input
                type="number"
                placeholder="จำนวน"
                className="h-10 bg-gray-50 border-gray-200"
                value={equipmentQty}
                onChange={(e) => setEquipmentQty(e.target.value)}
                min={1}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <FileText size={14} className="inline mr-1" />
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              rows={2}
              placeholder="ข้อมูลเพิ่มเติม..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ═══ Step 4: Confirm ═══ */}
      {step === 4 && selectedPurpose && selectedDeptRule && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-text-primary">ยืนยันข้อมูลนัดหมาย</h2>

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary-dark p-4 text-white">
              <p className="text-sm font-light">วันที่นัดหมาย</p>
              <p className="text-lg font-bold">{selectedDate} • {timeStart} - {timeEnd}</p>
            </div>
            <div className="p-4 space-y-3">
              <Row icon={<CalendarDays size={16} />} label="วัตถุประสงค์" value={`${selectedPurpose.icon || ""} ${selectedPurpose.name}`} />
              <Row icon={<Building2 size={16} />} label="หน่วยงาน" value={selectedDeptRule.department.name} />
              {selectedHost && <Row icon={<User size={16} />} label="ผู้ที่จะพบ" value={`${selectedHost.name} (${selectedHost.position})`} />}
              <Row icon={<FileText size={16} />} label="เรื่องที่ติดต่อ" value={purposeNote} />
              {companionCount > 0 && <Row icon={<Users size={16} />} label="ผู้ติดตาม" value={`${companionCount} คน`} />}
              {equipmentName && <Row icon={<Wrench size={16} />} label="อุปกรณ์" value={`${equipmentName} (${equipmentQty})`} />}
              {notes && <Row icon={<FileText size={16} />} label="หมายเหตุ" value={notes} />}

              {/* Approval status indicator */}
              <div className="pt-3 border-t border-gray-100">
                {selectedDeptRule.requireApproval ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <Clock size={16} className="text-amber-600" />
                    <p className="text-xs text-amber-700 font-medium">นัดหมายนี้ต้องรอการอนุมัติจากเจ้าหน้าที่</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <Check size={16} className="text-emerald-600" />
                    <p className="text-xs text-emerald-700 font-medium">นัดหมายนี้จะได้รับการอนุมัติอัตโนมัติ</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PDPA */}
          <div
            onClick={() => setAgreed(!agreed)}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              agreed ? "bg-primary-50 border-primary/30" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              agreed ? "bg-primary border-primary" : "border-gray-300 bg-white"
            }`}>
              {agreed && <Check size={12} className="text-white" />}
            </div>
            <p className="text-xs text-text-secondary leading-snug">
              ข้าพเจ้ายืนยันว่าข้อมูลข้างต้นถูกต้อง และยินยอมให้บันทึกข้อมูลเพื่อการรักษาความปลอดภัย ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
            </p>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error-light border border-error/20">
              <AlertCircle size={16} className="text-error" />
              <p className="text-sm text-error">{submitError}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ Navigation buttons ═══ */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        {step > 1 ? (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1"
          >
            <ChevronLeft size={16} /> ย้อนกลับ
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed}
            className="flex items-center gap-1"
          >
            ถัดไป <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed || submitting}
            loading={submitting}
            className="flex items-center gap-1 px-8"
          >
            <Check size={16} /> ยืนยันและส่งคำขอ
          </Button>
        )}
      </div>
    </div>
  );
}

// Summary row helper
function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
