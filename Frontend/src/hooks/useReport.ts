import { useState, useCallback, useMemo, useEffect } from "react";
import { fetchTemplates } from "../api/templateApi";
import type {
  ReportSection,
  ReportState,
  ReportTemplate,
  ScreenshotFile,
  TemplateHeaderConfig,
} from "../types/report";

export function useReport() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTemplates();
        setTemplates(data);
      } catch (err) {
        console.error("❌ Failed to load templates:", err);
        setError(err instanceof Error ? err.message : "Failed to load templates");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const getInitialFormData = (template: ReportTemplate): Record<string, string> => {
    const data: Record<string, string> = {};
    template.fields.forEach((field) => {
      data[field.id] = field.defaultValue || "";
    });
    return data;
  };

  const [report, setReport] = useState<ReportState>({
    templateId: "",
    formData: {},
    title: "Academic Laboratory Report",
    sections: [],
    screenshots: {},
    currentStep: 1,
  });

  // Initialize report state once templates are loaded (ONLY ONCE)
  // Inside useReport.ts, replace your existing template initialization useEffect with this:
  useEffect(() => {
    if (templates.length > 0 && !isInitialized) {
      const first = templates[0];
      

      let safeSections: any[] = [];

      // 1. Try to use the template's defaultSections if it's a valid array with length > 0
      if (Array.isArray(first.defaultSections) && first.defaultSections.length > 0) {
        safeSections = first.defaultSections.map((s: any) => ({
          id: s.id,
          type: s.type || s.id,
          title: s.title,
          description: s.description || "",
          enabled: s.enabled !== false,
          proof: s.proof === "required" ? "required" : "optional",
          isCustom: s.isCustom || false,
          content: s.content || "",
        }));
      } 
      // 2. NUCLEAR FALLBACK: If it's empty, broken, or overwritten, hardcode the correct array!
      else {
        console.warn("⚠️ defaultSections was empty or invalid. Using hardcoded fallback to prevent UI break.");
        safeSections = [
          { id: "aim", type: "aim", title: "Aim", description: "", enabled: true, proof: "optional" },
          { id: "objectives", type: "objectives", title: "Objectives", description: "", enabled: true, proof: "optional" },
          { id: "services", type: "services", title: "AWS Services Used", description: "", enabled: true, proof: "optional" },
          { id: "prerequisites", type: "prerequisites", title: "Prerequisites", description: "", enabled: true, proof: "optional" },
          { id: "architecture", type: "architecture", title: "Architecture Diagram", description: "", enabled: true, proof: "optional" },
          { id: "steps", type: "steps", title: "Step-by-Step Implementation", description: "", enabled: true, proof: "optional" },
          { id: "verification", type: "verification", title: "Verification / Testing", description: "", enabled: true, proof: "required" },
          { id: "expectedOutput", type: "expectedOutput", title: "Expected Output", description: "", enabled: true, proof: "required" },
          { id: "conclusion", type: "conclusion", title: "Result / Conclusion", description: "", enabled: true, proof: "optional" },
        ];
      }


      setReport((prev) => ({
        ...prev,
        templateId: first.id,
        title: first.defaultTitle || "Academic Laboratory Report",
        sections: safeSections, // ⚠️ THIS IS THE CRITICAL LINE
        currentStep: 1,
      }));
      
      setIsInitialized(true);
    }
  }, [templates, isInitialized]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);

  const selectedTemplate = useMemo(() => {
    if (!templates.length) return null;
    const base = templates.find((t) => t.id === report.templateId) || templates[0];
    if (!base) return null;
    if (report.customHeaderConfig) {
      return { ...base, headerConfig: { ...base.headerConfig, ...report.customHeaderConfig } };
    }
    return base;
  }, [report.templateId, report.customHeaderConfig, templates]);

  const selectTemplate = useCallback((templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      console.error("Template not found:", templateId);
      return;
    }
    setReport({
      templateId: template.id,
      formData: getInitialFormData(template),
      title: template.defaultTitle || `${template.name} Report`,
      sections: template.defaultSections.map((s) => ({ ...s })),
      screenshots: {},
      currentStep: 1,
    });
    setCompletedSteps([1]);
  }, [templates]);

  const updateFormField = useCallback((fieldId: string, value: string) => {
    setReport((prev) => ({ ...prev, formData: { ...prev.formData, [fieldId]: value } }));
  }, []);

  const updateTitle = useCallback((title: string) => {
    setReport((prev) => ({ ...prev, title }));
  }, []);

  const updateHeaderConfig = useCallback((updates: Partial<TemplateHeaderConfig>) => {
    setReport((prev) => ({
      ...prev,
      customHeaderConfig: {
        ...(prev.customHeaderConfig || {}),
        ...updates,
      },
    }));
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setReport((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => (sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec)),
    }));
  }, []);

const toggleScreenshotRequired = useCallback((sectionId: string) => {
  setReport((prev) => ({
    ...prev,
    sections: prev.sections.map((sec) =>
      sec.id === sectionId
        ? { ...sec, proof: sec.proof === "required" ? "optional" : "required" }
        : sec
    ),
  }));
}, []);

  const updateSection = useCallback((sectionId: string, updates: Partial<ReportSection>) => {
    setReport((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => (sec.id === sectionId ? { ...sec, ...updates } : sec)),
    }));
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    setReport((prev) => ({ ...prev, sections: prev.sections.filter((sec) => sec.id !== sectionId) }));
  }, []);

  const moveSection = useCallback((index: number, direction: "up" | "down") => {
    setReport((prev) => {
      const newSections = [...prev.sections];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSections.length) return prev;
      const temp = newSections[index];
      newSections[index] = newSections[targetIndex];
      newSections[targetIndex] = temp;
      return { ...prev, sections: newSections };
    });
  }, []);

const addCustomSection = useCallback((title: string, description: string, proof: "required" | "optional") => {
  const newId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  setReport((prev) => ({
    ...prev,
    sections: [
      ...prev.sections,
      {
        id: newId,
        type: "custom",
        title,
        description,
        enabled: true,
        proof, // ✅ Now it is used
        isCustom: true,
        content: "",
      },
    ],
  }));
}, []);

  const updateSectionContent = useCallback((sectionId: string, content: string) => {
    setReport((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => (sec.id === sectionId ? { ...sec, content } : sec)),
    }));
  }, []);

  const addScreenshot = useCallback((sectionId: string, screenshot: ScreenshotFile) => {
    setReport((prev) => {
      const existing = prev.screenshots[sectionId] || [];
      return { ...prev, screenshots: { ...prev.screenshots, [sectionId]: [...existing, screenshot] } };
    });
  }, []);

  const removeScreenshot = useCallback((sectionId: string, screenshotId: string) => {
    setReport((prev) => {
      const existing = prev.screenshots[sectionId] || [];
      return { ...prev, screenshots: { ...prev.screenshots, [sectionId]: existing.filter((sc) => sc.id !== screenshotId) } };
    });
  }, []);

  const validateStep = useCallback((step: number): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!selectedTemplate) return { valid: false, errors: ["Template not loaded"] };

    if (step === 1 && !report.templateId) errors.push("Please choose a document template.");
    if (step === 2) {
      if (!report.title.trim()) errors.push("Report Title is required.");
      selectedTemplate.fields.forEach((field) => {
        if (field.required && !report.formData[field.id]?.trim()) {
          errors.push(`${field.label} is required.`);
        }
      });
    }
    if (step === 3 && report.sections.filter((s) => s.enabled).length === 0) {
      errors.push("At least one section must be enabled.");
    }
  if (step === 4) {
  report.sections
    .filter((s) => s.enabled && s.proof === "required")
    .forEach((sec) => {
      if (!report.screenshots[sec.id]?.length) {
        errors.push(`At least one screenshot is required for "${sec.title}".`);
      }
    });
}
    return { valid: errors.length === 0, errors };
  }, [selectedTemplate, report]);

  const goToStep = useCallback((step: number) => {
    if (step < 1 || step > 7) return;
    setReport((prev) => ({ ...prev, currentStep: step }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const nextStep = useCallback(() => {
    const validation = validateStep(report.currentStep);
    if (!validation.valid) return validation;
    setCompletedSteps((prev) => (prev.includes(report.currentStep) ? prev : [...prev, report.currentStep]));
    const next = report.currentStep + 1;
    if (next <= 7) {
      setReport((prev) => ({ ...prev, currentStep: next }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return { valid: true, errors: [] };
  }, [report.currentStep, validateStep]);

  const prevStep = useCallback(() => {
    const prev = report.currentStep - 1;
    if (prev >= 1) {
      setReport((p) => ({ ...p, currentStep: prev }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [report.currentStep]);

  const resetReport = useCallback(() => {
    if (templates.length > 0) selectTemplate(templates[0].id);
  }, [selectTemplate, templates]);

  return {
    report,
    selectedTemplate,
    completedSteps,
    templates, // ← Make sure this is returned!
    isLoading,
    error,
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
    updateSectionContent,
    addScreenshot,
    removeScreenshot,
    goToStep,
    nextStep,
    prevStep,
    validateStep,
    resetReport,
  };
}