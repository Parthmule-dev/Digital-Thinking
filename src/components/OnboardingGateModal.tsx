import React, { useState } from "react";
import { UserSession } from "../types";
import { Activity, ShieldCheck, UserCheck, HeartPulse, Clock, Sparkles } from "lucide-react";

interface OnboardingGateModalProps {
  isOpen: boolean;
  onComplete: (session: UserSession) => void;
  initialName?: string;
  initialAge?: number;
}

export const OnboardingGateModal: React.FC<OnboardingGateModalProps> = ({
  isOpen,
  onComplete,
  initialName = "",
  initialAge,
}) => {
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState<string>(initialAge ? String(initialAge) : "");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const parsedAge = parseInt(age, 10);

    if (!cleanName) {
      setError("Please enter your full name to proceed with clinic check-in.");
      return;
    }

    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 125) {
      setError("Please enter a valid age between 1 and 125.");
      return;
    }

    // Generate unique token for the session
    const randomTokenNum = 104;
    const session: UserSession = {
      name: cleanName,
      age: parsedAge,
      phone: phone.trim() || "+1 555-019-8822",
      patientId: `user-p-${Date.now()}`,
      tokenNumber: `#A-${randomTokenNum}`,
      registeredAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    onComplete(session);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                <HeartPulse className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">MediFlow AI</h2>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-white/20 rounded-full border border-white/30 text-white">
                    Smart Triage
                  </span>
                </div>
                <p className="text-xs text-sky-100 mt-0.5">Express Digital Clinic Check-In</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-400/25 text-emerald-50 border border-emerald-300/30">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                Clinic Open
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-7">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-500" />
              Mandatory Patient Registration
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Please enter your details to generate your digital live queue token and enable AI triage.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Full Patient Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Patient Age <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="125"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. 29"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Mobile / WhatsApp <span className="text-slate-400 text-[10px] lowercase">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-019-8822"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Quick Demo Pre-fills */}
            <div className="pt-2">
              <p className="text-[11px] font-medium text-slate-400 mb-2">Quick demo identities:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setName("Sarah Connor");
                    setAge("32");
                    setPhone("+1 555-014-9921");
                    setError("");
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium"
                >
                  Sarah Connor (32)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName("David Miller");
                    setAge("45");
                    setPhone("+1 555-018-3344");
                    setError("");
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium"
                >
                  David Miller (45)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName("Maya Lin");
                    setAge("19");
                    setPhone("+1 555-011-7788");
                    setError("");
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium"
                >
                  Maya Lin (19)
                </button>
              </div>
            </div>

            {/* Feature preview notes */}
            <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-100/80 flex items-start gap-3 mt-4">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-xs text-sky-900">
                <p className="font-semibold">Instant Live Token & AI Triage</p>
                <p className="text-sky-700/90 mt-0.5 text-[11px] leading-relaxed">
                  Your token assigns an active live queue position with real-time wait estimation and pre-filled WhatsApp alert simulation.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/20 hover:shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              Check In & Get Live Token #A-104
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
