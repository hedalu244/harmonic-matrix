import type p5_ from "p5"; // インスタンスの型名はp5だと↓と被るのでズラす
declare const p5: typeof p5_; // 外部で値としてのp5が実装されていることを宣言

import "./gui";

import { generateNotes, Note } from "./note";
import { getSteps, makeVal_justIntonation, makeVal_fromP, Val } from "./monzo";
import { drawOctaveGrid, drawNote } from "./renderer";
import { Matrix, scaleMatrix } from "./matrix";
import { onMouseDown, onMouseMoved, onMouseUp } from "./player";
import { settings } from "./gui";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const sketch = (p: p5_) => {
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, canvas);
    };
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
    p.draw = () => {
        p.background(30);
        p.translate(p.width / 2, p.height / 2);
        drawOctaveGrid(p, settings.val, settings.scaledMatrix);
        drawOctaveGrid(p, makeVal_justIntonation(2, 3, 440), settings.scaledMatrix, 100);

        settings.notes.forEach(note => {
            drawNote(p, note, settings.scaledMatrix, settings.size);
        });
    };
    canvas.addEventListener("mousedown", () => {
        onMouseDown(p, settings.notes, settings.scaledMatrix);
    });
    canvas.addEventListener("mousemove", () => {
        onMouseMoved(p, settings.notes, settings.scaledMatrix);
    });
    canvas.addEventListener("mouseup", () => {
        onMouseUp(p);
    });
};
new p5(sketch);