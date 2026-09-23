import React, { useEffect } from "react";
import { X, FileText, Eye, Settings, Ticket, History, Sparkles } from "lucide-react";

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  {
    icon: <FileText className="w-5 h-5 text-blue-500" />,
    title: "Custom Templates",
    desc: "Upload your own college PDF formats and we'll match them perfectly.",
  },
  {
    icon: <Eye className="w-5 h-5 text-purple-500" />,
    title: "Context Previews",
    desc: "See exactly what ProjectX is going to add to your PDF before generating.",
  },
  {
    icon: <Settings className="w-5 h-5 text-emerald-500" />,
    title: "Advanced Customizations",
    desc: "More fonts, spacing controls, and layout options for your reports.",
  },
  {
    icon: <Ticket className="w-5 h-5 text-amber-500" />,
    title: "Promo Codes & Offers",
    desc: "Exclusive student discounts, seasonal offers, and referral rewards.",
  },
  {
    icon: <History className="w-5 h-5 text-rose-500" />,
    title: "Generation History",
    desc: "Access a complete record of all your previously generated documents.",
  },
];

export const UpdatesModal: React.FC<UpdatesModalProps> = ({ isOpen, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              What's Coming to ProjectX
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            We are constantly building to make your lab reports faster and better. 
            Here is what is currently in our pipeline:
          </p>
          
          <div className="grid gap-3">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-black/5 dark:border-white/5 hover:border-violet-500/30 dark:hover:border-violet-500/30 transition-colors"
              >
                <div className="mt-0.5 p-2 rounded-lg bg-white dark:bg-neutral-900 shadow-sm">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};