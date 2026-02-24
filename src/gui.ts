import { makeVal_justIntonation, makeVal_fromP, makeVal_fromQ, Val, makeVal_fromS } from "./monzo";

Array.from(document.getElementsByTagName("input")).forEach(input => {
    if (input.inputMode === "numeric") {
        input.addEventListener("input", () => {
            // 数字以外の文字を削除
            input.value = input.value.replace(/[^0-9]/g, "");
        });
    }
});

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
        readVal();
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
        readVal();
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
        readVal();
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
        readVal();
        return;
    }

    throw new Error("no tuning method selected");
}

function readVal(): Val {
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

    if (getInputElement("fromP").checked) {
        const val = makeVal_fromP(pVal, qVal, PVal, baseFreq);
        Qelm.value = val.Q.toString();
        Qelm.readOnly = true;
        Selm.value = val.S!.toString();
        Selm.readOnly = true;
        return val;
    }
    if (getInputElement("fromQ").checked) {
        const val = makeVal_fromQ(pVal, qVal, QVal, baseFreq);
        Pelm.value = val.P.toString();
        Pelm.readOnly = true;
        Selm.value = val.S!.toString();
        Selm.readOnly = true;
        return val;
    }
    if (getInputElement("fromS").checked) {
        const val = makeVal_fromS(pVal, qVal, SVal, baseFreq);
        Pelm.value = val.P.toString();
        Pelm.readOnly = true;
        Qelm.value = val.Q.toString();
        Qelm.readOnly = true;
        return val;
    }
    if (getInputElement("justIntonation").checked) {
        const val = makeVal_justIntonation(PVal, QVal, baseFreq);
        Selm.value = "";
        Selm.readOnly = true;
        pelm.value = "";
        pelm.readOnly = true;
        qelm.value = "";
        qelm.readOnly = true;
        return val;
    }

    throw new Error("no tuning method selected");
}


Array.from(document.getElementsByName("tuning")).forEach(input => {
    input.addEventListener("change", changeTuningMethod);
});

getInputElement("baseFreq").addEventListener("input", readVal);
getInputElement("PVal").addEventListener("input", readVal);
getInputElement("QVal").addEventListener("input", readVal);
getInputElement("SVal").addEventListener("input", readVal);
getInputElement("pVal").addEventListener("input", readVal);
getInputElement("qVal").addEventListener("input", readVal);
