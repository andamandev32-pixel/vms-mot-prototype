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
  MessageCircle,
  Key,
  Link2,
  Webhook,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  Settings,
  Eye,
  EyeOff,
  Save,
  Loader2,
} from "lucide-react";

export default function LineOaConfigPage() {
  const [showSchema, setShowSchema] = useState(false);
  const [showApiDoc, setShowApiDoc] = useState(false);
  const schema = getSchemaByPageId("line-oa-config");
  const apiDoc = getApiDocByPageId("line-oa-config");

  /* ── Card 1: Messaging API ── */
  const [channelId, setChannelId] = useState("1234567890");
  const [channelSecret, setChannelSecret] = useState("***");
  const [showSecret, setShowSecret] = useState(false);
  const [channelAccessToken, setChannelAccessToken] = useState("***");
  const [showToken, setShowToken] = useState(false);
  const [botBasicId, setBotBasicId] = useState("@evms-mots");

  /* ── Card 2: LIFF ── */
  const [liffAppId, setLiffAppId] = useState("1234567890-abcdefgh");
  const [liffEndpointUrl, setLiffEndpointUrl] = useState("https://evms.mots.go.th/liff");

  /* ── Card 3: Webhook ── */
  const webhookUrl = "https://evms.mots.go.th/api/line/webhook";
  const [webhookActive, setWebhookActive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [webhookChecking, setWebhookChecking] = useState(false);
  const [webhookResult, setWebhookResult] = useState<"success" | "fail" | null>(null);

  /* ── Card 4: Rich Menu ── */
  const [richMenuVisitor, setRichMenuVisitor] = useState("");
  const [richMenuOfficer, setRichMenuOfficer] = useState("");

  /* ── Card 5: Status & Testing ── */
  const [isActive, setIsActive] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<"success" | null>(null);

  /* ── Actions ── */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckWebhook = () => {
    setWebhookChecking(true);
    setWebhookResult(null);
    setTimeout(() => {
      setWebhookChecking(false);
      setWebhookResult("success");
    }, 1500);
  };

  const handleTestMessage = () => {
    setTestSending(true);
    setTestResult(null);
    setTimeout(() => {
      setTestSending(false);
      setTestResult("success");
    }, 1500);
  };

  const handleSave = () => {
    alert("บันทึกการตั้งค่าสำเร็จ");
  };

  return (
    <>
      <Topbar title="ตั้งค่า LINE OA" />
      {schema && (
        <DatabaseSchemaModal open={showSchema} onClose={() => setShowSchema(false)} schema={schema} />
      )}
      {apiDoc && <ApiDocModal open={showApiDoc} onClose={() => setShowApiDoc(false)} apiDoc={apiDoc} />}

      <main className="flex-1 p-6 space-y-6">
        {/* ── Header ── */}
        <div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <MessageCircle size={22} className="text-primary" />
            ตั้งค่า LINE Official Account
            <DbSchemaButton onClick={() => setShowSchema(true)} />
            {apiDoc && <ApiDocButton onClick={() => setShowApiDoc(true)} />}
          </h3>
          <p className="text-sm text-text-muted mt-1">
            กำหนดค่าการเชื่อมต่อ LINE Messaging API, LIFF, Webhook และ Rich Menu
          </p>
        </div>

        {/* ══════════════════════════════════════════════
            Card 1 — LINE Messaging API
           ══════════════════════════════════════════════ */}
        <Card>
          <div className="px-6 pt-6 pb-2 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <Key size={18} className="text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">LINE Messaging API</h4>
              <p className="text-xs text-text-muted">ข้อมูลการเชื่อมต่อจาก LINE Developers Console</p>
            </div>
          </div>
          <CardContent className="pt-4 space-y-4">
            <Input
              label="Channel ID"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="เช่น 1234567890"
              leftIcon={<Settings size={16} />}
            />

            <div className="w-full">
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">
                Channel Secret
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <Key size={16} />
                </div>
                <input
                  type={showSecret ? "text" : "password"}
                  value={channelSecret}
                  onChange={(e) => setChannelSecret(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-white pl-10 pr-10 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="w-full">
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">
                Channel Access Token
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-text-muted">
                  <Key size={16} />
                </div>
                <textarea
                  value={channelAccessToken}
                  onChange={(e) => setChannelAccessToken(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-white pl-10 pr-10 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary resize-y"
                  style={{ fontFamily: showToken ? "monospace" : "inherit" }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-3 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-text-secondary">Long-lived token จาก LINE Developers Console</p>
            </div>

            <Input
              label="Bot Basic ID"
              value={botBasicId}
              onChange={(e) => setBotBasicId(e.target.value)}
              placeholder="เช่น @evms-mots"
              leftIcon={<MessageCircle size={16} />}
            />
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════
            Card 2 — LIFF Configuration
           ══════════════════════════════════════════════ */}
        <Card>
          <div className="px-6 pt-6 pb-2 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <ExternalLink size={18} className="text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">LIFF Configuration</h4>
              <p className="text-xs text-text-muted">ตั้งค่า LINE Front-end Framework (LIFF)</p>
            </div>
          </div>
          <CardContent className="pt-4 space-y-4">
            <Input
              label="LIFF App ID"
              value={liffAppId}
              onChange={(e) => setLiffAppId(e.target.value)}
              placeholder="เช่น 1234567890-abcdefgh"
              leftIcon={<Settings size={16} />}
            />
            <Input
              label="LIFF Endpoint URL"
              value={liffEndpointUrl}
              onChange={(e) => setLiffEndpointUrl(e.target.value)}
              placeholder="https://..."
              leftIcon={<Link2 size={16} />}
            />
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════
            Card 3 — Webhook
           ══════════════════════════════════════════════ */}
        <Card>
          <div className="px-6 pt-6 pb-2 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <Webhook size={18} className="text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">Webhook</h4>
              <p className="text-xs text-text-muted">URL สำหรับรับ event จาก LINE Platform</p>
            </div>
          </div>
          <CardContent className="pt-4 space-y-4">
            {/* Webhook URL (readonly + copy) */}
            <div className="w-full">
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <Link2 size={16} />
                  </div>
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex h-10 w-full rounded-md border border-border bg-gray-50 pl-10 pr-3 py-2 text-sm text-text-secondary cursor-default focus-visible:outline-none"
                  />
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleCopy}
                  className="gap-2 shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Webhook status */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">
                  Webhook Status
                </label>
                <button
                  onClick={() => setWebhookActive(!webhookActive)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    webhookActive
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      webhookActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {webhookActive ? "Active" : "Inactive"}
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckWebhook}
                disabled={webhookChecking}
                className="gap-2"
              >
                {webhookChecking ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Webhook size={14} />
                )}
                ตรวจสอบ Webhook
              </Button>
            </div>

            {webhookResult === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">
                <CheckCircle2 size={16} />
                Webhook ทำงานปกติ - เชื่อมต่อสำเร็จ
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════
            Card 4 — Rich Menu
           ══════════════════════════════════════════════ */}
        <Card>
          <div className="px-6 pt-6 pb-2 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
              <Settings size={18} className="text-orange-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">Rich Menu</h4>
              <p className="text-xs text-text-muted">กำหนด Rich Menu ID สำหรับผู้เยี่ยมชมและเจ้าหน้าที่</p>
            </div>
          </div>
          <CardContent className="pt-4 space-y-4">
            <Input
              label="Rich Menu ID - Visitor"
              value={richMenuVisitor}
              onChange={(e) => setRichMenuVisitor(e.target.value)}
              placeholder="เช่น richmenu-abc123..."
              leftIcon={<Settings size={16} />}
            />
            <Input
              label="Rich Menu ID - Officer"
              value={richMenuOfficer}
              onChange={(e) => setRichMenuOfficer(e.target.value)}
              placeholder="เช่น richmenu-xyz789..."
              leftIcon={<Settings size={16} />}
            />
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════
            Card 5 — Status & Testing
           ══════════════════════════════════════════════ */}
        <Card>
          <div className="px-6 pt-6 pb-2 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Send size={18} className="text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">Status & Testing</h4>
              <p className="text-xs text-text-muted">สถานะการเชื่อมต่อและทดสอบส่งข้อความ</p>
            </div>
          </div>
          <CardContent className="pt-4 space-y-4">
            {/* Status toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">
                  สถานะการใช้งาน LINE OA
                </label>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    isActive
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {isActive ? "Active" : "Inactive"}
                </button>
              </div>
            </div>

            {/* Last test result */}
            <div>
              <label className="block text-xs font-medium uppercase text-text-secondary mb-1">
                ผลการทดสอบล่าสุด
              </label>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 size={16} className="text-green-500" />
                ส่งข้อความสำเร็จ - 25 มี.ค. 2569, 10:30 น.
              </div>
            </div>

            {/* Test button */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleTestMessage}
                disabled={testSending}
                className="gap-2"
              >
                {testSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                ทดสอบส่งข้อความ
              </Button>
              {testResult === "success" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <CheckCircle2 size={16} />
                  ส่งข้อความทดสอบสำเร็จ!
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Footer Actions ── */}
        <div className="flex justify-end pt-2 pb-6">
          <Button onClick={handleSave} className="gap-2">
            <Save size={16} />
            บันทึกการตั้งค่า
          </Button>
        </div>
      </main>
    </>
  );
}
