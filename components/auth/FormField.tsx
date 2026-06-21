import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-brand-dark">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={cn(
            "rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-dark placeholder:text-brand-gray",
            "focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-transparent",
            "transition-colors",
            error && "border-red-400 focus:ring-red-400",
            className
          )}
          {...rest}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

FormField.displayName = "FormField";
export default FormField;
