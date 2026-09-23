import React, { useState, useEffect, useRef, useMemo } from "react";
import type { ReportTemplate } from "../../types/report";
import { Check, X, ChevronLeft, ChevronRight, Eye, MoreVertical } from "lucide-react";

interface TemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
  onOptionsClick?: (e: React.MouseEvent, template: ReportTemplate) => void;
}

const IMG_URL = import.meta.env.VITE_IMG_URL || "http://localhost:4000";

const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath || typeof imagePath !== "string" || imagePath.trim() === "") return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  const baseUrl = IMG_URL.replace(/\/$/, "");
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${baseUrl}${path}`;
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  onOptionsClick,
}) => {
  const parsedScreenshots = useMemo(() => {
    if (!template.screenshots) return [];
    if (Array.isArray(template.screenshots)) return template.screenshots;
    if (typeof template.screenshots === "string") {
      try {
        const parsed = JSON.parse(template.screenshots);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [template.screenshots]);

  const allImageUrls = useMemo(() => {
    const urls: string[] = [];
    const addUrl = (path?: string | null) => {
      const url = getImageUrl(path);
      if (url && !urls.includes(url)) urls.push(url);
    };
    addUrl(template.previewImageUrl);
    parsedScreenshots.forEach(addUrl);
    return urls;
  }, [template.previewImageUrl, parsedScreenshots]);

  const [hoverIndex, setHoverIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());
  const hoverIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const workingUrls = useMemo(
    () => allImageUrls.filter((u) => !brokenUrls.has(u)),
    [allImageUrls, brokenUrls]
  );

  const startHoverSlide = () => {
    if (workingUrls.length > 1) {
      hoverIntervalRef.current = setInterval(() => {
        setHoverIndex((prev) => (prev + 1) % workingUrls.length);
      }, 1500);
    }
  };

  const stopHoverSlide = () => {
    if (hoverIntervalRef.current) clearInterval(hoverIntervalRef.current);
    setHoverIndex(0);
  };

  useEffect(() => {
    return () => {
      if (hoverIntervalRef.current) clearInterval(hoverIntervalRef.current);
    };
  }, []);

  const currentDisplayUrl = workingUrls.length > 0 ? workingUrls[hoverIndex % workingUrls.length] : null;

  const markBroken = (url: string) => {
    setBrokenUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const openZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomIndex(0);
    setIsZoomed(true);
  };

  const closeZoom = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
  };

  const nextZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomIndex((prev) => (prev + 1) % workingUrls.length);
  };

  const prevZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomIndex((prev) => (prev - 1 + workingUrls.length) % workingUrls.length);
  };

  useEffect(() => {
    if (!isZoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsZoomed(false);
      if (e.key === "ArrowRight") setZoomIndex((p) => (p + 1) % workingUrls.length);
      if (e.key === "ArrowLeft") setZoomIndex((p) => (p - 1 + workingUrls.length) % workingUrls.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isZoomed, workingUrls.length]);

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(template.id)}
        onMouseEnter={startHoverSlide}
        onMouseLeave={stopHoverSlide}
        className={`group relative flex flex-col text-left apple-glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all hover:scale-[1.02] ${
          isSelected ? "ring-2 ring-black dark:ring-white" : ""
        }`}
      >
        {/* Image Container with Responsive Aspect Ratio */}
        <div className="relative aspect-[4/5] sm:aspect-[3/4] mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {currentDisplayUrl ? (
            <>
              <img
                src={currentDisplayUrl}
                alt={`${template.name} preview`}
                className="w-full h-full object-cover transition-opacity duration-500"
                loading="lazy"
                onError={() => markBroken(currentDisplayUrl)}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 sm:gap-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openZoom}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openZoom(e as unknown as React.MouseEvent);
                    }
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-lg transition-all transform hover:scale-105 cursor-pointer"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-semibold">
                    {workingUrls.length > 1 ? `View ${workingUrls.length}` : "View"}
                  </span>
                </div>
              </div>

              {/* Top Right Controls */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                {isSelected && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                )}
                {onOptionsClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOptionsClick(e, template);
                    }}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-black/10 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
                    aria-label="Template options"
                  >
                    <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-2 sm:p-4">
                <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">🖼️</div>
                <p className="text-[10px] sm:text-xs text-neutral-500">No preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white leading-tight line-clamp-1">
              {template.name}
            </h3>
            <span className="text-base sm:text-lg flex-shrink-0">{template.icon || "📄"}</span>
          </div>
          <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {template.description}
          </p>
          <div className="pt-1 sm:pt-2 flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
              {template.category || "General"}
            </span>
          </div>
        </div>
      </button>

      {/* Compact Responsive Zoom Modal */}
      {isZoomed && workingUrls.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4"
          onClick={closeZoom}
        >
          <div className="relative w-full max-w-3xl sm:max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-2 sm:mb-4 px-1">
              <div>
                <h3 className="text-sm sm:text-xl font-semibold text-white truncate pr-4">{template.name}</h3>
                <p className="text-[10px] sm:text-sm text-neutral-400">
                  {zoomIndex + 1} of {workingUrls.length}
                </p>
              </div>
              <button
                onClick={closeZoom}
                className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
                aria-label="Close preview"
              >
                <X className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center p-2 sm:p-4">
              <img
                src={workingUrls[zoomIndex]}
                alt={`${template.name} view ${zoomIndex + 1}`}
                className="max-w-full max-h-[60vh] sm:max-h-[75vh] object-contain rounded-md sm:rounded-lg"
                onError={() => {
                  const bad = workingUrls[zoomIndex];
                  markBroken(bad);
                  setZoomIndex((z) => Math.max(0, z - 1));
                }}
              />

              {workingUrls.length > 1 && (
                <>
                  <button
                    onClick={prevZoom}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={nextZoom}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {workingUrls.length > 1 && (
              <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4 justify-center overflow-x-auto pb-2 px-1">
                {workingUrls.map((url, idx) => (
                  <button
                    key={url}
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomIndex(idx);
                    }}
                    className={`relative rounded-md sm:rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      idx === zoomIndex
                        ? "border-white scale-105"
                        : "border-white/20 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-16 h-12 sm:w-24 sm:h-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};