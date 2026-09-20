import React, { useState } from "react";
import { Patient, ClinicRoom, BroadcastAlert, UrgencyLevel, Appointment, AppointmentStatus, GlobalAlert } from "../types";
import { AddAppointmentModal } from "./AddAppointmentModal";
import { RescheduleModal } from "./RescheduleModal";
import { WaitTimeTrendChart } from "./WaitTimeTrendChart";
import {
  Activity,
  Users,
  Clock,
  AlertOctagon,
  Megaphone,
  UserPlus,
  CheckCircle,
  Stethoscope,
  ChevronRight,
  PhoneCall,
  Search,
  Filter,
  ShieldAlert,
  ArrowUpDown,
  DoorOpen,
  Sparkles,
  XCircle,
  ExternalLink,
  Calendar as CalendarIcon,
  CalendarCheck,
  UserCheck,
  CalendarDays,
  PlusCircle,
  AlertCircle,
  Check,
  FileText
} from "lucide-react";

interface StaffDashboardProps {
  patients: Patient[];
  rooms: ClinicRoom[];
  broadcasts: BroadcastAlert[];
  appointments?: Appointment[];
  onCallPatient: (patientId: string, roomId?: string) => void;
  onCompletePatient: (patientId: string) => void;
  onUpdateUrgency: (patientId: string, newUrgency: UrgencyLevel) => void;
  onOpenBroadcastModal: () => void;
  onOpenAddPatientModal: () => void;
  onClearBroadcast: (broadcastId: string) => void;
  onToggleRoomStatus: (roomId: string) => void;
  onCheckInAppointment?: (appointment: Appointment) => void;
  onUpdateAppointmentStatus?: (appointmentId: string, status: AppointmentStatus) => void;
  onRescheduleAppointment?: (appointmentId: string, newDate: string, newTime: string, newDoctorId?: string) => void;
  onAddAppointment?: (appointment: Appointment) => void;
  onOpenGlobalAlertModal?: () => void;
  activeGlobalAlert?: GlobalAlert | null;
  onDeactivateGlobalAlert?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  patients,
  rooms,
  broadcasts,
  appointments = [],
  onCallPatient,
  onCompletePatient,
  onUpdateUrgency,
  onOpenBroadcastModal,
  onOpenAddPatientModal,
  onClearBroadcast,
  onToggleRoomStatus,
  onCheckInAppointment,
  onUpdateAppointmentStatus,
  onRescheduleAppointment,
  onAddAppointment,
  onOpenGlobalAlertModal,
  activeGlobalAlert,
  onDeactivateGlobalAlert,
}) => {
  const todayStr = "2026-09-20";
  const [activeTab, setActiveTab] = useState<"queue" | "appointments">("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedRoomForCall, setSelectedRoomForCall] = useState<string>(rooms.find(r => r.status === "available")?.id || rooms[0]?.id || "");

  // Appointments Management Tab state
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentFilterDate, setAppointmentFilterDate] = useState<string>("ALL");
  const [appointmentFilterDoctor, setAppointmentFilterDoctor] = useState<string>("ALL");
  const [appointmentFilterStatus, setAppointmentFilterStatus] = useState<string>("ALL");
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [staffNotification, setStaffNotification] = useState<string | null>(null);

  // Analytics
  const waitingPatients = patients.filter((p) => p.status === "waiting");
  const inConsultationPatients = patients.filter((p) => p.status === "in_consultation");
  const completedPatients = patients.filter((p) => p.status === "completed");
  const emergencyCount = patients.filter((p) => p.urgency === "Emergency" && p.status !== "completed").length;

  const avgWaitTime = waitingPatients.length > 0
    ? Math.round(
        waitingPatients.reduce((sum, p) => sum + (p.estimatedWaitMinutes || 10), 0) /
          waitingPatients.length
      )
    : 0;

  const availableRooms = rooms.filter((r) => r.status === "available");
  const occupiedRooms = rooms.filter((r) => r.status === "occupied");

  // Filtered patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.symptoms.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUrgency = filterUrgency === "ALL" || patient.urgency === filterUrgency;
    const matchesStatus = filterStatus === "ALL" || patient.status === filterStatus;

    return matchesSearch && matchesUrgency && matchesStatus;
  });

  // Sort: In Consultation first, then Emergency waiting, then Moderate, then Normal, completed last
  const statusWeight = { in_consultation: 4, waiting: 2, completed: 1 };
  const urgencyWeight = { Emergency: 3, Moderate: 2, Normal: 1 };

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (statusWeight[b.status] !== statusWeight[a.status]) {
      return statusWeight[b.status] - statusWeight[a.status];
    }
    if (a.status === "waiting" && b.status === "waiting") {
      if (urgencyWeight[b.urgency] !== urgencyWeight[a.urgency]) {
        return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
      }
      return (b.triageScore || 0) - (a.triageScore || 0);
    }
    return 0;
  });

  const activeBroadcast = broadcasts.find((b) => b.active);

  // Find next eligible patient to call
  const nextWaitingPatient = waitingPatients.sort((a, b) => {
    if (urgencyWeight[b.urgency] !== urgencyWeight[a.urgency]) {
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    }
    return (b.triageScore || 0) - (a.triageScore || 0);
  })[0];

  // Appointment analytics & filtering
  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const confirmedAppointments = appointments.filter((a) => a.status === "confirmed");
  const checkedInAppointments = appointments.filter((a) => a.status === "checked_in");
  const completedAppointments = appointments.filter((a) => a.status === "completed");

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      apt.referenceNumber.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      apt.reason.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      (apt.patientPhone && apt.patientPhone.includes(appointmentSearch));

    const matchesDate =
      appointmentFilterDate === "ALL"
        ? true
        : appointmentFilterDate === "TODAY"
        ? apt.date === todayStr
        : appointmentFilterDate === "TOMORROW"
        ? apt.date === "2026-09-21"
        : apt.date === appointmentFilterDate;

    const matchesDoctor =
      appointmentFilterDoctor === "ALL" || apt.doctorId === appointmentFilterDoctor;

    const matchesStatus =
      appointmentFilterStatus === "ALL" || apt.status === appointmentFilterStatus;

    return matchesSearch && matchesDate && matchesDoctor && matchesStatus;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  return (
    <div className="space-y-6">
      {/* Staff Feedback Notification */}
      {staffNotification && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs font-bold text-sky-900">
            <Check className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{staffNotification}</span>
          </div>
          <button
            onClick={() => setStaffNotification(null)}
            className="text-xs text-sky-600 hover:text-sky-900 font-bold px-2 py-0.5 rounded-lg hover:bg-sky-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner / Broadcast Alert if Active */}
      {activeBroadcast && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 border border-amber-300 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Active Waiting Room Broadcast
                </span>
                {activeBroadcast.delayMinutes && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    +{activeBroadcast.delayMinutes}m delay
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-950 font-medium mt-0.5">{activeBroadcast.message}</p>
            </div>
          </div>
          <button
            onClick={() => onClearBroadcast(activeBroadcast.id)}
            className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            Clear Broadcast
          </button>
        </div>
      )}

      {/* Staff Dashboard Header: Clinical Command Center & Global Alert Override */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Reception & Triage Command
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active Intake
            </span>
            {activeGlobalAlert && activeGlobalAlert.active && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300 animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                Global Flash Active
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">Staff Control Tower</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* HIGH-PRIORITY GLOBAL ALERT BUTTON */}
          <button
            id="staff-header-global-alert-btn"
            type="button"
            onClick={onOpenGlobalAlertModal}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              activeGlobalAlert && activeGlobalAlert.active
                ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse border-2 border-rose-300 shadow-rose-600/30 ring-2 ring-rose-500/20"
                : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/25 border border-rose-700/50"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>{activeGlobalAlert && activeGlobalAlert.active ? "Global Alert Active" : "Global Alert"}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/20">
              {activeGlobalAlert && activeGlobalAlert.active ? "Broadcasting" : "Flash Override"}
            </span>
          </button>

          {activeGlobalAlert && activeGlobalAlert.active && onDeactivateGlobalAlert && (
            <button
              type="button"
              onClick={onDeactivateGlobalAlert}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Declare All Clear
            </button>
          )}
        </div>
      </div>

      {/* Master View Mode Switcher: Live Queue vs Dedicated Appointment Schedule */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "queue"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            Live Queue & Suites
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "queue" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {waitingPatients.length} Waiting
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("appointments")}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "appointments"
                ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Appointment Schedule
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "appointments" ? "bg-white text-sky-700" : "bg-sky-100 text-sky-700"
            }`}>
              {appointments.length}
            </span>
          </button>
        </div>

        {activeTab === "appointments" && (
          <button
            type="button"
            onClick={() => setIsAddAppointmentOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-sm shadow-sky-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Schedule New Appointment
          </button>
        )}
      </div>

      {activeTab === "queue" ? (
        <>
          {/* Control Tower Header with Live Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Waiting */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Waiting in Lounge
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">{waitingPatients.length}</span>
              <span className="text-xs text-slate-500 font-medium">active patients</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Queue capacity normal</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Wait Time */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Avg Dynamic Wait
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">{avgWaitTime}</span>
              <span className="text-xs text-slate-500 font-medium">minutes</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">↓ 14% below target threshold</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Room Status */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Consultation Suites
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">
                {occupiedRooms.length}/{rooms.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">rooms active</span>
            </div>
            <p className="text-[11px] text-sky-600 font-medium mt-1">
              {availableRooms.length} room(s) ready for next
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DoorOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Emergency Alert Metric */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Critical Triage Cases
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black ${emergencyCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                {emergencyCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">urgent priority</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Auto-prioritized by Gemini AI</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            emergencyCount > 0 ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-slate-100 text-slate-500"
          }`}>
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 6-Hour Patient Wait Time Trend Chart for Resource Allocation */}
      <WaitTimeTrendChart currentPatients={patients} currentAvgWait={avgWaitTime} />

      {/* Control Tower Actions Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Quick Call Next Box */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Next Eligible Patient in Queue</span>
            <p className="text-xs text-slate-500">
              {nextWaitingPatient ? (
                <span>
                  <strong>{nextWaitingPatient.tokenNumber}</strong> ({nextWaitingPatient.name}) •{" "}
                  {nextWaitingPatient.urgency === "Emergency" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 border border-rose-300 text-rose-700 animate-pulse shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      Emergency Priority
                    </span>
                  ) : (
                    <span className="text-slate-700 font-semibold">
                      {nextWaitingPatient.urgency} Priority
                    </span>
                  )}
                </span>
              ) : (
                "No patients currently waiting"
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Room Selector for Call */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRoomForCall}
              onChange={(e) => setSelectedRoomForCall(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} ({r.doctor}) - {r.status}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (nextWaitingPatient) {
                  onCallPatient(nextWaitingPatient.id, selectedRoomForCall);
                }
              }}
              disabled={!nextWaitingPatient}
              className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PhoneCall className="w-4 h-4" />
              Call Next Patient
            </button>
          </div>

          <button
            onClick={onOpenGlobalAlertModal}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            Global Alert
          </button>

          <button
            onClick={onOpenBroadcastModal}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            Delay Broadcast
          </button>

          <button
            onClick={onOpenAddPatientModal}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md shadow-slate-900/20 transition flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Walk-in
          </button>
        </div>
      </div>

      {/* Interactive Rooms Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            Clinic Consultation Suites ({rooms.length})
          </h3>
          <span className="text-[11px] text-slate-400">Click any suite to toggle status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {rooms.map((room) => {
            const isOccupied = room.status === "occupied";
            const isCleaning = room.status === "cleaning";
            return (
              <div
                key={room.id}
                className={`p-4 rounded-3xl border transition shadow-sm ${
                  isOccupied
                    ? "bg-sky-50/60 border-sky-200"
                    : isCleaning
                    ? "bg-slate-50 border-slate-200"
                    : "bg-white border-emerald-200/80 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm text-slate-900">{room.roomNumber}</span>
                  <span
                    onClick={() => onToggleRoomStatus(room.id)}
                    title="Click to toggle availability"
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                      isOccupied
                        ? "bg-sky-100 text-sky-700 border border-sky-200"
                        : isCleaning
                        ? "bg-slate-200 text-slate-700"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {isOccupied ? "Occupied" : isCleaning ? "Sanitizing" : "Available"}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 line-clamp-1">{room.doctor}</p>
                <p className="text-[11px] text-slate-500 line-clamp-1">{room.specialty}</p>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  {isOccupied ? (
                    <span className="font-semibold text-sky-700">
                      With {room.currentPatientToken || "Patient"}
                    </span>
                  ) : (
                    <span className="text-slate-400">Ready for next</span>
                  )}
                  <button
                    onClick={() => onToggleRoomStatus(room.id)}
                    className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    Toggle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Patient Queue Grid / Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Filters & Search Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-base">Live Patient Queue</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {patients.length} total
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, token, symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Urgency Filter */}
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Urgencies</option>
              <option value="Emergency">Emergency Priority</option>
              <option value="Moderate">Moderate Priority</option>
              <option value="Normal">Normal Routine</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="waiting">Waiting in Line</option>
              <option value="in_consultation">In Consultation</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Patient Cards / Rows */}
        <div className="divide-y divide-slate-100">
          {sortedPatients.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No patients match the selected criteria.</p>
            </div>
          ) : (
            sortedPatients.map((patient) => {
              const isEmergency = patient.urgency === "Emergency";
              const isModerate = patient.urgency === "Moderate";
              const isInConsultation = patient.status === "in_consultation";
              const isCompleted = patient.status === "completed";

              return (
                <div
                  key={patient.id}
                  className={`p-5 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                    isEmergency && !isCompleted
                      ? "bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500"
                      : isInConsultation
                      ? "bg-teal-50/30 hover:bg-teal-50/60 border-l-4 border-l-teal-500"
                      : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                  }`}
                >
                  {/* Left Patient Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="text-center shrink-0">
                      <span className="text-lg font-black text-sky-700 block leading-tight">
                        {patient.tokenNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{patient.checkInTime}</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{patient.name}</h4>
                        <span className="text-xs text-slate-400">({patient.age} yrs)</span>

                        {/* Urgency Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isEmergency
                              ? "bg-rose-100 border-rose-300 text-rose-800 shadow-xs animate-pulse"
                              : isModerate
                              ? "bg-amber-100 border-amber-300 text-amber-800"
                              : "bg-emerald-100 border-emerald-300 text-emerald-800"
                          }`}
                        >
                          {isEmergency && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />}
                          {patient.urgency} (Score {patient.triageScore}/10)
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isInConsultation
                              ? "bg-sky-600 text-white"
                              : isCompleted
                              ? "bg-slate-200 text-slate-600"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isInConsultation ? "In Consultation" : patient.status}
                        </span>

                        {patient.isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            Current Session Patient
                          </span>
                        )}
                      </div>

                      {/* Symptoms Line */}
                      <p className="text-xs text-slate-600 line-clamp-1 font-medium">
                        <strong className="text-slate-700">Symptoms:</strong> {patient.symptoms || "None recorded"}
                      </p>

                      {/* Doctor / Room assignment info if assigned */}
                      {patient.roomNumber && (
                        <p className="text-[11px] text-sky-700 font-semibold">
                          Assigned: {patient.roomNumber} ({patient.doctorName || "Staff Physician"})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions & Urgency Modifiers */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    {/* Urgency Modifier Dropdown */}
                    <select
                      value={patient.urgency}
                      onChange={(e) => onUpdateUrgency(patient.id, e.target.value as UrgencyLevel)}
                      title="Adjust clinical urgency triage tier"
                      className="text-xs bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700 font-medium focus:outline-none"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Emergency">Emergency</option>
                    </select>

                    {/* Call Next Button */}
                    {!isInConsultation && !isCompleted && (
                      <button
                        onClick={() => onCallPatient(patient.id, selectedRoomForCall)}
                        className="py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Call to Room
                      </button>
                    )}

                    {/* Mark Completed Button */}
                    {isInConsultation && (
                      <button
                        onClick={() => onCompletePatient(patient.id)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark Completed
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 px-2 py-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Finished
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
    ) : (
      /* DEDICATED APPOINTMENT SCHEDULE MANAGEMENT TAB */
      <div className="space-y-6 animate-fadeIn">
        {/* Top Analytics for Appointments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Bookings */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Bookings
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900">{appointments.length}</span>
                <span className="text-xs text-slate-500 font-medium">appointments</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Clinic schedule registry</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6" />
            </div>
          </div>

          {/* Today's Bookings */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Today's Schedule
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-sky-600">{todayAppointments.length}</span>
                <span className="text-xs text-slate-500 font-medium">scheduled today</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Date: {todayStr}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>

          {/* Awaiting Check-In */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Pending Check-In
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-amber-600">{confirmedAppointments.length}</span>
                <span className="text-xs text-slate-500 font-medium">confirmed</span>
              </div>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">Ready for arrival</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* In Queue / Completed */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Checked-in / Done
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-teal-600">
                  {checkedInAppointments.length + completedAppointments.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">processed</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Active queue synchronized</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Appointments Filter & Controls Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by patient name, reference code (e.g. APT-1082), phone, or symptoms..."
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Filter */}
              <select
                value={appointmentFilterDate}
                onChange={(e) => setAppointmentFilterDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Today (Sep 20)</option>
                <option value="TOMORROW">Tomorrow (Sep 21)</option>
                <option value="2026-09-22">Sep 22</option>
                <option value="2026-09-23">Sep 23</option>
              </select>

              {/* Doctor Filter */}
              <select
                value={appointmentFilterDoctor}
                onChange={(e) => setAppointmentFilterDoctor(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Doctors</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.doctor} ({r.roomNumber})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={appointmentFilterStatus}
                onChange={(e) => setAppointmentFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Schedule button */}
              <button
                type="button"
                onClick={() => setIsAddAppointmentOpen(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <PlusCircle className="w-4 h-4" />
                New Appointment
              </button>
            </div>
          </div>

          {/* Quick Filter Tag Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">Quick Views:</span>
            <button
              type="button"
              onClick={() => {
                setAppointmentFilterDate("TODAY");
                setAppointmentFilterStatus("confirmed");
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-[11px] cursor-pointer transition"
            >
              Today's Pending Check-in ({todayAppointments.filter(a => a.status === "confirmed").length})
            </button>
            <button
              type="button"
              onClick={() => {
                setAppointmentFilterDate("ALL");
                setAppointmentFilterStatus("checked_in");
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-[11px] cursor-pointer transition"
            >
              Active in Queue ({checkedInAppointments.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setAppointmentFilterDate("ALL");
                setAppointmentFilterDoctor("ALL");
                setAppointmentFilterStatus("ALL");
                setAppointmentSearch("");
              }}
              className="px-2.5 py-1 text-sky-600 hover:underline font-bold text-[11px] cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Appointments Roster / Cards */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-sky-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Clinic Appointments Roster</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                {sortedAppointments.length} matching
              </span>
            </div>
            <span className="text-xs text-slate-400">Click 'Check In' to admit arriving patients directly into the live triage queue.</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sortedAppointments.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No appointments found matching current filters</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing your search query or schedule a new appointment.</p>
                <button
                  type="button"
                  onClick={() => setIsAddAppointmentOpen(true)}
                  className="mt-4 px-4 py-2 bg-sky-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  Schedule Appointment
                </button>
              </div>
            ) : (
              sortedAppointments.map((apt) => {
                const isToday = apt.date === todayStr;
                const isEmergency = apt.urgency === "Emergency";
                const isModerate = apt.urgency === "Moderate";

                return (
                  <div
                    key={apt.id}
                    className={`p-5 transition flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 ${
                      apt.status === "cancelled"
                        ? "bg-slate-50/40 opacity-70"
                        : apt.status === "checked_in"
                        ? "bg-sky-50/30 border-l-4 border-l-sky-500"
                        : isToday
                        ? "hover:bg-slate-50/80 border-l-4 border-l-amber-400"
                        : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                    }`}
                  >
                    {/* Left Block: Ref & Date/Time */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="text-center shrink-0 w-24">
                        <span className="text-xs font-black text-slate-900 block leading-tight">
                          {apt.referenceNumber}
                        </span>
                        <span className="text-sm font-black text-sky-600 block mt-0.5">
                          {apt.timeSlot}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {apt.date}
                        </span>
                        {isToday && (
                          <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Middle Details */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-slate-900 text-sm">{apt.patientName}</h4>
                          <span className="text-xs text-slate-400">({apt.patientAge} yrs)</span>
                          {apt.patientPhone && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              • {apt.patientPhone}
                            </span>
                          )}

                          {/* Urgency Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isEmergency
                                ? "bg-rose-100 border-rose-300 text-rose-800 animate-pulse shadow-xs shadow-rose-200/50"
                                : isModerate
                                ? "bg-amber-100 border-amber-300 text-amber-800"
                                : "bg-emerald-100 border-emerald-300 text-emerald-800"
                            }`}
                          >
                            {isEmergency && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />}
                            {apt.urgency}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              apt.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : apt.status === "checked_in"
                                ? "bg-sky-100 text-sky-800 border border-sky-200"
                                : apt.status === "completed"
                                ? "bg-slate-200 text-slate-700"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {apt.status === "checked_in" ? "In Live Queue" : apt.status}
                          </span>
                        </div>

                        {/* Attending Doctor */}
                        <p className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          <span>{apt.doctorName}</span>
                          <span className="text-slate-400 font-normal">({apt.roomNumber})</span>
                          <span className="text-slate-400 font-normal">• {apt.specialty}</span>
                        </p>

                        {/* Reason */}
                        <p className="text-xs text-slate-600 font-medium">
                          <strong className="text-slate-700">Reason:</strong> {apt.reason}
                        </p>

                        {/* Notes */}
                        {apt.notes && (
                          <p className="text-[11px] text-slate-400 italic">
                            Note: {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end xl:self-center">
                      {/* Check-In to Queue Button */}
                      {apt.status === "confirmed" && onCheckInAppointment && (
                        <button
                          type="button"
                          onClick={() => {
                            onCheckInAppointment(apt);
                            setStaffNotification(`Patient ${apt.patientName} has been checked into the live queue.`);
                          }}
                          className="py-2 px-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-sm shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Check In to Queue
                        </button>
                      )}

                      {/* Reschedule Button */}
                      {apt.status === "confirmed" && (
                        <button
                          type="button"
                          onClick={() => setReschedulingAppointment(apt)}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                          Reschedule
                        </button>
                      )}

                      {/* Mark Completed Button */}
                      {apt.status === "checked_in" && onUpdateAppointmentStatus && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAppointmentStatus(apt.id, "completed");
                            setStaffNotification(`Appointment ${apt.referenceNumber} marked completed.`);
                          }}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mark Completed
                        </button>
                      )}

                      {/* Cancel Button */}
                      {apt.status === "confirmed" && onUpdateAppointmentStatus && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAppointmentStatus(apt.id, "cancelled");
                            setStaffNotification(`Appointment ${apt.referenceNumber} cancelled.`);
                          }}
                          className="py-2 px-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      {/* Re-activate if cancelled */}
                      {apt.status === "cancelled" && onUpdateAppointmentStatus && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAppointmentStatus(apt.id, "confirmed");
                            setStaffNotification(`Appointment ${apt.referenceNumber} re-activated.`);
                          }}
                          className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Re-activate
                        </button>
                      )}

                      {apt.status === "completed" && (
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 px-2 py-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    )}

    {/* Staff Add Appointment Modal */}
    <AddAppointmentModal
      isOpen={isAddAppointmentOpen}
      onClose={() => setIsAddAppointmentOpen(false)}
      rooms={rooms}
      appointments={appointments}
      onAddAppointment={(newApt) => {
        onAddAppointment?.(newApt);
        setStaffNotification(`New appointment ${newApt.referenceNumber} scheduled for ${newApt.patientName}.`);
      }}
    />

    {/* Staff Reschedule Appointment Modal */}
    <RescheduleModal
      appointment={reschedulingAppointment}
      isOpen={!!reschedulingAppointment}
      onClose={() => setReschedulingAppointment(null)}
      rooms={rooms}
      allAppointments={appointments}
      onReschedule={(aptId, newDate, newTime, newDoctorId) => {
        onRescheduleAppointment?.(aptId, newDate, newTime, newDoctorId);
      }}
    />
  </div>
  );
};
