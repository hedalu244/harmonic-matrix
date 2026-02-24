import { Matrix, invertMatrix, multiplyMatrix, normalizeMatrix, scaleMatrix } from "./matrix";
import { EasingMatrix } from "./easing";
import { makeVal_justIntonation, makeVal_fromP, makeVal_fromQ, Val, makeVal_fromS } from "./monzo";
import { generateNotes, Note } from "./note";
import * as player from "./player";

interface GUISettings {
    val: Val,
    notes: Note[],
    matrix: Matrix,
    animatedMatrix: EasingMatrix,
    gap: number,
    scale: number,

    playMode: "hold" | "toggle",
    showSteps: boolean,
}

export const settings: GUISettings = {
    val: makeVal_fromP(12, 19, 2, 440),
    notes: [],
    matrix: { a: 1, b: -2, c: 2, d: -3 },
    animatedMatrix: new EasingMatrix({ a: 1, b: -2, c: 2, d: -3 }),
    gap: 1,
    scale: 100,
    playMode: "hold",
    showSteps: false,
};

function initializeGUI() {
    changeTuningMethod();
    updateNotes();
    updateScale();
}
initializeGUI();

function getInputElement(id: string): HTMLInputElement {
    return document.getElementById(id) as HTMLInputElement;
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
            pelm.value = "12"; qelm.value = "19";
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
            pelm.value = "12"; qelm.value = "19";
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
        Selm.value = "1.0594630943592953"; // 2^(1/12)
        if (pelm.value === "" || qelm.value === "") {
            pelm.value = "12"; qelm.value = "19";
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

function updateVal(): void {
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
        player.stopAllNotes();
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
        Selm.value = val.S!.toString();
        Selm.readOnly = true;

        settings.val = val;
        player.stopAllNotes();
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
        Selm.value = val.S!.toString();
        Selm.readOnly = true;

        settings.val = val;
        player.stopAllNotes();
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
        player.stopAllNotes();
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
        player.stopAllNotes();
    }
    else if (toggleMode.checked) {
        settings.playMode = "toggle";
        player.stopAllNotes();
    }
}

// m1が更新された時には行列は更新せず、m2を更新する
function updateMatrixLeft() {
    const m1 = {
        a: parseFloat(getInputElement("matrix1A").value),
        b: parseFloat(getInputElement("matrix1B").value),
        c: parseFloat(getInputElement("matrix1C").value),
        d: parseFloat(getInputElement("matrix1D").value),
    }
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
function updateMatrixRight(hardset: boolean) {
    const m1 = {
        a: parseFloat(getInputElement("matrix1A").value),
        b: parseFloat(getInputElement("matrix1B").value),
        c: parseFloat(getInputElement("matrix1C").value),
        d: parseFloat(getInputElement("matrix1D").value),
    }
    const m2 = {
        a: parseFloat(getInputElement("matrix2A").value),
        b: parseFloat(getInputElement("matrix2B").value),
        c: parseFloat(getInputElement("matrix2C").value),
        d: parseFloat(getInputElement("matrix2D").value),
    }

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

    // 上下鏡像反転
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

Array.from(document.getElementsByName("tuning")).forEach(input => {
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

Array.from(document.getElementsByTagName("input")).forEach(input => {
    input.addEventListener("change", storeSettingsToURL);
});


getInputElement("showSteps").addEventListener("change", () => {
    settings.showSteps = getInputElement("showSteps").checked;
});

Array.from(document.getElementsByTagName("input")).forEach(input => {
    if (input.classList.contains("integer")) {
        input.addEventListener("input", () => {
            // 数字以外の文字を削除
            input.value = input.value.replace(/[^0-9-]/g, "");
        });
    }
    if (input.classList.contains("decimal")) {
        input.addEventListener("input", () => {
            // 数字以外の文字を削除
            input.value = input.value.replace(/[^0-9.-]/g, "");
        });
    }
});