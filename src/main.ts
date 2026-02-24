import type p5_ from "p5"; // インスタンスの型名はp5だと↓と被るのでズラす
declare const p5: typeof p5_; // 外部で値としてのp5が実装されていることを宣言

import "./gui";

import { generateNotes, Note } from "./note";
import { getSteps, makeVal_justIntonation, makeVal_fromP, Val } from "./monzo";
import { drawOctaveGrid, drawNote } from "./renderer";
import { Matrix, scaleMatrix } from "./matrix";
import { onMouseDown, onMouseMoved, onMouseUp } from "./player";
import { settings } from "./gui";

let val: Val;
let notes: Note[];
let matrix: Matrix;
let scale: number;

const sketch = (p: p5_) => {
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
    };
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
    p.draw = () => {
        val = settings.val;
        notes = settings.notes;
        matrix = settings.matrix;
        scale = settings.scale;


        p.background(30);
        p.translate(p.width / 2, p.height / 2);
        drawOctaveGrid(p, val, scaleMatrix(matrix, scale));
        drawOctaveGrid(p, makeVal_justIntonation(2, 3, 440), scaleMatrix(matrix, scale), 100);

        notes.forEach(note => {
            drawNote(p, note, scaleMatrix(matrix, scale));
        });
    };

    p.mousePressed = () => {
        onMouseDown(p, notes, scaleMatrix(matrix, scale));
    }
    p.mouseMoved = () => {
        onMouseMoved(p, notes, scaleMatrix(matrix, scale));
    }
    p.mouseReleased = () => {
        onMouseUp(p);
    }
};

new p5(sketch);