"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "size"> {
  /** Current search value */
  value: string;
  /** Callback when value changes (already debounced internally if debounceMs > 0) */
  onValueChange: (value: string) => void;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Placeholder text (default: Thai search text) */
  placeholder?: string;
  /** Allow clearing the input */
  clearable?: boolean;
  /** Additional wrapper className */
  wrapperClassName?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export function SearchInput({
  value,
  onValueChange,
  debounceMs = 300,
  placeholder = "ค้นหา...",
  clearable = true,
  wrapperClassName,
  size = "md",
  className,
  ...props
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external value changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (debounceMs > 0) {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          onValueChange(newValue);
        }, debounceMs);
      } else {
        onValueChange(newValue);
      }
    },
    [onValueChange, debounceMs]
  );

  const handleClear = React.useCallback(() => {
    setLocalValue("");
    onValueChange("");
    clearTimeout(timerRef.current);
  }, [onValueChange]);

  // Cleanup timer
  React.useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const sizeClasses = {
    sm: "h-8 text-sm pl-8 pr-8",
    md: "h-10 text-sm pl-10 pr-10",
    lg: "h-12 text-base pl-12 pr-12",
  };

  const iconSizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const iconLeftClasses = {
    sm: "left-2.5",
    md: "left-3",
    lg: "left-3.5",
  };

  const iconRightClasses = {
    sm: "right-2",
    md: "right-3",
    lg: "right-3.5",
  };

  return (
    <div className={cn("relative", wrapperClassName)}>
      {/* Search icon */}
      <Search
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-text-muted pointer-events-none",
          iconLeftClasses[size],
          iconSizeClasses[size]
        )}
      />

      {/* Input */}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-border bg-white text-text-primary",
          "placeholder:text-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400",
          "transition-colors",
          sizeClasses[size],
          className
        )}
        {...props}
      />

      {/* Clear button */}
      {clearable && localValue && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors",
            iconRightClasses[size]
          )}
          aria-label="ล้างการค้นหา"
        >
          <X className={cn(iconSizeClasses[size])} />
        </button>
      )}
    </div>
  );
}
