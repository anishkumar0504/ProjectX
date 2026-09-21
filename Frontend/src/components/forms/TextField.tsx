import React from "react";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  isTextarea?: boolean;
  type?: "text" | "number";
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  helperText,
  isTextarea,
  type = "text",
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

      {isTextarea ? (
        <textarea
          id={id}
          rows={3}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl apple-input px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none transition-all resize-y font-sans leading-relaxed"
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl apple-input px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none transition-all font-sans"
        />
      )}

      {helperText && (
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{helperText}</p>
      )}
    </div>
  );
};
