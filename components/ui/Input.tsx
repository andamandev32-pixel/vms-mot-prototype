import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, helperText, leftIcon, rightIcon, disabled, required, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className={cn("block text-xs font-medium uppercase text-text-secondary mb-1", error && "text-error")}>
                        {label}{required && <span className="text-error ml-0.5">*</span>}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-bg file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-bg disabled:text-text-muted",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            error && "border-error focus-visible:ring-error text-error",
                            className
                        )}
                        ref={ref}
                        disabled={disabled}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <p className="mt-1 text-xs text-error">{error}</p>}
                {helperText && !error && <p className="mt-1 text-xs text-text-secondary">{helperText}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
