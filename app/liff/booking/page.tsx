"use client";

// ════════════════════════════════════════════════════
// LIFF: Booking Wizard (4 Steps)
// จองนัดหมายผ่าน LINE — เปิดจาก Rich Menu "บันทึกนัดหมาย"
// ════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useLiff } from "@/lib/liff/use-liff";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  CalendarDays,
  Clock,
  Search,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Users,
  FileText,
  MapPin,
} from "lucide-react";

interface VisitPurpose {
  id: number;
  name: string;
  nameEn?: string;
  requireApproval?: boolean;
}

interface Department {
  id: number;
  name: string;
  nameEn?: string;
  buildingName?: string;
  floorName?: string;
}

interface StaffResult {
  id: number;
  firstName: string;
  lastName: string;
  position?: string;
  departmentName?: string;
}

export default function LiffBookingPage() {
  const { loading, error, isLoggedIn, login, accessToken, closeWindow } = useLiff();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [bookingResult, setBookingResult] = useState<{ code: string } | null>(null);

  // Step 1: Purpose
  const [purposes, setPurposes] = useState<VisitPurpose[]>([]);
  const [selectedPurpose, setSelectedPurpose] = useState<VisitPurpose | null>(null);
  const [loadingPurposes, setLoadingPurposes] = useState(true);

  // Step 2: Department + Date/Time + Host
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:00");
  const [hostSearch, setHostSearch] = useState("");
  const [hostResults, setHostResults] = useState<StaffResult[]>([]);
  const [selectedHost, setSelectedHost] = useState<StaffResult | null>(null);
  const [searchingHost, setSearchingHost] = useState(false);

  // Step 3: Details
  const [companions, setCompanions] = useState("0");
  const [purposeNote, setPurposeNote] = useState("");
  const [notes, setNotes] = useState("");

  // Step 4: Confirm + PDPA
  const [pdpaAccepted, setPdpaAccepted] = useState(false);

  // --- Load purposes ---
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/visit-purposes?channel=line")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPurposes(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingPurposes(false));
  }, [isLoggedIn]);

  // --- Load departments ---
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/locations/departments")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setDepartments(json.data || []);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // --- Set default date (tomorrow) ---
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  // --- Search host staff (debounced) ---
  const searchHost = useCallback(async (q: string) => {
    if (q.length < 2) { setHostResults([]); return; }
    setSearchingHost(true);
    try {
      const res = await fetch(`/api/staff?search=${encodeURIComponent(q)}&limit=10`);
      const json = await res.json();
      if (json.success) setHostResults(json.data || []);
    } catch { /* ignore */ }
    setSearchingHost(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchHost(hostSearch), 300);
    return () => clearTimeout(timer);
  }, [hostSearch, searchHost]);

  // --- Submit booking ---
  const handleSubmit = async () => {
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitPurposeId: selectedPurpose!.id,
          departmentId: selectedDept?.id,
          dateStart: selectedDate,
          dateEnd: selectedDate,
          timeStart,
          timeEnd,
          hostStaffId: selectedHost?.id,
          companionCount: parseInt(companions) || 0,
          purposeNote,
          notes,
          channel: "line",
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setFormError(json.error?.message || "เกิดข้อผิดพลาด");
        return;
      }
      setBookingResult({ code: json.data?.code || json.data?.id });
      setStep(5); // success
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading / Error / Not logged in ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6 text-center">
        <div>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-3 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6 text-center">
        <div>
          <p className="text-sm text-muted mb-4">กรุณา Login ด้วย LINE</p>
          <Button onClick={login}>Login</Button>
        </div>
      </div>
    );
  }

  // --- Success page ---
  if (step === 5 && bookingResult) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-lg font-bold text-green-700 mt-4">จองนัดหมายสำเร็จ!</h2>
          <p className="text-2xl font-mono font-bold text-primary mt-2">
            {bookingResult.code}
          </p>
          <p className="text-xs text-muted mt-2">
            {selectedPurpose?.requireApproval
              ? "รอเจ้าหน้าที่อนุมัติ — จะแจ้งผลทาง LINE"
              : "นัดหมายได้รับการยืนยันแล้ว"}
          </p>
          <Button onClick={closeWindow} className="mt-6">
            ปิด
          </Button>
        </div>
      </div>
    );
  }

  // --- Step indicators ---
  const stepLabels = ["วัตถุประสงค์", "วัน/เวลา", "รายละเอียด", "ยืนยัน"];

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="text-muted hover:text-primary">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-primary">จองนัดหมาย</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-1 mb-6">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex-1 text-center">
            <div
              className={`h-1 rounded-full mb-1 ${
                i + 1 <= step ? "bg-primary" : "bg-gray-200"
              }`}
            />
            <span className={`text-[10px] ${i + 1 === step ? "text-primary font-semibold" : "text-muted"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Purpose */}
      {step === 1 && (
        <div>
          <p className="text-sm text-muted mb-3">เลือกวัตถุประสงค์การเข้าพบ</p>
          {loadingPurposes ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mt-8" />
          ) : (
            <div className="space-y-2">
              {purposes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPurpose(p); setStep(2); }}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedPurpose?.id === p.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{p.name}</p>
                  {p.requireApproval && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                      ต้องรออนุมัติ
                    </span>
                  )}
                </button>
              ))}
              {purposes.length === 0 && (
                <p className="text-sm text-muted text-center py-8">ไม่พบวัตถุประสงค์ที่เปิดให้จองผ่าน LINE</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Dept + Date + Time + Host */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Department */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">แผนก</label>
            <select
              className="w-full border rounded-lg p-2.5 text-sm"
              value={selectedDept?.id ?? ""}
              onChange={(e) => {
                const d = departments.find((x) => x.id === Number(e.target.value));
                setSelectedDept(d || null);
              }}
            >
              <option value="">-- เลือกแผนก --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <Input
            label="วันที่"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            leftIcon={<CalendarDays className="w-4 h-4" />}
          />

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="เวลาเริ่ม"
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              leftIcon={<Clock className="w-4 h-4" />}
            />
            <Input
              label="เวลาสิ้นสุด"
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              leftIcon={<Clock className="w-4 h-4" />}
            />
          </div>

          {/* Host Staff Search */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">ผู้รับพบ</label>
            <div className="relative">
              <Input
                placeholder="ค้นหาชื่อเจ้าหน้าที่..."
                value={selectedHost ? `${selectedHost.firstName} ${selectedHost.lastName}` : hostSearch}
                onChange={(e) => {
                  setHostSearch(e.target.value);
                  setSelectedHost(null);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
              {searchingHost && (
                <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              )}
            </div>
            {!selectedHost && hostResults.length > 0 && (
              <div className="mt-1 border rounded-lg max-h-40 overflow-y-auto">
                {hostResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedHost(s); setHostSearch(""); setHostResults([]); }}
                    className="w-full p-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-muted">{s.position} — {s.departmentName}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={() => setStep(3)}
            disabled={!selectedDate || !timeStart || !timeEnd}
            className="w-full mt-2"
          >
            ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div className="space-y-4">
          <Input
            label="จำนวนผู้ติดตาม"
            type="number"
            value={companions}
            onChange={(e) => setCompanions(e.target.value)}
            leftIcon={<Users className="w-4 h-4" />}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุวัตถุประสงค์</label>
            <textarea
              className="w-full border rounded-lg p-2.5 text-sm resize-none"
              rows={2}
              placeholder="รายละเอียดเพิ่มเติม..."
              value={purposeNote}
              onChange={(e) => setPurposeNote(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <textarea
              className="w-full border rounded-lg p-2.5 text-sm resize-none"
              rows={2}
              placeholder="หมายเหตุอื่น ๆ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button onClick={() => setStep(4)} className="w-full mt-2">
            ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 4: Confirm + PDPA */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <SummaryRow icon={<FileText className="w-4 h-4" />} label="วัตถุประสงค์" value={selectedPurpose?.name || "-"} />
            <SummaryRow icon={<MapPin className="w-4 h-4" />} label="แผนก" value={selectedDept?.name || "-"} />
            <SummaryRow icon={<CalendarDays className="w-4 h-4" />} label="วันที่" value={selectedDate} />
            <SummaryRow icon={<Clock className="w-4 h-4" />} label="เวลา" value={`${timeStart} - ${timeEnd}`} />
            <SummaryRow icon={<Users className="w-4 h-4" />} label="ผู้รับพบ" value={selectedHost ? `${selectedHost.firstName} ${selectedHost.lastName}` : "-"} />
            <SummaryRow icon={<Users className="w-4 h-4" />} label="ผู้ติดตาม" value={`${companions} คน`} />
          </div>

          {/* PDPA */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pdpaAccepted}
              onChange={(e) => setPdpaAccepted(e.target.checked)}
              className="mt-1"
            />
            <span className="text-xs text-muted">
              ข้าพเจ้ายินยอมให้จัดเก็บและใช้ข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) เพื่อวัตถุประสงค์ในการจัดการผู้มาติดต่อ
            </span>
          </label>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!pdpaAccepted || submitting} className="w-full">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังจอง...
              </span>
            ) : (
              "ยืนยันจองนัดหมาย"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted">{icon}</span>
      <span className="text-sm text-muted w-20">{label}</span>
      <span className="text-sm font-medium text-gray-900 flex-1">{value}</span>
    </div>
  );
}
