import type p5_ from "p5";
import { getFrequency, Monzo, Val } from "./monzo";
import { Vector, Matrix, applyMatrix } from "./matrix";
import { Note } from "./note";
import { noteToPos, radius } from "./renderer";

export function getClickedNote(p5: p5_, notes: Note[], matrix: Matrix): Note | null {
    const nearest = { note: null as Note | null, dist: Infinity };
    for (const note of notes) {
        const pos = noteToPos(note, matrix);
        const d = p5.dist(p5.mouseX, p5.mouseY, pos.x, pos.y);
        if (d < nearest.dist) {
            nearest.note = note;
            nearest.dist = d;
        }
    }
    return nearest.dist <= radius ? nearest.note : null;
}

export function playNote(note: Note, val: Val) {
    const frequency = getFrequency(note.monzo, val);
}