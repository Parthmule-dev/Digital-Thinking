import React, { useState } from "react";
import { Patient, BroadcastAlert, TriageAnalysisResult, UserSession, ClinicRoom, Appointment } from "../types";
import { AppointmentScheduling } from "./AppointmentScheduling";
import {
  HeartPulse,
  Clock,
  Users,
  Sparkles,
  Share2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Send,
  BellRing,
  Phone,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  FileText,
  Calendar as CalendarIcon,
  CalendarCheck,
  Ticket
} from "lucide-react";

interface PatientViewProps {
  currentPatient: Patient | null;
  allPatients: Patient[];
  broadcasts: BroadcastAlert[];
  rooms?: ClinicRoom[];
  appointments?: Appointment[];
  userSession: UserSession | null;
  apiKey: string;
  hasEnvKey: boolean;
  onTriageCompleted: (patientId: string, result: TriageAnalysisResult, symptomsText: string) => void;
  onOpenSettings: () => void;
  onBookAppointment?: (appointment: Appointment) => void;
  onCheckInAppointment?: (appointment: Appointment) => void;
  onCancelAppointment?: (appointmentId: string) => void;
}

export const PatientView: React.FC<PatientViewProps> = ({
  currentPatient,
  allPatients,
  broadcasts,
  rooms = [],
  appointments = [],
  userSession,
  apiKey,
  hasEnvKey,
  onTriageCompleted,
  onOpenSettings,
  onBookAppointment,
  onCheckInAppointment,
  onCancelAppointment,
}) => {
  const [patientTab, setPatientTab] = useState<"queue" | "appointments">("queue");
  const [symptomsInput, setSymptomsInput] = useState(currentPatient?.symptoms || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [triageError, setTriageError] = useState("");
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [simulatedNotification, setSimulatedNotification] = useState<string | null>(null);

  // Calculate position ahead in queue
  const activeWaitingPatients = allPatients.filter((p) => p.status === "waiting");
  
  // Sort order of waiting queue: Emergency first, then Moderate, then Normal
  const urgencyWeight = { Emergency: 3, Moderate: 2, Normal: 1 };
  const sortedWaiting = [...activeWaitingPatients].sort((a, b) => {
    if (urgencyWeight[b.urgency] !== urgencyWeight[a.urgency]) {
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    }
    return (b.triageScore || 0) - (a.triageScore || 0);
  });

  const patientIndexInQueue = currentPatient
    ? sortedWaiting.findIndex((p) => p.id === currentPatient.id)
    : -1;
  const peopleAhead = patientIndexInQueue >= 0 ? patientIndexInQueue : 0;

  // Active Broadcast notice
  const activeBroadcast = broadcasts.find((b) => b.active);

  // Dynamic wait time calculation (takes into account people ahead and broadcast delay)
  const baseMinutes = currentPatient?.status === "in_consultation" 
    ? 0 
    : currentPatient?.urgency === "Emergency" 
    ? 2 
    : Math.max(3, (peopleAhead + 1) * 7);

  const delayAddition = activeBroadcast?.delayMinutes || 0;
  const dynamicWaitMinutes = currentPatient?.status === "in_consultation" ? 0 : baseMinutes + delayAddition;

  // Handle AI Triage Submit
  const handleRunTriage = async (symptomsToTest?: string) => {
    const textToAnalyze = symptomsToTest || symptomsInput;
    if (!textToAnalyze.trim()) {
      setTriageError("Please describe your symptoms before starting AI triage.");
      return;
    }

    setTriageError("");
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: textToAnalyze,
          age: userSession?.age || currentPatient?.age || 30,
          name: userSession?.name || currentPatient?.name || "Patient",
          customApiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Triage service returned an error status");
      }

      const data: TriageAnalysisResult = await response.json();
      if (currentPatient) {
        onTriageCompleted(currentPatient.id, data, textToAnalyze);
      }

      // Show temporary simulated alert
      setSimulatedNotification(
        `AI Triage complete: Urgency classified as ${data.urgency.toUpperCase()}. Queue position synchronized.`
      );
      setTimeout(() => setSimulatedNotification(null), 5000);
    } catch (err: any) {
      console.error("AI Triage client error:", err);
      setTriageError("Could not complete AI triage. Please consult clinic reception.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // WhatsApp formatted URL generator
  const getWhatsAppShareUrl = () => {
    if (!currentPatient) return "#";
    const statusText =
      currentPatient.status === "in_consultation"
        ? `🔔 *CALLING NOW* - Proceed to ${currentPatient.roomNumber || "Consultation Room"}`
        : `⏳ In Queue - ${peopleAhead} patients ahead (Est. ~${dynamicWaitMinutes} mins)`;

    const rawMessage = `🏥 *MediFlow AI Clinic Live Queue Update*
━━━━━━━━━━━━━━━━━
👤 *Patient:* ${currentPatient.name} (Age: ${currentPatient.age})
🎟️ *Token Number:* ${currentPatient.tokenNumber}
📊 *Queue Status:* ${statusText}
🩺 *Triage Tier:* ${currentPatient.urgency} Priority
🏥 *Department:* ${currentPatient.roomNumber || "General Acute Care"}
⏱️ *Estimated Wait:* ~${dynamicWaitMinutes} minutes

📍 *MediFlow Medical Centre* | Track live on clinic portal.`;

    const encoded = encodeURIComponent(rawMessage);
    const phoneParam = userSession?.phone ? userSession.phone.replace(/[^0-9]/g, "") : "";
    return phoneParam ? `https://wa.me/${phoneParam}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  };

  const sampleSymptoms = [
    { label: "🚨 Chest Pain & Shortness of Breath", text: "Acute crushing chest tightness radiating to left shoulder with shortness of breath and sweating" },
    { label: "🌡️ High Fever 102.5°F & Cough", text: "Persistent high fever 102.5°F for 3 days, severe shivering, body aches and dry hacking cough" },
    { label: "🩹 Severe Ankle Sprain", text: "Stepped awkwardly off stairs, severe swelling, acute bruising, unable to bear weight on foot" },
    { label: "💊 Routine Prescription Renewal", text: "Refill consultation for regular blood pressure medication, no current distress" },
  ];

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case "Emergency":
        return {
          bg: "bg-rose-50 border-rose-300 text-rose-700 animate-pulse shadow-xs shadow-rose-200/50",
          dot: "bg-rose-500 animate-ping",
          label: "Emergency Priority",
        };
      case "Moderate":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-700",
          dot: "bg-amber-500",
          label: "Moderate Priority",
        };
      default:
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
          dot: "bg-emerald-500",
          label: "Standard Routine",
        };
    }
  };

  const badge = getUrgencyBadge(currentPatient?.urgency);

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 pb-12">
      {/* Patient View Mode Switcher: Live Queue Ticket vs Schedule Appointment */}
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setPatientTab("queue")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            patientTab === "queue"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Ticket className="w-4 h-4" />
          Live Queue Ticket
          {currentPatient && (
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
              patientTab === "queue" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {currentPatient.tokenNumber}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPatientTab("appointments")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            patientTab === "appointments"
              ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Appointment Scheduling
          {appointments.filter(a => userSession?.name && a.patientName.toLowerCase() === userSession.name.toLowerCase()).length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              patientTab === "appointments" ? "bg-white text-sky-700" : "bg-sky-100 text-sky-700"
            }`}>
              {appointments.filter(a => userSession?.name && a.patientName.toLowerCase() === userSession.name.toLowerCase()).length}
            </span>
          )}
        </button>
      </div>

      {patientTab === "appointments" ? (
        <AppointmentScheduling
          rooms={rooms}
          appointments={appointments}
          userSession={userSession}
          onBookAppointment={(apt) => {
            onBookAppointment?.(apt);
          }}
          onCheckInAppointment={(apt) => {
            onCheckInAppointment?.(apt);
            setPatientTab("queue");
          }}
          onCancelAppointment={onCancelAppointment}
          onBackToQueue={() => setPatientTab("queue")}
        />
      ) : (
        <>
          {/* Quick Schedule Notice inside Live Queue */}
          <div className="p-3 bg-gradient-to-r from-sky-50 to-teal-50/60 border border-sky-200/70 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-600/10 text-sky-600 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">Want to schedule a future visit?</span>
                <span className="text-slate-500 text-[11px]">Select a date and time slot with your doctor.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPatientTab("appointments")}
              className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              Book Slot
            </button>
          </div>

          {/* Real-time Calling Alert when Reception calls patient */}
      {currentPatient?.status === "in_consultation" && (
        <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 rounded-3xl text-white shadow-xl shadow-teal-500/20 animate-pulse border border-white/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30">
              <BellRing className="w-7 h-7 text-white animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wider uppercase">
                  Active Consultation Call
                </span>
                <span className="text-xs text-emerald-100 font-medium">Please proceed</span>
              </div>
              <h4 className="text-lg font-extrabold text-white mt-0.5">
                Token {currentPatient.tokenNumber} is Being Called!
              </h4>
              <p className="text-xs text-emerald-50 font-medium">
                Please enter <strong className="underline decoration-white underline-offset-2">{currentPatient.roomNumber || "Room 101"}</strong> now ({currentPatient.doctorName || "Attending Physician"}).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Bar */}
      {activeBroadcast && (
        <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3 backdrop-blur-sm shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Clinic Live Notice {activeBroadcast.delayMinutes ? `(+${activeBroadcast.delayMinutes}m delay)` : ""}
              </span>
              <span className="text-[10px] text-amber-700 font-medium">{activeBroadcast.timestamp}</span>
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">{activeBroadcast.message}</p>
          </div>
        </div>
      )}

      {/* Simulated Push Notification Banner */}
      {simulatedNotification && (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-xs flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{simulatedNotification}</span>
          </div>
          <button
            onClick={() => setSimulatedNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Token Card (Apple Health / Fintech aesthetic) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden relative">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-sky-100/50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-teal-100/40 blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Digital Queue Ticket
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {currentPatient ? currentPatient.name : "Patient Check-in"}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-sky-600 tracking-tight">
              {currentPatient ? currentPatient.tokenNumber : "#A-104"}
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Check-in {currentPatient?.checkInTime || "Just now"}
            </span>
          </div>
        </div>

        {/* Dynamic Queue Metrics Grid */}
        <div className="p-6 grid grid-cols-2 gap-4 bg-slate-50/50 border-b border-slate-100 relative">
          {/* Wait Time Metric */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-500" />
                Est. Wait Time
              </span>
              {activeBroadcast?.delayMinutes && (
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  Delay +{activeBroadcast.delayMinutes}m
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {currentPatient?.status === "in_consultation" ? "Ready" : `~${dynamicWaitMinutes}`}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {currentPatient?.status === "in_consultation" ? "Inside room" : "minutes"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {currentPatient?.status === "in_consultation"
                ? "Consultation in progress"
                : "Real-time dynamic estimate"}
            </p>
          </div>

          {/* People Ahead Metric */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-500" />
                Queue Position
              </span>
              <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {currentPatient?.status === "in_consultation" ? "0" : peopleAhead}
              </span>
              <span className="text-xs text-slate-500 font-medium">people ahead</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {currentPatient?.status === "in_consultation"
                ? "Your turn right now"
                : peopleAhead === 0
                ? "You are next in line"
                : `${peopleAhead} patient(s) prior to call`}
            </p>
          </div>
        </div>

        {/* Status Stepper Progression */}
        <div className="p-6 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
            Live Consultation Progress
          </p>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-3 right-3 top-3.5 h-0.5 bg-slate-200 -z-0" />
            
            {/* Step 1: Checked In */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1.5">Checked In</span>
            </div>

            {/* Step 2: AI Triage */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                currentPatient?.triageScore ? "bg-emerald-500 text-white" : "bg-sky-500 text-white"
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1.5">
                {currentPatient?.triageScore ? "Triaged" : "AI Triage"}
              </span>
            </div>

            {/* Step 3: In Line */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                currentPatient?.status === "in_consultation" || currentPatient?.status === "completed"
                  ? "bg-emerald-500 text-white"
                  : "bg-sky-600 text-white ring-4 ring-sky-100 animate-pulse"
              }`}>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1.5">In Queue</span>
            </div>

            {/* Step 4: Doctor Called */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                currentPatient?.status === "in_consultation"
                  ? "bg-emerald-500 text-white ring-4 ring-emerald-100 animate-pulse"
                  : "bg-slate-200 text-slate-500"
              }`}>
                <Stethoscope className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1.5">Consultation</span>
            </div>
          </div>
        </div>

        {/* Assigned Room Information */}
        <div className="px-6 py-4 bg-slate-50/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span className="text-slate-600">Assigned Station:</span>
            <strong className="text-slate-900 font-bold">
              {currentPatient?.roomNumber || "Next Available Room (Auto-Routing)"}
            </strong>
          </div>
          {currentPatient?.doctorName && (
            <span className="text-slate-500 font-medium">{currentPatient.doctorName}</span>
          )}
        </div>
      </div>

      {/* FREE AI SYMPTOM TRIAGE SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Free AI Symptom Triage</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-200">
                  Gemini AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500">Auto-evaluates clinical urgency to prioritize critical cases</p>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            title="Configure Gemini API Key"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Key Config
          </button>
        </div>

        {/* Pre-fill Quick Chips */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Quick symptom presets for instant test:
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleSymptoms.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSymptomsInput(chip.text);
                  handleRunTriage(chip.text);
                }}
                disabled={isAnalyzing}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition font-medium text-left cursor-pointer disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms Textarea */}
        <div className="relative">
          <textarea
            rows={3}
            value={symptomsInput}
            onChange={(e) => setSymptomsInput(e.target.value)}
            placeholder="Describe your current symptoms, pain severity, duration, and any physical distress..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition leading-relaxed"
          />
        </div>

        {triageError && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {triageError}
          </div>
        )}

        {/* Analyze Urgency with Gemini AI Button */}
        <button
          type="button"
          onClick={() => handleRunTriage()}
          disabled={isAnalyzing || !symptomsInput.trim()}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-sky-600 via-teal-600 to-sky-700 hover:from-sky-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-xs"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Urgency with Gemini AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Analyze Urgency with Gemini AI</span>
            </>
          )}
        </button>

        {/* AI Triage Detailed Report Card (if triaged) */}
        {currentPatient?.triageNotes && (
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-800">Clinical Triage Evaluation</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                {currentPatient.urgency} (Score: {currentPatient.triageScore}/10)
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {currentPatient.triageNotes}
            </p>

            {currentPatient.precautions && currentPatient.precautions.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Immediate Clinical Precautions:
                </span>
                <ul className="space-y-1">
                  {currentPatient.precautions.map((prec, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                      <span>{prec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INSTANT WHATSAPP ALERT SIMULATION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Instant WhatsApp Alert Simulation</h3>
              <p className="text-xs text-slate-500">Free, live pre-filled status alert via `https://wa.me/`</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            100% Free
          </span>
        </div>

        {/* WhatsApp Message Preview Box */}
        <div className="p-4 bg-[#e7f8ee] border border-emerald-200/80 rounded-2xl relative text-xs text-slate-800 space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold mb-1">
            <span>Incoming Message Preview (WhatsApp)</span>
            <span>Just now</span>
          </div>
          <p className="font-bold text-emerald-950">🏥 MediFlow AI Clinic Queue Update</p>
          <p>👤 Patient: <strong>{currentPatient?.name || "Sarah Connor"}</strong></p>
          <p>🎟️ Token: <strong>{currentPatient?.tokenNumber || "#A-104"}</strong></p>
          <p>⏳ Status: <strong>{peopleAhead} people ahead (~{dynamicWaitMinutes}m wait)</strong></p>
          <p>🩺 Triage: <strong>{currentPatient?.urgency || "Normal"} Priority</strong></p>
          <p className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200">
            You will receive a notification ping when the doctor calls your token number.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {/* Working wa.me Link Button */}
          <a
            href={getWhatsAppShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-xs"
          >
            <Send className="w-4 h-4" />
            Send Live WhatsApp Update (wa.me)
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* Simulate Push Notification in UI */}
          <button
            type="button"
            onClick={() => {
              setSimulatedNotification(
                `WhatsApp ping sent to ${userSession?.phone || "+1 555-019-8822"}: "Token ${currentPatient?.tokenNumber} updated. ${peopleAhead} ahead, ~${dynamicWaitMinutes}m wait."`
              );
            }}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-600" />
            Simulate Phone Alert
          </button>
        </div>
      </div>
    </>
    )}
  </div>
  );
};
