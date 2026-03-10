import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Bell, User, Calendar, FolderClock, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Shield } from "lucide-react";

export default function MobileDashboard() {
    return (
        <div className="min-h-full bg-bg pb-20">
            {/* Top Nav - Gradient Header */}
            <header className="bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white p-6 pb-14 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/15 rounded-full blur-[40px]"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-300/20 rounded-full blur-[30px]"></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <Shield size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-white/60 font-medium">eVMES MOT • LINE OA</p>
                            <h1 className="text-lg font-bold">คุณพุทธิพงษ์ คาดสนิท</h1>
                        </div>
                    </div>
                    <button className="relative p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                        <Bell size={22} />
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-primary"></span>
                    </button>
                </div>
            </header>

            <div className="px-5 -mt-8 relative z-10 space-y-5">
                {/* Hero Card */}
                <Card className="bg-white border-none shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden rounded-2xl">
                    <div className="h-1.5 bg-gradient-to-r from-accent to-accent-hover w-full"></div>
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                            <Badge variant="pending" className="bg-accent-100 text-accent-600 border-accent-200 font-bold">
                                การนัดหมายถัดไป
                            </Badge>
                            <Badge variant="approved">Approved</Badge>
                        </div>

                        <div className="space-y-1 mb-4">
                            <h2 className="text-2xl font-bold text-primary">20 ม.ค. 2568</h2>
                            <p className="text-lg font-medium text-text-primary">10:00 - 11:00 น.</p>
                        </div>

                        <div className="flex items-start gap-3 mb-5 p-3 bg-primary-50 rounded-xl border border-primary-100">
                            <div className="mt-0.5 min-w-[36px] w-[36px]">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                    ส
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary">คุณสมชาย รักชาติ</p>
                                <p className="text-xs text-text-secondary">สำนักนโยบายและยุทธศาสตร์</p>
                            </div>
                        </div>

                        <Link href="/mobile/qr-code">
                            <Button variant="secondary" fullWidth className="h-12 font-bold shadow-md hover:shadow-lg transition-all rounded-xl text-white">
                                ดู QR Code เข้าพื้นที่
                                <ChevronRight size={16} className="ml-1 opacity-70" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <ActionButton href="/mobile/booking" icon={<Calendar size={24} />} label="จองนัดหมาย" />
                    <ActionButton href="/mobile/history" icon={<FolderClock size={24} />} label="ประวัติการเยือน" />
                </div>

                {/* Recent Visits */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-bold text-text-primary">ประวัติล่าสุด</h3>
                        <Link href="/mobile/history" className="text-xs text-primary font-bold hover:underline">
                            ดูทั้งหมด
                        </Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar snap-x">
                        <VisitCard place="อาคาร A ชั้น 3" date="18 ม.ค. 68" status="Checked-out" variant="checkout" />
                        <VisitCard place="อาคาร B ห้องประชุม 2" date="15 ม.ค. 68" status="Completed" variant="checkedin" />
                        <VisitCard place="อาคาร C โรงอาหาร" date="10 ม.ค. 68" status="Cancelled" variant="rejected" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href}>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:border-primary/20 transition-all active:scale-95 duration-200 h-28">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary">
                    {icon}
                </div>
                <span className="text-sm font-bold text-text-secondary">{label}</span>
            </div>
        </Link>
    )
}

function VisitCard({ place, date, status, variant }: { place: string; date: string; status: string; variant: "checkout" | "checkedin" | "rejected" }) {
    return (
        <div className="min-w-[170px] bg-white p-3 rounded-2xl border border-gray-100 flex flex-col justify-between h-[110px] snap-start shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
                    <MapPin size={16} />
                </div>
                <Badge variant={variant} className="text-[10px] h-5 px-2">{status}</Badge>
            </div>
            <div>
                <p className="text-sm font-bold text-text-primary truncate">{place}</p>
                <p className="text-xs text-text-muted">{date}</p>
            </div>
        </div>
    )
}
