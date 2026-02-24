import type p5_ from "p5";
import { getFrequency, Monzo, Val } from "./monzo";
import { Vector, Matrix, applyMatrix } from "./matrix";
import { Note } from "./note";
import { noteToPos } from "./renderer";
import { settings } from "./gui";

export function getClickedNote(p5: p5_, notes: Note[], matrix: Matrix): Note | null {
    const nearest = { note: null as Note | null, dist: Infinity };
    console.log(`Mouse: (${p5.mouseX}, ${p5.mouseY})`);
    for (const note of notes) {
        const pos = noteToPos(note, matrix);
        const d = p5.dist(p5.mouseX - p5.width / 2, p5.mouseY - p5.height / 2, pos.x, pos.y);
        if (d < nearest.dist) {
            nearest.note = note;
            nearest.dist = d;
        }
    }
    // const ans = nearest.dist <= size * 0.7 ? nearest.note : null;
    const ans = nearest.note;
    console.log(ans);
    return ans;
}

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

function playNote(note: Note) {
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

function stopNote(note: Note) {
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

export function onMouseDown(p5: p5_, notes: Note[], matrix: Matrix) {
    const note = getClickedNote(p5, notes, matrix);

    if (settings.playMode === "toggle") {
        if (note) {
            if (isPlaying(note))
                stopNote(note);
            else
                playNote(note);
        }
    }
    if (settings.playMode === "hold")
    if (note) {
        playNote(note);
    }
}

export function onMouseMoved(p5: p5_, notes: Note[], matrix: Matrix) {
    /*
    const note = getClickedNote(p5, notes, matrix);
    if (note !== playingNote) {
        stopNote();
        if (note) {
            playNote(note);
        }
    }*/
}
export function onMouseUp(p5: p5_) {
    if (settings.playMode === "hold") {
        stopAllNotes();
    }
}