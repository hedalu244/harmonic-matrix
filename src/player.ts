import type p5_ from "p5";
import { getFrequency, Monzo, Val } from "./monzo";
import { Vector, Matrix, applyMatrix } from "./matrix";
import { Note } from "./note";
import { noteToPos, radius } from "./renderer";

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
    const ans = nearest.dist <= radius ? nearest.note : null;
    console.log(ans);
    return ans;
}

const audioCtx = new AudioContext();
let oscillator: OscillatorNode | null = null;
let playingNote = null as Note | null;

export function isPlaying(note: Note): boolean {
    return playingNote === note;
}

function playNote(note: Note, val: Val) {
    const frequency = getFrequency(note.monzo, val);
    oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    playingNote = note;
}

function stopNote() {
    if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        oscillator = null;
    }
    playingNote = null;
}

export function onMouseDown(p5: p5_, notes: Note[], matrix: Matrix, val: Val) {
    const note = getClickedNote(p5, notes, matrix);
    if (note) {
        playNote(note, val);
    }
}

export function onMouseMoved(p5: p5_, notes: Note[], matrix: Matrix, val: Val) {
    /*
    const note = getClickedNote(p5, notes, matrix);
    if (note !== playingNote) {
        stopNote();
        if (note) {
            playNote(note, val);
        }
    }*/
}
export function onMouseUp(p5: p5_) {
    stopNote();
}