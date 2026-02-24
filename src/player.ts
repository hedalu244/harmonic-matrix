import { Note } from "./note";

const audioCtx = new AudioContext();
const masterGain = audioCtx.createGain();
const compressor = audioCtx.createDynamicsCompressor();

masterGain.gain.value = 0.6;
compressor.threshold.value = -18;
compressor.knee.value = 24;
compressor.ratio.value = 4;
compressor.attack.value = 0.003;
compressor.release.value = 0.25;

masterGain.connect(compressor);
compressor.connect(audioCtx.destination);

type Voice = { oscillator: OscillatorNode; gain: GainNode };
let oscillators = new Map<number, Voice>();
const releaseTimeSec = 0.01;
const minGain = 0.0001;

export function isPlaying(note: Note): boolean {
    return oscillators.has(note.frequency);
}

function updateMasterGain() {
    const active = oscillators.size;
    const safe = active > 0 ? 1 / Math.sqrt(active) : 1;
    masterGain.gain.setTargetAtTime(0.6 * safe, audioCtx.currentTime, 0.01);
}

export function playNote(note: Note) {
    const frequency = note.frequency;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start();

    oscillators.set(frequency, { oscillator, gain });
    updateMasterGain();
}

export function stopNote(note: Note) {
    const voice = oscillators.get(note.frequency);
    if (voice) {
        const now = audioCtx.currentTime;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, minGain), now);
        voice.gain.gain.exponentialRampToValueAtTime(minGain, now + releaseTimeSec);
        voice.oscillator.stop(now + releaseTimeSec);
        voice.oscillator.onended = () => {
            voice.oscillator.disconnect();
            voice.gain.disconnect();
        };
    }
    oscillators.delete(note.frequency);
    updateMasterGain();
}

export function stopAllNotes() {
    for (const voice of oscillators.values()) {
        const now = audioCtx.currentTime;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, minGain), now);
        voice.gain.gain.exponentialRampToValueAtTime(minGain, now + releaseTimeSec);
        voice.oscillator.stop(now + releaseTimeSec);
        voice.oscillator.onended = () => {
            voice.oscillator.disconnect();
            voice.gain.disconnect();
        };
    }
    oscillators.clear();
    updateMasterGain();
}