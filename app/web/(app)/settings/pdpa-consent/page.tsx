"use client";

import { useState } from "react";
import Topbar from "@/components/web/Topbar";
import { DatabaseSchemaModal, DbSchemaButton } from "@/components/web/DatabaseSchemaModal";
import { FlowchartModal, FlowRulesButton } from "@/components/web/FlowchartModal";
import { getSchemaByPageId } from "@/lib/database-schema";
import { getFlowByPageId } from "@/lib/flowchart-data";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Shield, Save, Eye, Globe, RotateCcw } from "lucide-react";

const defaultPdpaTh = `พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)

กระทรวงการท่องเที่ยวและกีฬา ("หน่วยงาน") จะเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังต่อไปนี้:

1. การยืนยันตัวตนและลงทะเบียนผู้มาติดต่อ
2. การรักษาความปลอดภัยของสถานที่
3. การบันทึกประวัติการเข้า-ออกอาคาร
4. การติดต่อสื่อสารกรณีฉุกเฉิน

ข้อมูลที่เก็บรวบรวม:
• ชื่อ-นามสกุล
• เลขบัตรประจำตัวประชาชน/หนังสือเดินทาง
• ภาพถ่ายใบหน้า
• ข้อมูลการติดต่อ

สิทธิของเจ้าของข้อมูล:
ท่านมีสิทธิในการเข้าถึง แก้ไข ลบ หรือขอสำเนาข้อมูลส่วนบุคคลของท่าน รวมถึงสิทธิในการเพิกถอนความยินยอม โดยสามารถติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลได้ที่เคาน์เตอร์ประชาสัมพันธ์

ระยะเวลาการจัดเก็บ:
ข้อมูลจะถูกจัดเก็บไว้เป็นระยะเวลา 90 วัน นับจากวันที่เข้าเยี่ยมชม หลังจากนั้นจะถูกลบออกจากระบบโดยอัตโนมัติ`;

const defaultPdpaEn = `Personal Data Protection Act B.E. 2562 (PDPA)

The Ministry of Tourism and Sports ("the Organization") will collect, use, and disclose your personal data for the following purposes:

1. Identity verification and visitor registration
2. Premises security maintenance
3. Building entry/exit records
4. Emergency communication

Data Collected:
• Full name
• National ID / Passport number
• Facial photograph
• Contact information

Data Subject Rights:
You have the right to access, correct, delete, or request copies of your personal data, including the right to withdraw consent. Please contact the Data Protection Officer at the reception counter.

Retention Period:
Data will be retained for 90 days from the date of visit, after which it will be automatically deleted from the system.`;

export default function PdpaConsentSettingsPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const schema = getSchemaByPageId("pdpa-consent")!;
  const flowData = getFlowByPageId("pdpa-consent")!;

  const [activeLang, setActiveLang] = useState<"th" | "en">("th");
  const [textTh, setTextTh] = useState(defaultPdpaTh);
  const [textEn, setTextEn] = useState(defaultPdpaEn);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [retentionDays, setRetentionDays] = useState("90");
  const [requireScroll, setRequireScroll] = useState(true);

  const currentText = activeLang === "th" ? textTh : textEn;
  const setCurrentText = activeLang === "th" ? setTextTh : setTextEn;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setTextTh(defaultPdpaTh);
    setTextEn(defaultPdpaEn);
    setRetentionDays("90");
  };

  return (
    <div>
      <Topbar title="PDPA / นโยบายคุ้มครองข้อมูลส่วนบุคคล" />
      <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      <FlowchartModal open={showFlow} onClose={() => setShowFlow(false)} flowData={flowData} />

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Shield size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                ข้อความ PDPA สำหรับ Kiosk
                <DbSchemaButton onClick={() => setShowSchema(true)} />
                <FlowRulesButton onClick={() => setShowFlow(true)} />
              </h2>
              <p className="text-sm text-text-muted">แก้ไขข้อความนโยบายคุ้มครองข้อมูลส่วนบุคคลที่แสดงบน Kiosk</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                preview ? "bg-primary-50 border-primary-200 text-primary-700" : "border-border text-text-secondary hover:bg-surface"
              )}
            >
              <Eye size={16} />
              {preview ? "ซ่อนตัวอย่าง" : "ดูตัวอย่าง"}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-surface transition-colors"
            >
              <RotateCcw size={16} />
              คืนค่าเริ่มต้น
            </button>
            <button
              onClick={handleSave}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                saved ? "bg-success text-white" : "bg-primary-600 text-white hover:bg-primary-700"
              )}
            >
              <Save size={16} />
              {saved ? "บันทึกแล้ว ✓" : "บันทึก"}
            </button>
          </div>
        </div>

        <div className={cn("grid gap-6", preview ? "grid-cols-2" : "grid-cols-1")}>
          {/* Editor */}
          <div className="space-y-4">
            {/* Language tabs */}
            <Card>
              <CardContent className="p-0">
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setActiveLang("th")}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                      activeLang === "th"
                        ? "border-primary-600 text-primary-700 bg-primary-50/50"
                        : "border-transparent text-text-muted hover:text-text-secondary"
                    )}
                  >
                    <Globe size={14} />
                    ภาษาไทย (TH)
                  </button>
                  <button
                    onClick={() => setActiveLang("en")}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                      activeLang === "en"
                        ? "border-primary-600 text-primary-700 bg-primary-50/50"
                        : "border-transparent text-text-muted hover:text-text-secondary"
                    )}
                  >
                    <Globe size={14} />
                    English (EN)
                  </button>
                </div>
                <div className="p-4">
                  <textarea
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    className="w-full h-[400px] p-4 rounded-lg border border-border bg-surface text-sm text-text-primary leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 font-sans"
                    placeholder={activeLang === "th" ? "ใส่ข้อความ PDPA ภาษาไทย..." : "Enter PDPA text in English..."}
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                    <span>{currentText.length} ตัวอักษร</span>
                    <span>{activeLang === "th" ? "ภาษาไทย" : "English"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-bold text-text-primary">ตั้งค่าเพิ่มเติม</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">ต้องเลื่อนอ่านก่อนยอมรับ</p>
                    <p className="text-xs text-text-muted">ผู้ใช้ต้องเลื่อนอ่านข้อความถึงด้านล่างก่อน checkbox จึงจะเปิดให้กด</p>
                  </div>
                  <button
                    onClick={() => setRequireScroll(!requireScroll)}
                    className={cn(
                      "w-12 h-7 rounded-full flex items-center px-1 transition-colors",
                      requireScroll ? "bg-primary-600 justify-end" : "bg-gray-300 justify-start"
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">ระยะเวลาเก็บข้อมูล (วัน)</p>
                    <p className="text-xs text-text-muted">กำหนดระยะเวลาในการจัดเก็บข้อมูลผู้มาติดต่อ</p>
                  </div>
                  <input
                    type="number"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg border border-border text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-300"
                    min="1"
                    max="365"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {preview && (
            <Card className="h-fit sticky top-6">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <Eye size={16} className="text-primary-600" />
                  ตัวอย่างบน Kiosk
                </div>
                <div className="rounded-xl border-2 border-border bg-white overflow-hidden">
                  {/* Mini kiosk header */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <Shield size={14} className="text-[#1B2B5E]" />
                    <span className="text-[11px] font-bold text-[#1B2B5E]">
                      {activeLang === "th" ? "นโยบายคุ้มครองข้อมูลส่วนบุคคล" : "Privacy Policy (PDPA)"}
                    </span>
                  </div>
                  {/* Scrollable text */}
                  <div className="p-3 h-[300px] overflow-y-auto">
                    <p className="text-[10px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {currentText}
                    </p>
                  </div>
                  {/* Mini checkbox + button */}
                  <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-[#C8A84E] bg-[#C8A84E] flex items-center justify-center">
                        <span className="text-white text-[8px]">✓</span>
                      </div>
                      <span className="text-[9px] text-gray-600">
                        {activeLang === "th" ? "ข้าพเจ้ายอมรับนโยบาย..." : "I accept the policy..."}
                      </span>
                    </div>
                    <div className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[#C8A84E] to-[#B8960B] text-center text-[10px] font-bold text-white">
                      {activeLang === "th" ? "ยอมรับและดำเนินการต่อ" : "Accept & Continue"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
