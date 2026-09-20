import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  HeartPulse,
  Lock,
  Megaphone,
  X,
  Radio,
  CheckCircle2,
  Volume2,
  Trash2,
  Plus
} from "lucide-react";
import { GlobalAlert, GlobalAlertSeverity } from "../types";
import { playEmergencyGlobalAlertSiren } from "../utils/audioAlerts";

interface GlobalAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcast: (alert: Omit<GlobalAlert, "id" | "timestamp" | "active">) => void;
  onDeactivate?: () => void;
  activeGlobalAlert: GlobalAlert | null;
}

interface AlertPreset {
  id: string;
  category: "evacuation" | "code_blue" | "surge" | "lockdown" | "custom";
  severity: GlobalAlertSeverity;
  label: string;
  title: string;
  message: string;
  icon: React.ElementType;
  colorClass: string;
  instructions: string[];
}

const PRESETS: AlertPreset[] = [
  {
    id: "code_red",
    category: "evacuation",
    severity: "critical",
    label: "Code Red: Evacuation",
    title: "CODE RED: IMMEDIATE FACILITY EVACUATION",
    message: "A safety hazard has been detected. All patients, visitors, and non-essential personnel must proceed to the nearest emergency exit immediately.",
    icon: Flame,
    colorClass: "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100",
    instructions: [
      "Evacuate via marked emergency fire exits immediately. Do not use elevators.",
      "Staff must assist mobility-impaired patients to safe refuge bays.",
      "Assemble at designated Exterior Triage Assembly Point A (North Plaza).",
      "Do not return for personal belongings until All Clear is officially declared."
    ]
  },
  {
    id: "code_blue",
    category: "code_blue",
    severity: "critical",
    label: "Code Blue: Resuscitation",
    title: "CODE BLUE: CARDIAC & ACUTE RESUSCITATION TEAM",
    message: "Immediate medical emergency in progress in Acute Consultation Wing. Acute Response Team dispatch requested.",
    icon: HeartPulse,
    colorClass: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
    instructions: [
      "Code Blue Response Team report immediately to Suite 102 with crash cart.",
      "Corridors 1 and 2 cleared of non-urgent traffic for rapid gurney transit.",
      "Waiting lounge patients remain seated; routine consultations temporarily paused.",
      "On-duty charge nurse assume regional medical triage control."
    ]
  },
  {
    id: "mass_surge",
    category: "surge",
    severity: "high",
    label: "Surge / Trauma Protocol",
    title: "CRITICAL SURGE: TRAUMA & CASUALTY PROTOCOL",
    message: "High-volume emergency trauma intake incoming from regional EMS. Urgent hospital diversion and triage reprioritization active.",
    icon: AlertTriangle,
    colorClass: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
    instructions: [
      "All available physician suites prepare for immediate trauma fast-track.",
      "Non-urgent walk-in consultations deferred; patients will be triaged by acuity score.",
      "Triage Nurse activate Fast-Track Overflow Room 104 immediately.",
      "Patients currently waiting in lounge please remain seated for updated queue order."
    ]
  },
  {
    id: "lockdown",
    category: "lockdown",
    severity: "high",
    label: "Facility Security Lockdown",
    title: "SECURITY ALERT: FACILITY PERIMETER LOCKDOWN",
    message: "Security precautionary protocol initiated. All external access points locked. Remain inside safe clinical zones.",
    icon: Lock,
    colorClass: "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200",
    instructions: [
      "Remain inside current consultation rooms and waiting area; lock interior doors.",
      "Do not approach exterior clinic windows or main lobby glass doors.",
      "Staff verify headcount of all active patients in waiting queue.",
      "Await official security clearance notification before opening exterior doors."
    ]
  },
  {
    id: "custom_notice",
    category: "custom",
    severity: "urgent",
    label: "Urgent Priority Notice",
    title: "HIGH-PRIORITY CLINICAL NOTICE: ALL ZONES",
    message: "Immediate operational broadcast for all patients, visitors, and clinical staff.",
    icon: Megaphone,
    colorClass: "bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100",
    instructions: [
      "Please listen attentively to clinic overhead announcements.",
      "Consultation queues are being actively reorganized to minimize delay.",
      "Please check with the front triage receptionist if you require urgent assistance."
    ]
  }
];

export const GlobalAlertModal: React.FC<GlobalAlertModalProps> = ({
  isOpen,
  onClose,
  onBroadcast,
  onDeactivate,
  activeGlobalAlert,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("code_red");
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [severity, setSeverity] = useState<GlobalAlertSeverity>("critical");
  const [category, setCategory] = useState<"evacuation" | "code_blue" | "surge" | "lockdown" | "custom">("evacuation");
  const [instructions, setInstructions] = useState<string[]>([]);
  const [newInstruction, setNewInstruction] = useState<string>("");
  const [author] = useState<string>("Clinical Command Desk");

  // Populate from active alert or default preset
  useEffect(() => {
    if (activeGlobalAlert && activeGlobalAlert.active) {
      setTitle(activeGlobalAlert.title);
      setMessage(activeGlobalAlert.message);
      setSeverity(activeGlobalAlert.severity);
      setCategory(activeGlobalAlert.category);
      setInstructions(activeGlobalAlert.instructions || []);
      setSelectedPreset("custom");
    } else {
      const defaultPreset = PRESETS[0];
      setSelectedPreset(defaultPreset.id);
      setTitle(defaultPreset.title);
      setMessage(defaultPreset.message);
      setSeverity(defaultPreset.severity);
      setCategory(defaultPreset.category);
      setInstructions(defaultPreset.instructions);
    }
  }, [activeGlobalAlert, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: AlertPreset) => {
    setSelectedPreset(preset.id);
    setTitle(preset.title);
    setMessage(preset.message);
    setSeverity(preset.severity);
    setCategory(preset.category);
    setInstructions([...preset.instructions]);
  };

  const handleAddInstruction = () => {
    if (!newInstruction.trim()) return;
    setInstructions((prev) => [...prev, newInstruction.trim()]);
    setNewInstruction("");
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    onBroadcast({
      title: title.trim(),
      message: message.trim(),
      severity,
      category,
      instructions: instructions.filter((i) => i.trim().length > 0),
      author,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Send High-Priority Global Alert</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 border border-white/30">
                  Screen Override
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                Immediately broadcasts an urgent flash takeover across all patient, staff & split screens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Alert Warning Banner if one is currently running */}
        {activeGlobalAlert && activeGlobalAlert.active && (
          <div className="bg-rose-50 border-b border-rose-200 p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-rose-900 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
              <span>A Global Flash Override is currently ACTIVE across all user screens!</span>
            </div>
            {onDeactivate && (
              <button
                type="button"
                onClick={() => {
                  onDeactivate();
                  onClose();
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Declare All Clear & Deactivate
              </button>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Quick Presets Selector */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Select Emergency Template / Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer text-xs ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                        : preset.colorClass
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : ""}`} />
                    <span className="font-bold leading-tight">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity & Category Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Alert Priority Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as GlobalAlertSeverity)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="critical">🚨 CRITICAL (Code Red / Evacuate / Life Safety)</option>
                <option value="high">⚠️ HIGH PRIORITY (Surge / Security / Clinical Delay)</option>
                <option value="urgent">📢 URGENT NOTICE (Operational Directive)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Sound Alert Siren
              </label>
              <button
                type="button"
                onClick={() => playEmergencyGlobalAlertSiren()}
                className="w-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-3 py-2.5 flex items-center justify-center gap-2 border border-slate-200 transition cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-rose-600" />
                <span>Test Emergency Alert Siren</span>
              </button>
            </div>
          </div>

          {/* Alert Title */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Flash Alert Headline / Banner Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., CODE RED: IMMEDIATE FACILITY EVACUATION"
              required
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Primary Message */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Primary Override Broadcast Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Provide a clear, authoritative directive for all individuals in the facility..."
              required
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 leading-relaxed"
            />
          </div>

          {/* Actionable Instructions List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Action Directives & Instructions ({instructions.length})
              </label>
              <span className="text-[10px] text-slate-400">Displayed in high-contrast checklist</span>
            </div>

            <div className="space-y-2 mb-2 max-h-36 overflow-y-auto">
              {instructions.map((inst, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <span className="font-semibold text-slate-700 flex-1">
                    {index + 1}. {inst}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(index)}
                    className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInstruction();
                  }
                }}
                placeholder="Add instruction step (e.g. 'Proceed to North Plaza assembly point')..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
              <button
                type="button"
                onClick={handleAddInstruction}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>Target: All connected patient, staff, and kiosk terminals</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer border border-rose-600"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Broadcast High-Priority Override</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
