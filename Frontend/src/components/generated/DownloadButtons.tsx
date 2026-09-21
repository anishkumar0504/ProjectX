import React, { useState } from "react";
import { GeneratedReportResponse } from "../../types/report";
import { Download, Printer, Copy, Check, ExternalLink } from "lucide-react"; // ✅ Removed FileDown
interface DownloadButtonsProps {
  reportResponse: GeneratedReportResponse;
  fileNameBase?: string;
}

export const DownloadButtons: React.FC<DownloadButtonsProps> = ({
  reportResponse,
  fileNameBase = "academic-report",
}) => {
  const [copied, setCopied] = useState(false);

  const cleanBase = fileNameBase
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 40);

  const handlePrintDocument = () => {
    // Open clean window with the generated printable content and trigger print
    const printWindow = window.open(reportResponse.pdfUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
      // Delay slightly to ensure content loads
      setTimeout(() => {
        try {
          printWindow.print();
        } catch {
          // fallback
        }
      }, 500);
    } else {
      window.print();
    }
  };

  const handleOpenPrintable = () => {
    window.open(reportResponse.pdfUrl, "_blank");
  };

  const handleCopySummary = () => {
    const text = `Academic Report: ${fileNameBase}\nID: ${reportResponse.reportId}\nGenerated: ${new Date().toLocaleDateString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
        {/* Print / Save as PDF Button */}
        <button
          type="button"
          onClick={handlePrintDocument}
          className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-semibold shadow-xs transition-all active:scale-[0.98] group"
        >
          <Printer className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Print / Save as PDF</span>
        </button>

        {/* Download Word DOCX Button */}
        <a
          href={reportResponse.docxUrl}
          download={`${cleanBase}.doc`}
          className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 text-xs font-semibold transition-all active:scale-[0.98] group"
        >
          <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          <span>Download Word Document</span>
        </a>
      </div>

      {/* Tertiary Quick Actions */}
      <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs">
        <button
          type="button"
          onClick={handleOpenPrintable}
          className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Printable Tab</span>
        </button>

        <span className="text-neutral-300 dark:text-neutral-700">•</span>

        <button
          type="button"
          onClick={handleCopySummary}
          className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-medium">Copied Reference!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Reference Info</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
