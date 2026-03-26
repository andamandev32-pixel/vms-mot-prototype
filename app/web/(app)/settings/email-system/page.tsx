"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Mail,
  Server,
  Shield,
  Send,
  CheckCircle2,
  XCircle,
  Settings,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

/* ══════════════════════════════════════════════════
   EMAIL SYSTEM SETTINGS PAGE
   ══════════════════════════════════════════════════ */
export default function EmailSystemSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("email-system");
  const apiDoc = getApiDocByPageId("email-system");

  /* ── SMTP Config ── */
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [encryption, setEncryption] = useState<"SSL" | "TLS" | "None">("TLS");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ── Sender Config ── */
  const [fromEmail, setFromEmail] = useState("noreply@mots.go.th");
  const [fromDisplayName, setFromDisplayName] = useState("eVMS กระทรวงการท่องเที่ยวและกีฬา");
  const [replyToEmail, setReplyToEmail] = useState("");

  /* ── Status & Testing ── */
  const [isActive, setIsActive] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [testConnStatus, setTestConnStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testSendStatus, setTestSendStatus] = useState<"idle" | "loading" | "success">("idle");
  const [savedToast, setSavedToast] = useState(false);

  /* ── Mock actions ── */
  const handleTestConnection = () => {
    setTestConnStatus("loading");
    setTimeout(() => {
      setTestConnStatus("success");
      setTimeout(() => setTestConnStatus("idle"), 3000);
    }, 1500);
  };

  const handleTestEmail = () => {
    if (!testEmail) return;
    setTestSendStatus("loading");
    setTimeout(() => {
      setTestSendStatus("success");
      setTimeout(() => setTestSendStatus("idle"), 3000);
    }, 1500);
  };

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <>
      <Topbar title="ตั้งค่าอีเมลระบบ" />
      {schema && (
        <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      )}
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Mail size={22} className="text-primary" />
            ตั้งค่าอีเมลระบบ — Email System
            <DbSchemaButton onClick={() => setShowSchema(true)} />
            {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
          </h3>
          <p className="text-sm text-text-muted mt-1">
            กำหนดค่า SMTP Server และข้อมูลผู้ส่งอีเมลสำหรับระบบแจ้งเตือนอัตโนมัติ
          </p>
        </div>

        {/* ── Card 1: SMTP Server Config ── */}
        <Card className="rounded-2xl shadow-sm border-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                <Server size={18} className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">SMTP Server</h4>
                <p className="text-xs text-text-muted">การตั้งค่าเซิร์ฟเวอร์สำหรับส่งอีเมล</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SMTP Host"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                leftIcon={<Server size={16} />}
              />
              <Input
                label="SMTP Port"
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                placeholder="587"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">
                Encryption
              </label>
              <div className="flex gap-2">
                {(["SSL", "TLS", "None"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setEncryption(opt)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      encryption === opt
                        ? "border-primary bg-primary-50 text-primary"
                        : "border-border bg-white text-text-secondary hover:border-primary/30"
                    }`}
                  >
                    <Shield size={14} />
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="SMTP Username"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                placeholder="user@gmail.com"
                leftIcon={<Mail size={16} />}
              />
              <div>
                <Input
                  label="SMTP Password"
                  type={showPassword ? "text" : "password"}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="••••••••"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 2: Sender Config ── */}
        <Card className="rounded-2xl shadow-sm border-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center">
                <Send size={18} className="text-accent-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">ข้อมูลผู้ส่ง</h4>
                <p className="text-xs text-text-muted">กำหนดชื่อและอีเมลที่แสดงเป็นผู้ส่ง</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="From Email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@mots.go.th"
                leftIcon={<Mail size={16} />}
              />
              <Input
                label="From Display Name"
                value={fromDisplayName}
                onChange={(e) => setFromDisplayName(e.target.value)}
                placeholder="eVMS กระทรวงการท่องเที่ยวและกีฬา"
              />
            </div>

            <div className="mt-4">
              <Input
                label="Reply-To Email (ไม่บังคับ)"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                placeholder="support@mots.go.th"
                helperText="หากไม่กำหนด ระบบจะใช้ From Email เป็น Reply-To"
                leftIcon={<Mail size={16} />}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Card 3: Status & Testing ── */}
        <Card className="rounded-2xl shadow-sm border-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-lg bg-success-light flex items-center justify-center">
                <Settings size={18} className="text-success" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">สถานะและทดสอบ</h4>
                <p className="text-xs text-text-muted">ตรวจสอบสถานะการเชื่อมต่อและส่งอีเมลทดสอบ</p>
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${isActive ? "bg-success animate-pulse" : "bg-gray-300"}`}
                />
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    สถานะระบบอีเมล
                  </p>
                  <p className="text-xs text-text-muted">
                    {isActive ? "เปิดใช้งาน — ระบบส่งอีเมลอัตโนมัติ" : "ปิดใช้งาน — ระบบจะไม่ส่งอีเมล"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isActive ? "bg-success" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Last test */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success-light/50 mb-4">
              <CheckCircle2 size={16} className="text-success" />
              <span className="text-sm text-text-primary">
                Last test: <strong>2026-03-20 10:00</strong> — OK ส่งสำเร็จ
              </span>
            </div>

            {/* Test email */}
            <div className="flex items-end gap-3 mb-3">
              <div className="flex-1">
                <Input
                  label="อีเมลสำหรับทดสอบ"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  leftIcon={<Mail size={16} />}
                />
              </div>
              <Button
                onClick={handleTestEmail}
                disabled={!testEmail || testSendStatus === "loading"}
                className="gap-2 shrink-0"
              >
                {testSendStatus === "loading" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังส่ง...
                  </>
                ) : testSendStatus === "success" ? (
                  <>
                    <CheckCircle2 size={16} /> ส่งสำเร็จ
                  </>
                ) : (
                  <>
                    <Send size={16} /> ส่งอีเมลทดสอบ
                  </>
                )}
              </Button>
            </div>

            {/* Test connection */}
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testConnStatus === "loading"}
              className="gap-2"
            >
              {testConnStatus === "loading" ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  กำลังทดสอบ...
                </>
              ) : testConnStatus === "success" ? (
                <>
                  <CheckCircle2 size={16} className="text-success" /> เชื่อมต่อสำเร็จ
                </>
              ) : testConnStatus === "error" ? (
                <>
                  <XCircle size={16} className="text-error" /> เชื่อมต่อไม่สำเร็จ
                </>
              ) : (
                <>
                  <Server size={16} /> ทดสอบการเชื่อมต่อ
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── Footer Actions ── */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2 px-8">
            <Save size={16} /> บันทึกการตั้งค่า
          </Button>
        </div>

        {/* Saved Toast */}
        {savedToast && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-success text-white px-5 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 z-50">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">บันทึกการตั้งค่าสำเร็จ</span>
          </div>
        )}
      </main>
    </>
  );
}
