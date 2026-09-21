export interface ReportSection {
  id: string;
  type?: string; // ✅ Added for custom section handling
  title: string; // ✅ MUST be here
  description: string;
  enabled: boolean;
  screenshotRequired?: boolean; // ✅ Made optional to avoid conflict with 'proof'
  proof?: "required" | "optional"; 
  isCustom?: boolean;
  content?: string;
  prompt?: string;
}

export interface ReportTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  previewImageUrl?: string;
  defaultTitle: string;
  fields: { id: string; label: string; type: string; required: boolean; defaultValue?: string }[];
  defaultSections: ReportSection[];
  headerConfig: {
    institutionName: string;
    logoUrl?: string;
    departmentName?: string;      // ✅ Added for TemplateRenderer
    subHeader?: string;           // ✅ Added for TemplateRenderer
    reportTypeBadge?: string;     // ✅ Added for TemplateRenderer
  };
  backendContent?: any;
  icon?: string;                  // ✅ Added for TemplateCard
  badge?: string;                 // ✅ Added for TemplatePreview
}

export interface ScreenshotFile {
  id: string;
  file?: File;                    // ✅ Added for ScreenshotUploader
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
  sections: string;               // ✅ Changed to string (JSON.stringify)
  imageLayout: "perStep" | "architectureOnly" | "combineAll" | "none";
  useGemini: boolean;
  allowMissingProof?: boolean;    // ✅ Added for validation override
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
  departmentName?: string;
  subHeader?: string;
  reportTypeBadge?: string;
}

export interface GeneratedDocumentResponse {
  id: string;
  status: string;
  meta: any;
  hasOutput: boolean;
  pdfUrl?: string;
  docxUrl?: string;
  reportId?: string;
    filename?: string; // ✅ Added to fix GeneratedReport.tsx error

}


// If DynamicFormProps is defined in this file, add this:
export interface DynamicFormProps {
  template: ReportTemplate;
  formData: Record<string, string>;
  title: string;
  onTitleChange: (title: string) => void;
  onFieldChange: (fieldId: string, value: string) => void;
  onHeaderConfigChange?: (updates: Partial<TemplateHeaderConfig>) => void; // ✅ Added
  validationErrors: string[];
}

// ✅ Type Aliases for backward compatibility with your imports
export type BackendTemplate = ReportTemplate;
export type Template = ReportTemplate;
export type GeneratedReportResponse = GeneratedDocumentResponse;