import React, { useState } from "react";
import { ReportState, ReportTemplate } from "../../types/report";
import { TemplateRenderer } from "./TemplateRenderer";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  FileCheck,
} from "lucide-react";

interface DocumentPreviewProps {
  template: ReportTemplate;
  report: ReportState;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  template,
  report,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 140));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 60));
  };

  const handleFitToPage = () => {
    setZoomLevel(100);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Apple Glass Preview Floating Control Bar */}
      <div className="apple-glass rounded-2xl sm:rounded-full px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-16 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              Live A4 Document Canvas
            </h3>
            <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400">
              High-fidelity typography & institutional formatting preview.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center border border-black/10 dark:border-white/10 rounded-full px-1.5 py-0.5 bg-black/5 dark:bg-white/5 backdrop-blur-md">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-full transition-colors"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium px-2 text-neutral-700 dark:text-neutral-300">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-full transition-colors"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleFitToPage}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 active:scale-[0.96] rounded-full border border-black/5 dark:border-white/10 transition-all"
            title="Reset to 100%"
          >
            <Maximize2 className="w-3.5 h-3.5 ios-vibrant-icon" />
            <span>Fit</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 active:scale-[0.96] rounded-full border border-black/5 dark:border-white/10 transition-all"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 ios-vibrant-icon" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* A4 Preview Stage with Zoom Scaling */}
      <div className="w-full overflow-x-auto p-4 sm:p-10 bg-neutral-200/50 dark:bg-black/80 rounded-3xl border border-black/10 dark:border-white/10 flex justify-center shadow-inner relative">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="w-full flex justify-center min-w-[650px]"
        >
          <TemplateRenderer template={template} report={report} />
        </div>
      </div>
    </div>
  );
};
