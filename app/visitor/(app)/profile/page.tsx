"use client";

import { useState } from "react";
import { useVisitorAuth } from "@/components/providers/VisitorAuthProvider";
import { User, Mail, Phone, Building2, CreditCard, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function VisitorProfilePage() {
  const { visitor, refresh } = useVisitorAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [firstName, setFirstName] = useState(visitor?.firstName || "");
  const [lastName, setLastName] = useState(visitor?.lastName || "");
  const [phone, setPhone] = useState(visitor?.phone || "");
  const [company, setCompany] = useState(visitor?.company || "");

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/auth/visitor/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, company }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setEditing(false);
        refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (!visitor) return null;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-text-primary mb-6">โปรไฟล์</h1>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <User size={28} className="text-white" />
          </div>
          <p className="font-bold text-lg">{visitor.firstName} {visitor.lastName}</p>
          <p className="text-sm opacity-80">{visitor.email}</p>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="ชื่อ" leftIcon={<User size={16} />} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input label="นามสกุล" leftIcon={<User size={16} />} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <Input label="เบอร์โทร" leftIcon={<Phone size={16} />} value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="บริษัท/หน่วยงาน" leftIcon={<Building2 size={16} />} value={company} onChange={(e) => setCompany(e.target.value)} />

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">ยกเลิก</Button>
                <Button onClick={handleSave} loading={saving} className="flex-1 flex items-center justify-center gap-1">
                  <Save size={16} /> บันทึก
                </Button>
              </div>
            </>
          ) : (
            <>
              <ProfileRow icon={<Mail size={16} />} label="อีเมล" value={visitor.email} />
              <ProfileRow icon={<Phone size={16} />} label="เบอร์โทร" value={visitor.phone} />
              <ProfileRow icon={<Building2 size={16} />} label="บริษัท/หน่วยงาน" value={visitor.company || "-"} />

              <div className="pt-2">
                <Button variant="outline" onClick={() => setEditing(true)} className="w-full">
                  แก้ไขข้อมูล
                </Button>
              </div>

              {saved && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <p className="text-sm text-emerald-700">บันทึกสำเร็จ</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
