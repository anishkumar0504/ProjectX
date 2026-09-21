import React, { useCallback, useEffect, useState } from "react";
import { Upload, X, Image as ImageIcon, FileImage } from "lucide-react";

export interface ScreenshotFile {
  id: string;
  file: File;
  preview: string;
}

interface ScreenshotUploaderProps {
  screenshots: ScreenshotFile[];
  onAdd: (files: ScreenshotFile[]) => void;
  onRemove: (id: string) => void;
}

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({
  screenshots,
  onAdd,
  onRemove,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      screenshots.forEach((sc) => URL.revokeObjectURL(sc.preview));
    };
  }, [screenshots]);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const validFiles: ScreenshotFile[] = [];
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

      Array.from(files).forEach((file) => {
        if (allowedTypes.includes(file.type)) {
          validFiles.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: URL.createObjectURL(file),
          });
        } else {
          alert(`File "${file.name}" is not a supported image format (PNG, JPG, WEBP).`);
        }
      });

      if (validFiles.length > 0) {
        onAdd(validFiles);
      }
    },
    [onAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
          <FileImage className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
            Verification Screenshots
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Upload all your screenshots. Gemini will automatically place them in the correct steps.
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-500/5"
            : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
        }`}
      >
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
          id="screenshot-upload"
        />
        <label htmlFor="screenshot-upload" className="cursor-pointer flex flex-col items-center">
          <Upload className="w-8 h-8 text-neutral-400 mb-2" />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            PNG, JPG, or WEBP (Max 20 images)
          </p>
        </label>
      </div>

      {/* Preview Grid */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {screenshots.map((sc) => (
            <div
              key={sc.id}
              className="group relative bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden transition-all hover:shadow-md"
            >
              {/* Image Preview */}
              <div className="aspect-video w-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                <img
                  src={sc.preview}
                  alt={sc.file.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* File Info & Delete Button */}
              <div className="p-2.5">
                <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {sc.file.name}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {(sc.file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => onRemove(sc.id)}
                className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                title="Remove screenshot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* "Add More" Tile */}
          <label
            htmlFor="screenshot-upload"
            className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 cursor-pointer transition-colors bg-black/5 dark:bg-white/5"
          >
            <ImageIcon className="w-6 h-6 text-neutral-400 mb-1" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Add More
            </span>
          </label>
        </div>
      )}
    </div>
  );
};