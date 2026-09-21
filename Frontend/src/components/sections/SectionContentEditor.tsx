import React from "react";
import { ReportSection, ScreenshotFile } from "../../types/report";
import { ScreenshotUploader } from "../screenshots/ScreenshotUploader";
import { Edit3, AlertCircle } from "lucide-react";

interface SectionContentEditorProps {
  sections: ReportSection[];
  screenshots: Record<string, ScreenshotFile[]>;
  onUpdateContent: (sectionId: string, content: string) => void;
  onAddScreenshot: (sectionId: string, file: ScreenshotFile) => void;
  onRemoveScreenshot: (sectionId: string, screenshotId: string) => void;
  validationErrors?: string[];
}

export const SectionContentEditor: React.FC<SectionContentEditorProps> = ({
  sections,
  screenshots,
  onUpdateContent,
  onAddScreenshot,
  onRemoveScreenshot,
  validationErrors = [],
}) => {
  const enabledSections = sections.filter((s) => s.enabled);

  return (
    <div className="space-y-5">
      {/* Header Overview */}
      <div className="apple-glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <Edit3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
            Add Section Content
          </h3>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Document observations, technical procedures, and verified output proofs for each active section.
        </p>

        {validationErrors.length > 0 && (
          <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Please resolve the following required items:</span>
            </div>
            <ul className="list-disc pl-5 text-xs text-red-600 dark:text-red-300 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Editor list for each enabled section */}
      <div className="space-y-4">
        {enabledSections.map((section, index) => {
          const sectionScreenshots = screenshots[section.id] || [];

          return (
            <div
              key={section.id}
              className="apple-glass-card rounded-2xl p-5 sm:p-6"
            >
              {/* Section Header */}
              <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 text-[11px] font-bold flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
                      {section.title}
                    </h4>
                  </div>
                  {section.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 pl-7">
                      {section.description}
                    </p>
                  )}
                </div>

                {section.proof === "required" && (
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/5 dark:border-white/10 shrink-0 font-mono">
                    PROOF REQUIRED
                  </span>
                )}
              </div>

              {/* Quick Technical Academic Snippets Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                    Insert:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `\n\`\`\`python\n# Implementation logic for ${section.title}\ndef run_pipeline():\n    print("Executing laboratory pipeline...")\n    return True\n\`\`\`\n`;
                      onUpdateContent(section.id, (section.content || "") + snippet);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-700 dark:text-neutral-300 font-mono transition-colors"
                  >
                    + Code Block
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `\n$ ./bin/run-service --target=${section.title.toLowerCase().replace(/[^a-z0-9]/g, "-")} --verify\n`;
                      onUpdateContent(section.id, (section.content || "") + snippet);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-700 dark:text-neutral-300 font-mono transition-colors"
                  >
                    + Command
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const table = `\n| Trial No. | Input Parameters | Expected Result | Actual Result | Status |\n| :---: | :--- | :--- | :--- | :---: |\n| 01 | Standard payload | 200 OK Response | 200 OK Verified | PASSED |\n| 02 | High-throughput load | Latency < 150ms | 42ms Recorded | PASSED |\n`;
                      onUpdateContent(section.id, (section.content || "") + table);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    + Observation Table
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const steps = `\n1. Initialize and verify runtime prerequisites.\n2. Configure local environment variables and system architecture.\n3. Execute the primary benchmark and record observation results.\n`;
                      onUpdateContent(section.id, (section.content || "") + steps);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    + Steps
                  </button>
                </div>

                <div className="text-[10px] text-neutral-400 font-mono">
                  {section.content ? section.content.trim().split(/\s+/).filter(Boolean).length : 0} words
                </div>
              </div>

              {/* Content Textarea */}
              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  value={section.content || ""}
                  onChange={(e) => onUpdateContent(section.id, e.target.value)}
                  placeholder={`Write detailed academic documentation for ${section.title}...`}
                  className="w-full rounded-xl apple-input px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none transition-all leading-relaxed font-sans"
                />
              </div>

              {/* Dynamic Screenshot Uploader */}
              {section.proof === "required" && (
                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10">
                  <ScreenshotUploader
                    sectionId={section.id}
                    sectionTitle={section.title}
                    screenshots={sectionScreenshots}
                    onAddScreenshot={onAddScreenshot}
                    onRemoveScreenshot={onRemoveScreenshot}
      required={  section.proof === "required"}
                  />
                </div>
              )}
            </div>
          );
        })}

        {enabledSections.length === 0 && (
          <div className="text-center py-12 apple-glass-card rounded-2xl border-dashed">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              No enabled sections to edit.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Please go back to Step 3 and enable at least one section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
