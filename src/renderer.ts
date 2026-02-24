import type p5_ from "p5";
import { getFrequency, getSteps, Monzo, Val } from "./monzo";
import { Vector, Matrix, applyMatrix } from "./matrix";
import { Note } from "./note";
import { oklch } from "./oklch";
import { isPlaying } from "./player";
import { settings } from "./gui";

export function noteToPos(note: Note, matrix: Matrix): Vector {
    const vector: Vector = {
        x: note.monzo.m,
        y: note.monzo.n,
    };

    return applyMatrix(matrix, vector);
}
export function NoteSize(): number {
    return settings.size * 0.8;
}

function noteToHue(note: Note): number {
    function fmod(a: number, b: number): number {
        return a - b * Math.floor(a / b);
    }
    return fmod((note.monzo.n * Math.log(note.val.Q) / Math.log(note.val.P)) * 360 + 20, 360);
}

function drawNote(p5: p5_, note: Note) {
    p5.push();
    const hue = noteToHue(note);
    const pos = noteToPos(note, settings.scaledMatrix);

    if (isPlaying(note)) {
        p5.fill(oklch(p5, 0.6, 0.2, hue));
        p5.stroke(oklch(p5, 0.8, 0.2, hue));
        p5.circle(pos.x, pos.y, settings.size * 0.8);
    }
    else {
        p5.fill(oklch(p5, 0.3, 0.2, hue));
        p5.stroke(oklch(p5, 0.8, 0.2, hue));
        p5.circle(pos.x, pos.y, settings.size * 0.6);
    }

    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.fill(255);
    p5.noStroke()

    p5.textSize(settings.size * 0.25);
    p5.text(`${note.name}${note.oct}`, pos.x, pos.y - settings.size * 0.15);

    p5.textSize(settings.size * 0.15);
    if (note.steps !== null && settings.showSteps) {
        p5.text(`［${note.monzo.m} ${note.monzo.n}〉= ${note.steps} \n ${note.frequency.toFixed(1)}Hz`,
            pos.x, pos.y + settings.size * 0.2);
    }
    else {
        p5.text(`［${note.monzo.m} ${note.monzo.n}〉 \n ${note.frequency.toFixed(1)}Hz`,
            pos.x, pos.y + settings.size * 0.2);
    }
    p5.pop();
}

export function drawNotes(p5: p5_) {
    settings.notes.forEach(note => {
        drawNote(p5, note);
    });
}

// 同じ周波数の音を線で結ぶ
export function drawOctaveGrid(p5: p5_, val: Val, matrix: Matrix, color = 200) {
    p5.push();

    // m 方向に ln Q、n 方向に -ln P を足すと周波数が P^m * Q^n = P^lnQ / Q^lnP = 1 倍になる、はず

    const octave = applyMatrix(matrix, { x: 1, y: 0 });
    const incline = applyMatrix(matrix, { x: Math.log(val.Q), y: -Math.log(val.P) });

    const scale = 100; // グリッド線の長さの調整係数
    const num = 5; // グリッド線の数（正負両方に引くので、実際にはこれの倍）


    p5.stroke(color);
    if (val.p !== null && val.q !== null) {
        const incline = applyMatrix(matrix, { x: val.q, y: -val.p });
        for (let i = -num; i <= num; i++) {
            p5.line(-octave.x * scale + incline.x * i, -octave.y * scale + incline.y * i,
                octave.x * scale + incline.x * i, octave.y * scale + incline.y * i);
        }
    } else {
        p5.line(-octave.x * scale, -octave.y * scale,
            octave.x * scale, octave.y * scale);
    }

    for (let i = -num; i <= num; i++) {
        p5.line(-incline.x * scale + octave.x * i, -incline.y * scale + octave.y * i,
            incline.x * scale + octave.x * i, incline.y * scale + octave.y * i);
    }
    p5.pop();
}