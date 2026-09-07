"use client";

import { forwardRef, useState, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const [show, setShow] = useState(false);
    const fieldId = id ?? "password";

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-brand-dark">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={show ? "text" : "password"}
            className={cn(
              "w-full rounded-lg border border-gray-200 bg-white px-3 py-3 lg:py-2.5 pr-11 min-h-[44px] lg:min-h-0 text-base lg:text-sm text-brand-dark placeholder:text-brand-gray",
              "focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent",
              "transition-colors",
              error && "border-red-400 focus:ring-red-400",
              className
            )}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-brand-gray hover:text-brand-dark transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
