export type UrgencyLevel = "Normal" | "Moderate" | "Emergency";

export type PatientStatus = "waiting" | "in_consultation" | "completed";

export interface Patient {
  id: string;
  tokenNumber: string;
  name: string;
  age: number;
  symptoms: string;
  urgency: UrgencyLevel;
  triageScore: number; // 1 to 10
  status: PatientStatus;
  checkInTime: string;
  estimatedWaitMinutes: number;
  roomNumber?: string;
  doctorName?: string;
  triageNotes?: string;
  precautions?: string[];
  phone?: string;
  isCurrentUser?: boolean;
}

export interface ClinicRoom {
  id: string;
  roomNumber: string;
  doctor: string;
  specialty: string;
  status: "available" | "occupied" | "cleaning";
  currentPatientToken?: string;
  currentPatientName?: string;
}

export interface BroadcastAlert {
  id: string;
  type: "delay" | "calling" | "general";
  message: string;
  timestamp: string;
  author: string;
  active: boolean;
  delayMinutes?: number;
}

export type GlobalAlertSeverity = "critical" | "high" | "urgent";

export interface GlobalAlert {
  id: string;
  title: string;
  message: string;
  instructions: string[];
  severity: GlobalAlertSeverity;
  category: "evacuation" | "code_blue" | "surge" | "lockdown" | "custom";
  timestamp: string;
  author: string;
  active: boolean;
}

export interface TriageAnalysisResult {
  urgency: UrgencyLevel;
  triageScore: number;
  recommendedDepartment: string;
  triageNotes: string;
  estimatedMinutes: number;
  precautions: string[];
  aiProvider?: string;
  fallbackNotice?: string;
}

export interface UserSession {
  name: string;
  age: number;
  phone?: string;
  patientId: string;
  tokenNumber: string;
  registeredAt: string;
}

export type AppointmentStatus = "confirmed" | "checked_in" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  referenceNumber: string; // e.g. "APT-1082"
  patientName: string;
  patientAge: number;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  roomNumber: string;
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "09:30 AM"
  reason: string;
  urgency: UrgencyLevel;
  status: AppointmentStatus;
  createdAt: string;
  notes?: string;
}
