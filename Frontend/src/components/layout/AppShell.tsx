import React from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  currentStep: number;
  completedSteps: number[];
  templateName?: string;
  onSelectStep: (step: number) => void;
  onFillSampleData?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentStep,
  completedSteps,
  templateName,
  onSelectStep,
  onFillSampleData,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-neutral-500/20 relative transition-colors duration-300">
      <div className="relative z-10 flex flex-col min-h-screen">
        <Topbar
          currentStep={currentStep}
          templateName={templateName}
          onFillSampleData={onFillSampleData}
        />

        {/* Main Workspace Layout */}
        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-3 sm:py-5 gap-5">
          {/* Sidebar Navigation */}
          <Sidebar
            currentStep={currentStep}
            completedSteps={completedSteps}
            onSelectStep={onSelectStep}
          />

          {/* Main Content Workspace */}
          <main className="flex-1 min-w-0 pb-16">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
