import React, { useRef } from "react";
import { Upload, FileText, X, MessageSquare } from "lucide-react";

interface ReferenceUploaderProps {
  referenceFile: File | null;
  referenceText: string;
  onFileChange: (file: File | null) => void;
  onTextChange: (text: string) => void;
}

export const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({
  referenceFile,
  referenceText,
  onFileChange,
  onTextChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.name.endsWith(".docx")) {

      onFileChange(file);
    } else if (file) {
      alert("Please upload a .docx file");
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* DOCX Upload Section */}
      <div className="apple-glass-card rounded-2xl p-6 border border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              Upload Reference Steps (Optional)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Upload your own .docx file with steps/notes. ProjectX AI will use this as the source of truth.
            </p>
          </div>
        </div>

        {!referenceFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
          >
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Click to upload .docx file
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Your steps will be preserved exactly as written
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {referenceFile.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {(referenceFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Additional Instructions Text Area */}
      <div className="apple-glass-card rounded-2xl p-6 border border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              Additional Instructions (Optional)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Add extra context or requirements for ProjectX AI to consider.
            </p>
          </div>
        </div>

        <textarea
          value={referenceText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Example: &#10;- Focus on security best practices&#10;- Use t3.micro instances only&#10;- Include cost estimation&#10;- Emphasize VPC peering over VPN..."
          className="w-full h-40 px-4 py-3 text-sm rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all resize-none"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-right">
          {referenceText.length} characters
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>💡 Tip:</strong> If you upload a DOCX, ProjectX AI will follow your steps exactly. 
          The additional instructions will help ProjectX AI enhance other sections like Aim, Objectives, 
          and Verification. Both fields are optional - leave them empty for automatic generation.
        </p>
      </div>
    </div>
  );
};