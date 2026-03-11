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
    const strokeColor = darkMode ? "#FFFFFF" : "#1a1a2e";
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
                height={size * 1.1}
                viewBox="0 0 100 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
            >
                {/* Shield outline */}
                <path
                    d="M50 6 L91 24 Q95 26 95 30 L95 58 C95 80 75 98 50 108 C25 98 5 80 5 58 L5 30 Q5 26 9 24 Z"
                    stroke={strokeColor}
                    strokeWidth="5"
                    fill="none"
                    strokeLinejoin="round"
                />
                {/* Person icon - head */}
                <circle cx="50" cy="42" r="13" stroke={strokeColor} strokeWidth="5" fill="none" />
                {/* Person icon - body */}
                <path
                    d="M27 88 C27 72 37 62 50 62 C63 62 73 72 73 88"
                    stroke={strokeColor}
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                />
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
