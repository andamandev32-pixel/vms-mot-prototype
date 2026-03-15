import Link from "next/link";
import { Smartphone, Monitor, Tablet, Shield, Users, Calendar, BarChart3 } from "lucide-react";

export default function Home() {
  const apps = [
    {
      title: "LINE OA",
      subtitle: "ผู้มาติดต่อ / เจ้าหน้าที่",
      description: "จองนัดหมาย, ดู QR Code, ตรวจสอบสถานะ, อนุมัติคำขอ",
      href: "/mobile",
      icon: <Smartphone className="h-8 w-8" />,
      badge: "13 หน้าจอ",
      screens: ["ลงทะเบียน LINE", "Dashboard", "จองนัดหมาย 4 ขั้นตอน", "QR Code", "ประวัติ", "โปรไฟล์", "Officer: อนุมัติ/ต้อนรับ"],
    },
    {
      title: "Web App",
      subtitle: "Admin / เจ้าหน้าที่ดูแลระบบ",
      description: "Dashboard, รายงาน, จัดการ Blocklist, Walk-in, ตั้งค่าระบบ",
      href: "/web",
      icon: <Monitor className="h-8 w-8" />,
      badge: "10 หน้าจอ",
      screens: ["Dashboard + KPI", "ตารางนัดหมาย", "Walk-in", "รายงาน", "Blocklist", "ค้นหาผู้ติดต่อ", "ตั้งค่า"],
    },
    {
      title: "Kiosk",
      subtitle: "ตู้บริการตนเอง",
      description: "สแกน QR / บัตรประชาชน, ลงทะเบียน Walk-in, พิมพ์บัตรผู้ติดต่อ",
      href: "/kiosk",
      icon: <Tablet className="h-8 w-8" />,
      badge: "12 หน้าจอ",
      screens: ["หน้าจอต้อนรับ", "เลือกภาษา", "สแกน QR", "สแกนบัตร", "Walk-in 4 ขั้นตอน", "ถ่ายรูป", "ใบ Slip"],
    },
    {
      title: "Counter",
      subtitle: "จุดรักษาความปลอดภัย",
      description: "Check-in / Check-out, ตรวจสอบบัตร, บันทึกยานพาหนะ, ออกบัตรผู้ติดต่อ",
      href: "/counter",
      icon: <Shield className="h-8 w-8" />,
      badge: "8 หน้าจอ",
      screens: ["PIN Login", "Dashboard", "Walk-in + นัดหมาย", "ตรวจสอบบัตร", "Check-out", "ใบ Visitor Badge"],
    },
  ];

  const stats = [
    { icon: <Users className="h-5 w-5" />, label: "Mock Visitors", value: "8" },
    { icon: <Calendar className="h-5 w-5" />, label: "Appointments", value: "8" },
    { icon: <BarChart3 className="h-5 w-5" />, label: "Total Screens", value: "~47" },
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
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-4 shadow-2xl mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">V</span>
            </div>
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

        {/* Quick Stats */}
        <div className="flex gap-4 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2.5 bg-white/[0.06] backdrop-blur border border-white/10 rounded-xl px-4 py-2.5">
              <span className="text-accent/80">{stat.icon}</span>
              <div>
                <p className="text-white font-bold text-lg leading-none">{stat.value}</p>
                <p className="text-white/40 text-[11px]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {apps.map((app) => (
            <Link href={app.href} key={app.href} className="group">
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
                        <span className="text-[10px] bg-accent/20 text-accent-100 rounded-full px-2 py-0.5 font-medium">
                          {app.badge}
                        </span>
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
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/30 text-sm">
          &copy; 2569 กระทรวงการท่องเที่ยวและกีฬา — Prototype v2.0
        </div>
      </div>
    </main>
  );
}
