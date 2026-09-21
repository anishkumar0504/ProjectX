import React, { useState } from "react";
import { ReportSection } from "../../types/report";
import { SectionItem } from "./SectionItem";
import { AddSectionModal } from "./AddSectionModal";
import { Plus, Sliders, AlertCircle } from "lucide-react";

interface SectionListProps {
  sections: ReportSection[];
  onToggleEnabled: (id: string) => void;
  onToggleScreenshot: (id: string) => void;
  onUpdateSection: (id: string, updates: Partial<ReportSection>) => void;
  onDeleteSection: (id: string) => void;
  onMoveSection: (index: number, direction: "up" | "down") => void;
onAddCustomSection: (title: string, description: string, proof: "required" | "optional") => void;  validationError?: string;
}

export const SectionList: React.FC<SectionListProps> = ({
  sections,
  onToggleEnabled,
  onToggleScreenshot,
  onUpdateSection,
  onDeleteSection,
  onMoveSection,
  onAddCustomSection,
  validationError,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const enabledCount = sections.filter((s) => s.enabled).length;
  const screenshotCount = sections.filter((s) => s.enabled && s.proof === "required").length;
  return (
    <div className="space-y-5">
      {/* Configuration Header & Stats */}
      <div className="apple-glass-card rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              Configure Report Sections
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Enable, reorder, or customize which sections will be included in your final document.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 font-medium rounded-full border border-black/5 dark:border-white/10">
              {enabledCount} of {sections.length} Active
            </span>
            <span className="px-3 py-1 bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 font-medium rounded-full border border-black/5 dark:border-white/10">
              {screenshotCount} Require Proof
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-semibold rounded-full shadow-2xs transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Custom Section</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-2.5">
        {sections.map((section, idx) => (
          <SectionItem
            key={section.id}
            section={section}
            index={idx}
            totalSections={sections.length}
            onToggleEnabled={onToggleEnabled}
            onToggleScreenshot={onToggleScreenshot}
            onUpdateSection={onUpdateSection}
            onDeleteSection={onDeleteSection}
            onMoveSection={onMoveSection}
          />
        ))}

        {sections.length === 0 && (
          <div className="text-center py-12 apple-glass-card rounded-2xl border-dashed">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              No sections defined
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-xs font-semibold text-neutral-900 dark:text-white underline underline-offset-4"
            >
              + Click to add your first section
            </button>
          </div>
        )}
      </div>

      <AddSectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSection={onAddCustomSection}
      />
    </div>
  );
};
