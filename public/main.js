(() => {
  // src/note.ts
  function addOctave(Note2, n) {
    return {
      name: Note2.name,
      oct: Note2.oct + n,
      monzo: {
        m: Note2.monzo.m + n,
        n: Note2.monzo.n
      }
    };
  }
  function addFlat(Note2, n) {
    if (Note2.name.endsWith("\u266F")) {
      throw new Error("Cannot add flat to a sharp note");
    }
    return {
      name: Note2.name + "\u266D".repeat(n),
      oct: Note2.oct,
      monzo: {
        m: Note2.monzo.m + n * 11,
        n: Note2.monzo.n - n * 7
      }
    };
  }
  function addSharp(Note2, n) {
    if (Note2.name.endsWith("\u266D")) {
      throw new Error("Cannot add sharp to a flat note");
    }
    return {
      name: Note2.name + "\u266F".repeat(n),
      oct: Note2.oct,
      monzo: {
        m: Note2.monzo.m - n * 11,
        n: Note2.monzo.n + n * 7
      }
    };
  }
  function generateNotes(baseNoteName = "A4", minOct = 2, maxOct = 6, flatNum = 1, sharpNum = 1) {
    const names = ["C", "D", "E", "F", "G", "A", "B"];
    const diatonic = [
      { name: "C", oct: 0, monzo: { m: 0, n: 0 } },
      // 0
      { name: "D", oct: 0, monzo: { m: -3, n: 2 } },
      // -36 + 38 = 2
      { name: "E", oct: 0, monzo: { m: -6, n: 4 } },
      // -72 + 76 = 4
      { name: "F", oct: 0, monzo: { m: 2, n: -1 } },
      // 24 - 19 = 5
      { name: "G", oct: 0, monzo: { m: -1, n: 1 } },
      // -12 + 19 = 7
      { name: "A", oct: 0, monzo: { m: -4, n: 3 } },
      // -48 + 57 = 9
      { name: "B", oct: 0, monzo: { m: -7, n: 5 } }
      // -84 + 95 = 11
    ];
    const chromatic = [...diatonic];
    for (let i = 1; i <= flatNum; i++) {
      for (const note of diatonic) {
        chromatic.push(addFlat(note, i));
      }
    }
    for (let i = 1; i <= sharpNum; i++) {
      for (const note of diatonic) {
        chromatic.push(addSharp(note, i));
      }
    }
    const notes2 = [];
    for (let oct = minOct; oct <= maxOct; oct++) {
      for (const note of chromatic) {
        const octDiff = oct - note.oct;
        notes2.push(addOctave(note, octDiff));
      }
    }
    const baseNote = notes2.find((note) => `${note.name}${note.oct}` === baseNoteName);
    if (!baseNote) {
      throw new Error(`Base note ${baseNoteName} not found`);
    }
    return notes2.sort((a, b) => {
      const aVal = Math.pow(2, a.monzo.m) * Math.pow(3, a.monzo.n);
      const bVal = Math.pow(2, b.monzo.m) * Math.pow(3, b.monzo.n);
      return aVal - bVal;
    }).map((note) => {
      return {
        ...note,
        monzo: {
          m: note.monzo.m - baseNote.monzo.m,
          n: note.monzo.n - baseNote.monzo.n
        }
      };
    });
  }

  // src/monzo.ts
  function getFrequency(monzo, val2) {
    return val2.baseFreq * Math.pow(val2.P, monzo.m) * Math.pow(val2.Q, monzo.n);
  }
  function getSteps(val2, monzo) {
    if (val2.p === null || val2.q === null) return null;
    return monzo.m * val2.p + monzo.n * val2.q;
  }
  function makeVal_asIrrational(P, Q, baseFreq) {
    return { P, Q, S: null, p: null, q: null, baseFreq };
  }

  // src/matrix.ts
  function scaleMatrix(matrix2, scale2) {
    return {
      a: matrix2.a * scale2,
      b: matrix2.b * scale2,
      c: matrix2.c * scale2,
      d: matrix2.d * scale2
    };
  }
  function applyMatrix(matrix2, vector) {
    return {
      x: matrix2.a * vector.x + matrix2.c * vector.y,
      y: matrix2.b * vector.x + matrix2.d * vector.y
    };
  }

  // src/oklch.ts
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function linearConversion(mat, vec) {
    return mat.map((row) => dot(row, vec));
  }
  function LCHtoLAB(lch) {
    let [l, c, h] = lch;
    const a = c * Math.cos(h / 180 * Math.PI);
    const b = c * Math.sin(h / 180 * Math.PI);
    return [l, a, b];
  }
  function LABtoLMS_(lab) {
    const M2_INV = [
      [1, 0.3963377774, 0.2158037573],
      [1, -0.1055613458, -0.0638541728],
      [1, -0.0894841775, -1.291485548]
    ];
    return linearConversion(M2_INV, lab);
  }
  function LMStoLRGB(lms) {
    const M1_INV = [
      [4.0767416621, -3.3077115913, 0.2309699292],
      [-1.2684380046, 2.6097574011, -0.3413193965],
      [-0.0041960863, -0.7034186147, 1.707614701]
    ];
    return linearConversion(M1_INV, lms);
  }
  function LRGBtoSRGB(lrgb) {
    return lrgb.map((c) => {
      const abs = Math.abs(c);
      return abs > 31308e-7 ? (Math.sign(c) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055) : c * 12.92;
    });
  }
  function oklchToSrgb(lch) {
    const lab = LCHtoLAB(lch);
    const lms_ = LABtoLMS_(lab);
    const lms = lms_.map((c) => c * c * c);
    const lrgb = LMStoLRGB(lms);
    const srgb = LRGBtoSRGB(lrgb);
    return srgb;
  }
  function oklch(p52, l, c, h) {
    const [r, g, b] = oklchToSrgb([l, c, h]);
    p52.colorMode(p52.RGB, 255);
    return p52.color(r * 255, g * 255, b * 255);
  }

  // src/player.ts
  function getClickedNote(p52, notes2, matrix2) {
    const nearest = { note: null, dist: Infinity };
    console.log(`Mouse: (${p52.mouseX}, ${p52.mouseY})`);
    for (const note of notes2) {
      const pos = noteToPos(note, matrix2);
      const d = p52.dist(p52.mouseX - p52.width / 2, p52.mouseY - p52.height / 2, pos.x, pos.y);
      if (d < nearest.dist) {
        nearest.note = note;
        nearest.dist = d;
      }
    }
    const ans = nearest.dist <= radius ? nearest.note : null;
    console.log(ans);
    return ans;
  }
  var audioCtx = new AudioContext();
  var oscillator = null;
  var playingNote = null;
  function isPlaying(note) {
    return playingNote === note;
  }
  function playNote(note, val2) {
    const frequency = getFrequency(note.monzo, val2);
    oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    playingNote = note;
  }
  function stopNote() {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect();
      oscillator = null;
    }
    playingNote = null;
  }
  function onMouseDown(p52, notes2, matrix2, val2) {
    const note = getClickedNote(p52, notes2, matrix2);
    if (note) {
      playNote(note, val2);
    }
  }
  function onMouseMoved(p52, notes2, matrix2, val2) {
  }
  function onMouseUp(p52) {
    stopNote();
  }

  // src/renderer.ts
  var radius = 30;
  function noteToPos(note, matrix2) {
    const vector = {
      x: note.monzo.m,
      y: note.monzo.n
    };
    return applyMatrix(matrix2, vector);
  }
  function fmod(a, b) {
    return a - b * Math.floor(a / b);
  }
  function noteToHue(note) {
    return fmod(note.monzo.n * Math.log(3) / Math.log(2) * 360 + 20, 360);
  }
  function drawNote(p52, note, matrix2, val2) {
    p52.push();
    const hue = noteToHue(note);
    const pos = noteToPos(note, matrix2);
    if (isPlaying(note)) {
      p52.fill(oklch(p52, 0.6, 0.2, hue));
      p52.stroke(oklch(p52, 0.8, 0.2, hue));
      p52.circle(pos.x, pos.y, radius * 2.5);
    } else {
      p52.fill(oklch(p52, 0.4, 0.2, hue));
      p52.stroke(oklch(p52, 0.8, 0.2, hue));
      p52.circle(pos.x, pos.y, radius * 2);
    }
    p52.textAlign(p52.CENTER, p52.CENTER);
    p52.textSize(30);
    p52.fill(255);
    p52.noStroke();
    p52.textSize(25);
    p52.text(`${note.name}${note.oct}`, pos.x, pos.y - 15);
    p52.textSize(15);
    p52.text(`
\uFF3B${note.monzo.m} ${note.monzo.n}\u3009 
 ${getFrequency(note.monzo, val2).toFixed(1)}Hz`, pos.x, pos.y + 10);
    p52.pop();
  }
  function drawOctaveGrid(p52, val2, matrix2, color = 200) {
    p52.push();
    const incline = applyMatrix(matrix2, { x: Math.log(val2.Q), y: -Math.log(val2.P) });
    const octave = applyMatrix(matrix2, { x: 1, y: 0 });
    const scale2 = 100;
    const num = 5;
    p52.stroke(color);
    p52.line(
      -octave.x * scale2,
      -octave.y * scale2,
      octave.x * scale2,
      octave.y * scale2
    );
    for (let i = -num; i <= num; i++) {
      p52.line(
        -incline.x * scale2 + octave.x * i,
        -incline.y * scale2 + octave.y * i,
        incline.x * scale2 + octave.x * i,
        incline.y * scale2 + octave.y * i
      );
    }
    p52.pop();
  }

  // src/main.ts
  var notes = generateNotes("A4", 1, 7, 2, 2);
  var val = makeVal_asIrrational(2, 3, 440);
  var matrix = { a: 1, b: -2, c: 2, d: -3 };
  var scale = 100;
  for (const note of notes) {
    const steps = getSteps(val, note.monzo);
    console.log(note, steps);
  }
  var sketch = (p) => {
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
    };
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
    p.draw = () => {
      p.background(30);
      p.translate(p.width / 2, p.height / 2);
      drawOctaveGrid(p, val, scaleMatrix(matrix, scale));
      drawOctaveGrid(p, makeVal_asIrrational(2, 3, 440), scaleMatrix(matrix, scale), 100);
      notes.forEach((note) => {
        drawNote(p, note, scaleMatrix(matrix, scale), val);
      });
    };
    p.mousePressed = () => {
      onMouseDown(p, notes, scaleMatrix(matrix, scale), val);
    };
    p.mouseMoved = () => {
      onMouseMoved(p, notes, scaleMatrix(matrix, scale), val);
    };
    p.mouseReleased = () => {
      onMouseUp(p);
    };
  };
  new p5(sketch);
})();
//# sourceMappingURL=main.js.map
