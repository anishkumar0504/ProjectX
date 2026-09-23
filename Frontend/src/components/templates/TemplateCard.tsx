import React, { useState, useEffect, useRef, useMemo } from "react";
import type { ReportTemplate } from "../../types/report";
import { Check, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface TemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
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
}) => {
  const parsedScreenshots = useMemo(() => {
    if (!template.screenshots) return [];
    if (Array.isArray(template.screenshots)) return template.screenshots;
    if (typeof template.screenshots === "string") {
      try {
        const parsed = JSON.parse(template.screenshots);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn(`[TemplateCard] Failed to parse screenshots for "${template.name}":`, template.screenshots, e);
        return [];
      }
    }
    return [];
  }, [template.screenshots, template.name]);

  const allImageUrls = useMemo(() => {
    const urls: string[] = [];
    const addUrl = (path?: string | null) => {
      const url = getImageUrl(path);
      if (url && !urls.includes(url)) urls.push(url);
    };
    addUrl(template.previewImageUrl);
    parsedScreenshots.forEach(addUrl);

    if (urls.length === 0 && process.env.NODE_ENV !== "production") {
      console.warn(`[TemplateCard] "${template.name}" resolved 0 image URLs.`, {
        previewImageUrl: template.previewImageUrl,
        rawScreenshots: template.screenshots,
        parsedScreenshots,
        IMG_URL,
      });
    }
    return urls;
  }, [template.previewImageUrl, parsedScreenshots, template.name, template.screenshots]);

  const mainImageUrl = allImageUrls[0] || null;
  const hasImages = allImageUrls.length > 0;

  const [hoverIndex, setHoverIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());
  const hoverIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const workingUrls = useMemo(
    () => allImageUrls.filter((u) => !brokenUrls.has(u)),
    [allImageUrls, brokenUrls]
  );
  const hasWorkingImages = workingUrls.length > 0;

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

  const currentDisplayUrl =
    workingUrls.length > 1 ? workingUrls[hoverIndex % workingUrls.length] : workingUrls[0] || null;

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

  // Close zoom on Escape
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
        className={`group relative flex flex-col text-left apple-glass-card rounded-2xl p-4 transition-all hover:scale-[1.02] ${
          isSelected ? "ring-2 ring-black dark:ring-white" : ""
        }`}
      >
        <div className="relative aspect-[3/4] mb-4 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {currentDisplayUrl && hasWorkingImages ? (
            <>
              <img
                src={currentDisplayUrl}
                alt={`${template.name} preview`}
                className="w-full h-full object-cover transition-opacity duration-500"
                loading="lazy"
                onError={() => {
                  console.error(`[TemplateCard] Image 404/failed: ${currentDisplayUrl}`);
                  markBroken(currentDisplayUrl);
                }}
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={openZoom}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-lg transition-all transform hover:scale-105"
                >
                  <Eye className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    {workingUrls.length > 1 ? `View ${workingUrls.length} Images` : "View Image"}
                  </span>
                </button>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center z-10">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-xs text-neutral-500">No preview available</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
              {template.name}
            </h3>
            <span className="text-lg">{template.icon || "📄"}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {template.description}
          </p>
          <div className="pt-2 flex items-center gap-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
              {template.category || template.subject}
            </span>
          </div>
        </div>
      </button>

      {isZoomed && hasWorkingImages && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={closeZoom}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{template.name}</h3>
                <p className="text-sm text-neutral-400">
                  {zoomIndex + 1} of {workingUrls.length} image{workingUrls.length > 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={closeZoom}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close preview"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center p-4">
              <img
                src={workingUrls[zoomIndex]}
                alt={`${template.name} view ${zoomIndex + 1}`}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                onError={() => {
                  const bad = workingUrls[zoomIndex];
                  console.error(`[TemplateCard] Zoomed image failed: ${bad}`);
                  markBroken(bad);
                  setZoomIndex((z) => Math.max(0, z - 1));
                }}
              />

              {workingUrls.length > 1 && (
                <>
                  <button
                    onClick={prevZoom}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextZoom}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {workingUrls.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center overflow-x-auto pb-2">
                {workingUrls.map((url, idx) => (
                  <button
                    key={url}
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomIndex(idx);
                    }}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      idx === zoomIndex
                        ? "border-white scale-110"
                        : "border-white/20 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-24 h-16 object-cover" />
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