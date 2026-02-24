import { Monzo, Val, getFrequency, getSteps } from "./monzo";

interface TemporalNote {
    name: string,
    oct: number,
    monzo: Monzo,
}

export interface Note {
    name: string,
    oct: number,

    monzo: Monzo,
    val: Val, // どの音律で計算したか記録

    frequency: number,
    steps: number | null,
}

function addOctave(Note: TemporalNote, n: number): TemporalNote {
    const monzo = {
        m: Note.monzo.m + n,
        n: Note.monzo.n,
    };

    return {
        name: Note.name,
        oct: Note.oct + n,
        monzo: monzo,
    }
}

function addFlat(Note: TemporalNote, n: number): TemporalNote {
    if (Note.name.endsWith("♯")) {
        throw new Error("Cannot add flat to a sharp note");
    }
    const monzo = {
        m: Note.monzo.m + n * 11,
        n: Note.monzo.n - n * 7,
    };

    return {
        name: Note.name + "♭".repeat(n),
        oct: Note.oct,
        monzo: monzo,
    }
}
function addSharp(Note: TemporalNote, n: number): TemporalNote {
    if (Note.name.endsWith("♭")) {
        throw new Error("Cannot add sharp to a flat note");
    }

    const monzo = {
        m: Note.monzo.m - n * 11,
        n: Note.monzo.n + n * 7,
    };
    return {
        name: Note.name + "♯".repeat(n),
        oct: Note.oct,
        monzo: monzo,
    }
}

export function generateNotes(val: Val, baseNoteName = "A4", minNoteName = "A0", maxNoteName = "C8", flatNum = 1, sharpNum = 1): Note[] {
    const baseMatch = baseNoteName.toUpperCase().match(/([A-G][♭#]*)(\d+)/);
    const minMatch = minNoteName.toUpperCase().match(/([A-G][♭#]*)(\d+)/);
    const maxMatch = maxNoteName.toUpperCase().match(/([A-G][♭#]*)(\d+)/);
    if (!baseMatch || !minMatch || !maxMatch) {
        console.error("Invalid note name format: ", { baseNoteName, minNoteName, maxNoteName });
        throw new Error(`Invalid note name format`);
    }

    const diatonic: TemporalNote[] = [
        { name: "C", oct: 0, monzo: { m: 0, n: 0 } }, // 0
        { name: "D", oct: 0, monzo: { m: -3, n: 2 } }, // -36 + 38 = 2
        { name: "E", oct: 0, monzo: { m: -6, n: 4 } }, // -72 + 76 = 4
        { name: "F", oct: 0, monzo: { m: 2, n: -1 } }, // 24 - 19 = 5
        { name: "G", oct: 0, monzo: { m: -1, n: 1 } }, // -12 + 19 = 7
        { name: "A", oct: 0, monzo: { m: -4, n: 3 } }, // -48 + 57 = 9
        { name: "B", oct: 0, monzo: { m: -7, n: 5 } }, // -84 + 95 = 11
    ];

    const chromatic: TemporalNote[] = [...diatonic];
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

    const minOct = Math.min(parseInt(baseMatch[2]), parseInt(minMatch[2]), parseInt(maxMatch[2]));
    const maxOct = Math.max(parseInt(baseMatch[2]), parseInt(minMatch[2]), parseInt(maxMatch[2]));

    const temporalNotes: TemporalNote[] = [];
    for (let oct = minOct; oct <= maxOct; oct++) {
        for (const note of chromatic) {
            const octDiff = oct - note.oct;
            temporalNotes.push(addOctave(note, octDiff));
        }
    }

    const baseNote = temporalNotes.find(note => `${note.name}${note.oct}` === baseNoteName);
    const minNote = temporalNotes.find(note => `${note.name}${note.oct}` === minNoteName);
    const maxNote = temporalNotes.find(note => `${note.name}${note.oct}` === maxNoteName);

    if (!baseNote)
        throw new Error(`Base note ${baseNoteName} not found`);
    if (!minNote) 
        throw new Error(`Min note ${minNoteName} not found`);
    if (!maxNote) 
        throw new Error(`Max note ${maxNoteName} not found`);

    const minFrequency = getFrequency(val, {
        m: minNote.monzo.m - baseNote.monzo.m,
        n: minNote.monzo.n - baseNote.monzo.n,
    });
    const maxFrequency = getFrequency(val, {
        m: maxNote.monzo.m - baseNote.monzo.m,
        n: maxNote.monzo.n - baseNote.monzo.n,
    });

    return temporalNotes.map(note => {
        // baseNoteとの相対的なmonzoに変換
        const monzo = {
            m: note.monzo.m - baseNote.monzo.m,
            n: note.monzo.n - baseNote.monzo.n,
        };
        // 周波数、ステップ数を計算してNoteに保存
        return {
            name: note.name,
            oct: note.oct,

            monzo: monzo,
            val: val,

            frequency: getFrequency(val, monzo),
            steps: getSteps(val, monzo),
        };
    }).sort((a, b) => a.frequency - b.frequency).filter(note => note.frequency >= minFrequency && note.frequency <= maxFrequency);
}