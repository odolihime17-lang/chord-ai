"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface MetronomeProps {
    bpm: number;
}

const Metronome: React.FC<MetronomeProps> = ({ bpm }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentBeat, setCurrentBeat] = useState(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const beatRef = useRef(0);

    const playClick = useCallback((accent: boolean) => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Accent beat (beat 1) is higher pitch
        osc.frequency.value = accent ? 1000 : 800;
        osc.type = "sine";

        gain.gain.setValueAtTime(accent ? 0.3 : 0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
    }, []);

    const startMetronome = useCallback(() => {
        audioCtxRef.current = new AudioContext();
        beatRef.current = 0;

        const intervalMs = (60 / bpm) * 1000;

        // Play first click immediately
        playClick(true);
        setCurrentBeat(1);
        beatRef.current = 1;

        intervalRef.current = setInterval(() => {
            beatRef.current = (beatRef.current % 4) + 1;
            playClick(beatRef.current === 1);
            setCurrentBeat(beatRef.current);
        }, intervalMs);

        setIsPlaying(true);
    }, [bpm, playClick]);

    const stopMetronome = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
        setIsPlaying(false);
        setCurrentBeat(0);
    }, []);

    const toggle = () => {
        if (isPlaying) {
            stopMetronome();
        } else {
            startMetronome();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (audioCtxRef.current) audioCtxRef.current.close();
        };
    }, []);

    // Restart if BPM changes while playing
    useEffect(() => {
        if (isPlaying) {
            stopMetronome();
            startMetronome();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bpm]);

    return (
        <button
            onClick={toggle}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all active:scale-95 ${isPlaying
                    ? "bg-green-500 text-white shadow-md shadow-green-200 animate-pulse"
                    : "bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600"
                }`}
        >
            {isPlaying ? (
                <>
                    <span className="flex gap-0.5">
                        {[1, 2, 3, 4].map((b) => (
                            <span
                                key={b}
                                className={`inline-block w-1.5 h-1.5 rounded-full transition-all ${currentBeat === b ? "bg-white scale-125" : "bg-white/40"
                                    }`}
                            />
                        ))}
                    </span>
                    {bpm} BPM ■
                </>
            ) : (
                <>{bpm} BPM ▶</>
            )}
        </button>
    );
};

export default Metronome;
