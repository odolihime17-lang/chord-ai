"use client";

import React from "react";

interface GuitarDiagramProps {
    chordName: string;
    frets: number[];
    size?: "sm" | "lg";
}

const GuitarDiagram: React.FC<GuitarDiagramProps> = ({
    chordName,
    frets,
    size = "sm",
}) => {
    const strings = 6;
    const visibleFrets = 5;

    const maxFret = Math.max(...frets);
    const positiveFrets = frets.filter((f) => f > 0);
    const minFret = positiveFrets.length > 0 ? Math.min(...positiveFrets) : 1;
    let startFret = 1;
    if (maxFret > 5) {
        startFret = minFret;
    }

    const scale = size === "lg" ? 1.6 : 1;
    const width = 100 * scale;
    const height = 120 * scale;
    const margin = 15 * scale;
    const chartWidth = width - margin * 2;
    const chartHeight = height - margin * 2;
    const stringSpacing = chartWidth / (strings - 1);
    const fretSpacing = chartHeight / visibleFrets;
    const dotR = (size === "lg" ? 5 : 4) * scale;
    const fontSize = (size === "lg" ? 12 : 10) * scale;

    return (
        <div className="flex flex-col items-center">
            <div
                className={`font-bold text-slate-700 ${size === "lg" ? "text-xl mb-2" : "text-sm mb-1"
                    }`}
            >
                {chordName}
            </div>
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
            >
                {/* Nut */}
                <line
                    x1={margin}
                    y1={margin}
                    x2={width - margin}
                    y2={margin}
                    stroke="#1e293b"
                    strokeWidth={startFret === 1 ? 3 * scale : 1}
                />

                {/* Frets */}
                {[...Array(visibleFrets + 1)].map((_, i) => (
                    <line
                        key={`fret-${i}`}
                        x1={margin}
                        y1={margin + i * fretSpacing}
                        x2={width - margin}
                        y2={margin + i * fretSpacing}
                        stroke="#94a3b8"
                        strokeWidth={i === 0 && startFret === 1 ? 3 * scale : 1}
                    />
                ))}

                {/* Strings */}
                {[...Array(strings)].map((_, i) => (
                    <line
                        key={`string-${i}`}
                        x1={margin + i * stringSpacing}
                        y1={margin}
                        x2={margin + i * stringSpacing}
                        y2={margin + chartHeight}
                        stroke="#64748b"
                        strokeWidth={1 + (5 - i) * 0.15}
                    />
                ))}

                {/* Start fret number */}
                {startFret > 1 && (
                    <text
                        x={margin - 4 * scale}
                        y={margin + fretSpacing / 2}
                        fontSize={fontSize}
                        textAnchor="end"
                        alignmentBaseline="middle"
                        fill="#475569"
                        fontWeight="bold"
                    >
                        {startFret}
                    </text>
                )}

                {/* Fingering dots */}
                {frets.map((fret, stringIdx) => {
                    if (fret === -1) {
                        return (
                            <text
                                key={`mute-${stringIdx}`}
                                x={margin + stringIdx * stringSpacing}
                                y={margin - 5 * scale}
                                fontSize={fontSize}
                                textAnchor="middle"
                                fill="#ef4444"
                                fontWeight="bold"
                            >
                                ×
                            </text>
                        );
                    }
                    if (fret === 0) {
                        return (
                            <circle
                                key={`open-${stringIdx}`}
                                cx={margin + stringIdx * stringSpacing}
                                cy={margin - 5 * scale}
                                r={dotR * 0.7}
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth={1.5}
                            />
                        );
                    }

                    const displayFret = fret - startFret + 1;
                    if (displayFret > 0 && displayFret <= visibleFrets) {
                        return (
                            <g key={`dot-${stringIdx}`}>
                                <circle
                                    cx={margin + stringIdx * stringSpacing}
                                    cy={margin + (displayFret - 0.5) * fretSpacing}
                                    r={dotR}
                                    fill="#2563eb"
                                />
                                <text
                                    x={margin + stringIdx * stringSpacing}
                                    y={margin + (displayFret - 0.5) * fretSpacing}
                                    fontSize={dotR * 1.4}
                                    textAnchor="middle"
                                    alignmentBaseline="central"
                                    fill="white"
                                    fontWeight="bold"
                                >
                                    {fret}
                                </text>
                            </g>
                        );
                    }
                    return null;
                })}
            </svg>
        </div>
    );
};

export default GuitarDiagram;
