"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Shield, UserCircle, Briefcase, ChevronRight, Check, X, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import NewFriendRichMenu from "@/components/mobile/NewFriendRichMenu";
import { lookupPersonnel, type PersonnelRecord } from "@/lib/mock-data";

type UserType = "visitor" | "staff" | null;
type ChatState = "new-friend" | "registering" | "registered";

interface ChatBubble {
    id: string;
    type: "bot" | "user" | "card";
    content: string;
    time: string;
    cardData?: {
        userType: "visitor" | "staff";
        name: string;
        date: string;
        company: string;
        phone: string;
    };
}

export default function LineRegistrationPage() {
    const router = useRouter();
    const [chatState, setChatState] = useState<ChatState>("new-friend");
    const [userType, setUserType] = useState<UserType>(null);
    const [showLiff, setShowLiff] = useState(false);
    const [liffStep, setLiffStep] = useState<"select" | "form">("select");
    const [messages, setMessages] = useState<ChatBubble[]>([
        {
            id: "welcome",
            type: "bot",
            content: "ยินดีต้อนรับสู่ eVMES MOT 🙏\nระบบจัดการผู้มาติดต่อ\nกระทรวงการท่องเที่ยวและกีฬา\n\nกรุณากดปุ่ม \"Registration Now\" ด้านล่างเพื่อลงทะเบียนเข้าใช้งาน",
            time: "22:00",
        },
    ]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle registration button click from Rich Menu
    const handleRegisterClick = () => {
        setShowLiff(true);
        setLiffStep("select");
        setUserType(null);
    };

    // Handle LIFF form submission
    const handleRegisterSubmit = () => {
        const isVisitor = userType === "visitor";
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

        // Close LIFF overlay
        setShowLiff(false);

        // Add "Registration Complete" card bubble
        const newMessages: ChatBubble[] = [
            ...messages,
            {
                id: `reg-${Date.now()}`,
                type: "card",
                content: "Registration Complete",
                time: timeStr,
                cardData: {
                    userType: userType!,
                    name: isVisitor ? "พุทธิพงษ์ คาดสนิท" : "นพดล ชูช่วย",
                    date: `10 03 2026,${timeStr} น.`,
                    company: isVisitor ? "บริษัท สยามเทค จำกัด" : "กองกิจการท่องเที่ยว",
                    phone: isVisitor ? "081-302-5678" : "064-131-8526",
                },
            },
        ];
        setMessages(newMessages);

        // Switch to registered state
        setChatState("registered");
    };

    // Navigate to the app
    const handleStartUsingApp = () => {
        if (userType === "visitor") {
            router.push("/mobile/dashboard");
        } else {
            router.push("/mobile/officer");
        }
    };

    return (
        <div className="flex flex-col h-full relative bg-[#7494A5]">
            {/* ===== LINE Chat Header ===== */}
            <div className="bg-[#506D7B] text-white flex items-center gap-3 px-4 py-3 shadow-md z-30 sticky top-0">
                <button className="text-white/80 hover:text-white">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shadow">
                    <Shield size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-bold leading-tight">eVMES MOT</h1>
                </div>
                <div className="flex items-center gap-3.5 text-white/70">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M12 12L15.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <rect x="3" y="3" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M3 7H15" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3 5H15M3 9H15M3 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            {/* ===== Chat Area ===== */}
            <div className={cn(
                "flex-1 overflow-y-auto px-3 py-4",
                chatState === "new-friend" ? "pb-[110px]" : "pb-[160px]"
            )}>
                {/* Date divider */}
                <div className="flex justify-center mb-4">
                    <span className="text-[11px] text-white/60 bg-black/15 rounded-full px-3 py-1">
                        วันนี้
                    </span>
                </div>

                {/* Chat Bubbles */}
                {messages.map((msg) => (
                    <div key={msg.id} className="mb-3">
                        {msg.type === "bot" && (
                            <div className="flex items-end gap-2 max-w-[85%]">
                                {/* Bot avatar */}
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shadow flex-shrink-0">
                                    <Shield size={12} className="text-white" />
                                </div>
                                <div>
                                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                        <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{msg.content}</p>
                                    </div>
                                    <p className="text-[10px] text-white/50 mt-1 ml-1">{msg.time}</p>
                                </div>
                            </div>
                        )}

                        {msg.type === "card" && msg.cardData && (
                            <div className="flex items-end gap-2 max-w-[85%]">
                                {/* Bot avatar */}
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shadow flex-shrink-0">
                                    <Shield size={12} className="text-white" />
                                </div>
                                <div>
                                    {/* Registration Complete Card — like the reference screenshots */}
                                    <div className="bg-white rounded-2xl rounded-bl-md shadow-sm overflow-hidden border border-gray-100">
                                        {/* Card Header with logo */}
                                        <div className="px-5 pt-5 pb-3 text-center border-b border-gray-100">
                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                                                    <Shield size={18} className="text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-extrabold text-primary-800 leading-tight">eVMES MOT</p>
                                                    <p className="text-[9px] text-text-muted leading-tight">Visitor Management System</p>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-[#06C755]">Registration Complete</h3>
                                        </div>

                                        {/* Card Body — registration details */}
                                        <div className="px-5 py-3 space-y-1.5 text-sm">
                                            <div className="flex gap-2">
                                                <span className="text-text-muted min-w-[60px]">ประเภท</span>
                                                <span className="font-medium text-text-primary">{msg.cardData.userType === "visitor" ? "Visitor" : "Officer"}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-text-muted min-w-[60px]">วันที่</span>
                                                <span className="font-medium text-text-primary">{msg.cardData.date}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-text-muted min-w-[60px]">ชื่อ</span>
                                                <span className="font-medium text-text-primary">{msg.cardData.name}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-text-muted min-w-[60px]">บริษัท</span>
                                                <span className="font-medium text-text-primary">{msg.cardData.company}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-text-muted min-w-[60px]">โทร.</span>
                                                <span className="font-medium text-text-primary">{msg.cardData.phone}</span>
                                            </div>
                                        </div>

                                        {/* Card Actions */}
                                        <div className="px-4 pb-4 pt-2 space-y-2">
                                            <button
                                                onClick={handleStartUsingApp}
                                                className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 rounded-xl transition-colors active:scale-[0.98]"
                                            >
                                                สร้างรายการนัดหมาย
                                            </button>
                                            <button
                                                onClick={handleStartUsingApp}
                                                className="w-full bg-white border-2 border-gray-200 text-text-primary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors active:scale-[0.98]"
                                            >
                                                ข้อมูลส่วนบุคคล
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-white/50 mt-1 ml-1">{msg.time}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <div ref={chatEndRef} />
            </div>

            {/* ===== Rich Menu ===== */}
            {chatState === "new-friend" && (
                <NewFriendRichMenu onRegister={handleRegisterClick} />
            )}

            {chatState === "registered" && userType === "visitor" && (
                <VisitorPostRegRichMenu />
            )}

            {chatState === "registered" && userType === "staff" && (
                <StaffPostRegRichMenu />
            )}

            {/* ===== LIFF Overlay (Registration form) ===== */}
            {showLiff && (
                <div className="absolute inset-0 z-[60] flex flex-col">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowLiff(false)} />

                    {/* LIFF Container — slides up from bottom */}
                    <div className="relative mt-auto bg-white rounded-t-[1.5rem] max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in-bottom">
                        {/* LIFF Header */}
                        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-3 border-b border-gray-100 rounded-t-[1.5rem]">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                                    <Shield size={14} className="text-white" />
                                </div>
                                <span className="text-sm font-bold text-text-primary">eVMES MOT Registration</span>
                            </div>
                            <button
                                onClick={() => setShowLiff(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} className="text-text-muted" />
                            </button>
                        </div>

                        {/* LIFF Content */}
                        <div className="px-5 py-5">
                            {liffStep === "select" ? (
                                <>
                                    <h2 className="text-xl font-bold text-text-primary mb-1">ลงทะเบียนเข้าใช้งาน</h2>
                                    <p className="text-sm text-text-secondary mb-6">เลือกประเภทผู้ใช้งานของคุณ</p>

                                    <div className="space-y-3">
                                        <UserTypeCard
                                            icon={<UserCircle size={28} />}
                                            title="ผู้มาติดต่อ"
                                            titleEn="Visitor"
                                            desc="บุคคลภายนอกที่ต้องการเข้าพบเจ้าหน้าที่"
                                            selected={userType === "visitor"}
                                            onClick={() => setUserType("visitor")}
                                            color="green"
                                        />
                                        <UserTypeCard
                                            icon={<Briefcase size={28} />}
                                            title="พนักงาน"
                                            titleEn="Officer"
                                            desc="เจ้าหน้าที่ กท.กก. ตรวจสอบและอนุมัติรายการ"
                                            selected={userType === "staff"}
                                            onClick={() => setUserType("staff")}
                                            color="purple"
                                        />
                                    </div>

                                    <Button
                                        fullWidth
                                        disabled={!userType}
                                        onClick={() => setLiffStep("form")}
                                        className="mt-6 h-13 text-base font-bold rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white shadow-lg disabled:opacity-40 disabled:shadow-none"
                                    >
                                        ดำเนินการต่อ
                                        <ChevronRight size={18} className="ml-1" />
                                    </Button>
                                </>
                            ) : (
                                <RegistrationForm
                                    userType={userType!}
                                    onBack={() => setLiffStep("select")}
                                    onSubmit={handleRegisterSubmit}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== Inline Rich Menu Components (post-registration, within chat page) =====

function VisitorPostRegRichMenu() {
    const router = useRouter();
    return (
        <div className="absolute bottom-0 left-0 right-0 z-50">
            <div className="max-w-md mx-auto">
                <div className="bg-white shadow-[0_-6px_30px_rgba(0,0,0,0.15)] overflow-hidden border-t border-gray-200">
                    {/* Logo Header */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-md flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">V</span>
                        </div>
                        <span className="text-[11px] font-semibold text-primary-800">eVMES MOT</span>
                        <span className="text-[10px] text-text-muted">Visitor Management System</span>
                    </div>

                    <div className="grid grid-cols-2 gap-[1px] bg-gray-200">
                        <button onClick={() => router.push("/mobile/profile")} className="bg-white flex flex-col items-center justify-center py-5 px-3 active:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-[#06C755]/10 flex items-center justify-center mb-2.5">
                                <UserCircle size={36} className="text-[#06C755]" />
                            </div>
                            <p className="text-xs font-bold text-text-primary text-center leading-tight">ข้อมูลส่วนบุคคล</p>
                            <p className="text-[10px] text-text-muted text-center mt-0.5">ผู้มาติดต่อ / Visitor</p>
                        </button>
                        <button onClick={() => router.push("/mobile/booking")} className="bg-white flex flex-col items-center justify-center py-5 px-3 active:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2.5">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M12 14v4M10 16h4" /></svg>
                            </div>
                            <p className="text-xs font-bold text-text-primary text-center leading-tight">บันทึกนัดหมาย</p>
                            <p className="text-[10px] text-text-muted text-center mt-0.5">Make Appointment</p>
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 py-2 bg-gray-100 border-t border-gray-200">
                        <div className="w-5 h-5 bg-gray-400 rounded flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="0.5" fill="white" /><rect x="7" y="1" width="4" height="4" rx="0.5" fill="white" /><rect x="1" y="7" width="4" height="4" rx="0.5" fill="white" /><rect x="7" y="7" width="4" height="4" rx="0.5" fill="white" /></svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500">Bulletin ▾</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StaffPostRegRichMenu() {
    const router = useRouter();
    return (
        <div className="absolute bottom-0 left-0 right-0 z-50">
            <div className="max-w-md mx-auto">
                <div className="bg-white shadow-[0_-6px_30px_rgba(0,0,0,0.15)] overflow-hidden border-t border-gray-200">
                    {/* Logo Header */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary-600 to-primary-800 rounded-md flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">V</span>
                        </div>
                        <span className="text-[11px] font-semibold text-primary-800">eVMES MOT</span>
                        <span className="text-[10px] text-text-muted">Visitor Management System</span>
                    </div>

                    <div className="grid grid-cols-2 gap-[1px] bg-gray-200">
                        <button onClick={() => router.push("/mobile/officer")} className="bg-white flex flex-col items-center justify-center py-5 px-3 active:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2.5">
                                <UserCircle size={36} className="text-primary" />
                            </div>
                            <p className="text-xs font-bold text-text-primary text-center leading-tight">ข้อมูลส่วนบุคคล</p>
                            <p className="text-[10px] text-text-muted text-center mt-0.5">พนักงาน กท.กก.</p>
                        </button>
                        <button onClick={() => router.push("/mobile/officer/requests")} className="bg-white flex flex-col items-center justify-center py-5 px-3 active:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-2.5">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-600"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M12 14v4M10 16h4" /></svg>
                            </div>
                            <p className="text-xs font-bold text-text-primary text-center leading-tight">บันทึกนัดหมาย</p>
                            <p className="text-[10px] text-text-muted text-center mt-0.5">Make Appointment</p>
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 py-2 bg-gray-100 border-t border-gray-200">
                        <div className="w-5 h-5 bg-gray-400 rounded flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="0.5" fill="white" /><rect x="7" y="1" width="4" height="4" rx="0.5" fill="white" /><rect x="1" y="7" width="4" height="4" rx="0.5" fill="white" /><rect x="7" y="7" width="4" height="4" rx="0.5" fill="white" /></svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500">Bulletin ▾</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== Shared Sub-components =====

function UserTypeCard({
    icon,
    title,
    titleEn,
    desc,
    selected,
    onClick,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    titleEn: string;
    desc: string;
    selected: boolean;
    onClick: () => void;
    color: "green" | "purple";
}) {
    const colorMap = {
        green: {
            bg: "bg-[#06C755]/10",
            activeBg: "bg-[#06C755]",
            border: "border-[#06C755]",
            text: "text-[#06C755]",
        },
        purple: {
            bg: "bg-primary/10",
            activeBg: "bg-primary",
            border: "border-primary",
            text: "text-primary",
        },
    };
    const c = colorMap[color];

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white shadow-sm",
                selected ? `${c.border} bg-opacity-5` : "border-gray-200 hover:border-gray-300"
            )}
        >
            <div
                className={cn(
                    "w-13 h-13 rounded-2xl flex items-center justify-center mr-4 transition-all flex-shrink-0",
                    selected ? `${c.activeBg} text-white shadow-md` : `${c.bg} ${c.text}`
                )}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text-primary text-base">{title}</h3>
                <p className="text-[11px] text-text-muted">{titleEn}</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{desc}</p>
            </div>
            {selected && (
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-2", c.activeBg)}>
                    <Check size={14} className="text-white" />
                </div>
            )}
        </div>
    );
}

function RegistrationForm({
    userType,
    onBack,
    onSubmit,
}: {
    userType: "visitor" | "staff";
    onBack: () => void;
    onSubmit: () => void;
}) {
    const isVisitor = userType === "visitor";
    const [staffQuery, setStaffQuery] = useState("");
    const [foundStaff, setFoundStaff] = useState<PersonnelRecord | null>(null);
    const [lookupError, setLookupError] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const handleStaffLookup = () => {
        if (!staffQuery.trim()) return;
        setIsSearching(true);
        setLookupError("");
        // Simulate async lookup
        setTimeout(() => {
            const result = lookupPersonnel(staffQuery);
            if (result) {
                setFoundStaff(result);
                setLookupError("");
            } else {
                setFoundStaff(null);
                setLookupError("ไม่พบข้อมูลพนักงาน กรุณาตรวจสอบรหัสอีกครั้ง");
            }
            setIsSearching(false);
        }, 800);
    };

    return (
        <>
            <button onClick={onBack} className="text-sm text-primary font-medium mb-4 flex items-center gap-1 hover:underline">
                ← ย้อนกลับ
            </button>

            <div className="flex items-center gap-3 mb-5">
                <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                    isVisitor ? "bg-[#06C755]/10 text-[#06C755]" : "bg-primary/10 text-primary"
                )}>
                    {isVisitor ? <UserCircle size={22} /> : <Briefcase size={22} />}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">
                        ลงทะเบียน{isVisitor ? "ผู้มาติดต่อ" : "พนักงาน"}
                    </h2>
                    <p className="text-xs text-text-secondary">
                        {isVisitor ? "กรอกข้อมูลส่วนบุคคล" : "ป้อนรหัสพนักงานหรือเลขบัตรประชาชน"}
                    </p>
                </div>
            </div>

            {isVisitor ? (
                /* ===== Visitor Form ===== */
                <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="ชื่อ" placeholder="ชื่อ" defaultValue="พุทธิพงษ์" />
                        <Input label="นามสกุล" placeholder="นามสกุล" defaultValue="คาดสนิท" />
                    </div>
                    <Input label="เบอร์โทรศัพท์" placeholder="0XX-XXX-XXXX" type="tel" />
                    <Input label="อีเมล" placeholder="example@email.com" type="email" />
                    <Input label="บริษัท / หน่วยงาน" placeholder="ชื่อบริษัท" />

                    <Button
                        fullWidth
                        onClick={onSubmit}
                        className="mt-6 h-13 text-base font-bold rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white shadow-lg"
                    >
                        ลงทะเบียน
                    </Button>
                </div>
            ) : (
                /* ===== Staff Form — ID Lookup Flow ===== */
                <div className="space-y-4">
                    {/* Step 1: Search by Employee ID or National ID */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                            รหัสพนักงาน หรือ เลขบัตรประชาชน
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="EMP-007 หรือ 1-XXXX-XXXXX-XX-X"
                                value={staffQuery}
                                onChange={(e) => {
                                    setStaffQuery(e.target.value);
                                    if (foundStaff) {
                                        setFoundStaff(null);
                                        setLookupError("");
                                    }
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") handleStaffLookup(); }}
                                className="flex-1"
                            />
                            <button
                                onClick={handleStaffLookup}
                                disabled={!staffQuery.trim() || isSearching}
                                className={cn(
                                    "flex items-center justify-center w-12 h-12 rounded-xl transition-all flex-shrink-0",
                                    staffQuery.trim() && !isSearching
                                        ? "bg-primary text-white shadow-md active:scale-95"
                                        : "bg-gray-100 text-gray-400"
                                )}
                            >
                                {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                            </button>
                        </div>
                        {lookupError && (
                            <p className="text-xs text-error mt-1.5">{lookupError}</p>
                        )}
                    </div>

                    {/* Step 2: Show found personnel data */}
                    {foundStaff && (
                        <>
                            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Check size={16} className="text-[#06C755]" />
                                    <span className="text-sm font-bold text-[#06C755]">พบข้อมูลพนักงาน</span>
                                </div>
                                <div className="text-sm space-y-1.5">
                                    <div className="flex gap-2">
                                        <span className="text-text-muted min-w-[80px]">ชื่อ-สกุล</span>
                                        <span className="font-medium text-text-primary">{foundStaff.firstName} {foundStaff.lastName}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-text-muted min-w-[80px]">ตำแหน่ง</span>
                                        <span className="font-medium text-text-primary">{foundStaff.position}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-text-muted min-w-[80px]">สังกัด</span>
                                        <span className="font-medium text-text-primary">{foundStaff.departmentName}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-text-muted min-w-[80px]">รหัส</span>
                                        <span className="font-medium text-text-primary">{foundStaff.employeeId}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Enter phone + email */}
                            <Input label="เบอร์โทรศัพท์" placeholder="0XX-XXX-XXXX" type="tel" />
                            <Input label="อีเมล" placeholder="example@email.com" type="email" />

                            <Button
                                fullWidth
                                onClick={onSubmit}
                                className="mt-2 h-13 text-base font-bold rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white shadow-lg"
                            >
                                ลงทะเบียน
                            </Button>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
