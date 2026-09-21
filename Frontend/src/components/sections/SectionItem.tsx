import React, { useState } from "react";
import { ReportSection } from "../../types/report";
import {
  GripVertical,
  Check,
  Camera,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

interface SectionItemProps {
  section: ReportSection;
  index: number;
  totalSections: number;
  onToggleEnabled: (id: string) => void;
  onToggleScreenshot: (id: string) => void;
  onUpdateSection: (id: string, updates: Partial<ReportSection>) => void;
  onDeleteSection: (id: string) => void;
  onMoveSection: (index: number, direction: "up" | "down") => void;
}

export const SectionItem: React.FC<SectionItemProps> = ({
  section,
  index,
  totalSections,
  onToggleEnabled,
  onToggleScreenshot,
  onUpdateSection,
  onDeleteSection,
  onMoveSection,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [editDescription, setEditDescription] = useState(section.description || "");

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdateSection(section.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`rounded-2xl transition-all apple-glass-card ${
        section.enabled ? "" : "opacity-40"
      }`}
    >
      <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Reorder, Enabled toggle & Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Order arrows & drag indicator */}
          <div className="flex items-center gap-0.5 text-neutral-400">
            <button
              type="button"
              onClick={() => onMoveSection(index, "up")}
              disabled={index === 0}
              className="p-1 hover:text-neutral-900 dark:hover:text-white disabled:opacity-20 transition-colors"
              title="Move up"
              aria-label="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <GripVertical className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
            <button
              type="button"
              onClick={() => onMoveSection(index, "down")}
              disabled={index === totalSections - 1}
              className="p-1 hover:text-neutral-900 dark:hover:text-white disabled:opacity-20 transition-colors"
              title="Move down"
              aria-label="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Enabled Checkbox */}
          <button
            type="button"
            onClick={() => onToggleEnabled(section.id)}
            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
              section.enabled
                ? "bg-black dark:bg-white border-transparent text-white dark:text-black shadow-2xs"
                : "border-black/20 dark:border-white/20 bg-transparent"
            }`}
            aria-label={section.enabled ? "Disable section" : "Enable section"}
          >
            {section.enabled && <Check className="w-3 h-3 stroke-[3]" />}
          </button>

          {/* Section details or Inline Editor */}
          {isEditing ? (
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl apple-input text-neutral-900 dark:text-white focus:outline-none"
                placeholder="Section Title"
                autoFocus
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl apple-input text-neutral-600 dark:text-neutral-300 focus:outline-none flex-1"
                placeholder="Short description / guidance"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">
                  {index + 1}.
                </span>
                <h4
                  className={`text-sm font-semibold tracking-tight truncate ${
                    section.enabled
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-400 line-through"
                  }`}
                >
                  {section.title}
                </h4>
                {section.isCustom && (
                  <span className="text-[10px] px-2 py-0.5 bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 rounded-full font-medium border border-black/5 dark:border-white/10">
                    Custom
                  </span>
                )}
              </div>
              {section.description && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  {section.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Screenshot Toggle, Edit, Delete */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/10">
          {/* Screenshot Requirement Toggle */}
          <button
            type="button"
            onClick={() => onToggleScreenshot(section.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              section.proof === "required" // ✅ CHANGED HERE
                ? "bg-black text-white dark:bg-white dark:text-black border-transparent shadow-2xs"
                : "bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/15"
            }`}
            title="Toggle screenshot requirement"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Proof {section.screenshotRequired ? "Required" : "Optional"}</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Edit Section Name"
              aria-label="Edit section"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteSection(section.id)}
              className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Delete Section"
              aria-label="Delete section"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
