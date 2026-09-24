import React, { useState } from "react";
import { useReport } from "../hooks/useReport";
import { AppShell } from "../components/layout/AppShell";
import { TemplateGrid } from "../components/templates/TemplateGrid";
import { DynamicForm } from "../components/forms/DynamicForm";
import { SectionList } from "../components/sections/SectionList";
import { ScreenshotUploader, type ScreenshotFile } from "../components/ScreenshotUploader";
import { ReferenceUploader } from "../components/ReferenceUploader";
import { GeneratedReport } from "../components/generated/GeneratedReport";
import { generateReport } from "../api/reportApi";
import type { GeneratedDocumentResponse } from "../types/report";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  FileCheck2,
  Layers,
  Image as ImageIcon,
  User,
  GraduationCap,
  Sparkles,
  FileDown,
  X, // Added for the close button
} from "lucide-react";

export const ReportGenerator: React.FC = () => {
  const {
    report,
    selectedTemplate,
    completedSteps,
    templates,
    isLoading,
    selectTemplate,
    updateFormField,
    updateTitle,
    updateHeaderConfig,
    toggleSection,
    toggleScreenshotRequired,
    updateSection,
    deleteSection,
    moveSection,
    addCustomSection,
    goToStep,
    nextStep,
    prevStep,
    validateStep,
    resetReport,
  } = useReport();

  // Generation & API state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedResponse, setGeneratedResponse] = useState<GeneratedDocumentResponse | null>(null);

  // NEW: Token modal state
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Flat screenshot state (Gemini handles the section mapping automatically)
  const [uploadedScreenshots, setUploadedScreenshots] = useState<ScreenshotFile[]>([]);
  
  // Reference state
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceText, setReferenceText] = useState("");

  // Step validation feedback
  const [stepErrors, setStepErrors] = useState<string[]>([]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-neutral-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-900 dark:text-white mx-auto" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedTemplate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-semibold">No templates available</p>
          <p className="text-sm text-red-500 mt-2">Please ensure the backend server is running and seeded.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    // Step 4 (Screenshots & References) is entirely optional.
    // We bypass the old useReport validation that might be blocking it.
    if (report.currentStep === 4) {
      goToStep(5);
      setStepErrors([]);
      return;
    }

    const result = nextStep();
    if (!result.valid) {
      setStepErrors(result.errors);
    } else {
      setStepErrors([]);
    }
  };

  const handleStepSelect = (step: number) => {
    if (step > report.currentStep) {
      const validation = validateStep(report.currentStep);
      if (!validation.valid) {
        setStepErrors(validation.errors);
        return;
      }
    }
    setStepErrors([]);
    goToStep(step);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setShowTokenModal(false); // Reset modal state
    setGenerationProgress(15);
    setGenerationPhase("Preparing payload and assets...");

    try {
      setGenerationProgress(40);
      setGenerationPhase("Uploading to generation engine...");

      const sectionsPayload = report.sections.map((s) => ({
        id: s.id,
        type: s.type || (["aim", "objectives", "services", "prerequisites", "architecture", "steps", "verification", "expectedOutput", "conclusion"].includes(s.id) ? s.id : "custom"),
        title: s.title,
        enabled: s.enabled !== false,
        proof: s.proof || (["verification", "expectedOutput"].includes(s.id) ? "required" : "optional"),
        prompt: s.prompt || "",
      }));

      const hasCustomSections = sectionsPayload.some(s => s.type === "custom" && s.enabled);

      const payload = {
        templateSlug: selectedTemplate.slug,
        meta: {
          studentName: report.formData["studentName"] || "",
          prn: report.formData["prn"] || "",
          facultyName: report.formData["facultyName"] || "",
          title: report.title,
        },
        sections: JSON.stringify(sectionsPayload),
        imageLayout: "perStep" as const,
        useGemini: uploadedScreenshots.length > 0 || 
                   !!referenceFile || 
                   !!referenceText || 
                   hasCustomSections ||
                   report.title !== selectedTemplate.defaultTitle, 
        allowMissingProof: false,
      };

      setGenerationProgress(70);
      setGenerationPhase("Synthesizing document via ProjectX AI & DocBuilder...");

      const screenshotFiles = uploadedScreenshots.map((sc) => ({
        sectionId: "auto",
        file: sc.file,
      }));

      const res = await generateReport(payload, screenshotFiles, referenceFile, referenceText);
      
      setGenerationProgress(100);
      setGenerationPhase("Complete!");
      setGeneratedResponse(res.document);
      goToStep(6);
      window.dispatchEvent(new Event('credits-updated'));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred while compiling the report.";
      
      // Check for insufficient tokens/credits variations
      const isTokenError = /not enough token|insufficient token|out of credit|insufficient credit/i.test(errorMessage);

      if (isTokenError) {
        setShowTokenModal(true);
      } else {
        setGenerationError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFillDemoData = () => {
    const enabledSectionsWithScreenshot = report.sections.filter(
      (s) => s.enabled && s.proof === "required"
    );

    const newScreenshots: ScreenshotFile[] = [];

    enabledSectionsWithScreenshot.forEach((sec, index) => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0c0d10";
        ctx.fillRect(0, 0, 800, 400);
        ctx.fillStyle = "#18191f";
        ctx.fillRect(0, 0, 800, 36);
        ctx.fillStyle = "#ff5f56";
        ctx.beginPath();
        ctx.arc(18, 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffbd2e";
        ctx.beginPath();
        ctx.arc(36, 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#27c93f";
        ctx.beginPath();
        ctx.arc(54, 18, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#8a8b94";
        ctx.font = "12px monospace";
        ctx.fillText(`terminal output verification - ${sec.title}`, 75, 23);

        ctx.fillStyle = "#e5e5ea";
        ctx.font = "14px monospace";
        ctx.fillText("$ status verification: SUCCESS [2/2 checks passed]", 25, 80);
        ctx.fillStyle = "#30d158";
        ctx.fillText("Ready for submission • Verification ID: OK-2026", 25, 115);

        const dataUrl = canvas.toDataURL("image/png");
        
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], `${sec.title.toLowerCase().replace(/\s+/g, "-")}-proof.png`, { type: mimeString });

        newScreenshots.push({
          id: `sc-auto-${Date.now()}-${index}`,
          file,
          preview: dataUrl,
        });
      }
    });

    if (newScreenshots.length > 0) {
      setUploadedScreenshots((prev) => [...prev, ...newScreenshots]);
    }
    setStepErrors([]);
  };

  const enabledSections = report.sections.filter((s) => s.enabled);
  const totalScreenshotsCount = uploadedScreenshots.length;

  return (
    <AppShell
      currentStep={report.currentStep}
      completedSteps={completedSteps}
      templateName={selectedTemplate.name}
      onSelectStep={handleStepSelect}
      onFillSampleData={handleFillDemoData}
    >
      <div className="space-y-6">
        {/* STEP 1: SELECT TEMPLATE */}
        {report.currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200">
                  Step 1 of 6
                </span>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Select Report Template
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Choose an institutional document model. All fields, sections, rules, and document layouts dynamically adapt.
              </p>
            </div>
            <TemplateGrid
              templates={templates}
              selectedTemplateId={report.templateId}
              onSelectTemplate={(tId) => {
                selectTemplate(tId);
                setStepErrors([]);
              }}
              isLoading={isLoading}
            />
            <div className="pt-4 border-t border-black/5 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedTemplate}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 disabled:opacity-30 text-xs font-semibold rounded-full shadow-xs transition-all active:scale-[0.98]"
              >
                <span>Continue to Basic Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BASIC DETAILS */}
        {report.currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200">
                  Step 2 of 6
                </span>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Basic Information & Title
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Configure student details and document header for{" "}
                <strong className="text-neutral-800 dark:text-neutral-200">
                  {selectedTemplate.name}
                </strong>.
              </p>
            </div>
            <DynamicForm
              template={selectedTemplate}
              formData={report.formData}
              title={report.title}
              onTitleChange={updateTitle}
              onFieldChange={updateFormField}
              onHeaderConfigChange={updateHeaderConfig}
              validationErrors={stepErrors}
            />
            <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <button type="button" onClick={prevStep} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-semibold rounded-full shadow-xs transition-all active:scale-[0.98]">
                <span>Continue to Configure Sections</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIGURE SECTIONS */}
        {report.currentStep === 3 && (
          <div className="space-y-6">
            {report.sections.length === 0 ? (
              <div className="apple-glass-card rounded-2xl p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Sections are still loading for this template. Please wait a moment.
              </div>
            ) : (
              <SectionList
                sections={report.sections}
                onToggleEnabled={toggleSection}
                onToggleScreenshot={toggleScreenshotRequired}
                onUpdateSection={updateSection}
                onDeleteSection={deleteSection}
                onMoveSection={moveSection}
                onAddCustomSection={addCustomSection}
                validationError={stepErrors[0]}
              />
            )}
            <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <button type="button" onClick={prevStep} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-semibold rounded-full shadow-xs transition-all active:scale-[0.98]">
                <span>Continue to Screenshots & References</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SCREENSHOTS & REFERENCES */}
        {report.currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200">
                  Step 4 of 6
                </span>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Screenshots & References
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Upload your verification screenshots and optional reference materials. ProjectX AI will automatically organize them into the correct steps.
              </p>
            </div>

            <div className="apple-glass-card rounded-2xl p-6 border border-black/5 dark:border-white/10">
              <ScreenshotUploader
                screenshots={uploadedScreenshots}
                onAdd={(newFiles) => setUploadedScreenshots((prev) => [...prev, ...newFiles])}
                onRemove={(id) => setUploadedScreenshots((prev) => prev.filter((sc) => sc.id !== id))}
              />
            </div>

            <ReferenceUploader
              referenceFile={referenceFile}
              referenceText={referenceText}
              onFileChange={setReferenceFile}
              onTextChange={setReferenceText}
            />

            <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <button type="button" onClick={prevStep} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-semibold rounded-full shadow-xs transition-all active:scale-[0.98]">
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: CONFIRM & GENERATE */}
        {report.currentStep === 5 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200">
                  Step 5 of 6
                </span>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Ready to Generate Report?
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Verify the report configuration before compiling the final document package.
              </p>
            </div>

            {generationError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Unable to generate report.</p>
                  <p className="text-xs">{generationError}</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="apple-glass rounded-3xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white flex items-center justify-center mx-auto">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
                    Generating report package...
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {generationPhase}
                  </p>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden max-w-md mx-auto">
                  <div className="bg-black dark:bg-white h-full transition-all duration-300 rounded-full" style={{ width: `${generationProgress}%` }} />
                </div>
                <div className="flex justify-center gap-4 text-[11px] text-neutral-500 font-mono">
                  <span className={generationProgress >= 25 ? "text-neutral-900 dark:text-white font-medium" : ""}>• Structure</span>
                  <span className={generationProgress >= 50 ? "text-neutral-900 dark:text-white font-medium" : ""}>• Proofs</span>
                  <span className={generationProgress >= 75 ? "text-neutral-900 dark:text-white font-medium" : ""}>• Layout</span>
                  <span className={generationProgress >= 95 ? "text-neutral-900 dark:text-white font-medium" : ""}>• Binaries</span>
                </div>
              </div>
            )}

            {!isGenerating && (
              <div className="apple-glass-card rounded-3xl p-6 sm:p-8 space-y-5">
                <h3 className="text-xs font-mono font-medium uppercase tracking-widest text-neutral-400 border-b border-black/5 dark:border-white/10 pb-3">
                  Document Summary Review
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      <GraduationCap className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                      <span>Template</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1.5">{selectedTemplate.name}</p>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{selectedTemplate.headerConfig.institutionName}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      <User className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                      <span>Candidate</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1.5">{report.formData["studentName"] || "—"}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">PRN: {report.formData["prn"] || "—"} • Class: {report.formData["class"] || "—"}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 col-span-1 sm:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      <FileCheck2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                      <span>Report Title</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-1.5">{report.title}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      <Layers className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                      <span>Active Sections</span>
                    </div>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{enabledSections.length}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Out of {report.sections.length} total defined sections</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      <ImageIcon className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                      <span>Verification Proofs</span>
                    </div>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{totalScreenshotsCount}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Attached screenshots</p>
                  </div>
                </div>
                <div className="pt-2 text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Direct synthesis targeting institutional export schema</span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <button type="button" onClick={prevStep} disabled={isGenerating} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors disabled:opacity-40">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button type="button" onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 disabled:opacity-40 text-xs font-semibold rounded-full shadow-xs transition-all active:scale-[0.98]">
                {isGenerating ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Compiling Report...</span></>
                ) : (
                  <><Send className="w-3.5 h-3.5" /><span>Generate Report</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: DOWNLOAD DOCX / PDF */}
        {report.currentStep === 6 && (
          generatedResponse ? (
            <GeneratedReport
              response={generatedResponse}
              template={selectedTemplate}
              report={report}
              onReset={resetReport}
              onBackToEdit={() => goToStep(4)}
            />
          ) : (
            <div className="apple-glass-card rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mx-auto">
                <FileDown className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Ready to Compile Package</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Generate the official academic document package with formatted typography, tables, and verification proofs.
              </p>
              <div className="pt-2">
                <button type="button" onClick={handleGenerate} disabled={isGenerating} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50">
                  {isGenerating ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Compiling Documentation...</span></>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /><span>Compile & Generate Files Now</span></>
                  )}
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* INSUFFICIENT TOKENS MODAL */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button (Cross Sign) */}
            <button
              onClick={() => setShowTokenModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Insufficient Tokens
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                You don't have enough tokens to generate this report. Upgrade your plan or purchase more tokens to continue.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  window.location.href = "/subscribe";
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Subscribe to Get Tokens</span>
              </button>
              <button
                onClick={() => setShowTokenModal(false)}
                className="w-full px-6 py-3 bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/10 text-sm font-medium rounded-xl transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};