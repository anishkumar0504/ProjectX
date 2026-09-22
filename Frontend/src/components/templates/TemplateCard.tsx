import React, { useState, useEffect, useRef } from "react";
import type { ReportTemplate } from "../../types/report";
import { Check, X, ChevronLeft, ChevronRight, ZoomIn, Images } from "lucide-react";

interface TemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL;

const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return null;
  const backendUrl = API_URL.replace(/\/api\/?$/, "");
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${backendUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  // ✅ Fallback to the first screenshot if previewImageUrl is missing
  const mainImageUrl = getImageUrl(template.previewImageUrl || template.screenshots?.[0]);
  const screenshotUrls = (template.screenshots || []).map(getImageUrl).filter(Boolean);
  
  const [hoverIndex, setHoverIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const hoverIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Hover sliding logic
  const startHoverSlide = () => {
    if (screenshotUrls.length > 1) {
      hoverIntervalRef.current = setInterval(() => {
        setHoverIndex((prev) => (prev + 1) % screenshotUrls.length);
      }, 1500); // Slides every 1.5 seconds
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

  const currentDisplayUrl = screenshotUrls.length > 1 
    ? screenshotUrls[hoverIndex] 
    : mainImageUrl;

  const openZoom = (index: number = 0) => {
    setZoomIndex(index);
    setIsZoomed(true);
  };

  const closeZoom = () => setIsZoomed(false);
  const nextZoom = () => setZoomIndex((prev) => (prev + 1) % screenshotUrls.length);
  const prevZoom = () => setZoomIndex((prev) => (prev - 1 + screenshotUrls.length) % screenshotUrls.length);

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
        {/* Preview Image Container */}
        <div className="relative aspect-[3/4] mb-4 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {currentDisplayUrl ? (
            <>
              <img
                src={currentDisplayUrl}
                alt={`${template.name} preview`}
                className="w-full h-full object-cover transition-opacity duration-500"
                loading="lazy"
              />
              
              {/* Hover Overlay for Zoom & Slide Indicator */}
              <div 
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card selection when clicking zoom
                  openZoom(hoverIndex);
                }}
              >
                <button
                  type="button"
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                  title="Zoom preview"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                {screenshotUrls.length > 1 && (
                  <span className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    {hoverIndex + 1}/{screenshotUrls.length}
                  </span>
                )}
              </div>

              {/* Selection Indicator */}
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

        {/* Template Info */}
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

      {/* ✅ Zoom Modal */}
      {isZoomed && screenshotUrls.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
          onClick={closeZoom}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={closeZoom}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Zoomed Image */}
            <div className="relative bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 aspect-[4/3]">
              <img
                src={screenshotUrls[zoomIndex]}
                alt={`${template.name} screenshot ${zoomIndex + 1}`}
                className="w-full h-full object-contain"
              />
              
              {screenshotUrls.length > 1 && (
                <>
                  <button
                    onClick={prevZoom}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextZoom}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {screenshotUrls.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center overflow-x-auto pb-2">
                {screenshotUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setZoomIndex(idx)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      idx === zoomIndex
                        ? "border-white scale-110"
                        : "border-white/20 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-20 h-12 object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-center text-sm text-white mt-4 font-medium">{template.name}</p>
            <p className="text-center text-xs text-neutral-400">
              {zoomIndex + 1} of {screenshotUrls.length} screenshots
            </p>
          </div>
        </div>
      )}
    </>
  );
};