(() => {
  // src/monzo.ts
  function getFrequency(val, monzo) {
    return val.baseFreq * Math.pow(val.P, monzo.m) * Math.pow(val.Q, monzo.n);
  }
  function getSteps(val, monzo) {
    if (val.p === null || val.q === null) return null;
    return monzo.m * val.p + monzo.n * val.q;
  }
  function makeVal_fromP(p, q, P, baseFreq) {
    const S = Math.pow(P, 1 / p);
    const Q = Math.pow(S, q);
    return { P, Q, S, p, q, baseFreq };
  }
  function makeVal_fromQ(p, q, Q, baseFreq) {
    const S = Math.pow(Q, 1 / q);
    const P = Math.pow(S, p);
    return { P, Q, S, p, q, baseFreq };
  }
  function makeVal_fromS(p, q, S, baseFreq) {
    const P = Math.pow(S, p);
    const Q = Math.pow(S, q);
    return { P, Q, S, p, q, baseFreq };
  }
  function makeVal_justIntonation(P, Q, baseFreq) {
    return { P, Q, S: null, p: null, q: null, baseFreq };
  }

  // src/matrix.ts
  function scaleMatrix(matrix, scale) {
    return {
      a: matrix.a * scale,
      b: matrix.b * scale,
      c: matrix.c * scale,
      d: matrix.d * scale
    };
  }
  function applyMatrix(matrix, vector) {
    return {
      x: matrix.a * vector.x + matrix.c * vector.y,
      y: matrix.b * vector.x + matrix.d * vector.y
    };
  }
  function multiplyMatrix(left, right) {
    return {
      a: left.a * right.a + left.c * right.b,
      b: left.b * right.a + left.d * right.b,
      c: left.a * right.c + left.c * right.d,
      d: left.b * right.c + left.d * right.d
    };
  }
  function determinant(matrix) {
    return matrix.a * matrix.d - matrix.b * matrix.c;
  }
  function invertMatrix(matrix) {
    const det = determinant(matrix);
    if (det === 0) {
      return null;
    }
    const invDet = 1 / det;
    return {
      a: matrix.d * invDet,
      b: -matrix.b * invDet,
      c: -matrix.c * invDet,
      d: matrix.a * invDet
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
  var audioCtx = new AudioContext();
  var masterGain = audioCtx.createGain();
  var compressor = audioCtx.createDynamicsCompressor();
  masterGain.gain.value = 0.6;
  compressor.threshold.value = -18;
  compressor.knee.value = 24;
  compressor.ratio.value = 4;
  compressor.attack.value = 3e-3;
  compressor.release.value = 0.25;
  masterGain.connect(compressor);
  compressor.connect(audioCtx.destination);
  var oscillators = /* @__PURE__ */ new Map();
  var releaseTimeSec = 0.01;
  var minGain = 1e-4;
  function isPlaying(note) {
    return oscillators.has(note.frequency);
  }
  function updateMasterGain() {
    const active = oscillators.size;
    const safe = active > 0 ? 1 / Math.sqrt(active) : 1;
    masterGain.gain.setTargetAtTime(0.6 * safe, audioCtx.currentTime, 0.01);
  }
  function playNote(note) {
    const frequency = note.frequency;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start();
    oscillators.set(frequency, { oscillator, gain });
    updateMasterGain();
  }
  function stopNote(note) {
    const voice = oscillators.get(note.frequency);
    if (voice) {
      const now = audioCtx.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, minGain), now);
      voice.gain.gain.exponentialRampToValueAtTime(minGain, now + releaseTimeSec);
      voice.oscillator.stop(now + releaseTimeSec);
      voice.oscillator.onended = () => {
        voice.oscillator.disconnect();
        voice.gain.disconnect();
      };
    }
    oscillators.delete(note.frequency);
    updateMasterGain();
  }
  function stopAllNotes() {
    for (const voice of oscillators.values()) {
      const now = audioCtx.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, minGain), now);
      voice.gain.gain.exponentialRampToValueAtTime(minGain, now + releaseTimeSec);
      voice.oscillator.stop(now + releaseTimeSec);
      voice.oscillator.onended = () => {
        voice.oscillator.disconnect();
        voice.gain.disconnect();
      };
    }
    oscillators.clear();
    updateMasterGain();
  }

  // src/easing.ts
  var EasingNumber = class _EasingNumber {
    start;
    timestamp;
    target;
    duration = 500;
    // ms
    constructor(x) {
      this.start = x;
      this.target = x;
      this.timestamp = _EasingNumber.now;
    }
    static now = performance.now();
    static updateTime() {
      _EasingNumber.now = performance.now();
    }
    static easingFunction(t) {
      if (t < 0) return 0;
      if (t > 1) return 1;
      return t * t * (3 - 2 * t);
    }
    setTarget(target) {
      this.start = this.getCurrent();
      this.target = target;
      this.timestamp = _EasingNumber.now;
    }
    getCurrent() {
      const elapsed = _EasingNumber.now - this.timestamp;
      const t = Math.min(elapsed / this.duration, 1);
      return this.start + (this.target - this.start) * _EasingNumber.easingFunction(t);
    }
    hardSetTarget(target) {
      this.target = target;
      this.timestamp = _EasingNumber.now - this.duration;
    }
  };
  var EasingMatrix = class {
    a;
    b;
    c;
    d;
    // メモ化キャッシュ
    current;
    lastUpdate;
    constructor(matrix) {
      this.a = new EasingNumber(matrix.a);
      this.b = new EasingNumber(matrix.b);
      this.c = new EasingNumber(matrix.c);
      this.d = new EasingNumber(matrix.d);
      this.current = matrix;
      this.lastUpdate = EasingNumber.now;
    }
    setTarget(matrix) {
      this.a.setTarget(matrix.a);
      this.b.setTarget(matrix.b);
      this.c.setTarget(matrix.c);
      this.d.setTarget(matrix.d);
    }
    getCurrent() {
      if (EasingNumber.now != this.lastUpdate) {
        this.current = {
          a: this.a.getCurrent(),
          b: this.b.getCurrent(),
          c: this.c.getCurrent(),
          d: this.d.getCurrent()
        };
        this.lastUpdate = EasingNumber.now;
      }
      return this.current;
    }
    hardSetTarget(matrix) {
      this.a.hardSetTarget(matrix.a);
      this.b.hardSetTarget(matrix.b);
      this.c.hardSetTarget(matrix.c);
      this.d.hardSetTarget(matrix.d);
    }
  };

  // src/note.ts
  function addOctave(Note2, n) {
    const monzo = {
      m: Note2.monzo.m + n,
      n: Note2.monzo.n
    };
    return {
      name: Note2.name,
      oct: Note2.oct + n,
      monzo
    };
  }
  function addFlat(Note2, n) {
    if (Note2.name.endsWith("\u266F")) {
      throw new Error("Cannot add flat to a sharp note");
    }
    const monzo = {
      m: Note2.monzo.m + n * 11,
      n: Note2.monzo.n - n * 7
    };
    return {
      name: Note2.name + "\u266D".repeat(n),
      oct: Note2.oct,
      monzo
    };
  }
  function addSharp(Note2, n) {
    if (Note2.name.endsWith("\u266D")) {
      throw new Error("Cannot add sharp to a flat note");
    }
    const monzo = {
      m: Note2.monzo.m - n * 11,
      n: Note2.monzo.n + n * 7
    };
    return {
      name: Note2.name + "\u266F".repeat(n),
      oct: Note2.oct,
      monzo
    };
  }
  function generateNotes(val, baseNoteName = "A4", minNoteName = "A0", maxNoteName = "C8", flatNum = 1, sharpNum = 1) {
    const baseMatch = baseNoteName.toUpperCase().match(/([A-G][♭#]*)(\d+)/);
    const minMatch = minNoteName.toUpperCase().match(/([A-G][♭#]*)(\d+)/);
    const maxMatch = maxNoteName.toUpperCase().match(/([A-G][♭#]*)(\d+)/);
    if (!baseMatch || !minMatch || !maxMatch) {
      console.error("Invalid note name format: ", { baseNoteName, minNoteName, maxNoteName });
      throw new Error(`Invalid note name format`);
    }
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
    const minOct = Math.min(parseInt(baseMatch[2]), parseInt(minMatch[2]), parseInt(maxMatch[2])) - 1;
    const maxOct = Math.max(parseInt(baseMatch[2]), parseInt(minMatch[2]), parseInt(maxMatch[2])) + 1;
    const temporalNotes = [];
    for (let oct = minOct; oct <= maxOct; oct++) {
      for (const note of chromatic) {
        const octDiff = oct - note.oct;
        temporalNotes.push(addOctave(note, octDiff));
      }
    }
    const baseNote = temporalNotes.find((note) => `${note.name}${note.oct}` === baseNoteName);
    const minNote = temporalNotes.find((note) => `${note.name}${note.oct}` === minNoteName);
    const maxNote = temporalNotes.find((note) => `${note.name}${note.oct}` === maxNoteName);
    if (!baseNote)
      throw new Error(`Base note ${baseNoteName} not found`);
    if (!minNote)
      throw new Error(`Min note ${minNoteName} not found`);
    if (!maxNote)
      throw new Error(`Max note ${maxNoteName} not found`);
    const minFrequency = getFrequency(val, {
      m: minNote.monzo.m - baseNote.monzo.m,
      n: minNote.monzo.n - baseNote.monzo.n
    });
    const maxFrequency = getFrequency(val, {
      m: maxNote.monzo.m - baseNote.monzo.m,
      n: maxNote.monzo.n - baseNote.monzo.n
    });
    return temporalNotes.map((note) => {
      const monzo = {
        m: note.monzo.m - baseNote.monzo.m,
        n: note.monzo.n - baseNote.monzo.n
      };
      return {
        name: note.name,
        oct: note.oct,
        monzo,
        val,
        frequency: getFrequency(val, monzo),
        steps: getSteps(val, monzo)
      };
    }).sort((a, b) => a.frequency - b.frequency).filter((note) => note.frequency >= minFrequency && note.frequency <= maxFrequency);
  }

  // src/gui.ts
  var settings = {
    val: makeVal_fromP(12, 19, 2, 440),
    notes: [],
    matrix: { a: 1, b: -2, c: 2, d: -3 },
    animatedMatrix: new EasingMatrix({ a: 1, b: -2, c: 2, d: -3 }),
    gap: 1,
    scale: 100,
    playMode: "hold",
    showSteps: false
  };
  function initializeGUI() {
    changeTuningMethod();
    updateNotes();
    updateScale();
  }
  initializeGUI();
  function getInputElement(id) {
    return document.getElementById(id);
  }
  function changeTuningMethod() {
    console.log("changeTuningMethod called");
    const Pelm = getInputElement("PVal");
    const Qelm = getInputElement("QVal");
    const Selm = getInputElement("SVal");
    const pelm = getInputElement("pVal");
    const qelm = getInputElement("qVal");
    if (getInputElement("fromP").checked) {
      Pelm.readOnly = false;
      Qelm.readOnly = true;
      Selm.readOnly = true;
      pelm.readOnly = false;
      qelm.readOnly = false;
      Pelm.value = "2";
      if (pelm.value === "" || qelm.value === "") {
        pelm.value = "12";
        qelm.value = "19";
      }
      updateVal();
      return;
    }
    if (getInputElement("fromQ").checked) {
      Pelm.readOnly = true;
      Qelm.readOnly = false;
      Selm.readOnly = true;
      pelm.readOnly = false;
      qelm.readOnly = false;
      Qelm.value = "3";
      if (pelm.value === "" || qelm.value === "") {
        pelm.value = "12";
        qelm.value = "19";
      }
      updateVal();
      return;
    }
    if (getInputElement("fromS").checked) {
      Pelm.readOnly = true;
      Qelm.readOnly = true;
      Selm.readOnly = false;
      pelm.readOnly = false;
      qelm.readOnly = false;
      Selm.value = "1.0594630943592953";
      if (pelm.value === "" || qelm.value === "") {
        pelm.value = "12";
        qelm.value = "19";
      }
      updateVal();
      return;
    }
    if (getInputElement("justIntonation").checked) {
      Pelm.readOnly = false;
      Qelm.readOnly = false;
      Selm.readOnly = true;
      pelm.readOnly = true;
      qelm.readOnly = true;
      Pelm.value = "2";
      Qelm.value = "3";
      updateVal();
      return;
    }
    throw new Error("no tuning method selected");
  }
  function updateVal() {
    const baseFreq = parseFloat(getInputElement("baseFreq").value);
    const Pelm = getInputElement("PVal");
    const Qelm = getInputElement("QVal");
    const Selm = getInputElement("SVal");
    const pelm = getInputElement("pVal");
    const qelm = getInputElement("qVal");
    const pVal = parseFloat(pelm.value);
    const qVal = parseFloat(qelm.value);
    const PVal = parseFloat(Pelm.value);
    const QVal = parseFloat(Qelm.value);
    const SVal = parseFloat(Selm.value);
    if (getInputElement("justIntonation").checked) {
      if (isNaN(baseFreq) || isNaN(PVal) || isNaN(QVal)) {
        console.warn("Invalid input: ", { baseFreq, PVal, QVal });
        return;
      }
      const val = makeVal_justIntonation(PVal, QVal, baseFreq);
      Selm.value = "";
      Selm.readOnly = true;
      pelm.value = "";
      pelm.readOnly = true;
      qelm.value = "";
      qelm.readOnly = true;
      settings.val = val;
      stopAllNotes();
      updateNotes();
      return;
    }
    if (getInputElement("fromP").checked) {
      if (isNaN(baseFreq) || isNaN(pVal) || isNaN(qVal) || isNaN(PVal)) {
        console.warn("Invalid input: ", { baseFreq, pVal, qVal, PVal });
        return;
      }
      const val = makeVal_fromP(pVal, qVal, PVal, baseFreq);
      Qelm.value = val.Q.toString();
      Qelm.readOnly = true;
      Selm.value = val.S.toString();
      Selm.readOnly = true;
      settings.val = val;
      stopAllNotes();
      updateNotes();
      return;
    }
    if (getInputElement("fromQ").checked) {
      if (isNaN(baseFreq) || isNaN(pVal) || isNaN(qVal) || isNaN(QVal)) {
        console.warn("Invalid input: ", { baseFreq, pVal, qVal, QVal });
        return;
      }
      const val = makeVal_fromQ(pVal, qVal, QVal, baseFreq);
      Pelm.value = val.P.toString();
      Pelm.readOnly = true;
      Selm.value = val.S.toString();
      Selm.readOnly = true;
      settings.val = val;
      stopAllNotes();
      updateNotes();
      return;
    }
    if (getInputElement("fromS").checked) {
      if (isNaN(baseFreq) || isNaN(pVal) || isNaN(qVal) || isNaN(SVal)) {
        console.warn("Invalid input: ", { baseFreq, pVal, qVal, SVal });
        return;
      }
      const val = makeVal_fromS(pVal, qVal, SVal, baseFreq);
      Pelm.value = val.P.toString();
      Pelm.readOnly = true;
      Qelm.value = val.Q.toString();
      Qelm.readOnly = true;
      settings.val = val;
      stopAllNotes();
      updateNotes();
      return;
    }
    throw new Error("no tuning method selected");
  }
  function updateNotes() {
    const baseNoteName = getInputElement("baseNote").value;
    const minNoteName = getInputElement("minNote").value;
    const maxNoteName = getInputElement("maxNote").value;
    const flatNum = parseInt(getInputElement("flatNum").value);
    const sharpNum = parseInt(getInputElement("sharpNum").value);
    if (isNaN(flatNum) || isNaN(sharpNum)) {
      console.warn("Invalid input for notes: ", { flatNum, sharpNum });
      return;
    }
    try {
      settings.notes = generateNotes(settings.val, baseNoteName, minNoteName, maxNoteName, flatNum, sharpNum);
    } catch (error) {
      console.error("Error generating notes:", error);
    }
  }
  function updatePlayMode() {
    const holdMode = getInputElement("playModeHold");
    const toggleMode = getInputElement("playModeToggle");
    if (holdMode.checked) {
      settings.playMode = "hold";
      stopAllNotes();
    } else if (toggleMode.checked) {
      settings.playMode = "toggle";
      stopAllNotes();
    }
  }
  function updateMatrixLeft() {
    const m1 = {
      a: parseFloat(getInputElement("matrix1A").value),
      b: parseFloat(getInputElement("matrix1B").value),
      c: parseFloat(getInputElement("matrix1C").value),
      d: parseFloat(getInputElement("matrix1D").value)
    };
    if (isNaN(m1.a) || isNaN(m1.b) || isNaN(m1.c) || isNaN(m1.d)) {
      console.warn("Invalid input for matrix: ", m1);
      return;
    }
    const m2 = multiplyMatrix(settings.matrix, m1);
    getInputElement("matrix2A").value = m2.a.toString();
    getInputElement("matrix2B").value = m2.b.toString();
    getInputElement("matrix2C").value = m2.c.toString();
    getInputElement("matrix2D").value = m2.d.toString();
  }
  function updateMatrixRight(hardset) {
    const m1 = {
      a: parseFloat(getInputElement("matrix1A").value),
      b: parseFloat(getInputElement("matrix1B").value),
      c: parseFloat(getInputElement("matrix1C").value),
      d: parseFloat(getInputElement("matrix1D").value)
    };
    const m2 = {
      a: parseFloat(getInputElement("matrix2A").value),
      b: parseFloat(getInputElement("matrix2B").value),
      c: parseFloat(getInputElement("matrix2C").value),
      d: parseFloat(getInputElement("matrix2D").value)
    };
    if (isNaN(m1.a) || isNaN(m1.b) || isNaN(m1.c) || isNaN(m1.d)) {
      console.warn("Invalid input for matrix: ", m1);
      return;
    }
    if (isNaN(m2.a) || isNaN(m2.b) || isNaN(m2.c) || isNaN(m2.d)) {
      console.warn("Invalid input for matrix: ", m2);
      return;
    }
    const m1Inv = invertMatrix(m1);
    if (!m1Inv) {
      console.warn("Invalid input for matrix: not invertible", m1);
      return;
    }
    const transform = multiplyMatrix({ a: 1, b: 0, c: 0, d: -1 }, multiplyMatrix(m2, m1Inv));
    settings.matrix = transform;
    if (hardset) settings.animatedMatrix.hardSetTarget(transform);
    else settings.animatedMatrix.setTarget(settings.matrix);
  }
  function updateScale() {
    const gapInput = getInputElement("gap");
    const scaleInput = getInputElement("scale");
    const gap = parseFloat(gapInput.value);
    const scale = parseFloat(scaleInput.value);
    if (isNaN(gap) || isNaN(scale)) {
      console.warn("Invalid input for gap or scale: ", { gap, scale });
      return;
    }
    settings.gap = gap / 100;
    settings.scale = scale;
  }
  Array.from(document.getElementsByName("tuning")).forEach((input) => {
    input.addEventListener("change", changeTuningMethod);
  });
  getInputElement("baseFreq").addEventListener("input", updateVal);
  getInputElement("PVal").addEventListener("input", updateVal);
  getInputElement("QVal").addEventListener("input", updateVal);
  getInputElement("SVal").addEventListener("input", updateVal);
  getInputElement("pVal").addEventListener("input", () => {
    if (getInputElement("autopq").checked) {
      const p = parseFloat(getInputElement("pVal").value);
      const q = Math.round(p * Math.log(3) / Math.log(2));
      getInputElement("qVal").value = q.toString();
    }
    updateVal();
  });
  getInputElement("qVal").addEventListener("input", () => {
    if (getInputElement("autopq").checked) {
      const q = parseFloat(getInputElement("qVal").value);
      const p = Math.round(q * Math.log(2) / Math.log(3));
      getInputElement("pVal").value = p.toString();
    }
    updateVal();
  });
  getInputElement("baseNote").addEventListener("input", updateNotes);
  getInputElement("minNote").addEventListener("input", updateNotes);
  getInputElement("maxNote").addEventListener("input", updateNotes);
  getInputElement("flatNum").addEventListener("input", updateNotes);
  getInputElement("sharpNum").addEventListener("input", updateNotes);
  getInputElement("playModeHold").addEventListener("change", updatePlayMode);
  getInputElement("playModeToggle").addEventListener("change", updatePlayMode);
  getInputElement("matrix1A").addEventListener("input", updateMatrixLeft);
  getInputElement("matrix1B").addEventListener("input", updateMatrixLeft);
  getInputElement("matrix1C").addEventListener("input", updateMatrixLeft);
  getInputElement("matrix1D").addEventListener("input", updateMatrixLeft);
  getInputElement("matrix2A").addEventListener("input", () => updateMatrixRight(false));
  getInputElement("matrix2B").addEventListener("input", () => updateMatrixRight(false));
  getInputElement("matrix2C").addEventListener("input", () => updateMatrixRight(false));
  getInputElement("matrix2D").addEventListener("input", () => updateMatrixRight(false));
  getInputElement("scale").addEventListener("input", updateScale);
  getInputElement("gap").addEventListener("input", updateScale);
  function storeSettingsToURL() {
    const params = new URLSearchParams();
    params.set("baseNote", getInputElement("baseNote").value);
    params.set("minNote", getInputElement("minNote").value);
    params.set("maxNote", getInputElement("maxNote").value);
    params.set("flatNum", getInputElement("flatNum").value);
    params.set("sharpNum", getInputElement("sharpNum").value);
    params.set("baseFreq", getInputElement("baseFreq").value);
    if (getInputElement("fromP").checked) {
      params.set("tuning", "fromP");
    } else if (getInputElement("fromQ").checked) {
      params.set("tuning", "fromQ");
    } else if (getInputElement("fromS").checked) {
      params.set("tuning", "fromS");
    } else if (getInputElement("justIntonation").checked) {
      params.set("tuning", "justIntonation");
    }
    params.set("P", getInputElement("PVal").value);
    params.set("Q", getInputElement("QVal").value);
    params.set("S", getInputElement("SVal").value);
    params.set("p", getInputElement("pVal").value);
    params.set("q", getInputElement("qVal").value);
    params.set("playMode", settings.playMode);
    params.set("A", getInputElement("matrix1A").value);
    params.set("B", getInputElement("matrix1B").value);
    params.set("C", getInputElement("matrix1C").value);
    params.set("D", getInputElement("matrix1D").value);
    params.set("a", getInputElement("matrix2A").value);
    params.set("b", getInputElement("matrix2B").value);
    params.set("c", getInputElement("matrix2C").value);
    params.set("d", getInputElement("matrix2D").value);
    params.set("gap", getInputElement("gap").value);
    params.set("scale", getInputElement("scale").value);
    params.set("showSteps", getInputElement("showSteps").checked ? "1" : "0");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }
  function restoreSettingsFromURL() {
    const params = new URLSearchParams(window.location.search);
    console.log(params.entries());
    getInputElement("baseNote").value = params.get("baseNote") || "A4";
    getInputElement("minNote").value = params.get("minNote") || "C2";
    getInputElement("maxNote").value = params.get("maxNote") || "C7";
    getInputElement("flatNum").value = params.get("flatNum") || "2";
    getInputElement("sharpNum").value = params.get("sharpNum") || "2";
    getInputElement("baseFreq").value = params.get("baseFreq") || "440";
    const tuning = params.get("tuning") || "fromP";
    if (tuning === "fromP") {
      getInputElement("fromP").checked = true;
    } else if (tuning === "fromQ") {
      getInputElement("fromQ").checked = true;
    } else if (tuning === "fromS") {
      getInputElement("fromS").checked = true;
    } else if (tuning === "justIntonation") {
      getInputElement("justIntonation").checked = true;
    }
    getInputElement("PVal").value = params.get("P") || "2";
    getInputElement("QVal").value = params.get("Q") || "3";
    getInputElement("SVal").value = params.get("S") || "";
    getInputElement("pVal").value = params.get("p") || "12";
    getInputElement("qVal").value = params.get("q") || "19";
    const playMode = params.get("playMode") || "hold";
    if (playMode === "hold") {
      getInputElement("playModeHold").checked = true;
    } else if (playMode === "toggle") {
      getInputElement("playModeToggle").checked = true;
    }
    getInputElement("matrix1A").value = params.get("A") || "2";
    getInputElement("matrix1B").value = params.get("B") || "-1";
    getInputElement("matrix1C").value = params.get("C") || "-1";
    getInputElement("matrix1D").value = params.get("D") || "1";
    getInputElement("matrix2A").value = params.get("a") || "0";
    getInputElement("matrix2B").value = params.get("b") || "1";
    getInputElement("matrix2C").value = params.get("c") || "1";
    getInputElement("matrix2D").value = params.get("d") || "1";
    getInputElement("gap").value = params.get("gap") || "100";
    getInputElement("scale").value = params.get("scale") || "100";
    getInputElement("showSteps").checked = params.get("showSteps") === "1";
    changeTuningMethod();
    updateNotes();
    updatePlayMode();
    updateMatrixRight(true);
    updateScale();
  }
  restoreSettingsFromURL();
  Array.from(document.getElementsByTagName("input")).forEach((input) => {
    input.addEventListener("change", storeSettingsToURL);
  });
  getInputElement("showSteps").addEventListener("change", () => {
    settings.showSteps = getInputElement("showSteps").checked;
  });
  Array.from(document.getElementsByTagName("input")).forEach((input) => {
    if (input.classList.contains("integer")) {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^0-9-]/g, "");
      });
    }
    if (input.classList.contains("decimal")) {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^0-9.-]/g, "");
      });
    }
  });

  // src/renderer.ts
  function noteToPos(note, matrix) {
    const vector = {
      x: note.monzo.m,
      y: note.monzo.n
    };
    return applyMatrix(matrix, vector);
  }
  function noteToHue(note) {
    function fmod(a, b) {
      return a - b * Math.floor(a / b);
    }
    return fmod(Math.log(note.frequency) / Math.log(note.val.P) * 360 + 100, 360);
  }
  function drawNote(p52, note) {
    p52.push();
    const scaledMatrix = scaleMatrix(settings.animatedMatrix.getCurrent(), settings.gap * settings.scale);
    const hue = noteToHue(note);
    const pos = noteToPos(note, scaledMatrix);
    if (isPlaying(note)) {
      p52.fill(oklch(p52, 0.6, 0.2, hue));
      p52.stroke(oklch(p52, 0.8, 0.2, hue));
      p52.circle(pos.x, pos.y, settings.scale * 0.8);
    } else {
      p52.fill(oklch(p52, 0.3, 0.2, hue));
      p52.stroke(oklch(p52, 0.8, 0.2, hue));
      p52.circle(pos.x, pos.y, settings.scale * 0.6);
    }
    p52.textAlign(p52.CENTER, p52.CENTER);
    p52.fill(255);
    p52.noStroke();
    p52.textSize(settings.scale * 0.25);
    p52.text(`${note.name}${note.oct}`, pos.x, pos.y - settings.scale * 0.15);
    p52.textSize(settings.scale * 0.15);
    if (note.steps !== null && settings.showSteps) {
      p52.text(
        `\uFF3B${note.monzo.m} ${note.monzo.n}\u3009= ${note.steps} 
 ${note.frequency.toFixed(1)}Hz`,
        pos.x,
        pos.y + settings.scale * 0.2
      );
    } else {
      p52.text(
        `\uFF3B${note.monzo.m} ${note.monzo.n}\u3009 
 ${note.frequency.toFixed(1)}Hz`,
        pos.x,
        pos.y + settings.scale * 0.2
      );
    }
    p52.pop();
  }
  function drawNotes(p52) {
    settings.notes.forEach((note) => {
      drawNote(p52, note);
    });
  }
  function drawOctaveGrid(p52, val, matrix, color = 200) {
    p52.push();
    const octave = applyMatrix(matrix, { x: 1, y: 0 });
    const incline = applyMatrix(matrix, { x: Math.log(val.Q), y: -Math.log(val.P) });
    const scale = 100;
    const num = 5;
    p52.stroke(color);
    if (val.p !== null && val.q !== null) {
      const incline2 = applyMatrix(matrix, { x: val.q, y: -val.p });
      for (let i = -num; i <= num; i++) {
        p52.line(
          -octave.x * scale + incline2.x * i,
          -octave.y * scale + incline2.y * i,
          octave.x * scale + incline2.x * i,
          octave.y * scale + incline2.y * i
        );
      }
    } else {
      p52.line(
        -octave.x * scale,
        -octave.y * scale,
        octave.x * scale,
        octave.y * scale
      );
    }
    for (let i = -num; i <= num; i++) {
      p52.line(
        -incline.x * scale + octave.x * i,
        -incline.y * scale + octave.y * i,
        incline.x * scale + octave.x * i,
        incline.y * scale + octave.y * i
      );
    }
    p52.pop();
  }

  // src/mouseEvent.ts
  function getClickedNote(p52, notes, matrix) {
    const nearest = { note: null, dist: Infinity };
    console.log(`Mouse: (${p52.mouseX}, ${p52.mouseY})`);
    for (const note of notes) {
      const pos = noteToPos(note, matrix);
      const d = p52.dist(p52.mouseX - p52.width / 2, p52.mouseY - p52.height / 2, pos.x, pos.y);
      if (d < nearest.dist) {
        nearest.note = note;
        nearest.dist = d;
      }
    }
    const ans = nearest.note;
    console.log(ans);
    return ans;
  }
  function mouseLeftPressed(p52, notes, matrix) {
    const note = getClickedNote(p52, notes, matrix);
    if (settings.playMode === "toggle") {
      if (note) {
        if (isPlaying(note))
          stopNote(note);
        else
          playNote(note);
      }
    }
    if (settings.playMode === "hold") {
      if (note) {
        playNote(note);
      }
    }
  }
  function mouseLeftReleased(p52) {
    if (settings.playMode === "hold") {
      stopAllNotes();
    }
  }

  // src/main.ts
  var canvas = document.getElementById("canvas");
  var sketch = (p) => {
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight, canvas);
    };
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
    p.draw = () => {
      EasingNumber.updateTime();
      p.background(15);
      p.translate(p.width / 2, p.height / 2);
      const scaledMatrix = scaleMatrix(settings.animatedMatrix.getCurrent(), settings.gap * settings.scale);
      drawOctaveGrid(p, settings.val, scaledMatrix, 100);
      drawOctaveGrid(p, makeVal_justIntonation(2, 3, 440), scaledMatrix, 100);
      drawNotes(p);
    };
    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
    canvas.addEventListener("mousedown", (event) => {
      event.preventDefault();
      if (event.button === 0) {
        const scaledMatrix = scaleMatrix(settings.animatedMatrix.getCurrent(), settings.gap * settings.scale);
        mouseLeftPressed(p, settings.notes, scaledMatrix);
      }
    });
    canvas.addEventListener("mouseup", (event) => {
      event.preventDefault();
      if (event.button === 0)
        mouseLeftReleased(p);
    });
  };
  new p5(sketch);
})();
//# sourceMappingURL=main.js.map
