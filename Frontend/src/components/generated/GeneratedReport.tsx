import React from "react";
import type { GeneratedReportResponse, ReportState, ReportTemplate } from "../../types/report";
import { Check, RotateCcw, Edit, FileText, Calendar, FileDown } from "lucide-react";

interface GeneratedReportProps {
  response: GeneratedReportResponse;
  template: ReportTemplate;
  report: ReportState;
  onReset: () => void;
  onBackToEdit: () => void;
}

export const GeneratedReport: React.FC<GeneratedReportProps> = ({
  response,
  template,
  report,
  onReset,
  onBackToEdit,
}) => {
  const enabledSectionsCount = report.sections.filter((s) => s.enabled).length;
  const totalScreenshots = Object.values(report.screenshots).reduce(
    (acc, list) => acc + list.length,
    0
  );

  // ✅ UPDATED: Now accepts 'docx' or 'pdf' format parameter
  const handleDownload = async (format: 'docx' | 'pdf') => {
    if (!response?.id) return;

    try {
      const token = localStorage.getItem("auth_token");

      // 1. Fetch the file as a Blob with the requested format
      const res = await fetch(`${import.meta.env.VITE_API_URL}/documents/${response.id}/download?format=${format}`, {
        method: "GET",
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Failed to download ${format.toUpperCase()} file`);
      }

      // 2. Convert response to a Blob
      const blob = await res.blob();
      
      // 3. Create a temporary object URL
      const url = window.URL.createObjectURL(blob);
      
      // 4. Create a hidden anchor element to trigger the browser download
      const a = document.createElement("a");
      a.href = url;
      
      // ✅ Safely derive the filename with the correct extension
      const originalFilename = (response as any).filename || `Report_${response.id}`;
      const cleanName = originalFilename.replace(/\.(docx|pdf)$/i, "");
      a.download = `${cleanName}.${format}`; 
      
      document.body.appendChild(a);
      a.click();
      
      // 5. Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Download failed:", error);
      alert(`Failed to download the ${format.toUpperCase()} document. It may not have been generated yet.`);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Success Notification Card */}
      <div className="apple-glass-card rounded-3xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Report Generated Successfully
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-lg mx-auto">
          Your document has been rendered to institutional standards and compiled into distribution-ready formats.
        </p>

        {/* Metadata pills */}
        <div className="mt-5 pt-5 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1.5 font-mono">
            <span className="text-neutral-400">ID:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {response.id}
            </span>
          </span>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>{template.name}</span>
          </span>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>{new Date().toLocaleDateString()}</span>
          </span>
        </div>
      </div>

      {/* Document Snapshot Card */}
      <div className="apple-glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Miniature Paper Icon/Preview */}
          <div className="w-36 h-48 rounded-xl bg-white text-neutral-900 border border-neutral-300 dark:border-neutral-700 p-3.5 flex flex-col justify-between shadow-xl shrink-0 select-none">
            <div className="border-b border-neutral-200 pb-1 text-center">
              <div className="text-[7px] font-bold text-neutral-900 truncate uppercase tracking-wider">
                {template.headerConfig?.institutionName || "INSTITUTION"}
              </div>
              <div className="text-[6px] text-neutral-500 truncate">
                {template.headerConfig?.departmentName || "DEPARTMENT"}
              </div>
            </div>
            <div className="text-center py-2">
              <div className="text-[8px] font-bold text-neutral-950 line-clamp-2">
                {report.title}
              </div>
              <div className="text-[7px] text-neutral-500 mt-1">
                {report.formData["studentName"] || "Student"} • {report.formData["prn"] || ""}
              </div>
            </div>
            <div className="text-[6px] text-neutral-400 border-t border-neutral-200 pt-1 flex justify-between font-mono">
              <span>{enabledSectionsCount} Sections</span>
              <span>{totalScreenshots} Proofs</span>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Official Document Package
              </span>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5 tracking-tight">
                {report.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Candidate: <strong className="text-neutral-800 dark:text-neutral-200 font-medium">{report.formData["studentName"] || "Student"}</strong> | PRN:{" "}
                <strong className="text-neutral-800 dark:text-neutral-200 font-medium">{report.formData["prn"] || "—"}</strong>
              </p>
            </div>

            {/* ✅ UPDATED: Dual Download Buttons (DOCX & PDF) */}
            <div className="pt-2 flex flex-wrap gap-3 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => handleDownload('docx')}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-full font-semibold hover:opacity-90 transition-all shadow-sm active:scale-[0.98]"
              >
                <FileText className="w-4 h-4" />
                <span>Download .docx</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleDownload('pdf')}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
              >
                <FileDown className="w-4 h-4" />
                <span>Download .pdf</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBackToEdit}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Back to Edit Content</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 hover:bg-black/10 dark:hover:bg-white/15 rounded-full border border-black/5 dark:border-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Create Another Report</span>
        </button>
      </div>
    </div>
  );
};