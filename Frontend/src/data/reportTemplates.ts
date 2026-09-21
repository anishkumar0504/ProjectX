import { ReportTemplate } from "../types/report";

// Map subjects to categories and icons for the frontend
const SUBJECT_TO_CATEGORY: Record<string, string> = {
  "Cloud Architecture and Services": "Cloud Computing",
  "Database Management": "Database",
  "Network Security": "Security",
  "Web Development": "Web",
};

const SUBJECT_TO_ICON: Record<string, string> = {
  "Cloud Architecture and Services": "☁️",
  "Database Management": "🗄️",
  "Network Security": "🔒",
  "Web Development": "🌐",
};

export function transformBackendTemplates(
  backendTemplates: any[] // ✅ Changed to any[] to allow access to .subject
): ReportTemplate[] {
  return backendTemplates.map((bt) => ({
    id: bt.id,
    slug: bt.slug,
    name: bt.name,
    description: bt.description,
    category: SUBJECT_TO_CATEGORY[bt.subject] || "General",
    icon: SUBJECT_TO_ICON[bt.subject] || "📄",
    previewImageUrl: bt.previewImageUrl,
    defaultTitle: `Practical: ${bt.name}`, // ✅ Added required property
    fields: [ // ✅ Added required property
      { id: "studentName", label: "Student Name", type: "text", required: true, defaultValue: "" },
      { id: "prn", label: "PRN", type: "text", required: true, defaultValue: "" },
      { id: "facultyName", label: "Faculty Name", type: "text", required: true, defaultValue: bt.defaultMeta?.facultyName || "" },
    ],
    defaultSections: [], // ✅ Added required property
    headerConfig: { // ✅ Added required property
      institutionName: bt.defaultMeta?.school || "D Y Patil International University",
      logoUrl: "/dypiu.png",
    },
    backendContent: bt.defaultContent,
  }));
}