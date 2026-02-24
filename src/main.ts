import type p5_ from "p5"; // インスタンスの型名はp5だと↓と被るのでズラす
declare const p5: typeof p5_; // 外部で値としてのp5が実装されていることを宣言

import { makeVal_justIntonation, makeVal_fromP, Val } from "./monzo";
import { drawOctaveGrid, drawNotes } from "./renderer";
import * as mouseEvent from "./mouseEvent";
import { settings } from "./gui";
import { EasingNumber } from "./easing";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const sketch = (p: p5_) => {
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, canvas);
    };
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
    p.draw = () => {
        EasingNumber.updateTime();
        p.background(15);
        p.translate(p.width / 2, p.height / 2);
        drawOctaveGrid(p, settings.val, settings.scaledMatrix.getCurrent(), 100);
        drawOctaveGrid(p, makeVal_justIntonation(2, 3, 440), settings.scaledMatrix.getCurrent(), 100);

        drawNotes(p);
    };
    canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });
    canvas.addEventListener("mousedown", (event) => {
        event.preventDefault();
        if (event.button === 0) // 左クリック
            mouseEvent.mouseLeftPressed(p, settings.notes, settings.scaledMatrix.getCurrent());
    });
    canvas.addEventListener("mouseup", (event) => {
        event.preventDefault();
        if (event.button === 0) // 左クリック
            mouseEvent.mouseLeftReleased(p);
    });
};
new p5(sketch);