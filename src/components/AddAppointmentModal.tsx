import React, { useState } from "react";
import { X, Calendar as CalendarIcon, Clock, Stethoscope, User, AlertCircle, PlusCircle } from "lucide-react";
import { Appointment, ClinicRoom, UrgencyLevel } from "../types";

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: ClinicRoom[];
  appointments: Appointment[];
  onAddAppointment: (appointment: Appointment) => void;
}

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  isOpen,
  onClose,
  rooms,
  appointments,
  onAddAppointment,
}) => {
  const todayStr = "2026-09-20";

  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState(rooms[0]?.id || "room-1");
  const [date, setDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState("10:30 AM");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Normal");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const standardTimeSlots = [
    "09:00 AM", "09:30 AM", "10:15 AM", "11:00 AM", "11:45 AM",
    "01:30 PM", "02:15 PM", "03:00 PM", "03:45 PM", "04:30 PM",
    "05:15 PM", "05:45 PM"
  ];

  const selectedDoctor = rooms.find((r) => r.id === selectedDoctorId) || rooms[0];

  const isSlotBooked = (slot: string) => {
    return appointments.some(
      (a) =>
        a.date === date &&
        a.timeSlot === slot &&
        a.doctorId === selectedDoctorId &&
        a.status !== "cancelled"
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError("Please enter patient name.");
      return;
    }
    const parsedAge = parseInt(patientAge, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      setError("Please enter a valid age.");
      return;
    }
    if (isSlotBooked(timeSlot)) {
      setError("This time slot is already booked for this doctor. Please pick another.");
      return;
    }

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
      date,
      timeSlot,
      reason: reason.trim() || "Clinical Consultation",
      urgency,
      status: "confirmed",
      createdAt: todayStr,
      notes: notes.trim() || undefined,
    };

    onAddAppointment(newAppointment);
    setPatientName("");
    setPatientAge("");
    setPatientPhone("");
    setReason("");
    setNotes("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Schedule Appointment (Staff Desk)</h3>
              <p className="text-xs text-slate-500">Book phone-in or future patient consultation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Name *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. David Williams"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age *
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="45"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+1 555-019-3388"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Triage Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Moderate">Moderate</option>
                <option value="Emergency">Emergency Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Doctor & Suite *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.doctor} ({r.roomNumber}) - {r.specialty}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time Slot *
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none"
              >
                {standardTimeSlots.map((slot) => {
                  const booked = isSlotBooked(slot);
                  return (
                    <option key={slot} value={slot} disabled={booked}>
                      {slot} {booked ? "(Already Booked)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Visit / Symptoms
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Follow-up consultation for respiratory symptoms"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Staff Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any intake notes or insurance details..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Schedule Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
