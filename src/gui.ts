import { Matrix, scaleMatrix } from "./matrix";
import { makeVal_justIntonation, makeVal_fromP, makeVal_fromQ, Val, makeVal_fromS } from "./monzo";
import { generateNotes, Note } from "./note";
import * as player from "./player";

interface GUISettings {
    val: Val,
    notes: Note[],
    matrix: Matrix,
    scaledMatrix: Matrix,
    size: number,

    playMode: "hold" | "toggle",
}

export const settings: GUISettings = {
    val: makeVal_fromP(12, 19, 2, 440),
    notes: [],
    matrix: { a: 1, b: -2, c: 2, d: -3 },
    scaledMatrix: scaleMatrix({ a: 1, b: -2, c: 2, d: -3 }, 100),
    size: 100,
    playMode: "hold",
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

function updateScale() {
    const gapInput = getInputElement("gap");
    const scaleInput = getInputElement("scale");

    const gap = parseFloat(gapInput.value);
    const scale = parseFloat(scaleInput.value);

    if (isNaN(gap) || isNaN(scale)) {
        console.warn("Invalid input for gap or scale: ", { gap, scale });
        return;
    }
    settings.scaledMatrix = scaleMatrix(settings.matrix, gap * scale / 100);
    settings.size = scale;
}

Array.from(document.getElementsByName("tuning")).forEach(input => {
    input.addEventListener("change", changeTuningMethod);
});

getInputElement("baseFreq").addEventListener("input", updateVal);
getInputElement("PVal").addEventListener("input", updateVal);
getInputElement("QVal").addEventListener("input", updateVal);
getInputElement("SVal").addEventListener("input", updateVal);
getInputElement("pVal").addEventListener("input", updateVal);
getInputElement("qVal").addEventListener("input", updateVal);

getInputElement("baseNote").addEventListener("input", updateNotes);
getInputElement("minNote").addEventListener("input", updateNotes);
getInputElement("maxNote").addEventListener("input", updateNotes);
getInputElement("flatNum").addEventListener("input", updateNotes);
getInputElement("sharpNum").addEventListener("input", updateNotes);

getInputElement("playModeHold").addEventListener("change", updatePlayMode);
getInputElement("playModeToggle").addEventListener("change", updatePlayMode);

getInputElement("scale").addEventListener("input", updateScale);
getInputElement("gap").addEventListener("input", updateScale);

Array.from(document.getElementsByTagName("input")).forEach(input => {
    if (input.inputMode === "numeric") {
        input.addEventListener("input", () => {
            // 数字以外の文字を削除
            input.value = input.value.replace(/[^0-9]/g, "");
        });
    }
});
