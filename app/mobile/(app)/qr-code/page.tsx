import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ChevronLeft, Share2, Download, MapPin, Calendar, User, Hash, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function QRCodePage() {
    return (
        <div className="min-h-full bg-bg pb-24">
            {/* Header */}
            <div className="bg-primary text-white p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
                <Link href="/mobile/dashboard">
                    <ChevronLeft size={24} />
                </Link>
                <h1 className="text-lg font-bold">QR Code เข้าพื้นที่</h1>
                <Share2 size={24} />
            </div>

            <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex justify-center">
                    <Badge variant="approved" className="text-sm px-4 py-1 h-8">Approved</Badge>
                </div>

                {/* QR Card */}
                <Card className="overflow-hidden shadow-lg border-none">
                    <div className="bg-white p-8 flex flex-col items-center gap-4">
                        <div className="w-[220px] h-[220px] border-4 border-primary rounded-xl flex items-center justify-center bg-white p-2">
                            {/* Simulated QR Code */}
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white text-xs text-center opacity-90 relative overflow-hidden">
                                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-0.5">
                                    {Array.from({ length: 144 }).map((_, i) => (
                                        <div key={i} className={`bg-white ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>
                                    ))}
                                </div>
                                {/* Eyes */}
                                <div className="absolute top-2 left-2 w-10 h-10 border-4 border-white bg-black">
                                    <div className="absolute inset-2 bg-white">
                                        <div className="absolute inset-1 bg-black"></div>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 w-10 h-10 border-4 border-white bg-black">
                                    <div className="absolute inset-2 bg-white">
                                        <div className="absolute inset-1 bg-black"></div>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 left-2 w-10 h-10 border-4 border-white bg-black">
                                    <div className="absolute inset-2 bg-white">
                                        <div className="absolute inset-1 bg-black"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-text-muted">วันหมดอายุ: 20 ม.ค. 2568 18:00 น.</p>
                    </div>

                    {/* Visit Info */}
                    <div className="bg-bg/50 p-6 space-y-4 border-t border-border">
                        <InfoRow icon={<Calendar size={18} />} label="วันที่" value="จ. 20 ม.ค. 2568 • 10:00-16:00 น." />
                        <InfoRow icon={<User size={18} />} label="พบ" value="คุณสมชาย • สำนักนโยบาย" />
                        <InfoRow icon={<MapPin size={18} />} label="พื้นที่" value="ชั้น 3 อาคาร A" />
                        <InfoRow icon={<Hash size={18} />} label="รหัสอ้างอิง" value="VMS-0042" />
                    </div>
                </Card>

                {/* Warning Banner */}
                <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-r-lg flex gap-3">
                    <AlertTriangle className="text-accent shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-bold text-text-primary">QR Code นี้ใช้ได้ 1 ครั้ง</p>
                        <p className="text-xs text-text-secondary">นำ QR Code นี้ไป Scan ที่เครื่อง Kiosk เพื่อ Check-in เข้าพื้นที่</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-12 border-primary text-primary">
                        <Download size={18} className="mr-2" />
                        บันทึกรูป
                    </Button>
                    <Button variant="outline" className="h-12 border-primary text-primary">
                        <Share2 size={18} className="mr-2" />
                        แชร์
                    </Button>
                </div>

            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-0.5 text-primary opacity-70">{icon}</div>
            <div className="flex-1">
                <p className="text-xs text-text-muted mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-text-primary">{value}</p>
            </div>
        </div>
    )
}
