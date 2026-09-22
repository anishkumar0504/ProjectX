import React, { useState, useEffect, useRef, useMemo } from "react";
import type { ReportTemplate } from "../../types/report";
import { Check, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface TemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const backendUrl = API_URL.replace(/\/api\/?$/, "");
  return `${backendUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  // ✅ FIX: Parse screenshots if it's a string (from database)
  const parsedScreenshots = useMemo(() => {
    if (!template.screenshots) return [];
    if (Array.isArray(template.screenshots)) return template.screenshots;
    // If it's a string, parse it as JSON
    try {
      return JSON.parse(template.screenshots as string);
    } catch {
      return [];
    }
  }, [template.screenshots]);

  // ✅ Combine previewImageUrl and screenshots
  const allImageUrls = useMemo(() => {
    const urls: string[] = [];
    const addUrl = (path?: string | null) => {
      if (!path) return;
      const url = getImageUrl(path);
      if (url && !urls.includes(url)) {
        urls.push(url);
      }
    };
    
    addUrl(template.previewImageUrl);
    parsedScreenshots.forEach(addUrl);
    return urls;
  }, [template.previewImageUrl, parsedScreenshots]);

  const mainImageUrl = allImageUrls[0] || null;
  const hasImages = allImageUrls.length > 0;
  
  const [hoverIndex, setHoverIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const hoverIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHoverSlide = () => {
    if (allImageUrls.length > 1) {
      hoverIntervalRef.current = setInterval(() => {
        setHoverIndex((prev) => (prev + 1) % allImageUrls.length);
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

  const currentDisplayUrl = allImageUrls.length > 1 
    ? allImageUrls[hoverIndex] 
    : mainImageUrl;

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
    setZoomIndex((prev) => (prev + 1) % allImageUrls.length);
  };

  const prevZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomIndex((prev) => (prev - 1 + allImageUrls.length) % allImageUrls.length);
  };

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
          {currentDisplayUrl ? (
            <>
              <img
                src={currentDisplayUrl}
                alt={`${template.name} preview`}
                className="w-full h-full object-cover transition-opacity duration-500"
                loading="lazy"
                onError={(e) => {
                  // ✅ Handle broken images gracefully
                  console.error("Failed to load image:", currentDisplayUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {hasImages && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={openZoom}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-neutral-900 shadow-lg transition-all transform hover:scale-105"
                    title="View image(s)"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      {allImageUrls.length > 1 ? `View ${allImageUrls.length} Images` : "View Image"}
                    </span>
                  </button>
                </div>
              )}

              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center z-10">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 mx-auto mb-2" />
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mx-auto" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
              {template.name}
            </h3>
            <span className="text-lg">{template.icon}</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {template.description}
          </p>
          <div className="pt-2 flex items-center gap-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
              {template.category}
            </span>
          </div>
        </div>
      </button>

      {isZoomed && hasImages && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" 
          onClick={closeZoom}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{template.name}</h3>
                <p className="text-sm text-neutral-400">
                  {zoomIndex + 1} of {allImageUrls.length} image{allImageUrls.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={closeZoom}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close preview"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center p-4">
              <img
                src={allImageUrls[zoomIndex]}
                alt={`${template.name} view ${zoomIndex + 1}`}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                onError={() => {
                  console.error("Failed to load zoomed image:", allImageUrls[zoomIndex]);
                }}
              />
              
              {allImageUrls.length > 1 && (
                <>
                  <button
                    onClick={prevZoom}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                    title="Previous"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextZoom}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                    title="Next"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {allImageUrls.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center overflow-x-auto pb-2">
                {allImageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomIndex(idx);
                    }}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      idx === zoomIndex
                        ? "border-white scale-110"
                        : "border-white/20 opacity-50 hover:opacity-100"
                    }`}
                    title={`View image ${idx + 1}`}
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