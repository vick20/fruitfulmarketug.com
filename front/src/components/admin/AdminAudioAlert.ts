// Web Audio API based chime for order alerts
let audioCtx: AudioContext | null = null;

export function playOrderChime(volume: number = 0.5): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Tone 1: E5 (659.25 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(volume * 0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Tone 2: G#5 (830.61 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(830.61, now + 0.12);
    gain2.gain.setValueAtTime(volume * 0.5, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.56);

    // Tone 3: B5 (987.77 Hz) - cheerful resolution
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(987.77, now + 0.24);
    gain3.gain.setValueAtTime(volume * 0.6, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.86);
  } catch (err) {
    console.warn("[AudioAlert] Failed to synthesize order chime:", err);
  }
}
