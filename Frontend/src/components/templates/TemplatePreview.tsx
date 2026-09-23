import React, { useMemo } from "react";
import type { ReportTemplate } from "../../types/report";

interface TemplatePreviewProps {
  template: ReportTemplate;
  isSelected?: boolean;
}

// ✅ Explicitly use VITE_IMG_URL
const IMG_URL = import.meta.env.VITE_IMG_URL || "http://localhost:4000";

const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const baseUrl = IMG_URL.replace(/\/$/, "");
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${baseUrl}${path}`;
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  isSelected,
}) => {
  const parsedScreenshots = useMemo(() => {
    if (!template.screenshots) return [];
    if (Array.isArray(template.screenshots)) return template.screenshots;
    if (typeof template.screenshots === "string") {
      try {
        const parsed = JSON.parse(template.screenshots);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [template.screenshots]);

  const imageUrl = getImageUrl(template.previewImageUrl || parsedScreenshots[0]);

  return (
    <div
      className={`relative w-full aspect-[1/1.3] bg-white dark:bg-neutral-900/90 rounded-xl overflow-hidden border transition-all ${
        isSelected
          ? "border-black dark:border-white shadow-md ring-1 ring-black/10 dark:ring-white/20"
          : "border-black/5 dark:border-white/10 shadow-2xs"
      }`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${template.name} preview`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}

      <div className={`flex flex-col h-full text-[7px] text-neutral-800 dark:text-neutral-200 font-serif select-none pointer-events-none p-3.5 ${imageUrl ? 'hidden' : ''}`}>
        <div className="border-b border-neutral-300 dark:border-neutral-700 pb-1.5 mb-1.5 text-center">
          <div className="font-bold tracking-tight text-[8px] text-neutral-950 dark:text-white uppercase truncate">
            {template.headerConfig?.institutionName || "INSTITUTION"}
          </div>
          <div className="text-[6.5px] text-neutral-500 dark:text-neutral-400 truncate">
            {template.headerConfig?.departmentName || "DEPARTMENT"}
          </div>
          <div className="inline-block mt-0.5 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[6px] rounded font-sans font-medium text-neutral-700 dark:text-neutral-300 uppercase">
            {template.headerConfig?.reportTypeBadge || "ACADEMIC RECORD"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 bg-neutral-50 dark:bg-neutral-800/60 p-1.5 rounded mb-1.5 text-[6.5px]">
          <div><span className="font-semibold text-neutral-500">Student:</span> Anish Kumar</div>
          <div><span className="font-semibold text-neutral-500">PRN:</span> 20240802503</div>
          <div className="col-span-2 truncate">
            <span className="font-semibold text-neutral-500">Subject:</span>{" "}
            {template.id === "project-report" ? "Major Project Phase II" : "Cloud Computing"}
          </div>
        </div>

        <div className="text-center font-bold text-[7.5px] mb-1.5 text-neutral-900 dark:text-white truncate font-sans">
          {template.defaultTitle || "Academic Technical Report"}
        </div>

        <div className="space-y-1 flex-1 overflow-hidden">
          {template.defaultSections?.slice(0, 4).map((sec, idx) => (
            <div key={sec.id} className="border-t border-neutral-100 dark:border-neutral-800 pt-0.5">
              <div className="font-bold text-[6.5px] text-neutral-900 dark:text-neutral-100 uppercase flex items-center justify-between">
                <span>{idx + 1}. {sec.title}</span>
                {sec.screenshotRequired && (
                  <span className="text-[5.5px] font-sans text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1 rounded">PROOF</span>
                )}
              </div>
              <div className="text-[5.5px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                {sec.content || "Standard section documentation."}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-1 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-[5.5px] text-neutral-400">
          <span>Page 1 of 2</span>
          <span>A4 Standard</span>
        </div>
      </div>

      <div className="absolute top-2.5 right-2.5 z-10">
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-black/80 dark:bg-white/90 text-white dark:text-black font-sans font-medium tracking-wide backdrop-blur-xs">
          {template.badge || template.category || template.subject}
        </span>
      </div>
    </div>
  );
};