"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, ChevronRight, Check, Clock, Users, Briefcase, FileText, Wrench, MoreHorizontal, User, Search, MapPin, Building2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRichMenu } from "@/components/mobile/RichMenuContext";
import { staffMembers, visitPurposeConfigs, getDepartmentLocation } from "@/lib/mock-data";

// Visit types rendered from visitPurposeConfigs — filter showOnLine (LINE OA channel)
const visitTypes = visitPurposeConfigs
    .filter((c) => c.isActive && c.showOnLine)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
        id: String(c.id),
        icon: <span className="text-2xl">{c.icon}</span>,
        label: c.name,
        desc: c.nameEn,
    }));

// March 2026 calendar helper
const MARCH_2026_OFFSET = 6; // March 1, 2026 = Sunday (col index 0)
const MARCH_2026_DAYS = 31;
const TODAY = 10;

const timeSlots = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];

export default function BookingPage() {
    const router = useRouter();
    const { isMenuOpen } = useRichMenu();
    const [step, setStep] = useState(1);

    // Step 1
    const [selectedType, setSelectedType] = useState<string | null>(null);
    // Step 2
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [timeStart, setTimeStart] = useState("10:00");
    const [timeEnd, setTimeEnd] = useState("11:00");
    const [hostSearch, setHostSearch] = useState("");
    const [selectedHost, setSelectedHost] = useState<typeof staffMembers[0] | null>(null);
    // Step 3
    const [companions, setCompanions] = useState(0);
    const [phone, setPhone] = useState("081-302-5678");
    const [email, setEmail] = useState("");
    const [purpose, setPurpose] = useState("");
    const [equipmentName, setEquipmentName] = useState("");
    const [equipmentQty, setEquipmentQty] = useState("");
    const [notes, setNotes] = useState("");
    // Step 4
    const [agreed, setAgreed] = useState(false);

    const totalSteps = 4;
    const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
    const prevStep = () => {
        if (step === 1) router.back();
        else setStep((prev) => Math.max(prev - 1, 1));
    };

    // Can proceed logic
    const canProceed = () => {
        if (step === 1) return !!selectedType;
        if (step === 2) return !!selectedDate && !!selectedHost;
        if (step === 3) return true;
        if (step === 4) return agreed;
        return false;
    };

    // Host search results
    const filteredHosts = hostSearch.length >= 1
        ? staffMembers.filter(s =>
            s.role !== "security" && (
                s.name.includes(hostSearch) ||
                s.nameEn.toLowerCase().includes(hostSearch.toLowerCase()) ||
                s.department.name.includes(hostSearch)
            )
        )
        : [];

    const getTypeName = () => visitTypes.find(t => t.id === selectedType)?.label ?? "";
    const getDateStr = () => selectedDate ? `${selectedDate} มีนาคม 2569` : "";

    return (
        <div className="min-h-full bg-bg pb-24">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevStep} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={24} className="text-primary" />
                    </button>
                    <h1 className="text-lg font-bold text-primary">บันทึกนัดหมาย</h1>
                    <div className="w-10"></div>
                </div>
                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-text-secondary">
                        <span>ขั้นตอนที่ {step}</span>
                        <span>{totalSteps}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className={cn(
                                "flex-1 transition-all duration-300",
                                s < step ? "bg-primary" : s === step ? "bg-accent" : "bg-transparent"
                            )} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="p-5">
                {step === 1 && (
                    <Step1SelectType selected={selectedType} onSelect={setSelectedType} />
                )}
                {step === 2 && (
                    <Step2DateTime
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        timeStart={timeStart}
                        onTimeStartChange={setTimeStart}
                        timeEnd={timeEnd}
                        onTimeEndChange={setTimeEnd}
                        hostSearch={hostSearch}
                        onHostSearchChange={setHostSearch}
                        filteredHosts={filteredHosts}
                        selectedHost={selectedHost}
                        onSelectHost={(h) => { setSelectedHost(h); setHostSearch(""); }}
                        onClearHost={() => setSelectedHost(null)}
                    />
                )}
                {step === 3 && (
                    <Step3Details
                        companions={companions}
                        onCompanionsChange={setCompanions}
                        phone={phone}
                        onPhoneChange={setPhone}
                        email={email}
                        onEmailChange={setEmail}
                        purpose={purpose}
                        onPurposeChange={setPurpose}
                        equipmentName={equipmentName}
                        onEquipmentNameChange={setEquipmentName}
                        equipmentQty={equipmentQty}
                        onEquipmentQtyChange={setEquipmentQty}
                        notes={notes}
                        onNotesChange={setNotes}
                    />
                )}
                {step === 4 && (
                    <Step4Confirm
                        typeName={getTypeName()}
                        dateStr={getDateStr()}
                        timeStart={timeStart}
                        timeEnd={timeEnd}
                        host={selectedHost}
                        companions={companions}
                        phone={phone}
                        email={email}
                        purpose={purpose}
                        equipmentName={equipmentName}
                        equipmentQty={equipmentQty}
                        notes={notes}
                        agreed={agreed}
                        onAgreeChange={setAgreed}
                    />
                )}
            </div>

            {/* Footer Action */}
            <div
                className="fixed left-0 right-0 p-4 bg-white border-t border-border z-20 transition-all duration-300"
                style={{ bottom: isMenuOpen ? "200px" : "40px" }}
            >
                <div className="max-w-[480px] mx-auto">
                    {step < 4 ? (
                        <Button fullWidth variant="secondary" onClick={nextStep} disabled={!canProceed()}>
                            ถัดไป <ChevronRight size={18} className="ml-1" />
                        </Button>
                    ) : (
                        <Link href="/mobile/booking-status">
                            <Button fullWidth variant="secondary" disabled={!agreed}>
                                ยืนยันและส่งคำขอ
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

// ===== Step 1 =====

function Step1SelectType({ selected, onSelect }: { selected: string | null; onSelect: (v: string) => void }) {
    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold text-primary mb-2">เลือกประเภทการเข้าพบ</h2>
            {visitTypes.map((type) => (
                <div
                    key={type.id}
                    onClick={() => onSelect(type.id)}
                    className={cn(
                        "flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer bg-white shadow-sm",
                        selected === type.id ? "border-primary bg-primary-50" : "border-border hover:border-primary/50"
                    )}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors",
                        selected === type.id ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    )}>
                        {type.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-text-primary">{type.label}</h3>
                        <p className="text-xs text-text-secondary">{type.desc}</p>
                    </div>
                    {selected === type.id && <Check size={24} className="text-accent" />}
                </div>
            ))}
        </div>
    );
}

// ===== Step 2 =====

function Step2DateTime({
    selectedDate, onSelectDate,
    timeStart, onTimeStartChange,
    timeEnd, onTimeEndChange,
    hostSearch, onHostSearchChange,
    filteredHosts, selectedHost,
    onSelectHost, onClearHost,
}: {
    selectedDate: number | null; onSelectDate: (d: number) => void;
    timeStart: string; onTimeStartChange: (v: string) => void;
    timeEnd: string; onTimeEndChange: (v: string) => void;
    hostSearch: string; onHostSearchChange: (v: string) => void;
    filteredHosts: typeof staffMembers;
    selectedHost: typeof staffMembers[0] | null;
    onSelectHost: (h: typeof staffMembers[0]) => void;
    onClearHost: () => void;
}) {
    const emptySlots = MARCH_2026_OFFSET; // Sunday = 0 slots before day 1
    const dayHeaders = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

    return (
        <div className="space-y-5">
            <h2 className="text-xl font-bold text-primary">เลือกวันและเวลา</h2>

            {/* Calendar — March 2026 */}
            <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <button className="p-1"><ChevronLeft size={18} className="text-text-muted" /></button>
                    <span className="font-bold text-base">มีนาคม 2569</span>
                    <button className="p-1"><ChevronRight size={18} className="text-text-muted" /></button>
                </div>
                <div className="grid grid-cols-7 text-center text-[11px] text-text-muted mb-2">
                    {dayHeaders.map(d => <span key={d} className="py-1">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                    {Array.from({ length: emptySlots }).map((_, i) => <span key={`e-${i}`} />)}
                    {Array.from({ length: MARCH_2026_DAYS }, (_, i) => i + 1).map(d => {
                        const isPast = d < TODAY;
                        const isToday = d === TODAY;
                        const isSelected = selectedDate === d;
                        const isWeekend = (d + emptySlots - 1) % 7 === 0 || (d + emptySlots - 1) % 7 === 6;
                        return (
                            <button
                                key={d}
                                onClick={() => !isPast && onSelectDate(d)}
                                disabled={isPast}
                                className={cn(
                                    "mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors",
                                    isSelected ? "bg-primary text-white font-bold shadow-md" :
                                    isToday ? "bg-accent/20 text-accent font-bold ring-1 ring-accent/40" :
                                    isPast ? "text-gray-300 cursor-not-allowed" :
                                    isWeekend ? "text-error/60 hover:bg-error/5" :
                                    "hover:bg-gray-100"
                                )}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>
                {selectedDate && (
                    <div className="mt-3 pt-3 border-t border-border text-center">
                        <span className="text-sm font-medium text-primary">
                            เลือกวันที่ {selectedDate} มีนาคม 2569
                        </span>
                    </div>
                )}
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">เวลาเริ่ม</label>
                    <div className="relative">
                        <select
                            value={timeStart}
                            onChange={(e) => onTimeStartChange(e.target.value)}
                            className="w-full h-12 pl-10 pr-3 rounded-xl border border-border bg-white appearance-none text-sm font-medium"
                        >
                            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Clock className="absolute left-3 top-3.5 text-text-muted" size={18} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">เวลาสิ้นสุด</label>
                    <div className="relative">
                        <select
                            value={timeEnd}
                            onChange={(e) => onTimeEndChange(e.target.value)}
                            className="w-full h-12 pl-10 pr-3 rounded-xl border border-border bg-white appearance-none text-sm font-medium"
                        >
                            {timeSlots.filter(t => t > timeStart).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Clock className="absolute left-3 top-3.5 text-text-muted" size={18} />
                    </div>
                </div>
            </div>

            {/* Host Search */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary">เจ้าหน้าที่ผู้รับพบ</label>
                {selectedHost ? (
                    <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <User size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-primary">{selectedHost.name}</p>
                            <p className="text-[11px] text-text-muted truncate">{selectedHost.position} • {selectedHost.department.name}</p>
                        </div>
                        <button onClick={onClearHost} className="text-xs text-primary font-bold px-2 py-1 hover:bg-primary/10 rounded-lg">
                            เปลี่ยน
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <Input
                            placeholder="ค้นหาชื่อเจ้าหน้าที่ หรือหน่วยงาน"
                            leftIcon={<Search size={18} />}
                            value={hostSearch}
                            onChange={(e) => onHostSearchChange(e.target.value)}
                        />
                        {filteredHosts.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-30 max-h-[240px] overflow-y-auto">
                                {filteredHosts.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => onSelectHost(s)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-border last:border-0 text-left"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <User size={16} className="text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-text-primary">{s.name}</p>
                                            <p className="text-[11px] text-text-muted truncate">{s.position}</p>
                                            <p className="text-[10px] text-text-muted">{s.department.name} • {(() => { const loc = getDepartmentLocation(s.department.id); return loc ? `${loc.building} ${loc.floor}` : ""; })()}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {hostSearch.length >= 1 && filteredHosts.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-30 p-4 text-center">
                                <p className="text-sm text-text-muted">ไม่พบเจ้าหน้าที่ที่ค้นหา</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== Step 3 =====

function Step3Details({
    companions, onCompanionsChange,
    phone, onPhoneChange,
    email, onEmailChange,
    purpose, onPurposeChange,
    equipmentName, onEquipmentNameChange,
    equipmentQty, onEquipmentQtyChange,
    notes, onNotesChange,
}: {
    companions: number; onCompanionsChange: (v: number) => void;
    phone: string; onPhoneChange: (v: string) => void;
    email: string; onEmailChange: (v: string) => void;
    purpose: string; onPurposeChange: (v: string) => void;
    equipmentName: string; onEquipmentNameChange: (v: string) => void;
    equipmentQty: string; onEquipmentQtyChange: (v: string) => void;
    notes: string; onNotesChange: (v: string) => void;
}) {
    return (
        <div className="space-y-5">
            <h2 className="text-xl font-bold text-primary">รายละเอียดเพิ่มเติม</h2>

            {/* Companions + Contact */}
            <div className="bg-white p-4 rounded-xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text-primary text-sm">จำนวนผู้ติดตาม</label>
                        <p className="text-[11px] text-text-muted">ไม่รวมตัวผู้นัดหมาย</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onCompanionsChange(Math.max(0, companions - 1))}
                            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                        >
                            <Minus size={16} />
                        </button>
                        <span className="font-bold text-lg w-6 text-center">{companions}</span>
                        <button
                            onClick={() => onCompanionsChange(Math.min(10, companions + 1))}
                            className="w-9 h-9 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/5 active:scale-95 transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <Input
                    label="หมายเลขโทรศัพท์"
                    placeholder="0XX-XXX-XXXX"
                    type="tel"
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                />
                <Input
                    label="อีเมล (ถ้ามี)"
                    placeholder="example@email.com"
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                />
                <div>
                    <label className="block text-xs font-medium uppercase text-text-secondary mb-1">วัตถุประสงค์</label>
                    <textarea
                        className="w-full rounded-xl border border-border p-3 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="ระบุวัตถุประสงค์การเข้าพบ..."
                        value={purpose}
                        onChange={(e) => onPurposeChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Equipment */}
            <div className="bg-white p-4 rounded-xl border border-border space-y-3">
                <h3 className="font-medium text-sm text-text-primary">อุปกรณ์นำเข้าพื้นที่</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                        <Input
                            placeholder="ชื่ออุปกรณ์ เช่น โน้ตบุ๊ก"
                            value={equipmentName}
                            onChange={(e) => onEquipmentNameChange(e.target.value)}
                        />
                    </div>
                    <Input
                        placeholder="จำนวน"
                        type="number"
                        value={equipmentQty}
                        onChange={(e) => onEquipmentQtyChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-xs font-medium uppercase text-text-secondary mb-1">หมายเหตุ</label>
                <textarea
                    className="w-full rounded-xl border border-border p-3 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="ระบุหมายเหตุ (ถ้ามี)..."
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                />
            </div>
        </div>
    );
}

// ===== Step 4 =====

function Step4Confirm({
    typeName, dateStr, timeStart, timeEnd,
    host, companions, phone, email, purpose,
    equipmentName, equipmentQty,
    notes, agreed, onAgreeChange,
}: {
    typeName: string; dateStr: string; timeStart: string; timeEnd: string;
    host: typeof staffMembers[0] | null;
    companions: number; phone: string; email: string; purpose: string;
    equipmentName: string; equipmentQty: string;
    notes: string; agreed: boolean; onAgreeChange: (v: boolean) => void;
}) {
    return (
        <div className="space-y-5">
            <h2 className="text-xl font-bold text-primary">ตรวจสอบข้อมูล</h2>

            <Card className="border-l-4 border-l-primary overflow-hidden">
                {/* Date/Time header */}
                <div className="bg-primary/5 p-4 border-b border-border">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">{dateStr}</span>
                        <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-lg">{timeStart} - {timeEnd}</span>
                    </div>
                </div>

                <div className="p-4 space-y-2.5">
                    <DetailRow label="ประเภท" value={typeName} />
                    {host && (
                        <>
                            <DetailRow label="ผู้รับพบ" value={host.name} />
                            <DetailRow label="แผนก/ฝ่าย" value={host.department.name} />
                            <DetailRow label="สถานที่" value={(() => { const loc = getDepartmentLocation(host.department.id); return loc ? `${loc.building} ${loc.floor}` : "-"; })()} />
                        </>
                    )}
                    <div className="border-t border-border my-2" />
                    <DetailRow label="ผู้ติดตาม" value={companions > 0 ? `${companions} คน` : "ไม่มี"} />
                    <DetailRow label="เบอร์โทร" value={phone || "-"} />
                    {email && <DetailRow label="อีเมล" value={email} />}
                    {purpose && <DetailRow label="วัตถุประสงค์" value={purpose} />}
                    {equipmentName && (
                        <>
                            <div className="border-t border-border my-2" />
                            <DetailRow label="อุปกรณ์" value={`${equipmentName} × ${equipmentQty || 1}`} />
                        </>
                    )}
                    {notes && (
                        <>
                            <div className="border-t border-border my-2" />
                            <DetailRow label="หมายเหตุ" value={notes} />
                        </>
                    )}
                </div>
            </Card>

            {/* Agreement */}
            <div
                onClick={() => onAgreeChange(!agreed)}
                className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                    agreed ? "bg-[#06C755]/5 border-[#06C755]/30" : "bg-accent/5 border-accent/20"
                )}
            >
                <div className={cn(
                    "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    agreed ? "bg-[#06C755] border-[#06C755]" : "border-gray-300 bg-white"
                )}>
                    {agreed && <Check size={12} className="text-white" />}
                </div>
                <p className="text-sm text-text-primary leading-snug">
                    ข้าพเจ้ายืนยันว่าข้อมูลข้างต้นถูกต้อง และยินยอมให้บันทึกข้อมูลเพื่อการรักษาความปลอดภัย
                </p>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-text-secondary text-sm flex-shrink-0">{label}</span>
            <span className="text-text-primary font-bold text-sm text-right">{value}</span>
        </div>
    );
}
