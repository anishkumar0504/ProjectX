import React from "react";
import { ReportState, ReportTemplate } from "../../types/report";
import { A4Page } from "./A4Page";
import { GraduationCap, ShieldCheck, Image as ImageIcon } from "lucide-react";

interface TemplateRendererProps {
  template: ReportTemplate;
  report: ReportState;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  template,
  report,
}) => {
  const enabledSections = report.sections.filter((s) => s.enabled);
  const formData = report.formData;

  const hasMultiplePages = enabledSections.length > 3;
  const page1Sections = hasMultiplePages ? enabledSections.slice(0, 3) : enabledSections;
  const page2Sections = hasMultiplePages ? enabledSections.slice(3) : [];
  const totalPages = hasMultiplePages ? 2 : 1;

  const headerConfig = template.headerConfig;

  const renderSection = (sec: typeof enabledSections[0], index: number) => {
    const screenshots = report.screenshots[sec.id] || [];

    return (
      <div key={sec.id} className="mb-6 last:mb-0">
        <div className="flex items-center gap-2 border-b-2 border-black pb-1 mb-2.5">
          <span className="text-xs font-bold font-mono px-1.5 py-0.5 bg-black text-white rounded-xs">
            {index + 1}
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-black font-sans">
            {sec.title}
          </h3>
        </div>

        {/* Section Text */}
        <div className="text-xs leading-relaxed text-neutral-800 font-serif whitespace-pre-wrap pl-1">
          {sec.content ? (
            sec.content
          ) : (
            <span className="italic text-neutral-400">
              [No content provided for {sec.title}]
            </span>
          )}
        </div>

        {/* Screenshots for this section if any */}
        {screenshots.length > 0 && (
          <div className="mt-3 pl-1 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {screenshots.map((sc, scIdx) => (
                <div
                  key={sc.id}
                  className="border border-neutral-300 rounded p-1.5 bg-neutral-50 text-center"
                >
                  <img
                    src={sc.dataUrl}
                    alt={sc.name}
                    className="max-h-48 w-full object-contain rounded border border-neutral-200 bg-white"
                  />
                  <p className="text-[10px] font-sans font-medium text-neutral-600 mt-1">
                    Figure {index + 1}.{scIdx + 1}: {sc.caption || sc.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder warning if screenshot is required but missing */}
        {sec.screenshotRequired && screenshots.length === 0 && (
          <div className="mt-2.5 p-2 rounded border border-dashed border-neutral-300 bg-neutral-50 text-neutral-700 text-[11px] flex items-center gap-2 font-sans">
            <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
            <span>
              [Verification Output / Screenshot required for {sec.title}]
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 print:space-y-0">
      {/* PAGE 1 */}
      <A4Page
        pageNumber={1}
        totalPages={totalPages}
        headerText={`${headerConfig.institutionName} • ${template.name}`}
        footerText={`${headerConfig.departmentName} • ${formData["academicYear"] || "2025-2026"}`}
      >
        {/* Institutional Academic Header */}
        <div className="border-b-2 border-black pb-4 mb-5 text-center relative">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center bg-neutral-100 text-black">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-black font-serif uppercase">
                {headerConfig.institutionName}
              </h1>
              <h2 className="text-xs sm:text-sm font-semibold text-neutral-700 font-sans tracking-wide">
                {headerConfig.departmentName}
              </h2>
            </div>
          </div>

          {headerConfig.subHeader && (
            <p className="text-[10px] text-neutral-500 italic max-w-xl mx-auto font-serif">
              {headerConfig.subHeader}
            </p>
          )}

          <div className="mt-2 inline-block px-3 py-0.5 bg-black text-white text-[10px] font-bold tracking-widest uppercase rounded-xs font-sans">
            {headerConfig.reportTypeBadge || "ACADEMIC REPORT"}
          </div>
        </div>

        {/* Experiment / Project Title Banner */}
        <div className="bg-neutral-100 border border-neutral-300 rounded p-3 mb-5 text-center">
          {formData["experimentNumber"] && (
            <div className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest font-sans mb-0.5">
              EXPERIMENT NO. {formData["experimentNumber"]}
            </div>
          )}
          <h2 className="text-base sm:text-lg font-bold text-black font-serif tracking-tight">
            {report.title || template.defaultTitle || "Untitled Academic Report"}
          </h2>
        </div>

        {/* Metadata Grid / Table based on template fields */}
        <div className="border border-neutral-300 rounded overflow-hidden mb-6 text-xs font-sans">
          <div className="grid grid-cols-2 divide-x divide-y divide-neutral-300 bg-white">
            {template.fields.map((field) => {
              const val = formData[field.id] || "—";
              return (
                <div key={field.id} className="p-2 flex items-baseline justify-between gap-2">
                  <span className="font-bold text-neutral-600 text-[11px] uppercase tracking-wide">
                    {field.label}:
                  </span>
                  <span className="font-semibold text-black text-right truncate">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Page 1 Sections */}
        <div className="flex-1">
          {page1Sections.map((sec, idx) => renderSection(sec, idx))}
        </div>

        {/* Verification Signatures at bottom of page 1 if single-page */}
        {!hasMultiplePages && (
          <div className="mt-8 pt-4 border-t border-neutral-300 grid grid-cols-2 text-center text-xs font-sans">
            <div>
              <div className="h-10"></div>
              <p className="font-bold text-black border-t border-neutral-400 pt-1 mx-8">
                {formData["studentName"] || "Student Signature"}
              </p>
              <p className="text-[10px] text-neutral-500">Candidate</p>
            </div>
            <div>
              <div className="h-10"></div>
              <p className="font-bold text-black border-t border-neutral-400 pt-1 mx-8">
                {formData["facultyName"] || "Faculty / Guide Signature"}
              </p>
              <p className="text-[10px] text-neutral-500">Department Examiner</p>
            </div>
          </div>
        )}
      </A4Page>

      {/* PAGE 2 (If content spans onto page 2) */}
      {hasMultiplePages && (
        <A4Page
          pageNumber={2}
          totalPages={2}
          headerText={`${report.title || template.name} • Continued`}
          footerText={`${headerConfig.departmentName} • Academic Year ${formData["academicYear"] || "2025-2026"}`}
        >
          <div className="flex-1">
            {page2Sections.map((sec, idx) => renderSection(sec, idx + page1Sections.length))}
          </div>

          {/* Academic Sign-off Section */}
          <div className="mt-12 pt-6 border-t border-neutral-300 grid grid-cols-2 text-center text-xs font-sans">
            <div>
              <div className="h-12 flex items-center justify-center text-neutral-400 font-serif italic">
                (Signed electronically)
              </div>
              <p className="font-bold text-black border-t border-neutral-400 pt-1 mx-8">
                {formData["studentName"] || "Student Signature"}
              </p>
              <p className="text-[10px] text-neutral-500">Candidate / Student</p>
            </div>
            <div>
              <div className="h-12 flex items-center justify-center text-black font-serif italic font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600 inline" /> Verified Record
              </div>
              <p className="font-bold text-black border-t border-neutral-400 pt-1 mx-8">
                {formData["facultyName"] || "Faculty In-Charge / Guide"}
              </p>
              <p className="text-[10px] text-neutral-500">Department Faculty</p>
            </div>
          </div>
        </A4Page>
      )}
    </div>
  );
};
