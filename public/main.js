(() => {
  // src/main.ts
  var sketch = (p) => {
    p.setup = () => {
      p.createCanvas(640, 480);
    };
    p.draw = () => {
      p.background(220);
      p.fill(0);
      p.ellipse(p.width / 2, p.height / 2, 100, 100);
    };
  };
  new p5(sketch);
})();
//# sourceMappingURL=main.js.map
