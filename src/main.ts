import type p5_ from "p5"; // インスタンスの型名はp5だと↓と被るのでズラす
declare const p5: typeof p5_; // 外部で値としてのp5が実装されていることを宣言

import { generateNotes, Note } from "./note";
import { getSteps, makeVal_asIrrational, makeVal_fromP } from "./monzo";
import { drawOctoveGrid, drawNote } from "./renderer";
import { scaleMatrix } from "./matrix";
import { onMouseDown, onMouseMoved, onMouseUp } from "./player";

const notes = generateNotes(1, 7, 4, 2, 2);

//const val = makeVal_fromP(12, 19, 2, 440);
//const val = makeVal_fromP(17, 27, 2, 440);
const val = makeVal_asIrrational(2, 3, 440);
const matrix = { a: 1, b: -2, c: 2, d: -3 };
const scale = 100;

// デバッグ出力
for (const note of notes) {
    const steps = getSteps(val, note.monzo);
    console.log(note, steps);
}

const sketch = (p: p5_) => {
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
    };
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
    p.draw = () => {
        p.background(30);
        p.translate(p.width / 2, p.height / 2);
        drawOctoveGrid(p, val, scaleMatrix(matrix, scale));
        drawOctoveGrid(p, makeVal_asIrrational(2, 3, 440), scaleMatrix(matrix, scale), 100);

        notes.forEach(note => {
            drawNote(p, note, scaleMatrix(matrix, scale), val);
        });
    };

    p.mousePressed = () => {
        onMouseDown(p, notes, scaleMatrix(matrix, scale), val);
    }
    p.mouseMoved = () => {
        onMouseMoved(p, notes, scaleMatrix(matrix, scale), val);
    }
    p.mouseReleased = () => {
        onMouseUp(p);
    }
};

new p5(sketch);