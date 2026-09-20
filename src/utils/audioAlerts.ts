// Web Audio API helper for hospital/clinic chime notifications
// Uses native browser AudioContext without external audio assets

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play an elegant two-tone clinic chime for status changes (e.g. "Now Calling / In Consultation")
 * Warm ascending chime (e.g., E5 -> B5, ~659Hz -> 987Hz)
 */
export function playConsultationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Note 2: B5 (987.77 Hz) slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.14);
    gain2.gain.setValueAtTime(0, now + 0.14);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.8);
  } catch (err) {
    console.warn("Audio chime could not play:", err);
  }
}

/**
 * Play a gentle hospital announcement chime for broad delay / triage updates
 * Three-bell chord progression (e.g. G4 -> C5 -> E5, ~392Hz -> 523Hz -> 659Hz)
 */
export function playBroadcastAlertSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, delay: 0.0, duration: 0.4 },  // C5
      { freq: 659.25, delay: 0.13, duration: 0.45 }, // E5
      { freq: 783.99, delay: 0.28, duration: 0.6 },  // G5
    ];

    notes.forEach(({ freq, delay, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle"; // Warm acoustic bell timbre
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.16, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.05);
    });
  } catch (err) {
    console.warn("Audio alert could not play:", err);
  }
}

/**
 * Play high-priority clinical emergency flash siren / attention pulse
 * Two alternating urgent dual-tone bursts (880Hz <-> 660Hz) with emergency pulse envelope
 */
export function playEmergencyGlobalAlertSiren(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pulses = [
      { freq: 880, delay: 0.0, duration: 0.22 },
      { freq: 659.25, delay: 0.25, duration: 0.22 },
      { freq: 880, delay: 0.5, duration: 0.25 },
      { freq: 659.25, delay: 0.78, duration: 0.35 },
    ];

    pulses.forEach(({ freq, delay, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.05);
    });
  } catch (err) {
    console.warn("Emergency siren could not play:", err);
  }
}
