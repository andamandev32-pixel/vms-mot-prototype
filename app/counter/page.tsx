import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Shield, Lock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export default function CounterLoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-[#1a0033] to-primary-800 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0">
                <div className="absolute left-10 top-10 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
                <div className="absolute right-10 bottom-10 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px]"></div>
            </div>

            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl relative z-10 mx-4">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-primary">Security Guard Access</h1>
                    <p className="text-text-secondary mt-1 text-sm">ระบบสำหรับเจ้าหน้าที่รักษาความปลอดภัย</p>
                </div>

                <div className="space-y-6">
                    <div className="bg-primary-50 border border-primary-100 p-3 rounded-xl flex items-center gap-3">
                        <Badge variant="default" className="bg-primary text-white">Station</Badge>
                        <span className="text-sm font-bold text-primary-700">ป้อมยาม 1 (ทางเข้าหลัก)</span>
                    </div>

                    <Input label="รหัสเจ้าหน้าที่" placeholder="Officer ID" leftIcon={<Shield size={18} />} autoFocus />
                    <Input label="รหัสผ่าน" type="password" placeholder="PIN Code" leftIcon={<Lock size={18} />} />

                    <Link href="/counter/dashboard" className="block">
                        <Button fullWidth size="lg" className="h-14 text-lg shadow-lg hover:shadow-xl rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold transition-all">
                            เข้าปฏิบัติงาน
                        </Button>
                    </Link>
                </div>

                <div className="mt-8 text-center text-xs text-text-muted">
                    VMS Security Module v1.0.0
                </div>
            </div>
        </div>
    );
}
