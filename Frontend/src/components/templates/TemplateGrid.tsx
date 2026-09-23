import React, { useState } from "react";
import type { ReportTemplate } from "../../types/report";
import { TemplateCard } from "./TemplateCard";
import { Search, Sparkles } from "lucide-react";

interface TemplateGridProps {
  templates?: ReportTemplate[]; // Made optional
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  isLoading?: boolean;
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({
  templates = [], // Default to empty array to prevent .map() crashes
  selectedTemplateId,
  onSelectTemplate,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Safely map over templates (fallback to [] if undefined)
  const safeTemplates = templates || [];
  const categories = ["All", ...Array.from(new Set(safeTemplates.map((t) => t.category)))];

  const filteredTemplates = safeTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
        <span className="ml-3 text-sm text-neutral-500">Loading templates from server...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full apple-input text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "apple-pill-active"
                  : "bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/15"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
       {filteredTemplates.map((template) => {
  return (
    <TemplateCard
      key={template.id}
      template={template}
      isSelected={selectedTemplateId === template.id}
      onSelect={onSelectTemplate}
    />
  );
})}
      </div>

      {filteredTemplates.length === 0 && !isLoading && (
        <div className="text-center py-12 apple-glass-card rounded-2xl">
          <Sparkles className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            No templates matching "{searchQuery}"
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Try resetting your search filters to see all templates.
          </p>
        </div>
      )}
    </div>
  );
};