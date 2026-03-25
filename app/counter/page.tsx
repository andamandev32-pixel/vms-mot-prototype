"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Shield, Lock, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import VmsLogo from "@/components/ui/VmsLogo";

export default function CounterLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Teal Gradient */}
            <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-primary via-primary-dark to-primary-900 flex-col justify-center px-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

                <div className="relative z-10">
                    <div className="mb-8">
                        <VmsLogo size={64} darkMode />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                        Security<br />Guard<br />Counter
                    </h1>
                    <div className="h-1 w-20 bg-accent rounded-full mb-6"></div>
                    <p className="text-primary-light text-lg font-light tracking-wide">
                        ระบบลงทะเบียนผู้เยี่ยม — จุดบริการ รปภ.
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                        กระทรวงการท่องเที่ยวและกีฬา
                    </p>
                </div>

                <div className="absolute bottom-12 text-white/30 text-sm font-light">
                    &copy; 2026 eVMS Counter Terminal v1.0
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-bg p-8">
                <div className="w-full max-w-md">
                    <div className="space-y-6">
                        <div className="text-center mb-2">
                            <div className="lg:hidden flex justify-center mb-4">
                                <VmsLogo size={48} />
                            </div>
                            <h2 className="text-2xl font-bold text-primary">เข้าสู่ระบบ</h2>
                            <p className="text-text-secondary text-sm mt-1">Security Guard Login</p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="ชื่อผู้ใช้"
                                type="text"
                                placeholder="กรอกชื่อผู้ใช้"
                                leftIcon={<User size={18} />}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                            <Input
                                label="รหัสผ่าน"
                                type="password"
                                placeholder="กรอกรหัสผ่าน"
                                leftIcon={<Lock size={18} />}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <Link href="/counter/dashboard">
                            <Button
                                fullWidth
                                size="lg"
                                className="h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                <Shield size={20} className="mr-2" /> เข้าสู่ระบบ
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-8 text-center text-xs text-text-muted">
                        eVMS Security Counter Module v1.0.0
                    </div>
                </div>
            </div>
        </div>
    );
}
