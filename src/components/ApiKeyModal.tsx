import React, { useState } from "react";
import { Sparkles, Key, CheckCircle, X, ExternalLink, ShieldAlert, Cpu } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
  hasEnvKey: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  hasEnvKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setInputKey("");
    onSaveKey("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Gemini AI Configuration</h3>
              <p className="text-xs text-slate-500">Power live clinical symptom triage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status Indicator */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${apiKey || hasEnvKey ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-xs font-semibold text-slate-700">Engine Status</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-white border border-slate-200 text-slate-800">
              {apiKey 
                ? "Custom Gemini Key Active" 
                : hasEnvKey 
                ? "Backend Server Key Active" 
                : "Intelligent Clinical Fallback Mode"}
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-600" />
                  Google Gemini API Key
                </span>
                <span className="text-[11px] text-slate-400">Optional</span>
              </label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Paste your free Google Gemini API key to enable live Gemini 3.8 Flash model evaluations. If omitted, MediFlow AI uses our clinical emergency triage rules engine seamlessly.
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-snug">
                Keys remain private to your session and are proxied securely to Gemini server-side endpoints without client-side exposure.
              </p>
            </div>

            {savedSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                API Key saved successfully!
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Save & Apply Key
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition cursor-pointer"
                >
                  Clear Key
                </button>
              )}
            </div>
          </form>

          <div className="text-center pt-1 border-t border-slate-100">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Get a free Gemini API Key from Google AI Studio
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
