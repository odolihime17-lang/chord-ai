export type ChordFret = number; // -1: mute, 0: open, >0: fret number

export interface ChordData {
    frets: ChordFret[]; // 6th string (low E) to 1st string (high E)
    barre?: number;
}

export const CHORD_DB: Record<string, ChordData> = {
    // === Major ===
    "C": { frets: [-1, 3, 2, 0, 1, 0] },
    "C#": { frets: [-1, 4, 3, 1, 2, 1], barre: 1 },
    "Db": { frets: [-1, 4, 3, 1, 2, 1], barre: 1 },
    "D": { frets: [-1, -1, 0, 2, 3, 2] },
    "D#": { frets: [-1, -1, 1, 3, 4, 3], barre: 1 },
    "Eb": { frets: [-1, -1, 1, 3, 4, 3], barre: 1 },
    "E": { frets: [0, 2, 2, 1, 0, 0] },
    "F": { frets: [1, 3, 3, 2, 1, 1], barre: 1 },
    "F#": { frets: [2, 4, 4, 3, 2, 2], barre: 2 },
    "Gb": { frets: [2, 4, 4, 3, 2, 2], barre: 2 },
    "G": { frets: [3, 2, 0, 0, 0, 3] },
    "G#": { frets: [4, 6, 6, 5, 4, 4], barre: 4 },
    "Ab": { frets: [4, 6, 6, 5, 4, 4], barre: 4 },
    "A": { frets: [-1, 0, 2, 2, 2, 0] },
    "A#": { frets: [-1, 1, 3, 3, 3, 1], barre: 1 },
    "Bb": { frets: [-1, 1, 3, 3, 3, 1], barre: 1 },
    "B": { frets: [-1, 2, 4, 4, 4, 2], barre: 2 },

    // === Minor ===
    "Cm": { frets: [-1, 3, 5, 5, 4, 3], barre: 3 },
    "C#m": { frets: [-1, 4, 6, 6, 5, 4], barre: 4 },
    "Dbm": { frets: [-1, 4, 6, 6, 5, 4], barre: 4 },
    "Dm": { frets: [-1, -1, 0, 2, 3, 1] },
    "D#m": { frets: [-1, -1, 1, 3, 4, 2], barre: 1 },
    "Ebm": { frets: [-1, -1, 1, 3, 4, 2], barre: 1 },
    "Em": { frets: [0, 2, 2, 0, 0, 0] },
    "Fm": { frets: [1, 3, 3, 1, 1, 1], barre: 1 },
    "F#m": { frets: [2, 4, 4, 2, 2, 2], barre: 2 },
    "Gbm": { frets: [2, 4, 4, 2, 2, 2], barre: 2 },
    "Gm": { frets: [3, 5, 5, 3, 3, 3], barre: 3 },
    "G#m": { frets: [4, 6, 6, 4, 4, 4], barre: 4 },
    "Abm": { frets: [4, 6, 6, 4, 4, 4], barre: 4 },
    "Am": { frets: [-1, 0, 2, 2, 1, 0] },
    "A#m": { frets: [-1, 1, 3, 3, 2, 1], barre: 1 },
    "Bbm": { frets: [-1, 1, 3, 3, 2, 1], barre: 1 },
    "Bm": { frets: [-1, 2, 4, 4, 3, 2], barre: 2 },

    // === 7th ===
    "C7": { frets: [-1, 3, 2, 3, 1, 0] },
    "D7": { frets: [-1, -1, 0, 2, 1, 2] },
    "E7": { frets: [0, 2, 0, 1, 0, 0] },
    "F7": { frets: [1, 3, 1, 2, 1, 1], barre: 1 },
    "G7": { frets: [3, 2, 0, 0, 0, 1] },
    "A7": { frets: [-1, 0, 2, 0, 2, 0] },
    "B7": { frets: [-1, 2, 1, 2, 0, 2] },
    "Bb7": { frets: [-1, 1, 3, 1, 3, 1], barre: 1 },
    "Eb7": { frets: [-1, -1, 1, 3, 2, 3], barre: 1 },

    // === Minor 7th ===
    "Cm7": { frets: [-1, 3, 5, 3, 4, 3], barre: 3 },
    "Dm7": { frets: [-1, -1, 0, 2, 1, 1] },
    "Em7": { frets: [0, 2, 0, 0, 0, 0] },
    "Fm7": { frets: [1, 3, 1, 1, 1, 1], barre: 1 },
    "Gm7": { frets: [3, 5, 3, 3, 3, 3], barre: 3 },
    "Am7": { frets: [-1, 0, 2, 0, 1, 0] },
    "Bm7": { frets: [-1, 2, 4, 2, 3, 2], barre: 2 },

    // === Major 7th ===
    "Cmaj7": { frets: [-1, 3, 2, 0, 0, 0] },
    "Dmaj7": { frets: [-1, -1, 0, 2, 2, 2] },
    "Emaj7": { frets: [0, 2, 1, 1, 0, 0] },
    "Fmaj7": { frets: [1, -1, 2, 2, 1, 0] },
    "Gmaj7": { frets: [3, 2, 0, 0, 0, 2] },
    "Amaj7": { frets: [-1, 0, 2, 1, 2, 0] },
    "Bbmaj7": { frets: [-1, 1, 3, 2, 3, 1], barre: 1 },

    // === sus4 ===
    "Csus4": { frets: [-1, 3, 3, 0, 1, 1] },
    "Dsus4": { frets: [-1, -1, 0, 2, 3, 3] },
    "Esus4": { frets: [0, 2, 2, 2, 0, 0] },
    "Fsus4": { frets: [1, 3, 3, 3, 1, 1], barre: 1 },
    "Gsus4": { frets: [3, 3, 0, 0, 1, 3] },
    "Asus4": { frets: [-1, 0, 2, 2, 3, 0] },
    "Bsus4": { frets: [-1, 2, 4, 4, 5, 2], barre: 2 },

    // === sus2 ===
    "Dsus2": { frets: [-1, -1, 0, 2, 3, 0] },
    "Asus2": { frets: [-1, 0, 2, 2, 0, 0] },
    "Esus2": { frets: [0, 2, 4, 4, 0, 0] },

    // === add9 ===
    "Cadd9": { frets: [-1, 3, 2, 0, 3, 0] },
    "Dadd9": { frets: [-1, -1, 0, 2, 3, 0] },
    "Eadd9": { frets: [0, 2, 2, 1, 0, 2] },
    "Gadd9": { frets: [3, 2, 0, 2, 0, 3] },

    // === dim ===
    "Cdim": { frets: [-1, 3, 4, 5, 4, -1] },
    "Ddim": { frets: [-1, -1, 0, 1, 3, 1] },
    "Edim": { frets: [0, 1, 2, 0, -1, -1] },
    "Fdim": { frets: [1, 2, 3, 1, -1, -1], barre: 1 },
    "Gdim": { frets: [3, 4, 5, 3, -1, -1], barre: 3 },
    "Adim": { frets: [-1, 0, 1, 2, 1, -1] },
    "Bdim": { frets: [-1, 2, 3, 4, 3, -1] },

    // === aug ===
    "Caug": { frets: [-1, 3, 2, 1, 1, 0] },
    "Daug": { frets: [-1, -1, 0, 3, 3, 2] },
    "Eaug": { frets: [0, 3, 2, 1, 1, 0] },
    "Faug": { frets: [1, -1, 3, 2, 2, 1], barre: 1 },
    "Gaug": { frets: [3, 2, 1, 0, 0, 3] },
    "Aaug": { frets: [-1, 0, 3, 2, 2, 1] },
};

/**
 * Lookup a chord. If not found exactly, return a fallback.
 */
export function getChordData(chordName: string): ChordData | null {
    if (CHORD_DB[chordName]) return CHORD_DB[chordName];

    // Try common aliases: e.g. "C#m7" might be stored differently
    // For truly unknown chords, return null so UI can show "unknown" state
    return null;
}
