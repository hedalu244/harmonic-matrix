import type p5_ from "p5"; // インスタンスの型名はp5だと↓と被るのでズラす
declare const p5: typeof p5_; // 外部で値としてのp5が実装されていることを宣言

// p5のインスタンスモードで書く
const sketch = (p: p5_) => {
  p.setup = () => {
    p.createCanvas(640, 480);
  };
  p.draw = () => {
    p.background(220);
    p.fill(0);
    p.ellipse(p.width/2, p.height/2, 100, 100);
  };
};

new p5(sketch);