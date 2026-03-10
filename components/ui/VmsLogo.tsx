import { cn } from "@/lib/utils";

interface VmsLogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
    textLayout?: "horizontal" | "vertical";
    darkMode?: boolean;
}

export default function VmsLogo({
    size = 40,
    className,
    showText = false,
    textLayout = "horizontal",
    darkMode = false
}: VmsLogoProps) {
    const textColor = darkMode ? "text-white" : "text-primary-dark";
    const subColor = darkMode ? "text-white/60" : "text-primary/60";

    return (
        <div className={cn(
            "flex items-center gap-3",
            textLayout === "vertical" && "flex-col gap-1",
            className
        )}>
            {/* Shield Logo SVG */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 drop-shadow-lg"
            >
                {/* Shield background */}
                <defs>
                    <linearGradient id="shieldGrad" x1="20" y1="10" x2="100" y2="110">
                        <stop offset="0%" stopColor="#6A0DAD" />
                        <stop offset="50%" stopColor="#4B0082" />
                        <stop offset="100%" stopColor="#2E0249" />
                    </linearGradient>
                    <linearGradient id="goldGrad" x1="20" y1="10" x2="100" y2="110">
                        <stop offset="0%" stopColor="#F0D070" />
                        <stop offset="50%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#B8860B" />
                    </linearGradient>
                    <linearGradient id="shineGrad" x1="30" y1="10" x2="90" y2="60">
                        <stop offset="0%" stopColor="white" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Gold border */}
                <path
                    d="M60 8 L105 28 L105 62 C105 85 85 105 60 115 C35 105 15 85 15 62 L15 28 Z"
                    fill="url(#goldGrad)"
                />
                {/* Purple inner shield */}
                <path
                    d="M60 14 L99 32 L99 62 C99 82 81 100 60 109 C39 100 21 82 21 62 L21 32 Z"
                    fill="url(#shieldGrad)"
                />
                {/* Shine overlay */}
                <path
                    d="M60 14 L99 32 L99 50 C99 50 75 55 50 35 L21 32 Z"
                    fill="url(#shineGrad)"
                    opacity="0.5"
                />
                {/* Person icon - head */}
                <circle cx="60" cy="48" r="13" stroke="white" strokeWidth="4" fill="none" />
                {/* Person icon - body */}
                <path
                    d="M38 88 C38 73 48 65 60 65 C72 65 82 73 82 88"
                    stroke="white"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Key/badge detail */}
                <circle cx="75" cy="42" r="6" stroke="white" strokeWidth="2.5" fill="none" opacity="0.7" />
                <path d="M79 46 L85 52" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
            </svg>

            {/* Text */}
            {showText && (
                <div className={cn(
                    textLayout === "vertical" && "text-center"
                )}>
                    <span className={cn("font-extrabold text-lg tracking-wide block leading-tight", textColor)}>
                        VMS
                    </span>
                    <span className={cn("text-[10px] font-semibold uppercase tracking-[0.15em] block leading-tight", subColor)}>
                        Visitor Management
                    </span>
                </div>
            )}
        </div>
    );
}
