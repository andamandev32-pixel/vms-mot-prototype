"use client";

import { CreditCard, ChevronLeft, Briefcase, Users, FileText, Wrench, MoreHorizontal, Check, ChevronRight, BookOpen, Camera, RefreshCw, AlertTriangle, ShieldCheck, ClipboardList, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

const visitTypes = [
    { id: "official", icon: <Briefcase size={40} />, label: "ติดต่อราชการ", desc: "ยื่นเอกสาร, ติดต่อเจ้าหน้าที่", descEn: "Official Business" },
    { id: "meeting", icon: <Users size={40} />, label: "ประชุม", desc: "เข้าร่วมประชุมตามนัดหมาย", descEn: "Meeting" },
    { id: "delivery", icon: <FileText size={40} />, label: "รับ-ส่งเอกสาร", desc: "Messenger, ไปรษณีย์", descEn: "Document Delivery" },
    { id: "contractor", icon: <Wrench size={40} />, label: "ผู้รับเหมา / ช่าง", desc: "ซ่อมบำรุง, ติดตั้งอุปกรณ์", descEn: "Contractor / Maintenance" },
    { id: "other", icon: <MoreHorizontal size={40} />, label: "อื่นๆ", desc: "ผู้มาติดต่อทั่วไป", descEn: "Other" },
];

const stepTitles: Record<number, { th: string; en: string }> = {
    1: { th: "เลือกประเภทการเข้าพบ", en: "Select visit purpose" },
    2: { th: "ยืนยันตัวตน", en: "Identity Verification" },
    3: { th: "ตรวจสอบข้อมูล", en: "Review Information" },
    4: { th: "ถ่ายภาพใบหน้า", en: "Face Photo Capture" },
};

export default function KioskWalkInPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedIdMethod, setSelectedIdMethod] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const closeDrawer = () => setDrawerOpen(false);

    // Face capture state
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [detecting, setDetecting] = useState(false);
    const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const idMethods = [
        { id: "idcard", icon: <CreditCard size={48} />, label: "บัตรประชาชน", desc: "Thai National ID Card" },
        { id: "passport", icon: <BookOpen size={48} />, label: "หนังสือเดินทาง", desc: "Passport / Travel Document" },
    ];

    const goBack = () => {
        if (step === 1) router.push('/kiosk');
        else {
            if (step === 4) stopCamera();
            setStep(step - 1);
        }
    };

    // Camera functions
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
        } catch {
            // Camera not available — will use demo mode
            setCameraActive(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current && cameraActive) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL("image/jpeg");
                setCapturedPhoto(dataUrl);
                stopCamera();
                simulateFaceDetection();
            }
        } else {
            // Demo mode — simulate capture with countdown
            simulateDemoCapture();
        }
    }, [stopCamera, cameraActive]);

    // Simulated demo photo capture with visual countdown
    const simulateDemoCapture = () => {
        setCapturedPhoto("demo");
        simulateFaceDetection();
    };

    const simulateFaceDetection = () => {
        setDetecting(true);
        setFaceDetected(null);
        setTimeout(() => {
            setDetecting(false);
            setFaceDetected(true); // Always succeed in demo
        }, 2000);
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        setFaceDetected(null);
        setDetecting(false);
        startCamera();
    };

    // Start camera when entering Step 4 (face capture)
    useEffect(() => {
        if (step === 4 && !capturedPhoto) {
            startCamera();
        }
        return () => {
            if (step !== 4) stopCamera();
        };
    }, [step, capturedPhoto, startCamera, stopCamera]);

    return (
        <div className="flex flex-col h-screen">
            {/* Header — MOTS CI */}
            <header className="h-[100px] flex items-center px-12 shrink-0">
                <button
                    onClick={goBack}
                    className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mr-5 hover:bg-white/20 active:scale-95 transition-all"
                >
                    <ChevronLeft size={32} />
                </button>
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Emblem_of_Ministry_of_Tourism_and_Sports_of_Thailand.svg/960px-Emblem_of_Ministry_of_Tourism_and_Sports_of_Thailand.svg.png"
                    alt="MOTS"
                    className="w-[52px] h-[52px] object-contain drop-shadow-lg mr-5"
                />
                <div>
                    <h1 className="text-2xl font-bold text-white drop-shadow-md">
                        {stepTitles[step]?.th}
                    </h1>
                    <p className="text-white/50 text-sm">
                        {stepTitles[step]?.en}
                    </p>
                </div>
                {/* Step indicator — 4 steps */}
                <div className="ml-auto flex items-center gap-2">
                    <StepDot active={step >= 1} current={step === 1} label="1" />
                    <div className={cn("w-8 h-0.5", step >= 2 ? "bg-accent" : "bg-white/20")}></div>
                    <StepDot active={step >= 2} current={step === 2} label="2" />
                    <div className={cn("w-8 h-0.5", step >= 3 ? "bg-accent" : "bg-white/20")}></div>
                    <StepDot active={step >= 3} current={step === 3} label="3" />
                    <div className={cn("w-8 h-0.5", step >= 4 ? "bg-accent" : "bg-white/20")}></div>
                    <StepDot active={step >= 4} current={step === 4} label="4" />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-12 pb-8 overflow-y-auto">

                {/* ========== STEP 1: Select Visit Type ========== */}
                {step === 1 && (
                    <div className="max-w-[1100px] mx-auto grid grid-cols-1 gap-4">
                        {visitTypes.map((type) => (
                            <div
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={cn(
                                    "h-[100px] rounded-2xl flex items-center px-8 cursor-pointer transition-all duration-300 active:scale-[0.98] backdrop-blur-xl border",
                                    selectedType === type.id
                                        ? "bg-accent/20 border-accent/60 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                                        : "bg-white/[0.08] border-white/[0.15] hover:bg-white/[0.12] hover:border-white/30"
                                )}
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mr-6 transition-all",
                                    selectedType === type.id
                                        ? "bg-accent text-white shadow-lg"
                                        : "bg-white/10 text-white/80"
                                )}>
                                    {type.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white">{type.label}</h3>
                                    <p className="text-base text-white/50">{type.desc} / {type.descEn}</p>
                                </div>
                                {selectedType === type.id && (
                                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white shadow-lg animate-in zoom-in">
                                        <Check size={28} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ========== STEP 2: Select ID Method + Right Drawer ========== */}
                {step === 2 && (
                    <div className="max-w-[900px] mx-auto flex flex-col items-center justify-center h-full gap-8">
                        <p className="text-white/50 text-xl">เลือกวิธียืนยันตัวตน แล้วกดเพื่อเริ่ม</p>
                        <div className="w-full grid grid-cols-2 gap-6">
                            {idMethods.map((method) => (
                                <div
                                    key={method.id}
                                    onClick={() => {
                                        setSelectedIdMethod(method.id);
                                        setDrawerOpen(true);
                                    }}
                                    className={cn(
                                        "rounded-2xl p-8 cursor-pointer transition-all duration-300 active:scale-[0.98] backdrop-blur-xl border flex flex-col items-center text-center gap-4",
                                        selectedIdMethod === method.id
                                            ? "bg-accent/20 border-accent/60 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                                            : "bg-white/[0.08] border-white/[0.15] hover:bg-white/[0.12] hover:border-white/30"
                                    )}
                                >
                                    <div className={cn(
                                        "w-24 h-24 rounded-2xl flex items-center justify-center transition-all",
                                        selectedIdMethod === method.id
                                            ? "bg-accent text-white shadow-lg"
                                            : "bg-white/10 text-white/80"
                                    )}>
                                        {method.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">{method.label}</h3>
                                    <p className="text-base text-white/50">{method.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Right-Side Drawer for ID Verification */}
                {drawerOpen && selectedIdMethod && (
                    <div className="fixed inset-0 z-50 flex">
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={closeDrawer}
                        />
                        <div className="ml-auto relative w-[480px] h-full bg-gradient-to-b from-[#1e0a3c] via-[#2a1254] to-[#1e0a3c] border-l border-accent/20 shadow-[-10px_0_40px_rgba(106,13,173,0.3)] flex flex-col animate-in slide-in-from-right duration-300">
                            <div className="px-10 pt-10 pb-6 border-b border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-white">
                                        {selectedIdMethod === "idcard" ? "อ่านบัตรประชาชน" : "สแกนหนังสือเดินทาง"}
                                    </h2>
                                    <button
                                        onClick={closeDrawer}
                                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <p className="text-white/40 text-sm">
                                    {selectedIdMethod === "idcard" ? "Thai National ID Card" : "Passport / Travel Document"}
                                </p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center px-10 gap-8">
                                <div className="w-32 h-32 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center text-accent">
                                    {selectedIdMethod === "idcard" ? <CreditCard size={60} /> : <BookOpen size={60} />}
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-bold text-white">
                                        {selectedIdMethod === "idcard" ? "กรุณาเสียบบัตร" : "กรุณาวางพาสปอร์ต"}
                                    </h3>
                                    <p className="text-white/50 text-base">
                                        {selectedIdMethod === "idcard"
                                            ? "เสียบบัตรประชาชนที่ช่องเครื่องอ่าน"
                                            : "วางหนังสือเดินทางบนเครื่องสแกน"}
                                    </p>
                                </div>
                                <div className="w-full space-y-3">
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent animate-progress w-full origin-left rounded-full"></div>
                                    </div>
                                    <p className="text-white/30 animate-pulse text-center text-sm">รอรับข้อมูล / Waiting...</p>
                                </div>
                            </div>
                            <div className="px-10 pb-10 pt-6 border-t border-white/10 space-y-3">
                                <Button
                                    variant="kiosk"
                                    className="w-full bg-gradient-to-r from-accent to-accent-hover text-white border-0 rounded-2xl h-16 text-lg font-bold shadow-lg"
                                    onClick={() => { closeDrawer(); setStep(3); }}
                                >
                                    {selectedIdMethod === "idcard" ? "จำลองเสียบบัตร (Demo)" : "จำลองสแกน (Demo)"}
                                </Button>
                                <Button
                                    variant="kiosk"
                                    className="w-full bg-white/[0.06] border border-white/15 text-white/70 rounded-2xl h-16 text-lg font-bold hover:bg-white/10 hover:text-white transition-all"
                                    onClick={closeDrawer}
                                >
                                    เปลี่ยนวิธี / Change Method
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== STEP 3: Preview Scanned Data ========== */}
                {step === 3 && (
                    <div className="max-w-[900px] mx-auto flex flex-col items-center justify-center h-full gap-4">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] w-full shadow-2xl overflow-hidden">
                            {/* Preview Header */}
                            <div className="bg-accent/10 border-b border-accent/20 px-8 py-4 flex items-center gap-3">
                                <ClipboardList size={24} className="text-accent" />
                                <div>
                                    <h2 className="text-lg font-bold text-white">ข้อมูลที่อ่านได้จาก{selectedIdMethod === "idcard" ? "บัตรประชาชน" : "พาสปอร์ต"}</h2>
                                    <p className="text-white/50 text-xs">Data read from {selectedIdMethod === "idcard" ? "Thai ID Card" : "Passport"}</p>
                                </div>
                            </div>

                            {/* Preview Body */}
                            <div className="px-8 py-5 space-y-3">
                                {/* Visitor Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <Users size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-xs">ชื่อ-นามสกุล / Full Name</p>
                                        <p className="text-base font-bold text-white leading-tight">นายพุทธิพงษ์ คาดสนิท</p>
                                        <p className="text-white/50 text-xs">Mr. Somchai Jaidee</p>
                                    </div>
                                </div>
                                <div className="border-t border-white/10"></div>

                                {/* ID Number */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <CreditCard size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-xs">{selectedIdMethod === "idcard" ? "เลขบัตรประชาชน / ID Number" : "เลขหนังสือเดินทาง / Passport No."}</p>
                                        <p className="text-base font-bold text-white">{selectedIdMethod === "idcard" ? "1-1234-56789-01-0" : "AA1234567"}</p>
                                    </div>
                                </div>
                                <div className="border-t border-white/10"></div>

                                {/* Visit Purpose */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <Briefcase size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-xs">ประเภทการเข้าพบ / Visit Purpose</p>
                                        <p className="text-base font-bold text-white">
                                            {visitTypes.find(t => t.id === selectedType)?.label || "-"}
                                        </p>
                                        <p className="text-white/50 text-xs">
                                            {visitTypes.find(t => t.id === selectedType)?.descEn || ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t border-white/10"></div>

                                {/* Destination */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-xs">สถานที่ติดต่อ / Destination</p>
                                        <p className="text-base font-bold text-white">สำนักงานปลัดกระทรวง ชั้น 3</p>
                                        <p className="text-white/50 text-xs">Office of the Permanent Secretary, 3rd Floor</p>
                                    </div>
                                </div>
                                <div className="border-t border-white/10"></div>

                                {/* Time */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                                        <Clock size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white/40 text-xs">วันที่-เวลาเข้าพบ / Visit Time</p>
                                        <p className="text-base font-bold text-white">
                                            {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })} — {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-8 pb-6 flex gap-4">
                                <Button
                                    variant="kiosk"
                                    className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl h-14 text-lg font-bold"
                                    onClick={() => setStep(2)}
                                >
                                    <ChevronLeft size={22} className="mr-2" />
                                    ย้อนกลับ / Back
                                </Button>
                                <Button
                                    variant="kiosk"
                                    className="flex-[2] bg-gradient-to-r from-accent to-accent-hover text-white border-0 rounded-2xl h-14 text-lg font-bold shadow-xl"
                                    onClick={() => setStep(4)}
                                >
                                    ถ่ายภาพใบหน้า / Take Photo
                                    <ChevronRight size={22} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== STEP 4: Face Photo Capture ========== */}
                {step === 4 && (
                    <div className="max-w-[900px] mx-auto flex flex-col items-center justify-center h-full gap-6">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden w-full shadow-2xl">
                            {/* Camera view / Captured photo */}
                            <div className="relative aspect-[4/3] bg-black/40 flex items-center justify-center overflow-hidden">
                                {!capturedPhoto ? (
                                    <>
                                        {/* Live camera feed */}
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Face guide overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-[260px] h-[340px] border-4 border-dashed border-accent/60 rounded-[50%] relative">
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-accent/80 text-white text-sm font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                                                    วางใบหน้าในกรอบ
                                                </div>
                                            </div>
                                        </div>
                                        {/* Corner brackets */}
                                        <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-accent rounded-tl-lg pointer-events-none"></div>
                                        <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-accent rounded-tr-lg pointer-events-none"></div>
                                        <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-accent rounded-bl-lg pointer-events-none"></div>
                                        <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-accent rounded-br-lg pointer-events-none"></div>

                                        {!cameraActive && (
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-primary/80 flex flex-col items-center justify-center text-white gap-4">
                                                <Camera size={80} className="text-white/60" />
                                                <p className="text-xl font-bold">Demo Mode — ไม่พบกล้อง</p>
                                                <p className="text-white/50">กดปุ่ม "จำลองการถ่ายภาพ" ด้านล่าง</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {capturedPhoto === "demo" ? (
                                            <div className="w-full h-full bg-gradient-to-br from-[#2a1254]/80 to-[#1e0a3c]/80 flex flex-col items-center justify-center">
                                                <div className="w-32 h-32 bg-accent/20 rounded-full flex items-center justify-center mb-4 border-2 border-accent/40">
                                                    <ShieldCheck size={56} className="text-accent" />
                                                </div>
                                                <p className="text-white text-xl font-bold">ภาพถ่ายตัวอย่าง (Demo)</p>
                                                <p className="text-white/40 text-sm mt-1">Simulated photo capture</p>
                                            </div>
                                        ) : (
                                            <img src={capturedPhoto} alt="Captured face" className="w-full h-full object-cover" />
                                        )}

                                        {/* Face detection overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {detecting && (
                                                <div className="flex flex-col items-center gap-4 animate-pulse">
                                                    <div className="w-[260px] h-[340px] border-4 border-accent rounded-[50%] animate-ping opacity-30"></div>
                                                    <div className="absolute bottom-8 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full text-lg font-bold flex items-center gap-3">
                                                        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                                        กำลังตรวจจับใบหน้า...
                                                    </div>
                                                </div>
                                            )}
                                            {faceDetected === true && (
                                                <div className="absolute bottom-8 bg-success/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl text-xl font-bold flex items-center gap-3 shadow-xl animate-in zoom-in">
                                                    <ShieldCheck size={28} />
                                                    ตรวจจับใบหน้าสำเร็จ
                                                </div>
                                            )}
                                            {faceDetected === false && (
                                                <div className="absolute bottom-8 bg-error/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl text-xl font-bold flex items-center gap-3 shadow-xl animate-in zoom-in">
                                                    <AlertTriangle size={28} />
                                                    ไม่พบใบหน้า — กรุณาถ่ายใหม่
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 flex justify-center gap-4">
                                {!capturedPhoto ? (
                                    <>
                                        {cameraActive ? (
                                            <Button
                                                variant="kiosk"
                                                className="w-full max-w-md bg-gradient-to-r from-accent to-accent-hover text-white border-0 rounded-2xl h-16 text-xl font-bold shadow-xl"
                                                onClick={capturePhoto}
                                            >
                                                <Camera size={24} className="mr-3" />
                                                ถ่ายภาพ / Capture
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="kiosk"
                                                className="w-full max-w-md bg-gradient-to-r from-accent to-accent-hover text-white border-0 rounded-2xl h-16 text-xl font-bold shadow-xl"
                                                onClick={capturePhoto}
                                            >
                                                <Camera size={24} className="mr-3" />
                                                จำลองการถ่ายภาพ (Demo)
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="kiosk"
                                            className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl h-16 text-lg font-bold"
                                            onClick={retakePhoto}
                                        >
                                            <RefreshCw size={22} className="mr-3" />
                                            ถ่ายใหม่ / Retake
                                        </Button>
                                        <Button
                                            variant="kiosk"
                                            className={cn(
                                                "flex-[2] bg-gradient-to-r from-accent to-accent-hover text-white border-0 rounded-2xl h-16 text-lg font-bold shadow-xl transition-all",
                                                (!faceDetected || detecting) && "opacity-30 cursor-not-allowed"
                                            )}
                                            disabled={!faceDetected || detecting}
                                            onClick={() => router.push('/kiosk/success')}
                                        >
                                            <Check size={22} className="mr-3" />
                                            ยืนยันการเข้าพบ / Confirm Visit
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer — only for Step 1 */}
            {step === 1 && (
                <footer className="h-[120px] px-12 flex items-center justify-center shrink-0">
                    <Button
                        variant="kiosk"
                        className={cn(
                            "w-[600px] bg-gradient-to-r from-accent to-accent-hover text-white border-0 rounded-2xl h-20 text-2xl font-bold shadow-xl transition-all",
                            !selectedType && "opacity-30 cursor-not-allowed"
                        )}
                        disabled={!selectedType}
                        onClick={() => setStep(2)}
                    >
                        ถัดไป / Next
                        <ChevronRight size={28} className="ml-2" />
                    </Button>
                </footer>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

function StepDot({ active, current, label }: { active: boolean; current: boolean; label: string }) {
    return (
        <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all border-2",
            current
                ? "bg-accent text-white border-accent shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                : active
                    ? "bg-accent/30 text-accent border-accent/50"
                    : "bg-white/10 text-white/40 border-white/20"
        )}>
            {active && !current ? <Check size={18} /> : label}
        </div>
    );
}
