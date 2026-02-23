import type p5_ from "p5";
import { getFrequency, getSteps, Monzo, Val } from "./monzo";
import { Vector, Matrix, applyMatrix } from "./matrix";
import { Note } from "./note";
import { oklch } from "./oklch";
import { isPlaying } from "./player";

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

function noteToHue(note: Note, val: Val): number {
    return fmod((note.monzo.n * Math.log(val.Q) / Math.log(val.P)) * 360 + 20, 360);
}

export function drawNote(p5: p5_, note: Note, matrix: Matrix, val: Val) {
    p5.push();
    const hue = noteToHue(note, val);
    const pos = noteToPos(note, matrix);

    if (isPlaying(note)) {
        p5.fill(oklch(p5, 0.6, 0.2, hue));
        p5.stroke(oklch(p5, 0.8, 0.2, hue));
        p5.circle(pos.x, pos.y, radius * 2.5);
    }
    else {
        p5.fill(oklch(p5, 0.4, 0.2, hue));
        p5.stroke(oklch(p5, 0.8, 0.2, hue));
        p5.circle(pos.x, pos.y, radius * 2);
    }

    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.fill(255);
    p5.noStroke()

    p5.textSize(25);
    p5.text(`${note.name}${note.oct}`, pos.x, pos.y - 15);
    
    p5.textSize(15);
    if (val.p !== null && val.q !== null) {
        p5.text(`［${note.monzo.m} ${note.monzo.n}〉= ${getSteps(val, note.monzo)} \n ${getFrequency(note.monzo, val).toFixed(1)}Hz`, pos.x, pos.y + 20);
    }
    else {
        p5.text(`［${note.monzo.m} ${note.monzo.n}〉 \n ${getFrequency(note.monzo, val).toFixed(1)}Hz`, pos.x, pos.y + 20);
    }
    p5.pop();
}

// 同じ周波数の音を線で結ぶ
export function drawOctaveGrid(p5: p5_, val: Val, matrix: Matrix, color = 200) {
    p5.push();

    // m 方向に ln Q、n 方向に -ln P を足すと周波数が P^m * Q^n = P^lnQ / Q^lnP = 1 倍になる、はず

    const incline = applyMatrix(matrix, {x: Math.log(val.Q), y: -Math.log(val.P)});
    const octave = applyMatrix(matrix, {x: 1, y: 0});

    const scale = 100; // グリッド線の長さの調整係数
    const num = 5; // グリッド線の数（正負両方に引くので、実際にはこれの倍）

   
    p5.stroke(color);
    p5.line(-octave.x * scale, -octave.y * scale,
             octave.x * scale, octave.y * scale);
    
    for (let i = -num; i <= num; i++) {
        p5.line(-incline.x * scale + octave.x * i, -incline.y * scale + octave.y * i,
                 incline.x * scale + octave.x * i,  incline.y * scale + octave.y * i);
    }
    p5.pop();
}