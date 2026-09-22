const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

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
  sections: string; // ✅ Changed from Record<string, boolean> to string
    customSections?: { id: string; title: string }[]; // ✅ ADD THIS

  imageLayout: "perStep" | "architectureOnly" | "combineAll" | "none";
  useGemini: boolean;
    allowMissingProof?: boolean; // ✅ Added to fix TS2339

}

export async function generateReport(
  payload: GenerateReportPayload,
  screenshots: { sectionId: string; file: File; caption?: string }[],
  referenceFile?: File | null,
  referenceText?: string
): Promise<{ document: any }> {
  const formData = new FormData();
  
  formData.append("templateSlug", payload.templateSlug);
  formData.append("meta", JSON.stringify(payload.meta));
  formData.append("sections", payload.sections); // ✅ Already stringified in component
  formData.append("imageLayout", payload.imageLayout);
  formData.append("useGemini", String(payload.useGemini));
  
  if (payload.allowMissingProof) {
    formData.append("allowMissingProof", "true");
  }
  
  if (referenceText) {
    formData.append("referenceText", referenceText);
  }

  // ✅ Field name MUST be "shots" (not "shot" or "screenshot")
  screenshots.forEach((sc) => {
    formData.append("shots", sc.file);
  });

  if (referenceFile) {
    formData.append("reference", referenceFile);
  }

  console.log(" FRONTEND SENDING referenceFile:", referenceFile ? referenceFile.name : "NULL");
  console.log(" FRONTEND SENDING shots count:", screenshots.length);

  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/documents/generate`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Generation failed" }));
    throw new Error(error.error || "Failed to generate document");
  }

  return response.json();
}

export async function downloadDocument(documentId: string): Promise<Blob> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/documents/${documentId}/download`, { headers });
  if (!response.ok) throw new Error("Failed to download document");
  return response.blob();
}