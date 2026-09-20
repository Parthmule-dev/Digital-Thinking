import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  HeartPulse,
  Lock,
  Megaphone,
  CheckCircle2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Clock,
  UserCheck
} from "lucide-react";
import { GlobalAlert } from "../types";
import { playEmergencyGlobalAlertSiren } from "../utils/audioAlerts";

interface GlobalAlertOverlayProps {
  alert: GlobalAlert | null;
  onDeactivate: () => void;
  onOpenEditModal?: () => void;
  isStaff?: boolean;
}

export const GlobalAlertOverlay: React.FC<GlobalAlertOverlayProps> = ({
  alert,
  onDeactivate,
  onOpenEditModal,
  isStaff = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // When a new active alert arrives, reset minimization and acknowledgment so it takes over again
  useEffect(() => {
    if (alert && alert.active) {
      setIsMinimized(false);
      setHasAcknowledged(false);
      // Play siren once when active
      if (!soundMuted) {
        playEmergencyGlobalAlertSiren();
      }
    }
  }, [alert?.id, alert?.active]);

  if (!alert || !alert.active) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "evacuation":
        return Flame;
      case "code_blue":
        return HeartPulse;
      case "surge":
        return AlertTriangle;
      case "lockdown":
        return Lock;
      default:
        return Megaphone;
    }
  };

  const IconComponent = getCategoryIcon(alert.category);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          bgBadge: "bg-rose-600 text-white",
          border: "border-rose-600",
          strobe: "from-rose-600/20 via-red-600/10 to-transparent",
          headerBg: "bg-rose-700",
          accentColor: "text-rose-600",
        };
      case "high":
        return {
          bgBadge: "bg-amber-600 text-white",
          border: "border-amber-500",
          strobe: "from-amber-600/20 via-orange-600/10 to-transparent",
          headerBg: "bg-amber-700",
          accentColor: "text-amber-600",
        };
      default:
        return {
          bgBadge: "bg-sky-600 text-white",
          border: "border-sky-500",
          strobe: "from-sky-600/20 via-blue-600/10 to-transparent",
          headerBg: "bg-sky-800",
          accentColor: "text-sky-600",
        };
    }
  };

  const style = getSeverityStyle(alert.severity);

  // If user acknowledged or minimized, render persistent top flash banner
  if (isMinimized) {
    return (
      <aside aria-label="Active emergency broadcast banner" className="fixed top-0 left-0 right-0 z-[100] bg-rose-700 text-white shadow-xl border-b-2 border-rose-500 animate-slideDown">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-[10px] border border-white/30">
                Active Flash Override
              </span>
              <span className="font-extrabold truncate max-w-xs sm:max-w-md md:max-w-xl">
                {alert.title}: {alert.message}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsMinimized(false)}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand Flash Alert</span>
            </button>

            {isStaff && (
              <button
                onClick={onDeactivate}
                className="px-2.5 py-1 bg-white text-rose-800 hover:bg-rose-50 rounded-lg font-black transition cursor-pointer text-[11px] shadow-xs"
              >
                Declare All Clear
              </button>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // Full Screen Takeover Modal
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-lg animate-fadeIn overflow-y-auto">
      {/* Flashing ambient perimeter glow */}
      <div className="fixed inset-0 pointer-events-none border-4 sm:border-8 border-rose-600/70 animate-pulse" />

      <div className="relative bg-white w-full max-w-3xl rounded-3xl sm:rounded-4xl shadow-2xl border-2 border-rose-500 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Urgent Header Strobe */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start sm:items-center gap-3.5 z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg shrink-0 animate-bounce">
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white text-rose-700 shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  High-Priority Flash Override
                </span>
                <span className="text-rose-200 text-xs font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {alert.timestamp || "Just now"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                {alert.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center z-10">
            {/* Audio Toggle / Replay Button */}
            <button
              onClick={() => {
                if (soundMuted) {
                  setSoundMuted(false);
                  playEmergencyGlobalAlertSiren();
                } else {
                  setSoundMuted(true);
                }
              }}
              title={soundMuted ? "Unmute Siren" : "Mute Siren"}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer border border-white/20"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>

            {/* Minimize button */}
            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize to top bar"
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer border border-white/20"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-slate-800">
          {/* Primary Directive Card */}
          <div className="p-5 sm:p-6 bg-rose-50/80 rounded-3xl border border-rose-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs uppercase tracking-wider">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Broadcast Command Message</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {alert.message}
            </p>
          </div>

          {/* Action Directives / Mandatory Steps */}
          {alert.instructions && alert.instructions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Mandatory Action Directives for All Personnel & Patients
                </h2>
                <span className="text-[11px] font-bold text-slate-400">
                  Step-by-step guidance
                </span>
              </div>

              <div className="space-y-2.5">
                {alert.instructions.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3 text-xs sm:text-sm font-semibold text-slate-800"
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="leading-relaxed flex-1">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transmitter Metadata */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>
                Origin: <strong>{alert.author || "Clinical Command Desk"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>High-Priority System Override Active</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            {isStaff ? (
              <span>You are viewing this alert with <strong>Clinical Staff Command privileges</strong>.</span>
            ) : (
              <span>Please comply immediately with all instructions provided above.</span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
            {/* If Staff: Allow editing directive or declaring All Clear */}
            {isStaff && onOpenEditModal && (
              <button
                type="button"
                onClick={onOpenEditModal}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Update Directive
              </button>
            )}

            {isStaff && (
              <button
                type="button"
                onClick={onDeactivate}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Declare All Clear (Deactivate)</span>
              </button>
            )}

            {/* Patients & Staff can acknowledge / minimize */}
            <button
              type="button"
              onClick={() => {
                setHasAcknowledged(true);
                setIsMinimized(true);
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>I Acknowledge & Understand</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
