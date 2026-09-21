import React from "react";

interface A4PageProps {
  pageNumber: number;
  totalPages: number;
  headerText?: string;
  footerText?: string;
  children: React.ReactNode;
}

export const A4Page: React.FC<A4PageProps> = ({
  pageNumber,
  totalPages,
  headerText,
  footerText,
  children,
}) => {
  return (
    <div className="w-full max-w-[794px] min-h-[1123px] mx-auto bg-white text-neutral-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-neutral-300 dark:border-neutral-800 p-10 sm:p-14 flex flex-col justify-between relative rounded-xs transition-transform">
      {/* Top running header */}
      {headerText && (
        <div className="text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-200 pb-1.5 mb-6 flex justify-between items-center font-sans">
          <span>{headerText}</span>
          <span className="font-mono">ACADEMIC & EVALUATION RECORD</span>
        </div>
      )}

      {/* Main page body */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Running Footer */}
      <div className="mt-8 pt-3 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-400 font-sans">
        <span>{footerText || "Department of Computer Science & Engineering"}</span>
        <span className="font-mono">
          Page {pageNumber} of {totalPages}
        </span>
      </div>
    </div>
  );
};
