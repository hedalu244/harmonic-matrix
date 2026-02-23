import type p5_ from "p5";
import { getFrequency, Monzo, Val } from "./monzo";
import { Vector, Matrix, applyMatrix } from "./matrix";
import { Note } from "./note";

export const radius = 30; //px

export function noteToPos(note: Note, matrix: Matrix): Vector {
    const vector: Vector = {
        x: note.monzo.m,
        y: note.monzo.n,
    };

    return applyMatrix(matrix, vector);
}

function fmod(a: number, b: number): number {
    return a - b * Math.floor(a / b);
}

function noteToHue(note: Note): number {
    return fmod((note.monzo.n * Math.log(3) / Math.log(2)) * 360, 360);
}

export function drawNote(p5: p5_, note: Note, matrix: Matrix, val: Val) {
    p5.push();
    const hue = noteToHue(note);
    const pos = noteToPos(note, matrix);
    p5.colorMode(p5.HSB);
    p5.fill(hue, 100, 50);
    p5.stroke(hue, 100, 100)   
    p5.circle(pos.x, pos.y, radius * 2);

    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(30);
    p5.fill(255);
    p5.noStroke()
    p5.textSize(30);
    p5.text(`${note.name}${note.oct}`, pos.x, pos.y - 15);
    p5.textSize(15);
    p5.text(`\n［${note.monzo.m} ${note.monzo.n}〉 \n ${getFrequency(note.monzo, val).toFixed(1)}Hz`, pos.x, pos.y + 10);
    p5.pop();
}