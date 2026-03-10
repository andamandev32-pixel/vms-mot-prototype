import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, User } from "lucide-react";
import Link from "next/link";

export default function WebLoginPage() {
    return (
        <div className="flex min-h-screen web-theme">
            {/* Left Side - Purple Gradient (MOTS Theme) */}
            <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-primary via-primary-dark to-primary-900 flex-col justify-center px-12 relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                <div className="relative z-10 text-center lg:text-left">
                    <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20 shadow-2xl">
                        <span className="text-4xl font-bold text-white drop-shadow-md">V</span>
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">Visitor<br />Management<br />System</h1>
                    <div className="h-1 w-20 bg-accent rounded-full mb-6"></div>
                    <p className="text-primary-light text-xl font-light tracking-wide">สำนักงานปลัด กระทรวงการท่องเที่ยวและกีฬา</p>
                </div>
                <div className="absolute bottom-12 text-primary-light/60 text-sm font-light">
                    &copy; 2026 Ministry of Tourism and Sports
                </div>
            </div>

            {/* Right Side - White */}
            <div className="flex-1 flex items-center justify-center bg-bg p-8">
                <div className="w-full max-w-[420px] space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-primary mb-2">เข้าสู่ระบบ</h2>
                        <p className="text-text-secondary">สำหรับเจ้าหน้าที่และผู้ดูแลระบบ</p>
                    </div>

                    <div className="space-y-6">
                        <Input
                            label="ชื่อผู้ใช้"
                            placeholder="Enter your username"
                            leftIcon={<User size={18} />}
                            className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                        />
                        <div>
                            <Input
                                label="รหัสผ่าน"
                                type="password"
                                placeholder="••••••••"
                                leftIcon={<Lock size={18} />}
                                className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            />
                            <div className="flex justify-end mt-2">
                                <Link href="#" className="text-sm text-primary font-medium hover:text-primary-dark hover:underline">
                                    ลืมรหัสผ่าน?
                                </Link>
                            </div>
                        </div>

                        <Link href="/web/dashboard" className="block pt-2">
                            <Button fullWidth size="lg" className="h-14 text-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                เข้าสู่ระบบ
                            </Button>
                        </Link>
                    </div>

                    <div className="text-center text-xs text-text-muted pt-4 border-t border-gray-100">
                        Protected by reCAPTCHA and subject to the Privacy Policy and Terms of Service.
                    </div>
                </div>
            </div>
        </div>
    );
}
