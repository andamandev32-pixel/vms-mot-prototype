"use client";

import { useState } from "react";
import { Smartphone, Monitor, Tablet, Shield, GitBranch, ZoomIn } from "lucide-react";
import VmsLogo from "@/components/ui/VmsLogo";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";

export default function Home() {
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const apps = [
    {
      title: "LINE OA",
      subtitle: "ผู้มาติดต่อ / เจ้าหน้าที่",
      description: "จองนัดหมาย, ดู QR Code, ตรวจสอบสถานะ, อนุมัติคำขอ",
      href: "/mobile",
      icon: <Smartphone className="h-8 w-8" />,
      status: "กำลังออกแบบ" as string | undefined,
      badge: undefined as string | undefined,
      screens: ["ลงทะเบียน LINE", "Dashboard", "จองนัดหมาย 4 ขั้นตอน", "QR Code", "ประวัติ", "โปรไฟล์", "Officer: อนุมัติ/ต้อนรับ"],
    },
    {
      title: "Web App",
      subtitle: "Admin / เจ้าหน้าที่ดูแลระบบ",
      description: "Dashboard, รายงาน, จัดการ Blocklist, Walk-in, ตั้งค่าระบบ",
      href: "/web",
      icon: <Monitor className="h-8 w-8" />,
      status: undefined as string | undefined,
      badge: undefined as string | undefined,
      screens: ["Dashboard + KPI", "ตารางนัดหมาย", "Walk-in", "รายงาน", "Blocklist", "ค้นหาผู้ติดต่อ", "ตั้งค่า"],
    },
    {
      title: "Kiosk",
      subtitle: "ตู้บริการตนเอง",
      description: "สแกน QR / บัตรประชาชน, ลงทะเบียน Walk-in, พิมพ์บัตรผู้ติดต่อ",
      href: "/kiosk",
      icon: <Tablet className="h-8 w-8" />,
      status: undefined as string | undefined,
      badge: undefined as string | undefined,
      screens: ["หน้าจอต้อนรับ", "เลือกภาษา", "สแกน QR", "สแกนบัตร", "Walk-in 4 ขั้นตอน", "ถ่ายรูป", "ใบ Slip"],
    },
    {
      title: "Counter",
      subtitle: "จุดรักษาความปลอดภัย",
      description: "Check-in / Check-out, ตรวจสอบบัตร, บันทึกยานพาหนะ, ออกบัตรผู้ติดต่อ",
      href: "/counter",
      icon: <Shield className="h-8 w-8" />,
      status: undefined as string | undefined,
      badge: undefined as string | undefined,
      screens: ["PIN Login", "Dashboard", "Walk-in + นัดหมาย", "ตรวจสอบบัตร", "Check-out", "ใบ Visitor Badge"],
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-400/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.03] rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Header */}
        <div className="text-center mb-12 space-y-6">
          <div className="inline-flex items-center gap-4 mb-6">
            <VmsLogo size={48} darkMode />
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white tracking-tight">eVMS Prototype</h1>
              <p className="text-white/60 text-sm font-medium">Visitor Management System</p>
            </div>
          </div>
          <p className="text-xl text-white/70 font-light max-w-lg mx-auto">
            กระทรวงการท่องเที่ยวและกีฬา<br />
            <span className="text-white/40 text-base">Ministry of Tourism and Sports</span>
          </p>
        </div>

        {/* Flow Preview Link */}
        <a
          href="/vms_flow_preview.html"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-10 inline-flex items-center gap-3 bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl px-6 py-4 transition-all duration-300 hover:bg-white/[0.14] hover:border-accent/40 hover:scale-[1.02] group"
        >
          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent/30 transition-colors">
            <GitBranch className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-white font-semibold group-hover:text-accent transition-colors">VMS Flow Preview</p>
            <p className="text-white/40 text-xs">ดูภาพรวม Flow ทั้งหมดของระบบ</p>
          </div>
        </a>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {apps.map((app) => (
            <a href={app.href} key={app.href} target="_blank" rel="noopener noreferrer" className="group">
              <div className="relative bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.14] hover:border-accent/40 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden h-full">
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/5 group-hover:to-transparent transition-all duration-500 rounded-2xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors">
                      {app.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">{app.title}</h3>
                        {app.status && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 rounded-full px-2 py-0.5 font-medium animate-pulse">
                            {app.status}
                          </span>
                        )}
                        {app.badge && (
                          <span className="text-[10px] bg-accent/20 text-accent-100 rounded-full px-2 py-0.5 font-medium">
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-white/50 text-sm font-medium">{app.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed mb-3">{app.description}</p>

                  {/* Screen list */}
                  <div className="flex flex-wrap gap-1.5">
                    {app.screens.slice(0, 5).map((screen) => (
                      <span key={screen} className="text-[10px] text-white/40 bg-white/[0.06] rounded px-1.5 py-0.5">
                        {screen}
                      </span>
                    ))}
                    {app.screens.length > 5 && (
                      <span className="text-[10px] text-accent/60 bg-accent/10 rounded px-1.5 py-0.5">
                        +{app.screens.length - 5} อื่นๆ
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Kiosk Hardware */}
        <div className="mt-14 max-w-5xl w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Kiosk Hardware</h2>
            <p className="text-white/40 text-sm">ตู้บริการตนเอง — Self-Service Kiosk</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-6 overflow-hidden">
            <div className="grid grid-cols-3 gap-6 items-center">
              {/* Blueprint */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => setPreviewImage({ src: "/images/kiosk-blueprint.png", alt: "Kiosk Blueprint — แบบแปลน" })}
                  className="bg-white rounded-xl p-3 shadow-lg cursor-pointer group/img relative transition-all duration-300 hover:shadow-2xl hover:scale-[1.03]"
                >
                  <img src="/images/kiosk-blueprint.png" alt="Kiosk Blueprint" className="w-full h-auto max-h-[320px] object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 rounded-xl transition-all duration-300 flex items-center justify-center">
                    <ZoomIn size={28} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </button>
                <span className="text-white/40 text-xs">แบบแปลน (Blueprint) — คลิกเพื่อขยาย</span>
              </div>
              {/* 3D Side */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => setPreviewImage({ src: "/images/kiosk-3d-side.jpg", alt: "Kiosk 3D Side View — มุมมองด้านข้าง" })}
                  className="rounded-xl overflow-hidden shadow-lg cursor-pointer group/img relative transition-all duration-300 hover:shadow-2xl hover:scale-[1.03]"
                >
                  <img src="/images/kiosk-3d-side.jpg" alt="Kiosk 3D Side View" className="w-full h-auto max-h-[320px] object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 rounded-xl transition-all duration-300 flex items-center justify-center">
                    <ZoomIn size={28} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </button>
                <span className="text-white/40 text-xs">มุมมอง 3D (ด้านข้าง) — คลิกเพื่อขยาย</span>
              </div>
              {/* 3D Front */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => setPreviewImage({ src: "/images/kiosk-3d-front.jpg", alt: "Kiosk 3D Front View — มุมมองด้านหน้า" })}
                  className="rounded-xl overflow-hidden shadow-lg cursor-pointer group/img relative transition-all duration-300 hover:shadow-2xl hover:scale-[1.03]"
                >
                  <img src="/images/kiosk-3d-front.jpg" alt="Kiosk 3D Front View" className="w-full h-auto max-h-[320px] object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 rounded-xl transition-all duration-300 flex items-center justify-center">
                    <ZoomIn size={28} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </button>
                <span className="text-white/40 text-xs">มุมมอง 3D (ด้านหน้า) — คลิกเพื่อขยาย</span>
              </div>
            </div>
            {/* Specs */}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {[
                "800 x 600 x 1600 mm",
                "หน้าจอสัมผัส 32\"",
                "กล้องบันทึกภาพ",
                "เครื่องอ่านบัตรประชาชน",
                "QR Scanner",
                "เครื่องพิมพ์ VisitPass",
              ].map((spec) => (
                <span key={spec} className="text-[11px] text-white/50 bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Counter Hardware */}
        <div className="mt-14 max-w-5xl w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Counter Hardware</h2>
            <p className="text-white/40 text-sm">เคาน์เตอร์บริการ — Service Counter</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-6 overflow-hidden">
            <div className="grid grid-cols-3 gap-6 items-center">
              <div className="col-start-2 flex flex-col items-center gap-3">
                <button
                  onClick={() => setPreviewImage({ src: "/images/counter.png", alt: "Counter Hardware — เคาน์เตอร์บริการ" })}
                  className="rounded-xl overflow-hidden shadow-lg cursor-pointer group/img relative transition-all duration-300 hover:shadow-2xl hover:scale-[1.03]"
                >
                  <img src="/images/counter.png" alt="Counter Hardware" className="w-full h-auto max-h-[320px] object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 rounded-xl transition-all duration-300 flex items-center justify-center">
                    <ZoomIn size={28} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <span className="text-white/[0.08] text-6xl font-bold rotate-[-30deg] tracking-widest uppercase">PROTOTYPE</span>
                  </div>
                </button>
                <span className="text-white/40 text-xs">เคาน์เตอร์บริการ — คลิกเพื่อขยาย</span>
              </div>
            </div>
            {/* Specs */}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {[
                "หน้าจอสัมผัส 15.6\"",
                "เครื่องอ่านบัตรประชาชน",
                "กล้องบันทึกภาพ",
                "QR Scanner",
                "เครื่องพิมพ์ VisitPass",
              ].map((spec) => (
                <span key={spec} className="text-[11px] text-white/50 bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/30 text-sm">
          &copy; 2569 กระทรวงการท่องเที่ยวและกีฬา — Prototype v2.0
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        src={previewImage?.src ?? ""}
        alt={previewImage?.alt ?? ""}
      />
    </main>
  );
}
