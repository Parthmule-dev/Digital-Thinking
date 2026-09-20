import React, { useState } from "react";
import { X, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { Appointment, ClinicRoom } from "../types";

interface RescheduleModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  rooms: ClinicRoom[];
  allAppointments: Appointment[];
  onReschedule: (appointmentId: string, newDate: string, newTime: string, newDoctorId?: string) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  isOpen,
  onClose,
  rooms,
  allAppointments,
  onReschedule,
}) => {
  if (!isOpen || !appointment) return null;

  const todayStr = "2026-09-20";
  const [newDate, setNewDate] = useState(appointment.date || todayStr);
  const [newTime, setNewTime] = useState(appointment.timeSlot || "10:15 AM");
  const [newDoctorId, setNewDoctorId] = useState(appointment.doctorId || rooms[0]?.id || "room-1");
  const [error, setError] = useState("");

  const standardTimeSlots = [
    "09:00 AM", "09:30 AM", "10:15 AM", "11:00 AM", "11:45 AM",
    "01:30 PM", "02:15 PM", "03:00 PM", "03:45 PM", "04:30 PM",
    "05:15 PM", "05:45 PM"
  ];

  const isSlotBooked = (slot: string) => {
    return allAppointments.some(
      (a) =>
        a.id !== appointment.id &&
        a.date === newDate &&
        a.timeSlot === slot &&
        a.doctorId === newDoctorId &&
        a.status !== "cancelled"
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSlotBooked(newTime)) {
      setError("This slot is already booked for this doctor. Please choose another.");
      return;
    }
    setError("");
    onReschedule(appointment.id, newDate, newTime, newDoctorId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Reschedule Appointment</h3>
              <p className="text-xs text-slate-500">{appointment.referenceNumber} • {appointment.patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Doctor & Suite
            </label>
            <select
              value={newDoctorId}
              onChange={(e) => setNewDoctorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none"
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
                New Date
              </label>
              <input
                type="date"
                value={newDate}
                min={todayStr}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Time Slot
              </label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none"
              >
                {standardTimeSlots.map((slot) => {
                  const booked = isSlotBooked(slot);
                  return (
                    <option key={slot} value={slot} disabled={booked}>
                      {slot} {booked ? "(Booked)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
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
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition cursor-pointer"
            >
              Save New Slot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
