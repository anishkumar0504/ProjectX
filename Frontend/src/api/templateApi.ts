import type { ReportTemplate, ReportSection } from "../types/report";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function fetchTemplates(): Promise<ReportTemplate[]> {
  const response = await fetch(`${API_BASE}/templates`);
  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`);
  }
  const data = await response.json();

  const sectionMap: Record<string, { title: string; description: string }> = {
    aim: { title: "Aim", description: "The primary objective of this practical." },
    objectives: { title: "Objectives", description: "Specific goals to be achieved." },
    services: { title: "Services Used", description: "Cloud or technical services utilized." },
    prerequisites: { title: "Prerequisites", description: "Requirements before starting." },
    architecture: { title: "Architecture Diagram", description: "Visual representation of the setup." },
    steps: { title: "Step-by-Step Implementation", description: "Detailed instructions to follow." },
    verification: { title: "Verification / Testing", description: "Steps to confirm success." },
    expectedOutput: { title: "Expected Output", description: "What the result should look like." },
    conclusion: { title: "Result / Conclusion", description: "Final summary of the practical." },
  };

  return data.templates.map((t: any) => {
    const defaultSections: ReportSection[] = [];
    Object.entries(t.defaultSections || {}).forEach(([key, isEnabled]) => {
      if (isEnabled && sectionMap[key]) {
        defaultSections.push({
          id: key,
          title: sectionMap[key].title,
          description: sectionMap[key].description,
          enabled: true,
                    screenshotRequired: key === "steps" || key === "verification",

          proof: (key === "steps" || key === "verification") ? "required" : "optional", // ✅ Added
          isCustom: false,
          content: "",
        });
      }
    });

    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.subject || "General",
      previewImageUrl: t.previewImageUrl,
      defaultTitle: `Practical: ${t.name}`,
     fields: [
    { id: "studentName", label: "Student Name", type: "text", required: true, defaultValue: "" },
    { id: "prn", label: "PRN", type: "text", required: true, defaultValue: "" },
    { id: "facultyName", label: "Faculty Name", type: "text", required: true, defaultValue: t.defaultMeta?.facultyName || "" },
  ],
      defaultSections,
      headerConfig: {
        institutionName: t.defaultMeta?.school || "D Y Patil International University",
        logoUrl: "/dypiu.png",
      },
      backendContent: t.defaultContent,
    } as ReportTemplate;
  });
}