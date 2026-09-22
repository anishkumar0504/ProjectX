import React from "react";
import {
  LayoutTemplate,
  UserCheck,
  Sliders,
  FileEdit,
  Send,
  Download,
  Check,
  Zap,
  FileText,
  Clock,
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
    <aside className="w-full lg:w-72 apple-glass-card lg:sticky lg:top-20 self-start rounded-3xl p-4 sm:p-5 flex flex-col justify-between shrink-0 transition-all h-[calc(100vh-6rem)]">
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

      {/* Refined ProjectX Footer */}
      <div className="mt-auto pt-5 border-t border-black/5 dark:border-white/10 px-1">
        {/* Slogan Block */}
        <div className="mb-4 pl-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-emerald-500 text-xs">✦</span>
            <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">
              For engineers who submit at 8:59 AM
            </span>
          </div>
          <p className="text-[10px] leading-snug text-neutral-500 dark:text-neutral-400 pl-[18px]">
            Your lab report, done before the coffee cools.
          </p>
        </div>

        {/* Feature Cards - Contained in a subtle background for professionalism */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]">
          <div className="flex flex-col gap-1.5 px-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500/10" />
              <span className="text-[9px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">AI Engine</span>
            </div>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 leading-tight">GPT-4 + Claude stitching</span>
          </div>
          <div className="flex flex-col gap-1.5 px-1 border-l border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="text-[9px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">Speed</span>
            </div>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 leading-tight">~30s generation time</span>
          </div>
        </div>

        {/* Status Line */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 pl-1">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            <span>.docx ready</span>
          </div>
          <span className="font-mono text-[9px] opacity-50">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};