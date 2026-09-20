import React, { useState } from "react";
import { Megaphone, Clock, AlertTriangle, X, Radio } from "lucide-react";

interface DelayBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendBroadcast: (message: string, delayMinutes?: number) => void;
}

export const DelayBroadcastModal: React.FC<DelayBroadcastModalProps> = ({
  isOpen,
  onClose,
  onSendBroadcast,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(15);
  const [customText, setCustomText] = useState("Doctor attending to emergency trauma triage in Room 101. Thank you for your patience.");

  if (!isOpen) return null;

  const presets = [
    { mins: 10, label: "+10 Mins", desc: "Minor shift handover delay" },
    { mins: 15, label: "+15 Mins", desc: "Incoming emergency priority case" },
    { mins: 30, label: "+30 Mins", desc: "Complex surgical consultation in progress" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onSendBroadcast(customText.trim(), selectedPreset ?? undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Send Clinic Broadcast Delay</h3>
              <p className="text-xs text-slate-500">Notifies all waiting patients instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Estimated Delay Time
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {presets.map((p) => {
                const isSelected = selectedPreset === p.mins;
                return (
                  <button
                    type="button"
                    key={p.mins}
                    onClick={() => {
                      setSelectedPreset(p.mins);
                      setCustomText(`Clinic Notice: Approximately ${p.mins}-minute consultation delay due to urgent clinical requirements.`);
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{p.label}</span>
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Broadcast Message Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Broadcast Notice Text</span>
              <span className="text-[11px] text-slate-400 font-normal">Shown on all patient screens</span>
            </label>
            <textarea
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter announcement for waiting room..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              required
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
            <Radio className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span>This updates all live token countdowns and triggers patient screen alerts.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-amber-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              Transmit Live Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
