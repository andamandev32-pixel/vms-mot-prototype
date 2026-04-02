"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";

interface PendingApprovalScreenProps {
  locale: "th" | "en";
  appointmentId: number | null;
  onApproved: () => void;
  onRejected: (reason?: string) => void;
  onTimeout: () => void;
  onBack: () => void;
}

export default function PendingApprovalScreen({
  locale, appointmentId, onApproved, onRejected, onTimeout, onBack,
}: PendingApprovalScreenProps) {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<"polling" | "approved" | "rejected">("polling");
  const TIMEOUT_SECONDS = 300; // 5 minutes

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => {
        if (prev >= TIMEOUT_SECONDS) {
          onTimeout();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onTimeout]);

  // Poll appointment status
  useEffect(() => {
    if (!appointmentId || status !== "polling") return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`, { credentials: "include" });
        const json = await res.json();
        if (json.success) {
          const appt = json.data?.appointment || json.data;
          if (appt?.status === "approved") {
            setStatus("approved");
            setTimeout(() => onApproved(), 1500);
          } else if (appt?.status === "rejected") {
            setStatus("rejected");
            setTimeout(() => onRejected(appt?.rejectedReason), 2000);
          }
        }
      } catch { /* ignore poll errors */ }
    }, 10000);
    return () => clearInterval(poll);
  }, [appointmentId, status, onApproved, onRejected]);

  const remaining = TIMEOUT_SECONDS - elapsed;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px", textAlign: "center" }}>
      {status === "polling" && (
        <>
          <Loader2 size={64} style={{ color: "#FFB700", animation: "spin 2s linear infinite" }} />
          <h2 style={{ fontSize: "24px", fontWeight: 700, marginTop: "24px", color: "#003580" }}>
            {locale === "th" ? "รอการอนุมัติ" : "Waiting for Approval"}
          </h2>
          <p style={{ fontSize: "18px", color: "#666", marginTop: "12px", maxWidth: "400px" }}>
            {locale === "th"
              ? "รายการของท่านถูกส่งไปยังผู้อนุมัติแล้ว กรุณารอสักครู่..."
              : "Your request has been sent to the approver. Please wait..."}
          </p>
          <div style={{ marginTop: "24px", fontSize: "32px", fontWeight: 800, color: "#003580" }}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "4px" }}>
            {locale === "th" ? "เวลาที่เหลือ" : "Time remaining"}
          </p>
          <button
            onClick={onBack}
            style={{ marginTop: "32px", display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "12px", border: "2px solid #ccc", background: "white", fontSize: "16px", fontWeight: 600, cursor: "pointer", color: "#666" }}
          >
            <ArrowLeft size={18} />
            {locale === "th" ? "ยกเลิก" : "Cancel"}
          </button>
        </>
      )}
      {status === "approved" && (
        <>
          <CheckCircle size={80} style={{ color: "#34A853" }} />
          <h2 style={{ fontSize: "28px", fontWeight: 700, marginTop: "20px", color: "#34A853" }}>
            {locale === "th" ? "อนุมัติแล้ว!" : "Approved!"}
          </h2>
          <p style={{ fontSize: "18px", color: "#666", marginTop: "8px" }}>
            {locale === "th" ? "กำลังดำเนินการต่อ..." : "Proceeding..."}
          </p>
        </>
      )}
      {status === "rejected" && (
        <>
          <XCircle size={80} style={{ color: "#EA4335" }} />
          <h2 style={{ fontSize: "28px", fontWeight: 700, marginTop: "20px", color: "#EA4335" }}>
            {locale === "th" ? "คำขอถูกปฏิเสธ" : "Request Rejected"}
          </h2>
          <p style={{ fontSize: "18px", color: "#666", marginTop: "8px" }}>
            {locale === "th" ? "กรุณาติดต่อเคาน์เตอร์" : "Please contact the counter"}
          </p>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
