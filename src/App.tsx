import React, { useState, useEffect, useRef } from "react";
import { Patient, ClinicRoom, BroadcastAlert, UserSession, TriageAnalysisResult, UrgencyLevel, Appointment, AppointmentStatus, GlobalAlert } from "./types";
import { INITIAL_PATIENTS, INITIAL_ROOMS, INITIAL_BROADCASTS, INITIAL_APPOINTMENTS } from "./data/initialData";
import { Header, ViewMode } from "./components/Header";
import { PatientView } from "./components/PatientView";
import { StaffDashboard } from "./components/StaffDashboard";
import { OnboardingGateModal } from "./components/OnboardingGateModal";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { DelayBroadcastModal } from "./components/DelayBroadcastModal";
import { AddPatientModal } from "./components/AddPatientModal";
import { GlobalAlertModal } from "./components/GlobalAlertModal";
import { GlobalAlertOverlay } from "./components/GlobalAlertOverlay";
import { ShieldCheck, HeartPulse, Sparkles, Smartphone, LayoutDashboard, SplitSquareVertical } from "lucide-react";
import { playConsultationChime, playBroadcastAlertSound, playEmergencyGlobalAlertSiren } from "./utils/audioAlerts";

export default function App() {
  // Session storage check for Onboarding Gate
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = sessionStorage.getItem("mediflow_user_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(!userSession);
  const [viewMode, setViewMode] = useState<ViewMode>("patient");

  // API Key state
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem("mediflow_gemini_key") || "";
    } catch {
      return "";
    }
  });
  const [hasEnvKey, setHasEnvKey] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Clinic Core Data State
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [rooms, setRooms] = useState<ClinicRoom[]>(INITIAL_ROOMS);
  const [broadcasts, setBroadcasts] = useState<BroadcastAlert[]>(INITIAL_BROADCASTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);

  // Modals state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [isGlobalAlertModalOpen, setIsGlobalAlertModalOpen] = useState(false);
  const [globalAlert, setGlobalAlert] = useState<GlobalAlert | null>(null);

  // Audio Alerts Configuration & Sound State (Enabled by default, user-toggleable)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("mediflow_sound_enabled");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mediflow_sound_enabled", String(next));
      } catch (e) {
        console.warn("Storage error", e);
      }
      // If toggled on, play a brief preview chime
      if (next) {
        playConsultationChime();
      }
      return next;
    });
  };

  // Keep track of previous consultation patient IDs and broadcast count to detect updates
  const prevInConsultationIdsRef = useRef<Set<string>>(
    new Set(INITIAL_PATIENTS.filter((p) => p.status === "in_consultation").map((p) => p.id))
  );
  const prevBroadcastCountRef = useRef<number>(INITIAL_BROADCASTS.length);
  const isInitialMountRef = useRef<boolean>(true);

  // Sound effect trigger: Patient status changed to 'in_consultation'
  useEffect(() => {
    if (isInitialMountRef.current) {
      return;
    }

    const currentConsultationIds = new Set(
      patients.filter((p) => p.status === "in_consultation").map((p) => p.id)
    );

    // Check if any patient newly entered 'in_consultation'
    let newlyCalled = false;
    currentConsultationIds.forEach((id) => {
      if (!prevInConsultationIdsRef.current.has(id)) {
        newlyCalled = true;
      }
    });

    prevInConsultationIdsRef.current = currentConsultationIds;

    if (newlyCalled && soundEnabled) {
      playConsultationChime();
    }
  }, [patients, soundEnabled]);

  // Sound effect trigger: New broadcast alert posted
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (broadcasts.length > prevBroadcastCountRef.current && soundEnabled) {
      playBroadcastAlertSound();
    }
    prevBroadcastCountRef.current = broadcasts.length;
  }, [broadcasts, soundEnabled]);

  // Check health / server key presence on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data?.hasApiKey) {
          setHasEnvKey(true);
        }
      })
      .catch((err) => console.log("Healthcheck:", err));
  }, []);

  // Save API key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      if (key) {
        localStorage.setItem("mediflow_gemini_key", key);
      } else {
        localStorage.removeItem("mediflow_gemini_key");
      }
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  // Complete Onboarding Gate
  const handleCompleteOnboarding = (session: UserSession) => {
    setUserSession(session);
    try {
      sessionStorage.setItem("mediflow_user_session", JSON.stringify(session));
    } catch (e) {
      console.warn("Session storage error", e);
    }

    // Insert or update patient record in the queue
    setPatients((prev) => {
      const exists = prev.find((p) => p.id === session.patientId || p.tokenNumber === session.tokenNumber);
      if (exists) {
        return prev.map((p) =>
          p.id === exists.id
            ? { ...p, name: session.name, age: session.age, phone: session.phone }
            : p
        );
      }

      const newPatient: Patient = {
        id: session.patientId,
        tokenNumber: session.tokenNumber,
        name: session.name,
        age: session.age,
        symptoms: "Awaiting triage symptoms analysis",
        urgency: "Normal",
        triageScore: 3,
        status: "waiting",
        checkInTime: session.registeredAt,
        estimatedWaitMinutes: 18,
        phone: session.phone,
        isCurrentUser: true,
      };

      return [...prev, newPatient];
    });

    setIsOnboardingOpen(false);
  };

  // Synchronize AI Triage result back into the patient record
  const handleTriageCompleted = (
    patientId: string,
    result: TriageAnalysisResult,
    symptomsText: string
  ) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            symptoms: symptomsText,
            urgency: result.urgency,
            triageScore: result.triageScore,
            triageNotes: result.triageNotes,
            precautions: result.precautions,
            estimatedWaitMinutes: result.estimatedMinutes,
            roomNumber: result.recommendedDepartment,
          };
        }
        return p;
      })
    );
  };

  // Receptionist Action: Call Patient to Room
  const handleCallPatient = (patientId: string, roomId?: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId) || rooms.find((r) => r.status === "available") || rooms[0];

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            status: "in_consultation",
            roomNumber: targetRoom ? targetRoom.roomNumber : "Room 102",
            doctorName: targetRoom ? targetRoom.doctor : "Dr. Marcus Vance",
            estimatedWaitMinutes: 0,
          };
        }
        return p;
      })
    );

    if (targetRoom) {
      const patientToCall = patients.find((p) => p.id === patientId);
      setRooms((prev) =>
        prev.map((r) =>
          r.id === targetRoom.id
            ? {
                ...r,
                status: "occupied",
                currentPatientToken: patientToCall?.tokenNumber || "#A-104",
                currentPatientName: patientToCall?.name || "Patient",
              }
            : r
        )
      );
    }
  };

  // Receptionist Action: Mark Patient Consultation Completed
  const handleCompletePatient = (patientId: string) => {
    const targetPatient = patients.find((p) => p.id === patientId);

    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status: "completed" } : p))
    );

    // Free the associated room
    if (targetPatient?.roomNumber) {
      setRooms((prev) =>
        prev.map((r) =>
          r.roomNumber === targetPatient.roomNumber
            ? { ...r, status: "available", currentPatientToken: undefined, currentPatientName: undefined }
            : r
        )
      );
    }
  };

  // Manual Urgency Adjustment from Staff Dashboard
  const handleUpdateUrgency = (patientId: string, newUrgency: UrgencyLevel) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const score = newUrgency === "Emergency" ? 9 : newUrgency === "Moderate" ? 6 : 3;
          return { ...p, urgency: newUrgency, triageScore: score };
        }
        return p;
      })
    );
  };

  // Staff Action: Send Broadcast Delay Notice
  const handleSendBroadcast = (message: string, delayMinutes?: number) => {
    const newBroadcast: BroadcastAlert = {
      id: `b-${Date.now()}`,
      type: "delay",
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      author: "Reception Control Tower",
      active: true,
      delayMinutes,
    };

    setBroadcasts((prev) => [newBroadcast, ...prev.map((b) => ({ ...b, active: false }))]);
  };

  const handleClearBroadcast = (broadcastId: string) => {
    setBroadcasts((prev) => prev.map((b) => (b.id === broadcastId ? { ...b, active: false } : b)));
  };

  // Staff Action: Broadcast Global Flash Alert (Screen Override for all users)
  const handleBroadcastGlobalAlert = (alertData: Omit<GlobalAlert, "id" | "timestamp" | "active">) => {
    const newAlert: GlobalAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      active: true,
    };
    setGlobalAlert(newAlert);
    if (soundEnabled) {
      playEmergencyGlobalAlertSiren();
    }
  };

  const handleDeactivateGlobalAlert = () => {
    setGlobalAlert(null);
  };

  // Staff Action: Toggle Room Status
  const handleToggleRoomStatus = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const nextStatus = r.status === "available" ? "occupied" : r.status === "occupied" ? "cleaning" : "available";
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  // Staff Action: Add Walk-In Patient
  const handleAddWalkInPatient = (
    name: string,
    age: number,
    symptoms: string,
    urgency: UrgencyLevel,
    phone?: string
  ) => {
    const tokenNum = 100 + patients.length + 1;
    const newPatient: Patient = {
      id: `p-${Date.now()}`,
      tokenNumber: `#A-${tokenNum}`,
      name,
      age,
      symptoms,
      urgency,
      triageScore: urgency === "Emergency" ? 9 : urgency === "Moderate" ? 6 : 3,
      status: "waiting",
      checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      estimatedWaitMinutes: urgency === "Emergency" ? 4 : 18,
      phone,
    };
    setPatients((prev) => [...prev, newPatient]);
  };

  // Appointment Actions
  const handleBookAppointment = (appointment: Appointment) => {
    setAppointments((prev) => [appointment, ...prev]);
  };

  const handleCheckInAppointment = (appointment: Appointment) => {
    // 1. Mark appointment status as checked_in
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointment.id ? { ...a, status: "checked_in" } : a))
    );

    // 2. Add to active live patients queue
    const tokenNum = 100 + patients.length + 1;
    const isEmergency = appointment.urgency === "Emergency";
    const isModerate = appointment.urgency === "Moderate";

    const newPatient: Patient = {
      id: `p-apt-${Date.now()}`,
      tokenNumber: `#A-${tokenNum}`,
      name: appointment.patientName,
      age: appointment.patientAge,
      symptoms: appointment.reason || "Scheduled clinic consultation",
      urgency: appointment.urgency || "Normal",
      triageScore: isEmergency ? 9 : isModerate ? 6 : 3,
      status: "waiting",
      checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      estimatedWaitMinutes: isEmergency ? 4 : isModerate ? 10 : 16,
      phone: appointment.patientPhone,
      isCurrentUser: userSession?.name?.trim().toLowerCase() === appointment.patientName.trim().toLowerCase(),
      roomNumber: appointment.roomNumber,
      doctorName: appointment.doctorName,
    };

    setPatients((prev) => [...prev, newPatient]);
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
    );
  };

  const handleRescheduleAppointment = (
    appointmentId: string,
    newDate: string,
    newTime: string,
    newDoctorId?: string
  ) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appointmentId) {
          const docRoom = rooms.find((r) => r.id === newDoctorId);
          return {
            ...a,
            date: newDate,
            timeSlot: newTime,
            doctorId: docRoom?.id || a.doctorId,
            doctorName: docRoom?.doctor || a.doctorName,
            specialty: docRoom?.specialty || a.specialty,
            roomNumber: docRoom?.roomNumber || a.roomNumber,
            status: "confirmed" as const,
          };
        }
        return a;
      })
    );
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "cancelled" } : a))
    );
  };

  // Get current active session patient
  const currentPatient =
    patients.find((p) => p.isCurrentUser || p.tokenNumber === userSession?.tokenNumber) ||
    patients[0] ||
    null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-sky-100 selection:text-sky-900">
      {/* Mandatory Onboarding Gate Modal */}
      <OnboardingGateModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
        initialName={userSession?.name}
        initialAge={userSession?.age}
      />

      {/* Floating Settings / Gemini API Config Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
        hasEnvKey={hasEnvKey}
      />

      {/* Staff Delay Broadcast Modal */}
      <DelayBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSendBroadcast={handleSendBroadcast}
      />

      {/* Staff Add Walk-in Modal */}
      <AddPatientModal
        isOpen={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        onAddPatient={handleAddWalkInPatient}
        nextTokenNumber={`#A-${100 + patients.length + 1}`}
      />

      {/* Staff Global Flash Alert Composer & Template Modal */}
      <GlobalAlertModal
        isOpen={isGlobalAlertModalOpen}
        onClose={() => setIsGlobalAlertModalOpen(false)}
        onBroadcast={handleBroadcastGlobalAlert}
        onDeactivate={handleDeactivateGlobalAlert}
        activeGlobalAlert={globalAlert}
      />

      {/* High-Priority Global Flash Screen Override (Overriding all screens when active) */}
      <GlobalAlertOverlay
        alert={globalAlert}
        onDeactivate={handleDeactivateGlobalAlert}
        onOpenEditModal={() => setIsGlobalAlertModalOpen(true)}
        isStaff={viewMode === "staff" || viewMode === "split"}
      />

      {/* Application Header & View Switcher */}
      <Header
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        userSession={userSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReopenOnboarding={() => setIsOnboardingOpen(true)}
        apiKey={apiKey}
        hasEnvKey={hasEnvKey}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: Patient View (Mobile-optimized card interface) */}
        {viewMode === "patient" && (
          <div className="animate-fadeIn">
            <PatientView
              currentPatient={currentPatient}
              allPatients={patients}
              broadcasts={broadcasts}
              rooms={rooms}
              appointments={appointments}
              userSession={userSession}
              apiKey={apiKey}
              hasEnvKey={hasEnvKey}
              onTriageCompleted={handleTriageCompleted}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onBookAppointment={handleBookAppointment}
              onCheckInAppointment={handleCheckInAppointment}
              onCancelAppointment={handleCancelAppointment}
            />
          </div>
        )}

        {/* VIEW 2: Staff / Receptionist Control Tower */}
        {viewMode === "staff" && (
          <div className="animate-fadeIn">
            <StaffDashboard
              patients={patients}
              rooms={rooms}
              broadcasts={broadcasts}
              appointments={appointments}
              onCallPatient={handleCallPatient}
              onCompletePatient={handleCompletePatient}
              onUpdateUrgency={handleUpdateUrgency}
              onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
              onOpenAddPatientModal={() => setIsAddPatientModalOpen(true)}
              onClearBroadcast={handleClearBroadcast}
              onToggleRoomStatus={handleToggleRoomStatus}
              onCheckInAppointment={handleCheckInAppointment}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onRescheduleAppointment={handleRescheduleAppointment}
              onAddAppointment={handleBookAppointment}
              onOpenGlobalAlertModal={() => setIsGlobalAlertModalOpen(true)}
              activeGlobalAlert={globalAlert}
              onDeactivateGlobalAlert={handleDeactivateGlobalAlert}
            />
          </div>
        )}

        {/* VIEW 3: Side-by-Side Split View (Instant Reactive Demo) */}
        {viewMode === "split" && (
          <div className="animate-fadeIn space-y-4">
            {/* Split Screen Explainer Banner */}
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between text-xs text-sky-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span className="font-semibold">
                  Live Synchronized Split View: Book an appointment, check in, or call patients to observe instant reactive updates across both screens!
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white font-bold border border-sky-200 text-sky-700 shrink-0">
                Instant Bidirectional State
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column: Patient Mobile View Simulation (5 cols) */}
              <div className="xl:col-span-5 bg-slate-100/70 p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-inner">
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-sky-600" />
                    Patient Mobile Display (Live Sync)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Receiving Updates
                  </span>
                </div>
                <PatientView
                  currentPatient={currentPatient}
                  allPatients={patients}
                  broadcasts={broadcasts}
                  rooms={rooms}
                  appointments={appointments}
                  userSession={userSession}
                  apiKey={apiKey}
                  hasEnvKey={hasEnvKey}
                  onTriageCompleted={handleTriageCompleted}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onBookAppointment={handleBookAppointment}
                  onCheckInAppointment={handleCheckInAppointment}
                  onCancelAppointment={handleCancelAppointment}
                />
              </div>

              {/* Right Column: Staff Control Tower (7 cols) */}
              <div className="xl:col-span-7 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4 text-teal-600" />
                    Receptionist Control Tower (Command Center)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                    Transmitting State
                  </span>
                </div>
                <StaffDashboard
                  patients={patients}
                  rooms={rooms}
                  broadcasts={broadcasts}
                  appointments={appointments}
                  onCallPatient={handleCallPatient}
                  onCompletePatient={handleCompletePatient}
                  onUpdateUrgency={handleUpdateUrgency}
                  onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
                  onOpenAddPatientModal={() => setIsAddPatientModalOpen(true)}
                  onClearBroadcast={handleClearBroadcast}
                  onToggleRoomStatus={handleToggleRoomStatus}
                  onCheckInAppointment={handleCheckInAppointment}
                  onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                  onRescheduleAppointment={handleRescheduleAppointment}
                  onAddAppointment={handleBookAppointment}
                  onOpenGlobalAlertModal={() => setIsGlobalAlertModalOpen(true)}
                  activeGlobalAlert={globalAlert}
                  onDeactivateGlobalAlert={handleDeactivateGlobalAlert}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-4 px-6 text-center text-xs text-slate-400">
        <p>MediFlow AI • Clinical Crowd & Queue Management • Built with Apple Health & Modern Fintech Design</p>
      </footer>
    </div>
  );
}
