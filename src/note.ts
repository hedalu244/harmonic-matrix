import { Monzo, Val } from "./monzo";

export interface Note {
    name: string,
    oct: number,
    monzo: Monzo,
}

function addOctave(Note: Note, n: number): Note {
    return {
        name: Note.name,
        oct: Note.oct + n,
        monzo: {
            m: Note.monzo.m + n,
            n: Note.monzo.n,
        },
    }
}

function addFlat(Note: Note, n: number): Note {
    if (Note.name.endsWith("♯")) {
        throw new Error("Cannot add flat to a sharp note");
    }
    return {
        name: Note.name + "♭".repeat(n),
        oct: Note.oct,
        monzo: {
            m: Note.monzo.m + n * 11,
            n: Note.monzo.n - n * 7,
        },
    }
}
function addSharp(Note: Note, n: number): Note {
    if (Note.name.endsWith("♭")) {
        throw new Error("Cannot add sharp to a flat note");
    }
    return {
        name: Note.name + "♯".repeat(n),
        oct: Note.oct,
        monzo: {
            m: Note.monzo.m - n * 11,
            n: Note.monzo.n + n * 7,
        },
    }
}

export function generateNotes(baseNoteName = "A4", minOct = 2, maxOct = 6, flatNum = 1, sharpNum = 1): Note[] {
    const names = ["C", "D", "E", "F", "G", "A", "B"];

    const diatonic: Note[] = [
        { name: "C", oct: 0, monzo: { m: 0, n: 0 } }, // 0
        { name: "D", oct: 0, monzo: { m: -3, n: 2 } }, // -36 + 38 = 2
        { name: "E", oct: 0 , monzo: { m: -6, n: 4 } }, // -72 + 76 = 4
        { name: "F", oct: 0, monzo: { m: 2, n: -1 } }, // 24 - 19 = 5
        { name: "G", oct: 0, monzo: { m: -1, n: 1 } }, // -12 + 19 = 7
        { name: "A", oct: 0, monzo: { m: -4, n: 3 } }, // -48 + 57 = 9
        { name: "B", oct: 0, monzo: { m: -7, n: 5 } }, // -84 + 95 = 11
    ];

    const chromatic: Note[] = [...diatonic];
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

    const notes: Note[] = [];
    for (let oct = minOct; oct <= maxOct; oct++) {
        for (const note of chromatic) {
            const octDiff = oct - note.oct;
            notes.push(addOctave(note, octDiff));
        }
    }

    const baseNote = notes.find(note => `${note.name}${note.oct}` === baseNoteName);
    if (!baseNote) {
        throw new Error(`Base note ${baseNoteName} not found`);
    }

    return notes.sort((a, b) => {
        const aVal = Math.pow(2, a.monzo.m) * Math.pow(3, a.monzo.n);
        const bVal = Math.pow(2, b.monzo.m) * Math.pow(3, b.monzo.n);
        return aVal - bVal;
    }).map(note => {
        // basenoteとの相対的なmonzoに変換
        return {
            ...note,
            monzo:{
                m: note.monzo.m - baseNote.monzo.m,
                n: note.monzo.n - baseNote.monzo.n,
            }
        };
    });
}