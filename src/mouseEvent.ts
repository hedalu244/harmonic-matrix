
import type p5_ from "p5";
import { Note } from "./note";
import { Matrix } from "./matrix";
import { noteToPos } from "./renderer";
import * as Player from "./player";
import { settings } from "./gui";

function getClickedNote(p5: p5_, notes: Note[], matrix: Matrix): Note | null {
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

export function mouseLeftPressed(p5: p5_, notes: Note[], matrix: Matrix) {
    const note = getClickedNote(p5, notes, matrix);

    if (settings.playMode === "toggle") {
        if (note) {
            if (Player.isPlaying(note))
                Player.stopNote(note);
            else
                Player.playNote(note);
        }
    }
    if (settings.playMode === "hold")
    if (note) {
        Player.playNote(note);
    }
}
export function mouseLeftReleased(p5: p5_) {
    if (settings.playMode === "hold") {
        Player.stopAllNotes();
    }
}