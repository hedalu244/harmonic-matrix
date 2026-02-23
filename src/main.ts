import type p5_ from "p5"; // インスタンスの型名はp5だと↓と被るのでズラす
declare const p5: typeof p5_; // 外部で値としてのp5が実装されていることを宣言

import { generateNotes, Note } from "./note";
import { getSteps, makeVal_fromP } from "./monzo";
import { drawNote } from "./renderer";

const notes = generateNotes(2, 6, 4, 2, 2);
const val = makeVal_fromP(17, 27, 2, 440);

for (const note of notes) {
    const steps = getSteps(val, note.monzo);
    console.log(note, steps);
}

// p5のインスタンスモードで書く
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
        const scale = 80;
        notes.forEach(note => {
            drawNote(p, note, {a: 1 * scale, b: -2 * scale, c: 1 * scale, d: -3 * scale}, val);
        });
    };
};

new p5(sketch);