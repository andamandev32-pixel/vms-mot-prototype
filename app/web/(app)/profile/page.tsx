"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { ApiDocModal, ApiDocButton } from "@/components/web/ApiDocModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { getApiDocByPageId } from "@/lib/api-doc-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  User, Mail, Phone, Building2, Shield, ShieldCheck, KeyRound,
  MessageCircle, Unlink, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, Eye, EyeOff, X, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleConfig, type AppRole } from "@/lib/auth-config";
import { useChangePassword, useCurrentUser } from "@/lib/hooks";

export default function WebProfilePage() {
  const changePasswordMut = useChangePassword();
  const { data: meData, isLoading } = useCurrentUser();
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("my-profile");
  const flowData = getFlowByPageId("my-profile");
  const apiDoc = getApiDocByPageId("my-profile");

  const [toast, setToast] = useState<string | null>(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const account = (meData as any)?.user;
  const staffData = account?.staff;

  const firstName = account?.firstName ?? "";
  const lastName = account?.lastName ?? "";
  const email = account?.email ?? "";
  const phone = account?.phone ?? staffData?.phone ?? "-";
  const department = staffData?.department?.name ?? "-";
  const position = staffData?.position ?? "-";
  const role = (account?.role ?? "staff") as AppRole;
  const employeeId = staffData?.employeeId ?? "-";
  const createdAt = account?.createdAt
    ? new Date(account.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
    : "-";
  const lineUserId = account?.lineUserId ?? null;
  const lineDisplayName = account?.lineDisplayName ?? null;
  const lineLinkedAt = account?.lineLinkedAt
    ? new Date(account.lineLinkedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const rc = roleConfig[role];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLinkLine = () => {
    setShowLinkConfirm(false);
    // TODO: Implement real LINE linking via API
    showToast("ผูกบัญชี LINE สำเร็จ");
  };

  const handleChangeLine = () => {
    // TODO: Implement real LINE change via API
    showToast("เปลี่ยนบัญชี LINE สำเร็จ");
  };

  const handleUnlinkLine = () => {
    setShowUnlinkConfirm(false);
    // TODO: Implement real LINE unlinking via API
    showToast("ยกเลิกการผูก LINE สำเร็จ");
  };

  const handleChangePassword = async () => {
    if (!pwForm.oldPassword || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirmPassword) return;
    if (pwForm.newPassword.length < 8) return;
    try {
      await changePasswordMut.mutateAsync({ currentPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
    } catch {
      // TODO: show error toast from API
    }
    setShowChangePassword(false);
    setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    showToast("เปลี่ยนรหัสผ่านสำเร็จ");
  };

  return (
    <>
      <Topbar title="โปรไฟล์ของฉัน" />
      {schema && <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />}
      {flowData && <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />}
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}

      <main className="flex-1 p-6 space-y-6 max-w-4xl">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-success text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} /> {toast}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
        <>
        {/* Profile Header */}
        <div className="flex items-center gap-5">
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg", rc.bgColor, rc.color)}>
            {firstName[0]}{lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              {firstName} {lastName}
              {schema && <DbSchemaButton onClick={() => setShowSchema(true)} />}
              {flowData && <FlowRulesButton onClick={() => setShowFlow(true)} />}
              {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
            </h2>
            <p className="text-sm text-text-secondary">{position} — {department}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full", rc.bgColor, rc.color)}>
                <ShieldCheck size={12} /> {rc.label}
              </span>
              <span className="text-xs text-text-muted">รหัสพนักงาน: {employeeId}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ===== ข้อมูลส่วนตัว ===== */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-text-primary mb-5 flex items-center gap-2">
                <User size={18} className="text-primary" /> ข้อมูลส่วนตัว
              </h3>
              <div className="space-y-4">
                <InfoRow icon={<User size={16} />} label="ชื่อ-นามสกุล" value={`${firstName} ${lastName}`} />
                <InfoRow icon={<Mail size={16} />} label="อีเมล" value={email} mono />
                <InfoRow icon={<Phone size={16} />} label="เบอร์โทรศัพท์" value={phone} />
                <InfoRow icon={<Building2 size={16} />} label="แผนก / หน่วยงาน" value={department} />
                <InfoRow icon={<Clock size={16} />} label="สมาชิกตั้งแต่" value={createdAt} />
              </div>
            </CardContent>
          </Card>

          {/* ===== บัญชี LINE ===== */}
          <Card className="border-none shadow-sm overflow-hidden">
            {lineUserId ? (
              <div className="h-1.5 bg-[#06C755] w-full"></div>
            ) : (
              <div className="h-1.5 bg-gray-200 w-full"></div>
            )}
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-text-primary mb-5 flex items-center gap-2">
                <MessageCircle size={18} className="text-[#06C755]" /> บัญชี LINE
              </h3>

              {lineUserId ? (
                /* ===== ผูก LINE แล้ว ===== */
                <>
                  <div className="flex items-center gap-3 mb-4 p-3 bg-[#06C755]/5 rounded-xl border border-[#06C755]/15">
                    <div className="w-11 h-11 rounded-full bg-[#06C755] flex items-center justify-center shadow-md shadow-[#06C755]/20">
                      <MessageCircle size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary">{lineDisplayName}</p>
                      <p className="text-xs text-text-muted">ผูกเมื่อ: {lineLinkedAt}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-[#06C755] shadow-md shadow-[#06C755]/30"></div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 mb-5 text-xs text-text-muted space-y-1">
                    <p>รับการแจ้งเตือนนัดหมาย, สถานะอนุมัติ, Visit Slip ผ่าน LINE</p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" fullWidth onClick={handleChangeLine}>
                      <RefreshCw size={14} className="mr-1.5" /> เปลี่ยนบัญชี LINE
                    </Button>
                    <Button variant="destructive" fullWidth onClick={() => setShowUnlinkConfirm(true)}>
                      <Unlink size={14} className="mr-1.5" /> ยกเลิกการผูก
                    </Button>
                  </div>
                </>
              ) : (
                /* ===== ยังไม่ผูก LINE ===== */
                <>
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center">
                      <MessageCircle size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary">ยังไม่ได้ผูกบัญชี LINE</p>
                      <p className="text-xs text-text-muted">ผูกบัญชี LINE เพื่อรับการแจ้งเตือน</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  </div>

                  <div className="bg-[#06C755]/5 border border-[#06C755]/15 rounded-xl p-3 mb-5 text-xs space-y-1">
                    <p className="font-bold text-[#06C755]">ผูกบัญชี LINE เพื่อ:</p>
                    <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                      <li>รับแจ้งเตือนนัดหมาย & สถานะอนุมัติ</li>
                      <li>รับ Visit Slip ผ่าน LINE (ไม่ต้องพิมพ์กระดาษ)</li>
                      <li>เข้าใช้งานผ่าน LINE ได้สะดวก</li>
                    </ul>
                  </div>

                  <Button variant="primary" fullWidth onClick={() => setShowLinkConfirm(true)}>
                    <MessageCircle size={16} className="mr-1.5" /> ผูกบัญชี LINE
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== ความปลอดภัย ===== */}
        <Card className="border-none shadow-sm max-w-4xl">
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-text-primary mb-5 flex items-center gap-2">
              <Shield size={18} className="text-primary" /> ความปลอดภัย
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <KeyRound size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">รหัสผ่าน</p>
                  <p className="text-xs text-text-muted">เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบ</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowChangePassword(true)}>
                เปลี่ยนรหัสผ่าน
              </Button>
            </div>
          </CardContent>
        </Card>
        </>
        )}
      </main>

      {/* ===== Unlink LINE Confirm Modal ===== */}
      {showUnlinkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowUnlinkConfirm(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <Unlink size={24} className="text-error" />
              </div>
            </div>
            <h3 className="text-center text-lg font-bold text-text-primary mb-1">ยกเลิกการผูก LINE</h3>
            <p className="text-center text-sm text-text-secondary mb-4">คุณแน่ใจหรือไม่?</p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>หลังยกเลิก คุณจะ:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>ไม่ได้รับการแจ้งเตือนผ่าน LINE</li>
                  <li>ไม่ได้รับ Visit Slip ผ่าน LINE</li>
                  <li>ต้องผูกใหม่ด้วยตัวเองหากต้องการ</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setShowUnlinkConfirm(false)}>ยกเลิก</Button>
              <Button variant="destructive" fullWidth onClick={handleUnlinkLine}>ยืนยันยกเลิก</Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Link LINE Confirm Modal ===== */}
      {showLinkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowLinkConfirm(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#06C755]/10 flex items-center justify-center">
                <MessageCircle size={24} className="text-[#06C755]" />
              </div>
            </div>
            <h3 className="text-center text-lg font-bold text-text-primary mb-1">ผูกบัญชี LINE</h3>
            <p className="text-center text-sm text-text-secondary mb-4">เชื่อมต่อกับ LINE Official Account eVMS</p>

            <div className="bg-[#06C755]/5 border border-[#06C755]/15 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#06C755] flex items-center justify-center shadow-md shadow-[#06C755]/20">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">eVMS กระทรวงการท่องเที่ยวฯ</p>
                  <p className="text-xs text-text-muted">LINE Official Account</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary">ระบบจะนำคุณไปยังหน้า LINE Login เพื่อยืนยันตัวตน</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setShowLinkConfirm(false)}>ยกเลิก</Button>
              <Button variant="primary" fullWidth onClick={handleLinkLine}>
                <MessageCircle size={16} className="mr-1.5" /> เชื่อมต่อ LINE
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Change Password Modal ===== */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowChangePassword(false); }}>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95">
            <button onClick={() => setShowChangePassword(false)} className="absolute top-3 right-3 rounded-full p-1.5 text-text-muted hover:bg-gray-100 hover:text-text-primary transition-colors">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <KeyRound size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">เปลี่ยนรหัสผ่าน</h3>
                <p className="text-xs text-text-muted">กรอกรหัสผ่านเดิมและรหัสผ่านใหม่</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1.5">รหัสผ่านเดิม</label>
                <div className="relative">
                  <input type={showOldPw ? "text" : "password"} value={pwForm.oldPassword} onChange={(e) => setPwForm((p) => ({ ...p, oldPassword: e.target.value }))} placeholder="กรอกรหัสผ่านเดิม" className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <button type="button" onClick={() => setShowOldPw(!showOldPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1.5">รหัสผ่านใหม่</label>
                <div className="relative">
                  <input type={showNewPw ? "text" : "password"} value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} placeholder="อย่างน้อย 8 ตัวอักษร" className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwForm.newPassword && pwForm.newPassword.length < 8 && (
                  <p className="text-xs text-error mt-1">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                  <p className="text-xs text-error mt-1">รหัสผ่านไม่ตรงกัน</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" fullWidth onClick={() => setShowChangePassword(false)}>ยกเลิก</Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleChangePassword}
                  disabled={!pwForm.oldPassword || !pwForm.newPassword || pwForm.newPassword.length < 8 || pwForm.newPassword !== pwForm.confirmPassword}
                >
                  เปลี่ยนรหัสผ่าน
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-text-muted">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-muted font-medium uppercase">{label}</p>
        <p className={cn("text-sm font-semibold text-text-primary truncate", mono && "font-mono text-xs")}>{value}</p>
      </div>
    </div>
  );
}
