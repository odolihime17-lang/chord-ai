"use client";

import React from "react";
import GuitarDiagram from "./GuitarDiagram";
import { getChordData } from "../lib/chordDb";

interface LyricLineProps {
    lyric: string;
    chords: string[];
    onChordTap: (chord: string) => void;
}

const LyricLine: React.FC<LyricLineProps> = ({ lyric, chords, onChordTap }) => {
    return (
        <div className="py-2 border-b border-slate-50 last:border-b-0">
            {/* Chord diagrams row */}
            {chords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                    {chords.map((chord, idx) => {
                        const data = getChordData(chord);
                        return (
                            <div
                                key={idx}
                                onClick={() => onChordTap(chord)}
                                className="bg-slate-50 rounded-lg p-1.5 border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer"
                            >
                                {data ? (
                                    <GuitarDiagram
                                        chordName={chord}
                                        frets={data.frets}
                                        size="sm"
                                    />
                                ) : (
                                    <div className="text-center w-[100px] py-2">
                                        <p className="text-sm font-bold text-blue-600">{chord}</p>
                                        <p className="text-[9px] text-slate-400">データなし</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Lyric row */}
            {lyric && (
                <p className="text-slate-700 text-sm leading-relaxed pl-0.5">
                    {lyric}
                </p>
            )}
        </div>
    );
};

export default LyricLine;
