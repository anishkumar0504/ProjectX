import React from "react";
import {
  LayoutTemplate,
  UserCheck,
  Sliders,
  FileEdit,
  Send,
  Download,
  Check,
} from "lucide-react";

interface StepItem {
  id: number;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    label: "Select Template",
    description: "Curriculum format",
    icon: LayoutTemplate,
  },
  {
    id: 2,
    label: "Basic Details",
    description: "Student & metadata",
    icon: UserCheck,
  },
  {
    id: 3,
    label: "Configure Sections",
    description: "Structure & requirements",
    icon: Sliders,
  },
  {
    id: 4,
    label: "Screenshots & References",
    description: "Upload proofs & docs",
    icon: FileEdit,
  },
  {
    id: 5,
    label: "Confirm & Generate",
    description: "Review & compile",
    icon: Send,
  },
  {
    id: 6,
    label: "Download Artifacts",
    description: "PDF & Word DOCX",
    icon: Download,
  },
];

interface SidebarProps {
  currentStep: number;
  completedSteps: number[];
  onSelectStep: (step: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentStep,
  completedSteps,
  onSelectStep,
}) => {
  return (
    <aside className="w-full lg:w-72 apple-glass-card lg:sticky lg:top-20 self-start rounded-3xl p-4 sm:p-5 flex flex-col justify-between shrink-0 transition-all">
      <div>
        <div className="mb-4 px-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <span>Workflow</span>
            <span className="font-mono">
              {currentStep} of {STEPS.length}
            </span>
          </div>

          {/* Minimalist Apple Progress Bar */}
          <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-black dark:bg-white transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Vertical Steps */}
        <nav className="space-y-1" aria-label="Workflow Steps">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCurrent = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id) && !isCurrent;
            const canNavigate = completedSteps.includes(step.id) || step.id <= currentStep;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!canNavigate}
                onClick={() => onSelectStep(step.id)}
                className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all flex items-center gap-3 group relative ${
                  isCurrent
                    ? "apple-pill-active font-medium"
                    : canNavigate
                    ? "hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300"
                    : "opacity-40 text-neutral-400 cursor-not-allowed"
                }`}
              >
                {/* Step Indicator / Icon */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs transition-colors ${
                    isCurrent
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                      : isCompleted
                      ? "bg-black/10 text-neutral-900 dark:bg-white/15 dark:text-white"
                      : "bg-black/5 text-neutral-500 dark:bg-white/5 dark:text-neutral-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isCurrent
                          ? "text-neutral-950 dark:text-white"
                          : "text-neutral-800 dark:text-neutral-200"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        isCurrent
                          ? "text-neutral-600 dark:text-neutral-300 font-semibold"
                          : "text-neutral-400 opacity-60"
                      }`}
                    >
                      0{step.id}
                    </span>
                  </div>
                  <p
                    className={`text-[10.5px] truncate mt-0.5 ${
                      isCurrent
                        ? "text-neutral-600 dark:text-neutral-300"
                        : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 px-2 text-[11px] text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span>Institutional Compliant</span>
        </div>
        <p className="mt-0.5 text-[10px] leading-tight text-neutral-400 dark:text-neutral-500">
          Automatic A4 page layout & signature verification blocks.
        </p>
      </div>
    </aside>
  );
};