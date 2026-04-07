"use client";

// ════════════════════════════════════════════════════
// LIFF: Officer Approval Page
// เปิดจาก Flex Message ปุ่ม "ดูรายละเอียด" หรือ Rich Menu "คำขอ"
// รองรับ ?id=xxx สำหรับ deep link จาก Flex Message
// ════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useLiff } from "@/lib/liff/use-liff";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  User,
  Building2,
  CalendarDays,
  Clock,
  FileText,
  Users,
} from "lucide-react";

interface Appointment {
  id: number;
  code: string;
  status: string;
  dateStart: string;
  timeStart: string;
  timeEnd: string;
  visitor?: { firstName: string; lastName: string; company?: string; phone?: string };
  visitPurpose?: { name: string };
  department?: { name: string };
  hostStaff?: { firstName: string; lastName: string };
  companionCount?: number;
  notes?: string;
}

export default function LiffApprovePage() {
  const { loading, error, isLoggedIn, accessToken, login, closeWindow } = useLiff();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("id");

  const [authing, setAuthing] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionResult, setActionResult] = useState<"approved" | "rejected" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // --- LIFF Auth: Exchange LINE token → session cookie ---
  const authenticateOfficer = useCallback(async () => {
    if (!accessToken) return;
    setAuthing(true);
    try {
      const res = await fetch("/api/liff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineAccessToken: accessToken }),
      });
      const json = await res.json();
      if (json.success) {
        setAuthed(true);
      } else {
        setActionError(json.error?.message || "ไม่สามารถยืนยันตัวตนได้");
      }
    } catch {
      setActionError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setAuthing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isLoggedIn && accessToken && !authed) {
      authenticateOfficer();
    }
  }, [isLoggedIn, accessToken, authed, authenticateOfficer]);

  // --- Load appointment(s) ---
  useEffect(() => {
    if (!authed) return;

    async function loadData() {
      setLoadingData(true);
      try {
        if (appointmentId) {
          // Load specific appointment
          const res = await fetch(`/api/appointments/${appointmentId}`);
          const json = await res.json();
          if (json.success) {
            setSelectedAppt(json.data);
            setAppointments([json.data]);
          }
        } else {
          // Load pending appointments
          const res = await fetch("/api/appointments?status=pending&limit=20");
          const json = await res.json();
          if (json.success) {
            setAppointments(json.data || []);
          }
        }
      } catch {
        setActionError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [authed, appointmentId]);

  // --- Approve ---
  const handleApprove = async (id: number) => {
    setActionError("");
    setProcessing(true);
    try {
      const res = await fetch(`/api/appointments/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        setActionResult("approved");
      } else {
        setActionError(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      setActionError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setProcessing(false);
    }
  };

  // --- Reject ---
  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      setActionError("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }
    setActionError("");
    setProcessing(true);
    try {
      const res = await fetch(`/api/appointments/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setShowRejectModal(false);
        setActionResult("rejected");
      } else {
        setActionError(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      setActionError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setProcessing(false);
    }
  };

  // --- Loading states ---
  if (loading || authing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-sm text-muted">
            {authing ? "กำลังยืนยันตัวตน..." : "กำลังเชื่อมต่อ..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || (!authed && actionError)) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-3 text-sm text-red-600">{error || actionError}</p>
          <p className="text-xs text-muted mt-2">กรุณาลงทะเบียนเจ้าหน้าที่ก่อน</p>
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

  // --- Success result ---
  if (actionResult) {
    const isApproved = actionResult === "approved";
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          {isApproved ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          )}
          <h2 className={`text-lg font-bold mt-4 ${isApproved ? "text-green-700" : "text-red-700"}`}>
            {isApproved ? "อนุมัติเรียบร้อย" : "ปฏิเสธเรียบร้อย"}
          </h2>
          <p className="text-sm text-muted mt-2">แจ้งผลไปยังผู้มาติดต่อทาง LINE แล้ว</p>
          <Button onClick={closeWindow} className="mt-6">ปิด</Button>
        </div>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Single appointment detail ---
  if (selectedAppt) {
    const appt = selectedAppt;
    return (
      <div className="px-6 py-6">
        <h1 className="text-lg font-bold text-primary mb-4">รายละเอียดคำขอ</h1>

        <div className="bg-white border rounded-xl p-4 space-y-3">
          <DetailRow icon={<FileText />} label="รหัส" value={appt.code} />
          <DetailRow
            icon={<User />}
            label="ผู้ขอ"
            value={`${appt.visitor?.firstName || ""} ${appt.visitor?.lastName || ""}`}
          />
          <DetailRow icon={<Building2 />} label="บริษัท" value={appt.visitor?.company || "-"} />
          <DetailRow icon={<FileText />} label="วัตถุประสงค์" value={appt.visitPurpose?.name || "-"} />
          <DetailRow icon={<CalendarDays />} label="วันที่" value={appt.dateStart} />
          <DetailRow icon={<Clock />} label="เวลา" value={`${appt.timeStart} - ${appt.timeEnd}`} />
          <DetailRow icon={<Building2 />} label="แผนก" value={appt.department?.name || "-"} />
          <DetailRow icon={<Users />} label="ผู้ติดตาม" value={`${appt.companionCount ?? 0} คน`} />
          {appt.notes && <DetailRow icon={<FileText />} label="หมายเหตุ" value={appt.notes} />}
        </div>

        {appt.status === "pending" && (
          <>
            {actionError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{actionError}</p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Button
                onClick={() => handleApprove(appt.id)}
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "อนุมัติ"}
              </Button>
              <Button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                ปฏิเสธ
              </Button>
            </div>

            {/* Reject modal */}
            {showRejectModal && (
              <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                <div className="bg-white rounded-t-2xl w-full max-w-md p-6">
                  <h3 className="font-bold text-red-700 mb-3">ระบุเหตุผลการปฏิเสธ</h3>
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm resize-none"
                    rows={3}
                    placeholder="เหตุผล..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  {actionError && (
                    <p className="text-sm text-red-600 mt-2">{actionError}</p>
                  )}
                  <div className="mt-4 flex gap-3">
                    <Button
                      onClick={() => { setShowRejectModal(false); setActionError(""); }}
                      className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      onClick={() => handleReject(appt.id)}
                      disabled={processing}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "ยืนยันปฏิเสธ"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {appt.status !== "pending" && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-muted">
              สถานะ: <span className="font-semibold">{appt.status}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  // --- Pending list ---
  return (
    <div className="px-6 py-6">
      <h1 className="text-lg font-bold text-primary mb-4">
        คำขอรออนุมัติ ({appointments.length})
      </h1>

      {appointments.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto" />
          <p className="text-sm text-muted mt-3">ไม่มีคำขอรออนุมัติ</p>
        </div>
      )}

      <div className="space-y-3">
        {appointments.map((appt) => (
          <button
            key={appt.id}
            onClick={() => setSelectedAppt(appt)}
            className="w-full p-4 bg-white border rounded-xl text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted">{appt.code}</span>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">
                รออนุมัติ
              </span>
            </div>
            <p className="font-medium text-sm">
              {appt.visitor?.firstName} {appt.visitor?.lastName}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {appt.visitPurpose?.name} — {appt.dateStart} {appt.timeStart}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted mt-0.5 w-4 h-4 shrink-0">{icon}</span>
      <span className="text-sm text-muted w-20 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 flex-1">{value}</span>
    </div>
  );
}
