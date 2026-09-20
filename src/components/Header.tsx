import React from "react";
import { HeartPulse, Key, Smartphone, LayoutDashboard, SplitSquareVertical, UserCheck, RefreshCw, Cpu, Download } from "lucide-react";
import { UserSession } from "../types";

export type ViewMode = "patient" | "staff" | "split";

interface HeaderProps {
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  userSession: UserSession | null;
  onOpenSettings: () => void;
  onReopenOnboarding: () => void;
  apiKey: string;
  hasEnvKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onSelectViewMode,
  userSession,
  onOpenSettings,
  onReopenOnboarding,
  apiKey,
  hasEnvKey,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 transition">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Live status */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectViewMode("patient")}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  MediFlow <span className="text-sky-600">AI</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Smart Clinic Crowd & Queue Orchestration</p>
            </div>
          </div>

          {/* Quick Active Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Clinic Live • 4 Consultation Suites Active
          </div>
        </div>

        {/* View Switcher Tabs (Patient View | Staff Control Tower | Split Screen Demo) */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => onSelectViewMode("patient")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "patient"
                ? "bg-white text-sky-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Patient View
          </button>

          <button
            onClick={() => onSelectViewMode("staff")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "staff"
                ? "bg-white text-sky-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Staff Control Tower
          </button>

          <button
            onClick={() => onSelectViewMode("split")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "split"
                ? "bg-white text-sky-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            Live Split Demo
          </button>
        </div>

        {/* User Session Pill & Settings Modal Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Personalized User Pill */}
          {userSession && (
            <button
              onClick={onReopenOnboarding}
              title="Click to change registered patient"
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-2 transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span className="max-w-[120px] truncate font-bold">{userSession.name}</span>
              <span className="font-extrabold text-sky-600">{userSession.tokenNumber}</span>
            </button>
          )}

          {/* Download Project ZIP directly */}
          <a
            href="/mediflow-project.zip"
            download="mediflow-project.zip"
            title="Download full project ZIP archive"
            className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Export ZIP</span>
          </a>

          {/* Floating Settings Button */}
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">AI Config</span>
            <span
              className={`w-2 h-2 rounded-full ${
                apiKey || hasEnvKey ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
