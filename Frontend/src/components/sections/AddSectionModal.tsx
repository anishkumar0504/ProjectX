import React, { useState } from "react";
import { X, Plus, Camera } from "lucide-react";

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (title: string, description: string, proof: "required" | "optional") => void; // ✅ Changed from boolean
}

const ACADEMIC_SECTION_PRESETS = [
  {
    title: "Theoretical Background",
    desc: "Underlying principles, architecture, or conceptual foundation.",
    proof: false,
  },
  {
    title: "Algorithm & Flowchart",
    desc: "Logic structure, execution steps, and pseudo-code algorithm.",
    proof: false,
  },
  {
    title: "Hardware / Software Specifications",
    desc: "Operating environment, system dependencies, tools, and toolchain versions.",
    proof: false,
  },
  {
    title: "Source Code & Scripts",
    desc: "Complete implementation source code or terminal commands.",
    proof: false,
  },
  {
    title: "Observation & Test Matrix",
    desc: "Structured trial observations, test cases, and input/output measurements.",
    proof: true,
  },
  {
    title: "Results & Empirical Verification",
    desc: "Demonstration of successful execution and runtime behavior.",
    proof: true,
  },
  {
    title: "Viva & Review Questions",
    desc: "Core academic questions, conceptual queries, and analytical answers.",
    proof: false,
  },
  {
    title: "Conclusion & Learning Outcomes",
    desc: "Final deductions, critical takeaways, and academic conclusions.",
    proof: false,
  },
];

export const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onAddSection,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [screenshotRequired, setScreenshotRequired] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof ACADEMIC_SECTION_PRESETS[0]) => {
    setTitle(preset.title);
    setDescription(preset.desc);
    setScreenshotRequired(preset.proof);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a section name");
      return;
    }

  onAddSection(title.trim(), description.trim(), screenshotRequired ? "required" : "optional"); // ✅ Convert boolean to string
    setTitle("");
    setDescription("");
    setScreenshotRequired(false);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        className="w-full max-w-md apple-glass rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Plus className="w-4 h-4" />
            </div>
            <h3 id="modal-title" className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              Add Custom Section
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Academic Section Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 tracking-tight uppercase mb-2">
              Quick Academic Presets
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {ACADEMIC_SECTION_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    title === preset.title
                      ? "bg-black text-white dark:bg-white dark:text-black border-transparent font-medium shadow-2xs"
                      : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-tight mb-1.5">
              Section Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. System Architecture & Diagrams"
              className="w-full rounded-xl apple-input px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-tight mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Describe system topology, cloud VPC components, or methodology."
              className="w-full rounded-xl apple-input px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl apple-glass-card cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all">
              <input
                type="checkbox"
                checked={screenshotRequired}
                onChange={(e) => setScreenshotRequired(e.target.checked)}
                className="w-4 h-4 rounded-full accent-black dark:accent-white"
              />
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                <Camera className="w-4 h-4 text-neutral-500" />
                <span>Verification Screenshot / Proof Required</span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 rounded-full transition-all shadow-xs"
            >
              Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
