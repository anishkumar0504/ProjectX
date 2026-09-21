export interface ReportSection {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  screenshotRequired: boolean;
    proof: "required" | "optional"; // ✅ REPLACES screenshotRequired

  isCustom?: boolean;
  content?: string;
    prompt?: string;               // For Gemini generation of custom sections

}

export interface ReportTemplate {
  id: string;
  slug: string; // Added for backend API mapping
  name: string;
  description: string;
  category: string;
    previewImageUrl?: string; // ← Add this

  defaultTitle: string;
  fields: { id: string; label: string; type: string; required: boolean; defaultValue?: string }[];
  defaultSections: ReportSection[];
  headerConfig: {
    institutionName: string;
    logoUrl?: string;
  };
  backendContent?: any; // Holds the raw defaultContent from backend
}

export interface ScreenshotFile {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  caption?: string;
}
export interface GenerateReportPayload {
  templateSlug: string;
  meta: {
    studentName: string;
    prn: string;
    facultyName: string;
    title: string;
    subject?: string;
    program?: string;
    school?: string;
    namePrefix?: string;
  };
  sections: string;              // ✅ JSON.stringify(array) - NOT Record<string, boolean>
  imageLayout: "perStep" | "architectureOnly" | "combineAll" | "none";
  useGemini: boolean;
  allowMissingProof?: boolean;   // Optional override for proof validation
}
export interface ReportState {
  templateId: string;
  formData: Record<string, string>;
  title: string;
  sections: ReportSection[];
  screenshots: Record<string, ScreenshotFile[]>;
  currentStep: number;
  customHeaderConfig?: Partial<TemplateHeaderConfig>;
}

export interface TemplateHeaderConfig {
  institutionName: string;
  logoUrl?: string;
}

export interface GeneratedDocumentResponse {
  id: string;
  status: string;
  meta: any;
  hasOutput: boolean;
}