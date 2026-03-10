"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { LogOut, Scan, Search, Printer, UserPlus, CreditCard, ChevronRight, AlertCircle, RefreshCw, Loader2, CheckCircle2, Calendar, Users, MapPin, Clock, Building, Check, X } from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import VmsLogo from "@/components/ui/VmsLogo";

// ข้อมูลจำลองบัตรประชาชน
const MOCK_ID_CARDS = [
    { firstName: "พุทธิพงษ์", lastName: "คาดสนิท", idNumber: "1100100234567" },
    { firstName: "สมหญิง", lastName: "รักสุข", idNumber: "1101400789012" },
    { firstName: "วิชัย", lastName: "มั่นคง", idNumber: "3100500345678" },
    { firstName: "อัญชลี", lastName: "แสงทอง", idNumber: "1500700901234" },
    { firstName: "ประยุทธ์", lastName: "ศรีสุข", idNumber: "1102003456789" },
    { firstName: "นภาพร", lastName: "วงศ์สวัสดิ์", idNumber: "1200800567890" },
    { firstName: "ธนกร", lastName: "เจริญสุข", idNumber: "1409900123456" },
    { firstName: "พิมพ์ใจ", lastName: "สว่างวงศ์", idNumber: "1301200678901" },
];

// ข้อมูลนัดหมายจำลอง
const MOCK_APPOINTMENTS = [
    {
        id: "APT-001",
        visitorName: "นายวิชัย มั่นคง",
        idNumber: "3100500345678",
        host: "คุณสมศรี รักงาน",
        hostRole: "ผู้อำนวยการกองกิจการท่องเที่ยว",
        department: "สำนักงานปลัดกระทรวง ชั้น 3",
        purpose: "ประชุมหารือโครงการส่งเสริมการท่องเที่ยว",
        time: "09:00 - 10:30",
        status: "รอเข้าพบ",
    },
    {
        id: "APT-002",
        visitorName: "นางอัญชลี แสงทอง",
        idNumber: "1500700901234",
        host: "คุณประเสริฐ ศรีวิไล",
        hostRole: "หัวหน้ากลุ่มงานบริหารทั่วไป",
        department: "กองกลาง ชั้น 2",
        purpose: "ยื่นเอกสารสัญญาจ้าง",
        time: "10:00 - 11:00",
        status: "รอเข้าพบ",
    },
    {
        id: "APT-003",
        visitorName: "Mr. James Wilson",
        idNumber: "AA7890123",
        host: "คุณนภาพร วงศ์สวัสดิ์",
        hostRole: "ผู้เชี่ยวชาญด้านต่างประเทศ",
        department: "กองการต่างประเทศ ชั้น 5",
        purpose: "Meeting - International Tourism Cooperation",
        time: "13:00 - 14:30",
        status: "รอเข้าพบ",
    },
];

type CardReaderStatus = 'idle' | 'reading' | 'success';
type CheckinMode = 'walkin' | 'appointment';

export default function CounterDashboard() {
    const [activeTab, setActiveTab] = useState<'checkin' | 'checkout'>('checkin');
    const [checkinMode, setCheckinMode] = useState<CheckinMode>('walkin');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [cardReaderStatus, setCardReaderStatus] = useState<CardReaderStatus>('idle');
    const [passportReaderStatus, setPassportReaderStatus] = useState<CardReaderStatus>('idle');
    const [hasReadOnce, setHasReadOnce] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState<{ name: string; slip: string; type: string } | null>(null);

    // Identity Verification (Appointment)
    const [identityType, setIdentityType] = useState<'thai_id' | 'passport'>('thai_id');
    const [passportCheckStatus, setPassportCheckStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
    const [passportReaderMode, setPassportReaderMode] = useState(false);

    // Appointment states
    const [appointmentSearch, setAppointmentSearch] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState<typeof MOCK_APPOINTMENTS[0] | null>(null);

    // Live clock
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const filteredAppointments = MOCK_APPOINTMENTS.filter(a =>
        a.visitorName.includes(appointmentSearch) ||
        a.idNumber.includes(appointmentSearch) ||
        a.host.includes(appointmentSearch) ||
        a.id.toLowerCase().includes(appointmentSearch.toLowerCase())
    );

    const handleReadCard = useCallback(() => {
        if (cardReaderStatus === 'reading') return;
        setCardReaderStatus('reading');
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * MOCK_ID_CARDS.length);
            const mockData = MOCK_ID_CARDS[randomIndex];
            setFirstName(mockData.firstName);
            setLastName(mockData.lastName);
            setIdNumber(mockData.idNumber);
            setCardReaderStatus('success');
            setHasReadOnce(true);
            setTimeout(() => { setCardReaderStatus('idle'); }, 2000);
        }, 1500);
    }, [cardReaderStatus]);

    const handleReadPassport = useCallback(() => {
        if (passportReaderStatus === 'reading') return;
        setPassportReaderStatus('reading');
        setTimeout(() => {
            setPassportReaderStatus('success');
            setPassportCheckStatus('verified');
            setTimeout(() => { setPassportReaderStatus('idle'); }, 2000);
        }, 1500);
    }, [passportReaderStatus]);

    const handleReset = useCallback(() => {
        setFirstName('');
        setLastName('');
        setIdNumber('');
        setCardReaderStatus('idle');
        setPassportReaderStatus('idle');
        setHasReadOnce(false);
        setSelectedAppointment(null);
        setAppointmentSearch('');
        setIdentityType('thai_id');
        setPassportCheckStatus('pending');
        setPassportReaderMode(false);
    }, []);

    const handleSave = useCallback(() => {
        const slip = `VMS-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        if (checkinMode === 'walkin') {
            setSuccessData({ name: `${firstName} ${lastName}`, slip, type: 'Walk-in' });
        } else if (selectedAppointment) {
            setSuccessData({ name: selectedAppointment.visitorName, slip, type: 'นัดหมาย' });
        }
        setShowSuccess(true);
    }, [checkinMode, firstName, lastName, selectedAppointment]);

    const handleCloseSuccess = useCallback(() => {
        setShowSuccess(false);
        setSuccessData(null);
        handleReset();
    }, [handleReset]);

    const getCardReaderStyles = () => {
        switch (cardReaderStatus) {
            case 'reading': return 'bg-amber-50 border-amber-400 text-amber-700';
            case 'success': return 'bg-emerald-50 border-emerald-400 text-emerald-700';
            default: return 'bg-primary-50 border-primary/30 text-primary hover:bg-primary-100';
        }
    };

    const getPassportReaderStyles = () => {
        switch (passportReaderStatus) {
            case 'reading': return 'bg-amber-50 border-amber-400 text-amber-700';
            case 'success': return 'bg-emerald-50 border-emerald-400 text-emerald-700';
            default: return 'bg-primary-50 border-primary/30 text-primary hover:bg-primary-100';
        }
    };

    const canSaveWalkin = firstName.trim() && lastName.trim() && idNumber.trim();
    const isAppointmentVerified = identityType === 'thai_id'
        ? cardReaderStatus === 'success'
        : passportCheckStatus === 'verified';

    return (
        <div className="min-h-screen flex flex-col bg-bg">
            {/* Header */}
            <header className="h-16 bg-gradient-to-r from-primary-900 to-primary text-white flex justify-between items-center px-6 shadow-lg">
                <div className="flex items-center gap-3">
                    <VmsLogo size={42} darkMode />
                    <div>
                        <h1 className="font-bold leading-tight text-sm">
                            VMS — ป้อมยาม 1
                        </h1>
                        <p className="text-xs text-white/60">เจ้าหน้าที่: สมชาย มั่งมี</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xl font-mono font-bold leading-none">{time}</p>
                        <p className="text-xs text-white/60">{date}</p>
                    </div>
                    <Link href="/counter">
                        <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
                            <LogOut size={20} />
                        </button>
                    </Link>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-100 px-6 pt-2 flex gap-4 sticky top-0 z-10 shadow-sm">
                <button
                    onClick={() => setActiveTab('checkin')}
                    className={`pb-3 px-4 text-sm font-bold border-b-3 transition-colors flex items-center gap-2 ${activeTab === 'checkin' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-primary'}`}
                >
                    <UserPlus size={18} />
                    ลงทะเบียนเข้า (Check-in)
                </button>
                <button
                    onClick={() => setActiveTab('checkout')}
                    className={`pb-3 px-4 text-sm font-bold border-b-3 transition-colors flex items-center gap-2 ${activeTab === 'checkout' ? 'border-error text-error' : 'border-transparent text-text-secondary hover:text-error'}`}
                >
                    <LogOut size={18} />
                    ลงทะเบียนออก (Check-out)
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 overflow-auto flex flex-col items-center">

                {activeTab === 'checkin' ? (
                    <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-6">
                        {/* Left: Input Form */}
                        <Card className="flex flex-col border-0 shadow-lg overflow-hidden rounded-2xl">
                            {/* Toggle: Walk-in / Appointment */}
                            <div className="bg-gradient-to-r from-primary-50 to-white p-3 border-b border-primary-100">
                                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                                    <button
                                        onClick={() => { setCheckinMode('walkin'); handleReset(); }}
                                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${checkinMode === 'walkin' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'}`}
                                    >
                                        <UserPlus size={16} />
                                        Walk-in (ไม่มีนัด)
                                    </button>
                                    <button
                                        onClick={() => { setCheckinMode('appointment'); handleReset(); }}
                                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${checkinMode === 'appointment' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'}`}
                                    >
                                        <Calendar size={16} />
                                        มีนัดหมาย (Appointment)
                                    </button>
                                </div>
                            </div>

                            {/* Card Header */}
                            <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-bold text-primary flex items-center gap-2 text-sm">
                                    <CreditCard size={18} />
                                    {checkinMode === 'walkin' ? 'ข้อมูลผู้ติดต่อ (Walk-in)' : 'ค้นหานัดหมาย'}
                                </h2>
                                <Button size="sm" variant="outline" className="h-7 text-xs border-primary/30 text-primary rounded-lg" onClick={handleReset}>
                                    <RefreshCw size={12} className="mr-1" />
                                    Reset
                                </Button>
                            </div>

                            <CardContent className="flex-1 p-5 space-y-5 overflow-y-auto">
                                {checkinMode === 'walkin' ? (
                                    <>
                                        {/* Card Reader Area */}
                                        <div
                                            onClick={handleReadCard}
                                            className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${getCardReaderStyles()}`}
                                        >
                                            {cardReaderStatus === 'reading' ? (
                                                <>
                                                    <Loader2 size={40} className="mb-2 animate-spin text-amber-500" />
                                                    <span className="font-bold text-amber-700 text-sm">กำลังอ่านข้อมูลจากบัตร...</span>
                                                    <span className="text-xs text-amber-500">(Reading Smart Card...)</span>
                                                </>
                                            ) : cardReaderStatus === 'success' ? (
                                                <>
                                                    <CheckCircle2 size={40} className="mb-2 text-emerald-500" />
                                                    <span className="font-bold text-emerald-700 text-sm">อ่านข้อมูลสำเร็จ!</span>
                                                    <span className="text-xs text-emerald-500">(Card Read Successfully)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard size={40} className="mb-2 text-primary-400" />
                                                    <span className="font-bold text-primary-700 text-sm">
                                                        {hasReadOnce ? 'คลิกเพื่ออ่านบัตรอีกครั้ง' : 'เสียบบัตรประชาชนเพื่ออ่านข้อมูล'}
                                                    </span>
                                                    <span className="text-xs text-primary-400">
                                                        {hasReadOnce ? '(Click to Read Again)' : '(Smart Card Reader Ready)'}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Input label="ชื่อ" placeholder="-" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                            <Input label="นามสกุล" placeholder="-" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                            <div className="col-span-2">
                                                <Input label="เลขบัตรประชาชน" placeholder="-" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-dashed border-gray-200">
                                            <h3 className="text-xs font-bold text-primary mb-3">ข้อมูลการติดต่อ</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-text-secondary">ประเภท</label>
                                                    <select className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm mt-1 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none">
                                                        <option>ติดต่อราชการ</option>
                                                        <option>ส่งของ</option>
                                                        <option>ผู้รับเหมา</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-text-secondary">ทะเบียนรถ</label>
                                                    <Input placeholder="เช่น กก 1234" className="mt-1" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-xs font-semibold text-text-secondary">ผู้ที่มาพบ / หน่วยงาน</label>
                                                    <Input placeholder="ค้นหาหน่วยงาน..." className="mt-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Appointment Search */}
                                        <div className="relative">
                                            <Input
                                                placeholder="ค้นหาด้วยชื่อ, เลขบัตร, รหัสนัด..."
                                                value={appointmentSearch}
                                                onChange={(e) => setAppointmentSearch(e.target.value)}
                                                leftIcon={<Search size={16} />}
                                            />
                                        </div>

                                        {/* Appointment List */}
                                        <div className="space-y-3">
                                            {filteredAppointments.length === 0 ? (
                                                <div className="text-center py-8 text-text-muted">
                                                    <Calendar size={40} className="mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm">ไม่พบนัดหมาย</p>
                                                </div>
                                            ) : (
                                                filteredAppointments.map((apt) => (
                                                    <div
                                                        key={apt.id}
                                                        onClick={() => setSelectedAppointment(apt)}
                                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedAppointment?.id === apt.id
                                                            ? 'border-primary bg-primary-50 shadow-md'
                                                            : 'border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="bg-primary text-white text-[10px] px-2 py-0.5">{apt.id}</Badge>
                                                                <span className="font-bold text-sm text-text-primary">{apt.visitorName}</span>
                                                            </div>
                                                            {selectedAppointment?.id === apt.id && (
                                                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                                                                    <Check size={14} strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5 text-xs text-text-secondary">
                                                            <div className="flex items-center gap-2">
                                                                <Users size={12} className="text-primary/60 shrink-0" />
                                                                <span>พบ: <strong>{apt.host}</strong> — {apt.hostRole}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <MapPin size={12} className="text-primary/60 shrink-0" />
                                                                <span>{apt.department}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={12} className="text-primary/60 shrink-0" />
                                                                <span>{apt.time}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Selected Appointment Detail */}
                                        {selectedAppointment && (
                                            <div className="space-y-4">
                                                <div className="bg-primary-50 border border-primary/20 rounded-xl p-4 space-y-2">
                                                    <h4 className="text-xs font-bold text-primary">รายละเอียดนัดหมาย</h4>
                                                    <div className="text-xs text-text-secondary space-y-1">
                                                        <p><strong>วัตถุประสงค์:</strong> {selectedAppointment.purpose}</p>
                                                        <p><strong>ผู้มาติดต่อ:</strong> {selectedAppointment.visitorName} ({selectedAppointment.idNumber})</p>
                                                        <p><strong>สถานที่:</strong> {selectedAppointment.department}</p>
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Right: Actions & Preview */}
                        <div className="flex flex-col gap-4">
                            {checkinMode === 'appointment' && selectedAppointment && (
                                <Card className="border-0 shadow-lg p-5 bg-white space-y-4 rounded-2xl">
                                    <h4 className="text-sm font-bold text-primary mb-3 text-center">การยืนยันตัวตน (Identity Verification)</h4>
                                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4">
                                        <button
                                            onClick={() => { setIdentityType('thai_id'); setPassportCheckStatus('pending'); }}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${identityType === 'thai_id' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'}`}
                                        >
                                            บัตรประชาชน (Thai ID)
                                        </button>
                                        <button
                                            onClick={() => { setIdentityType('passport'); setCardReaderStatus('idle'); }}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${identityType === 'passport' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'}`}
                                        >
                                            พาสปอร์ต (Passport)
                                        </button>
                                    </div>

                                    {identityType === 'thai_id' && (
                                        <div
                                            onClick={handleReadCard}
                                            className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${getCardReaderStyles()}`}
                                        >
                                            {cardReaderStatus === 'reading' ? (
                                                <>
                                                    <Loader2 size={32} className="mb-2 animate-spin text-amber-500" />
                                                    <span className="font-bold text-amber-700 text-xs">กำลังอ่านข้อมูลจากบัตร...</span>
                                                </>
                                            ) : cardReaderStatus === 'success' ? (
                                                <>
                                                    <CheckCircle2 size={32} className="mb-2 text-emerald-500" />
                                                    <span className="font-bold text-emerald-700 text-xs">อ่านข้อมูลและยืนยันตัวตนสำเร็จ!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard size={32} className="mb-2 text-primary-400" />
                                                    <span className="font-bold text-primary-700 text-xs">
                                                        เสียบบัตรประชาชนเพื่อยืนยัน
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {identityType === 'passport' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-text-secondary">วิธีตรวจสอบ:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs ${!passportReaderMode ? 'text-primary font-bold' : 'text-text-muted'}`}>ตรวจสอบด้วยสายตา</span>
                                                    <button
                                                        onClick={() => { setPassportReaderMode(!passportReaderMode); setPassportCheckStatus('pending'); setPassportReaderStatus('idle'); }}
                                                        className={`w-10 h-5 rounded-full relative transition-colors ${passportReaderMode ? 'bg-primary' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${passportReaderMode ? 'left-5' : 'left-1'}`}></div>
                                                    </button>
                                                    <span className={`text-xs ${passportReaderMode ? 'text-primary font-bold' : 'text-text-muted'}`}>เครื่องอ่าน (Reader)</span>
                                                </div>
                                            </div>

                                            {passportReaderMode ? (
                                                <div
                                                    onClick={handleReadPassport}
                                                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${getPassportReaderStyles()}`}
                                                >
                                                    {passportReaderStatus === 'reading' ? (
                                                        <>
                                                            <Loader2 size={32} className="mb-2 animate-spin text-amber-500" />
                                                            <span className="font-bold text-amber-700 text-xs">กำลังสแกน Passport...</span>
                                                        </>
                                                    ) : passportReaderStatus === 'success' ? (
                                                        <>
                                                            <CheckCircle2 size={32} className="mb-2 text-emerald-500" />
                                                            <span className="font-bold text-emerald-700 text-xs">ยืนยัน Passport สำเร็จ!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Scan size={32} className="mb-2 text-primary-400" />
                                                            <span className="font-bold text-primary-700 text-xs">
                                                                วาง Passport บนเครื่องอ่าน
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                passportCheckStatus === 'verified' ? (
                                                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex flex-col items-center gap-2">
                                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                                        <p className="text-xs text-emerald-700 font-bold">ตรวจสอบด้วยสายตาเรียบร้อยแล้ว</p>
                                                    </div>
                                                ) : passportCheckStatus === 'rejected' ? (
                                                    <div className="bg-error/10 border border-error/20 p-3 rounded-xl flex flex-col items-center gap-2 text-center">
                                                        <AlertCircle size={24} className="text-error" />
                                                        <p className="text-xs text-error font-bold">ข้อมูลไม่ตรงกัน</p>
                                                        <Button size="sm" variant="outline" className="mt-1 h-7 text-[10px]" onClick={() => setPassportCheckStatus('pending')}>ตรวจสอบใหม่</Button>
                                                    </div>
                                                ) : (
                                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex flex-col items-center gap-2">
                                                        <p className="text-xs text-amber-800 text-center">กรุณาตรวจสอบชื่อ-นามสกุลใน Passport ว่าตรงกับข้อมูลนัดหมายหรือไม่ ({selectedAppointment.visitorName})</p>
                                                        <div className="flex gap-2 w-full mt-2">
                                                            <Button size="sm" variant="outline" className="flex-1 border-error text-error hover:bg-error/10 h-8 text-xs" onClick={() => setPassportCheckStatus('rejected')}>
                                                                <X size={14} className="mr-1" />
                                                                ไม่ตรง
                                                            </Button>
                                                            <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-8 text-xs" onClick={() => setPassportCheckStatus('verified')}>
                                                                <Check size={14} className="mr-1" />
                                                                ตรงกัน
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </Card>
                            )}

                            <Card className={`${checkinMode === 'appointment' && selectedAppointment ? '' : 'flex-1'} border-0 shadow-lg flex flex-col items-center justify-center p-6 bg-white space-y-4 rounded-2xl`}>
                                <div className="w-32 h-32 bg-primary-50 rounded-full flex items-center justify-center text-primary-300 mb-2">
                                    <Scan size={48} />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-text-primary">รูปถ่ายผู้ติดต่อ</h3>
                                    <p className="text-xs text-text-muted">คลิกเพื่อถ่ายภาพ</p>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 gap-3">
                                {checkinMode === 'walkin' ? (
                                    <Button
                                        fullWidth
                                        size="lg"
                                        className={`h-16 text-lg shadow-lg bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-bold transition-all ${!canSaveWalkin ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-xl'}`}
                                        disabled={!canSaveWalkin}
                                        onClick={handleSave}
                                    >
                                        <Printer size={22} className="mr-2" />
                                        บันทึก & พิมพ์บัตร
                                    </Button>
                                ) : (
                                    <Button
                                        fullWidth
                                        size="lg"
                                        className={`h-16 text-lg shadow-lg bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-bold transition-all ${(!selectedAppointment || !isAppointmentVerified) ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-xl'}`}
                                        disabled={!selectedAppointment || !isAppointmentVerified}
                                        onClick={handleSave}
                                    >
                                        <Check size={22} className="mr-2" />
                                        ยืนยัน Check-in & พิมพ์บัตร
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-3xl flex flex-col items-center justify-center h-full space-y-8">
                        <div className="w-full relative">
                            <Input
                                className="h-20 text-3xl pl-16 rounded-2xl shadow-lg border-2 border-primary/20 focus-visible:ring-4 focus-visible:ring-primary/20"
                                placeholder="สแกน QR Code หรือ Barcode บัตร..."
                                autoFocus
                            />
                            <Scan className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={32} />
                        </div>

                        <p className="text-text-muted text-lg">หรือค้นหาด้วยเลขบัตร / ทะเบียนรถ</p>

                        <div className="w-full bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
                            <div className="p-4 bg-gradient-to-r from-primary-50 to-white border-b border-primary-100 font-bold text-primary text-sm">
                                รายการล่าสุด (Live)
                            </div>
                            <div className="divide-y divide-gray-50">
                                <CheckoutRow name="นายพุทธิพงษ์ คาดสนิท" time="14:50" slip="VMS-0089" />
                                <CheckoutRow name="Ms. Sarah Connor" time="14:45" slip="VMS-0088" />
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* Success Overlay */}
            {showSuccess && successData && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-center text-white relative">
                            <button
                                onClick={handleCloseSuccess}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                                title="Close"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-2xl font-bold">ลงทะเบียนสำเร็จ!</h2>
                            <p className="text-sm text-white/80 mt-1">Check-in Completed Successfully</p>
                        </div>

                        {/* Success Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-muted">หมายเลขบัตร</span>
                                    <span className="font-mono font-bold text-primary text-lg">{successData.slip}</span>
                                </div>
                                <div className="border-t border-dashed border-gray-200"></div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-muted">ชื่อผู้ติดต่อ</span>
                                    <span className="font-bold text-text-primary">{successData.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-muted">ประเภท</span>
                                    <Badge className="bg-primary text-white">{successData.type}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-muted">เวลาเข้า</span>
                                    <span className="text-sm font-medium text-text-secondary">{time}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    fullWidth
                                    variant="outline"
                                    className="h-12 rounded-xl font-bold"
                                    onClick={handleCloseSuccess}
                                >
                                    ปิด
                                </Button>
                                <Button
                                    fullWidth
                                    className="h-12 rounded-xl font-bold bg-gradient-to-r from-primary to-primary-dark text-white"
                                    onClick={handleCloseSuccess}
                                >
                                    <Printer size={18} className="mr-2" />
                                    พิมพ์บัตรอีกครั้ง
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CheckoutRow({ name, time, slip }: { name: string, time: string, slip: string }) {
    return (
        <div className="p-4 flex justify-between items-center hover:bg-primary-50/30 transition-colors">
            <div>
                <p className="font-bold text-text-primary">{name}</p>
                <p className="text-xs text-text-muted">{slip}</p>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-text-secondary">เข้าเมื่อ {time}</span>
                <Button size="sm" variant="destructive" className="h-8 rounded-lg">Check-out</Button>
            </div>
        </div>
    )
}
