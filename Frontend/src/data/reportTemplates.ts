import { BackendTemplate, Template } from "../types/report";

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
  backendTemplates: BackendTemplate[]
): Template[] {
  return backendTemplates.map((bt) => ({
    id: bt.id,
    slug: bt.slug,
    name: bt.name,
    description: bt.description,
    subject: bt.subject,
    category: SUBJECT_TO_CATEGORY[bt.subject] || "General",
    icon: SUBJECT_TO_ICON[bt.subject] || "📄",
  }));
}