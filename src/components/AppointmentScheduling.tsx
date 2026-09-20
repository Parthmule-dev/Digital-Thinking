import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  CalendarCheck,
  PlusCircle,
  X,
  Phone,
  Sparkles,
  ExternalLink,
  MapPin,
  ArrowRight
} from "lucide-react";
import { Appointment, ClinicRoom, UrgencyLevel, UserSession } from "../types";

interface AppointmentSchedulingProps {
  rooms: ClinicRoom[];
  appointments: Appointment[];
  userSession: UserSession | null;
  onBookAppointment: (appointment: Appointment) => void;
  onCheckInAppointment?: (appointment: Appointment) => void;
  onCancelAppointment?: (appointmentId: string) => void;
  onBackToQueue?: () => void;
}

export const AppointmentScheduling: React.FC<AppointmentSchedulingProps> = ({
  rooms,
  appointments,
  userSession,
  onBookAppointment,
  onCheckInAppointment,
  onCancelAppointment,
  onBackToQueue,
}) => {
  // Today is 2026-09-20
  const todayStr = "2026-09-20";

  // Pre-generate 7 days of dates starting from today
  const availableDates = [
    { label: "Today", date: "2026-09-20", dayName: "Sun", dayNum: "20", month: "Sep" },
    { label: "Tomorrow", date: "2026-09-21", dayName: "Mon", dayNum: "21", month: "Sep" },
    { label: "Tue", date: "2026-09-22", dayName: "Tue", dayNum: "22", month: "Sep" },
    { label: "Wed", date: "2026-09-23", dayName: "Wed", dayNum: "23", month: "Sep" },
    { label: "Thu", date: "2026-09-24", dayName: "Thu", dayNum: "24", month: "Sep" },
    { label: "Fri", date: "2026-09-25", dayName: "Fri", dayNum: "25", month: "Sep" },
    { label: "Sat", date: "2026-09-26", dayName: "Sat", dayNum: "26", month: "Sep" },
  ];

  const standardTimeSlots = [
    { slot: "09:00 AM", period: "Morning" },
    { slot: "09:30 AM", period: "Morning" },
    { slot: "10:15 AM", period: "Morning" },
    { slot: "11:00 AM", period: "Morning" },
    { slot: "11:45 AM", period: "Morning" },
    { slot: "01:30 PM", period: "Afternoon" },
    { slot: "02:15 PM", period: "Afternoon" },
    { slot: "03:00 PM", period: "Afternoon" },
    { slot: "03:45 PM", period: "Afternoon" },
    { slot: "04:30 PM", period: "Afternoon" },
    { slot: "05:15 PM", period: "Evening" },
    { slot: "05:45 PM", period: "Evening" },
  ];

  // Form states
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(rooms[0]?.id || "room-1");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("10:15 AM");
  const [patientName, setPatientName] = useState(userSession?.name || "Sarah Connor");
  const [patientAge, setPatientAge] = useState(userSession?.age ? String(userSession.age) : "34");
  const [patientPhone, setPatientPhone] = useState(userSession?.phone || "+1 555-019-8822");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Normal");
  const [notes, setNotes] = useState("");

  // UI state
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [formError, setFormError] = useState("");
  const [viewTab, setViewTab] = useState<"book" | "my_appointments">("book");

  // Selected doctor object
  const selectedDoctor = rooms.find((r) => r.id === selectedDoctorId) || rooms[0];

  // Helper to check if a specific time slot is already taken for selected date & doctor
  const isSlotBooked = (slot: string) => {
    return appointments.some(
      (a) =>
        a.date === selectedDate &&
        a.timeSlot === slot &&
        a.doctorId === selectedDoctorId &&
        a.status !== "cancelled"
    );
  };

  // Filter patient's appointments (matching current user session name or phone)
  const myAppointments = appointments.filter((a) => {
    if (userSession?.name) {
      return a.patientName.toLowerCase() === userSession.name.toLowerCase();
    }
    return a.patientName.toLowerCase() === patientName.toLowerCase();
  });

  const reasonPresets = [
    "Routine Medical Check-up",
    "Prescription Renewal",
    "Follow-up on Lab Results",
    "Persistent Cough & Cold",
    "Specialist Consultation",
    "General Health Screening",
  ];

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setFormError("Please enter patient name.");
      return;
    }
    const parsedAge = parseInt(patientAge, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      setFormError("Please enter a valid age.");
      return;
    }
    if (!selectedTimeSlot) {
      setFormError("Please select a convenient time slot.");
      return;
    }
    if (isSlotBooked(selectedTimeSlot)) {
      setFormError("This time slot has already been booked. Please pick an alternative slot.");
      return;
    }

    setFormError("");

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      referenceNumber: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientName.trim(),
      patientAge: parsedAge,
      patientPhone: patientPhone.trim() || undefined,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.doctor,
      specialty: selectedDoctor.specialty,
      roomNumber: selectedDoctor.roomNumber,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      reason: reason.trim() || "Consultation & Health Review",
      urgency,
      status: "confirmed",
      createdAt: todayStr,
      notes: notes.trim() || undefined,
    };

    onBookAppointment(newAppointment);
    setConfirmedBooking(newAppointment);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-fadeIn">
      {/* Navigation Sub-header (Book vs My Appointments) */}
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setViewTab("book");
              setConfirmedBooking(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              viewTab === "book"
                ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Book New Appointment
          </button>

          <button
            type="button"
            onClick={() => setViewTab("my_appointments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              viewTab === "my_appointments"
                ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            My Booked Visits
            {myAppointments.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                viewTab === "my_appointments" ? "bg-white text-sky-700" : "bg-sky-100 text-sky-700"
              }`}>
                {myAppointments.length}
              </span>
            )}
          </button>
        </div>

        {onBackToQueue && (
          <button
            type="button"
            onClick={onBackToQueue}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium flex items-center gap-1 cursor-pointer"
          >
            Back to Live Queue
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* VIEW: Confirmed Pass Screen */}
      {confirmedBooking ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-fadeIn">
          {/* Top Success Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 p-6 text-white text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center text-white mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              Booking Confirmed
            </span>
            <h2 className="text-2xl font-black mt-2">Appointment Scheduled!</h2>
            <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto">
              Your appointment pass is generated and registered in the clinic management database.
            </p>
          </div>

          {/* Pass Details Card */}
          <div className="p-6 space-y-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Booking Reference
                  </span>
                  <span className="text-xl font-black text-slate-900 tracking-tight">
                    {confirmedBooking.referenceNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Status
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Confirmed
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Date & Time</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
                    {confirmedBooking.date} • {confirmedBooking.timeSlot}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Doctor & Suite</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    {confirmedBooking.doctorName} ({confirmedBooking.roomNumber})
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Patient Name</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {confirmedBooking.patientName} (Age: {confirmedBooking.patientAge})
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Specialty</span>
                  <p className="font-bold text-slate-700 text-sm mt-0.5">
                    {confirmedBooking.specialty}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/70">
                <span className="text-slate-400 font-medium text-xs block">Consultation Reason</span>
                <p className="text-xs text-slate-700 font-medium mt-1 bg-white p-2.5 rounded-xl border border-slate-200/60">
                  {confirmedBooking.reason}
                </p>
              </div>
            </div>

            {/* If appointment date is today, offer Instant Live Queue Check-in */}
            {confirmedBooking.date === todayStr && onCheckInAppointment && (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-900">Arrived at the Clinic Today?</h4>
                    <p className="text-[11px] text-sky-700">Check-in immediately to generate your Live Queue Token.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCheckInAppointment(confirmedBooking);
                    if (onBackToQueue) onBackToQueue();
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition cursor-pointer shrink-0"
                >
                  Check In to Live Queue Now
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmedBooking(null);
                  setViewTab("my_appointments");
                }}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer text-center"
              >
                View My Appointments
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmedBooking(null);
                  setViewTab("book");
                  setReason("");
                }}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition cursor-pointer text-center"
              >
                Book Another Slot
              </button>
            </div>
          </div>
        </div>
      ) : viewTab === "book" ? (
        /* VIEW: Booking Form */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8 relative overflow-hidden">
          {/* Ambient Background Accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Schedule Doctor Consultation</h2>
              <p className="text-xs text-slate-500 font-medium">
                Select your preferred doctor, date, and time slot for priority clinic entry.
              </p>
            </div>
          </div>

          <form onSubmit={handleBookSubmit} className="space-y-6 relative">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: Select Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-black">
                    1
                  </span>
                  Select Date
                </span>
                <span className="text-[11px] font-semibold text-sky-600 lowercase font-normal">
                  Selected: {selectedDate}
                </span>
              </label>

              {/* Horizontal Scrollable Day Cards */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {availableDates.map((d) => {
                  const isSelected = selectedDate === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(d.date)}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20 font-bold"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80"
                      }`}
                    >
                      <span className={`text-[10px] font-medium uppercase ${isSelected ? "text-sky-100" : "text-slate-400"}`}>
                        {d.dayName}
                      </span>
                      <span className="text-base font-black my-0.5">{d.dayNum}</span>
                      <span className={`text-[9px] font-medium ${isSelected ? "text-sky-100" : "text-slate-500"}`}>
                        {d.month}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Select Attending Doctor / Specialty Suite */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-black">
                  2
                </span>
                Select Doctor & Specialty Suite
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rooms.map((room) => {
                  const isSelected = selectedDoctorId === room.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedDoctorId(room.id)}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-sky-50/80 border-sky-400 ring-2 ring-sky-500/20 shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-200/80"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        {room.doctor.replace("Dr. ", "").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {room.doctor}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-400">
                            {room.roomNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {room.specialty}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: Select Time Slot */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-black">
                    3
                  </span>
                  Select Convenient Time Slot
                </label>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-600" /> Selected
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300" /> Booked
                  </span>
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {standardTimeSlots.map(({ slot, period }) => {
                  const booked = isSlotBooked(slot);
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={booked}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex flex-col items-center justify-center ${
                        booked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-sky-600 text-white border-sky-600 shadow-sm font-bold"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80"
                      }`}
                    >
                      <span>{slot}</span>
                      <span className={`text-[9px] ${isSelected ? "text-sky-100" : "text-slate-400"}`}>
                        {booked ? "Taken" : period}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: Patient Details & Reason */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-black">
                  4
                </span>
                Patient Info & Reason for Visit
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mobile / WhatsApp Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+1 555-019-8822"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Urgency Tier
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="Normal">Normal Routine</option>
                    <option value="Moderate">Moderate Concern</option>
                    <option value="Emergency">Urgent Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Reason for Consultation / Symptoms
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Regular health checkup or mild chest tightness"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 mb-2"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {reasonPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium transition cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Summary Footer */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-900 block">Appointment Summary:</span>
                <span>
                  {selectedDate} at <strong>{selectedTimeSlot}</strong> with{" "}
                  <strong>{selectedDoctor.doctor}</strong> ({selectedDoctor.roomNumber})
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" />
                Confirm & Schedule Appointment
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW: My Booked Appointments List */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">My Scheduled Appointments</h3>
              <p className="text-xs text-slate-500">Upcoming clinical visits recorded for {patientName}</p>
            </div>
            <button
              type="button"
              onClick={() => setViewTab("book")}
              className="px-3 py-1.5 bg-sky-50 text-sky-700 font-bold rounded-xl text-xs hover:bg-sky-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Book Another
            </button>
          </div>

          {myAppointments.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No scheduled appointments yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Select a date and doctor above to book your consultation.</p>
              <button
                type="button"
                onClick={() => setViewTab("book")}
                className="mt-3 px-4 py-2 bg-sky-600 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Schedule First Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myAppointments.map((apt) => {
                const isToday = apt.date === todayStr;
                return (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{apt.referenceNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : apt.status === "checked_in"
                              ? "bg-sky-100 text-sky-800"
                              : apt.status === "completed"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-rose-100 text-rose-800"
                          }`}>
                            {apt.status.replace("_", " ").toUpperCase()}
                          </span>
                          {apt.urgency === "Emergency" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 border border-rose-300 text-rose-700 animate-pulse shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              Emergency
                            </span>
                          )}
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          {apt.doctorName} • {apt.specialty} ({apt.roomNumber})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-sky-600 block">{apt.timeSlot}</span>
                        <span className="text-[11px] text-slate-400">{apt.date}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60 font-medium">
                      Reason: {apt.reason}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-slate-400">
                        Patient: {apt.patientName} (Age: {apt.patientAge})
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Check-in button if today and not already checked in */}
                        {isToday && apt.status === "confirmed" && onCheckInAppointment && (
                          <button
                            type="button"
                            onClick={() => {
                              onCheckInAppointment(apt);
                              if (onBackToQueue) onBackToQueue();
                            }}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                          >
                            Check In to Queue
                          </button>
                        )}

                        {apt.status === "confirmed" && onCancelAppointment && (
                          <button
                            type="button"
                            onClick={() => onCancelAppointment(apt.id)}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
