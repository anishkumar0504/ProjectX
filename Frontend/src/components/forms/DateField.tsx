import React from "react";
import { Calendar } from "lucide-react";

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helperText?: string;
}

export const DateField: React.FC<DateFieldProps> = ({
  id,
  label,
  value,
  onChange,
  required,
  helperText,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between tracking-tight"
      >
        <span>
          {label}
          {required && <span className="text-red-500 ml-1 font-semibold">*</span>}
        </span>
      </label>

      <div className="relative">
        <input
          id={id}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl apple-input pl-3.5 pr-10 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none transition-all font-sans"
        />
        <Calendar className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {helperText && (
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{helperText}</p>
      )}
    </div>
  );
};
