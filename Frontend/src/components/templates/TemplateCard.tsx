import React from "react";
import type { ReportTemplate } from "../../types/report";
import { Check } from "lucide-react";

interface TemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  console.log("🎴 TemplateCard render:", {
    slug: template.slug,
    previewUrl: template.previewImageUrl,
    fullUrl: template.previewImageUrl 
      ? `http://localhost:4000${template.previewImageUrl}` 
      : "NO URL",
  });

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={`group relative flex flex-col text-left apple-glass-card rounded-2xl p-4 transition-all hover:scale-[1.02] ${
        isSelected ? "ring-2 ring-black dark:ring-white" : ""
      }`}
    >
      {/* Preview Image */}
      <div className="relative aspect-[3/4] mb-4 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {template.previewImageUrl ? (
          <>
            <img
              src={`http://localhost:4000${template.previewImageUrl}`}
              alt={`${template.name} preview`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                console.error("❌ Image failed to load:", e);
                console.log("Tried to load:", `http://localhost:4000${template.previewImageUrl}`);
              }}
              onLoad={() => {
                console.log("✅ Image loaded successfully!");
              }}
            />
            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mb-2" />
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mx-auto" />
            </div>
          </div>
        )}
      </div>

      {/* Template Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
            {template.name}
          </h3>
          <span className="text-lg">{template.icon}</span>
        </div>
        
        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
          {template.description}
        </p>
        
        <div className="pt-2 flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
            {template.category}
          </span>
        </div>
      </div>
    </button>
  );
};