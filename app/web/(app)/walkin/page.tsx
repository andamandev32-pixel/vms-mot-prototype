"use client";

import Topbar from "@/components/web/Topbar";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Camera, CheckCircle, CreditCard, User, Building, Clock, MapPin } from "lucide-react";

export default function WalkInPage() {
    return (
        <>
            <Topbar title="ลงทะเบียน Walk-in" />
            <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 h-[calc(100vh-64px)] overflow-hidden">

                {/* Left: Form */}
                <div className="overflow-y-auto pr-2 pb-20 custom-scrollbar">
                    <Card className="border-none shadow-sm mb-6">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">ข้อมูลผู้มาติดต่อ</h2>
                            <Button variant="outline" className="text-primary border-primary hover:bg-primary/5">
                                <CreditCard size={18} className="mr-2" />
                                อ่านจากบัตรประชาชน (Smart Card)
                            </Button>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="ชื่อ" placeholder="ระบุชื่อ" />
                            <Input label="นามสกุล" placeholder="ระบุนามสกุล" />
                            <Input label="เลขบัตรประชาชน / Passport" placeholder="X-XXXX-XXXXX-XX-X" className="font-mono" />
                            <Input label="เบอร์โทรศัพท์" placeholder="0XX-XXXX-XXXX" />
                            <div className="md:col-span-2">
                                <Input label="บริษัท / หน่วยงาน" placeholder="ระบุสังกัด (ถ้ามี)" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm mb-20">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">รายละเอียดการเข้าพบ</h2>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">ประเภทการมาติดต่อ</label>
                                <select className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary">
                                    <option>ติดต่อราชการ</option>
                                    <option>ประชุม</option>
                                    <option>ส่งของ</option>
                                    <option>อื่นๆ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">ผู้พบ</label>
                                <Input placeholder="ค้นหาชื่อเจ้าหน้าที่..." leftIcon={<User size={16} />} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วัตถุประสงค์</label>
                                <div className="flex gap-2 mb-2">
                                    <BadgeButton label="ยื่นเอกสาร" />
                                    <BadgeButton label="ชำระค่าธรรมเนียม" />
                                    <BadgeButton label="ติดตามเรื่อง" />
                                </div>
                                <Input placeholder="ระบุเพิ่มเติม..." />
                            </div>
                            <div>
                                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">พื้นที่เข้าพบ</label>
                                <select className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary">
                                    <option>ชั้น 1 ประชาสัมพันธ์</option>
                                    <option>ชั้น 3 สำนักนโยบาย</option>
                                    <option>ห้องประชุม 201</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Preview & Action */}
                <div className="flex flex-col gap-6">
                    <Card className="flex-1 border-none shadow-md overflow-hidden bg-white flex flex-col">
                        <div className="bg-primary/5 p-3 text-center border-b border-primary/10">
                            <span className="text-xs font-bold text-primary tracking-wider">VISIT SLIP PREVIEW</span>
                        </div>
                        <CardContent className="flex-1 p-6 flex flex-col items-center">
                            {/* Photo Placeholder */}
                            <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-4 cursor-pointer hover:bg-gray-200 transition-colors group relative overflow-hidden">
                                <Camera size={32} className="text-gray-400 group-hover:text-primary mb-2" />
                                <span className="text-xs text-gray-500 group-hover:text-primary">ถ่ายรูปผู้ติดต่อ</span>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="text-center pb-4 border-b border-dashed border-gray-300">
                                    <h3 className="text-lg font-bold text-gray-800">รอระบุชื่อ...</h3>
                                    <p className="text-xs text-text-secondary">X-XXXX-XXXXX-XX-X</p>
                                </div>
                                <PreviewRow icon={<Building size={14} />} label="ประเภท" value="ติดต่อราชการ" />
                                <PreviewRow icon={<User size={14} />} label="พบ" value="-" />
                                <PreviewRow icon={<Clock size={14} />} label="เวลา" value="14:45 (Now)" />
                                <PreviewRow icon={<MapPin size={14} />} label="พื้นที่" value="-" />
                            </div>

                            <div className="mt-auto w-full pt-6">
                                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center h-32 mb-2">
                                    <span className="text-xs text-gray-400">QR Code Area</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <Button fullWidth variant="secondary" className="h-14 text-lg shadow-md">
                            <CheckCircle className="mr-2" />
                            Check-in & Print Slip
                        </Button>
                        <Button fullWidth variant="ghost" className="text-gray-500">
                            ยกเลิก
                        </Button>
                    </div>
                </div>

            </main>
        </>
    );
}

function BadgeButton({ label }: { label: string }) {
    return (
        <button className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20">
            {label}
        </button>
    )
}

function PreviewRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
                {icon}
                <span>{label}</span>
            </div>
            <span className="font-bold text-gray-800">{value}</span>
        </div>
    )
}
