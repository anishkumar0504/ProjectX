import React from "react";
import type { ReportTemplate, TemplateHeaderConfig } from "../../types/report";
import { FileText, User, Hash, GraduationCap } from "lucide-react";

interface DynamicFormProps {
  template: ReportTemplate;
  formData: Record<string, string>;
  title: string;
  onTitleChange: (val: string) => void;
  onFieldChange: (fieldId: string, val: string) => void;
  validationErrors?: string[];
  onHeaderConfigChange?: (updates: Partial<TemplateHeaderConfig>) => void; // ✅ Standard name
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  formData,
  title,
  onTitleChange,
  onFieldChange,
  validationErrors = [],
  // onHeaderConfigChange is intentionally omitted from destructuring as it is not used in this view yet
}) => {
  return (
    <div className="space-y-5">
      {/* ... rest of your JSX remains exactly the same ... */}
      <div className="apple-glass-card rounded-2xl p-5 sm:p-6 border border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              Report Document Title
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Appears prominently as the main experiment or project header.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
            Experiment / Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Access S3 from Private EC2 Instance using VPC Endpoint"
            className="w-full px-4 py-3 text-sm rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
          />
        </div>
      </div>

      <div className="apple-glass-card rounded-2xl p-5 sm:p-6 border border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-black/5 dark:border-white/10">
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              Student Details
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Required for the academic document header.
            </p>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
              Please complete the required fields:
            </p>
            <ul className="list-disc pl-4 text-xs text-red-600 dark:text-red-300 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
              Student Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={formData["studentName"] || ""}
                onChange={(e) => onFieldChange("studentName", e.target.value)}
                placeholder="e.g., Anish Kumar"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
              />
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
              PRN <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={formData["prn"] || ""}
                onChange={(e) => onFieldChange("prn", e.target.value)}
                placeholder="e.g., 20240802503"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
              />
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
              Faculty Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={formData["facultyName"] || ""}
                onChange={(e) => onFieldChange("facultyName", e.target.value)}
                placeholder="e.g., Ms. Tahreem Shaikh"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};