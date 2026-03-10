import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary:
                    "bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90 shadow-md",
                secondary:
                    "bg-accent text-white hover:bg-accent-hover shadow-sm",
                destructive:
                    "bg-error text-white hover:bg-error/90",
                outline:
                    "border-2 border-primary text-primary hover:bg-primary-light font-bold",
                ghost:
                    "hover:bg-primary-light text-primary",
                link: "text-primary underline-offset-4 hover:underline",
                kiosk: "bg-gradient-to-r from-accent to-accent-hover text-white text-2xl h-20 rounded-2xl shadow-xl active:scale-95 transition-transform border-2 border-white/20",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-md px-8",
                icon: "h-10 w-10",
                kiosk: "h-20 px-8 text-2xl",
            },
            fullWidth: {
                true: "w-full",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
            fullWidth: false,
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    size?: "default" | "sm" | "lg" | "icon" | "kiosk" | null;
    variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost" | "link" | "kiosk" | null;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, fullWidth, loading, children, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, fullWidth, className }))}
                ref={ref}
                disabled={loading || props.disabled}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
