import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  required,
  placeholder = "Select an option",
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
        <select
          id={id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl apple-input pl-3.5 pr-10 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none transition-all font-sans cursor-pointer"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {helperText && (
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{helperText}</p>
      )}
    </div>
  );
};
