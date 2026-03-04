"use client";

import React, { useState, useCallback, useEffect } from "react";
import { CHORD_DB, getChordData } from "./lib/chordDb";
import GuitarDiagram from "./components/GuitarDiagram";
import LyricLine from "./components/LyricLine";
import Metronome from "./components/Metronome";

interface LineDatum {
  lyric: string;
  chords: string[];
}

interface SongSection {
  title: string;
  lines: LineDatum[];
}

interface AnalysisResult {
  songTitle: string;
  artist?: string;
  key?: string;
  bpm?: number;
  sections: SongSection[];
}

interface SongCandidate {
  songTitle: string;
  artist: string;
  year?: number;
  genre?: string;
}

interface HistoryItem {
  id: string;
  transcriptionId: string;
  songTitle: string;
  artist: string;
  createdAt: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"search" | "history">("search");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<SongCandidate[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Initialize Device ID
  useEffect(() => {
    let id = localStorage.getItem("chord_ai_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("chord_ai_device_id", id);
    }
    setDeviceId(id);
  }, []);

  // Fetch History
  const fetchHistory = useCallback(async () => {
    if (!deviceId) return;

    setIsLoadingHistory(true);
    console.log("[Frontend] Fetching history for:", deviceId);
    try {
      const res = await fetch(`/api/history?deviceId=${deviceId}`);
      const data = await res.json();
      if (res.ok) {
        console.log("[Frontend] History received:", data.history?.length, "items");
        setHistoryItems(data.history || []);
      } else {
        console.error("[Frontend] History API Error:", data.error);
      }
    } catch (e) {
      console.error("[Frontend] Network error fetching history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const handleHideHistory = async (e: React.MouseEvent, transcriptionId: string) => {
    e.stopPropagation();
    if (!deviceId) return;

    try {
      const res = await fetch("/api/history/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, transcriptionId }),
      });

      if (res.ok) {
        setHistoryItems(prev => prev.filter(item => item.transcriptionId !== transcriptionId));
      }
    } catch (e) {
      console.error("Failed to hide history:", e);
    }
  };

  // Step 1: Search for candidates
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setErrorType(null);
    setResult(null);
    setCandidates(null);
    setSelectedChord(null);
    setActiveTab("search");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songTitle: query.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "検索に失敗しました");
        setErrorType(data.errorType || "unknown");
        return;
      }

      if (data.candidates && data.candidates.length === 1) {
        // Only one candidate - go straight to analysis
        handleSelectCandidate(data.candidates[0]);
      } else if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
      } else {
        setError("候補が見つかりませんでした。別の曲名をお試しください。");
        setErrorType("unknown");
      }
    } catch {
      setError("ネットワークに接続できませんでした。");
      setErrorType("network");
    } finally {
      setIsSearching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Step 2: Analyze chosen candidate
  const handleSelectCandidate = async (candidate: { songTitle: string; artist: string }) => {
    setCandidates(null);
    setIsAnalyzing(true);
    setError(null);
    setErrorType(null);
    setActiveTab("search");

    // Ensure we have deviceId (fallback to localStorage if state is slow)
    let currentDeviceId = deviceId;
    if (!currentDeviceId) {
      currentDeviceId = localStorage.getItem("chord_ai_device_id");
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songTitle: candidate.songTitle,
          artist: candidate.artist,
          deviceId: currentDeviceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "解析に失敗しました");
        setErrorType(data.errorType || "unknown");
        return;
      }

      setResult(data);
    } catch {
      setError("ネットワークに接続できませんでした。");
      setErrorType("network");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChordTap = (chord: string) => {
    setSelectedChord(selectedChord === chord ? null : chord);
  };

  const handleHistoryItemClick = (item: HistoryItem) => {
    handleSelectCandidate({ songTitle: item.songTitle, artist: item.artist });
  };

  // Collect all unique chords from the result
  const allChords: string[] = [];
  if (result) {
    result.sections.forEach((section) => {
      section.lines.forEach((line) => {
        line.chords.forEach((chord) => {
          if (!allChords.includes(chord)) allChords.push(chord);
        });
      });
    });
  }

  const sectionColors: Record<string, string> = {
    Intro: "bg-purple-50 text-purple-600 border-purple-100",
    Verse: "bg-blue-50 text-blue-600 border-blue-100",
    Chorus: "bg-orange-50 text-orange-600 border-orange-100",
    Bridge: "bg-green-50 text-green-600 border-green-100",
    Outro: "bg-slate-100 text-slate-600 border-slate-200",
    Solo: "bg-rose-50 text-rose-600 border-rose-100",
    "Pre-Chorus": "bg-cyan-50 text-cyan-600 border-cyan-100",
    Interlude: "bg-yellow-50 text-yellow-700 border-yellow-100",
  };

  const getSectionColor = (title: string) => {
    for (const key of Object.keys(sectionColors)) {
      if (title.toLowerCase().includes(key.toLowerCase())) {
        return sectionColors[key];
      }
    }
    return "bg-blue-50 text-blue-600 border-blue-100";
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-12 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl border-x border-slate-200">
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl border-x border-slate-200/50">
          {/* Header with Background and Glassmorphism */}
          <header className="relative min-h-[170px] flex flex-col justify-end overflow-hidden sticky top-0 z-20 shadow-lg">
            {/* Background Image Layer */}
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: 'url("/les-paul.png")' }}
            />
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent z-10" />

            {/* Glassmorphism Content Area */}
            <div className="relative z-20 p-5 backdrop-blur-[2px]">
              <h1 className="text-xl font-black mb-4 tracking-tighter flex items-center gap-2 text-white drop-shadow-md">
                <span className="text-2xl drop-shadow-lg">🎸</span> AI耳コピアシスタント
              </h1>

              <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                <input
                  type="text"
                  placeholder="曲名を入力 (例: マリーゴールド)"
                  className="flex-1 bg-transparent border-none focus:ring-0 placeholder:text-blue-100/60 text-white text-sm py-2 px-3 outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || isAnalyzing}
                  className="bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-white p-2 rounded-xl disabled:opacity-50 border border-white/10 flex items-center justify-center min-w-[44px]"
                >
                  {isSearching || isAnalyzing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Improved Tabs Navigation Inside Header for Glassmorphism */}
              <div className="flex mt-5 bg-white/10 rounded-xl p-1 backdrop-blur-md border border-white/5">
                <button
                  onClick={() => setActiveTab("search")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "search"
                      ? "bg-white text-slate-900 shadow-md"
                      : "text-white/70 hover:text-white"
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  検索
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "history"
                      ? "bg-white text-slate-900 shadow-md"
                      : "text-white/70 hover:text-white"
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  履歴
                </button>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-4">
            {activeTab === "search" ? (
              <>
                {/* Empty state */}
                {!result && !isAnalyzing && !isSearching && !error && !candidates && (
                  <div className="py-20 text-center space-y-4">
                    <div className="text-6xl">🎵</div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      曲名を入力してAIがコード進行と
                      <br />
                      歌詞を解析します
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      {["Let It Be", "マリーゴールド", "夜に駆ける", "Lemon"].map(
                        (s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setQuery(s);
                            }}
                            className="text-xs bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            {s}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Searching */}
                {isSearching && (
                  <div className="py-20 text-center space-y-3">
                    <div className="inline-block w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm font-medium">
                      「{query}」を検索しています...
                    </p>
                  </div>
                )}

                {/* Candidate selection */}
                {candidates && !isAnalyzing && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700">
                        🎤 該当する曲を選んでください
                      </p>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {candidates.length}件
                      </span>
                    </div>
                    {candidates.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectCandidate(c)}
                        className="w-full text-left bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98] group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {c.songTitle}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{c.artist}</p>
                          </div>
                          <div className="flex gap-1.5 items-center">
                            {c.year && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {c.year}
                              </span>
                            )}
                            {c.genre && (
                              <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">
                                {c.genre}
                              </span>
                            )}
                            <span className="text-blue-400 group-hover:text-blue-600 text-lg">→</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Loading */}
                {isAnalyzing && (
                  <div className="py-20 text-center space-y-3">
                    <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm font-medium">
                      AIが「{query}」を解析しています...
                    </p>
                    <p className="text-slate-400 text-xs">数秒かかる場合があります</p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="py-8 px-4">
                    <div
                      className={`rounded-2xl p-6 text-center space-y-3 ${errorType === "rate_limit"
                        ? "bg-amber-50 border border-amber-200"
                        : errorType === "network"
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-red-50 border border-red-200"
                        }`}
                    >
                      <div className="text-5xl">
                        {errorType === "rate_limit"
                          ? "☕"
                          : errorType === "network"
                            ? "📡"
                            : "🔧"}
                      </div>
                      <p
                        className={`text-base font-bold ${errorType === "rate_limit"
                          ? "text-amber-700"
                          : errorType === "network"
                            ? "text-blue-700"
                            : "text-red-600"
                          }`}
                      >
                        {errorType === "rate_limit"
                          ? "ちょっと休憩中..."
                          : errorType === "network"
                            ? "接続できません"
                            : "おっと！"}
                      </p>
                      <p
                        className={`text-sm ${errorType === "rate_limit"
                          ? "text-amber-600"
                          : errorType === "network"
                            ? "text-blue-600"
                            : "text-red-500"
                          }`}
                      >
                        {error}
                      </p>
                      <button
                        onClick={handleSearch}
                        className={`text-sm font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95 mt-2 ${errorType === "rate_limit"
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : errorType === "network"
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                          }`}
                      >
                        {errorType === "rate_limit" ? "もう一度試す ↻" : "再試行 ↻"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Result */}
                {result && !isAnalyzing && (
                  <div className="space-y-5">
                    {/* Song Info Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-black text-slate-800 leading-tight">
                          {result.songTitle}
                        </h2>
                        {result.artist && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {result.artist}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {result.key && (
                          <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-1 rounded-full">
                            Key: {result.key}
                          </span>
                        )}
                        {result.bpm && (
                          <Metronome bpm={result.bpm} />
                        )}
                      </div>
                    </div>

                    {/* Chord Palette */}
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        使用コード
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {allChords.map((chord) => {
                          const known = !!getChordData(chord);
                          return (
                            <button
                              key={chord}
                              onClick={() => handleChordTap(chord)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 border ${selectedChord === chord
                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                : known
                                  ? "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                  : "bg-white text-slate-400 border-slate-200"
                                }`}
                            >
                              {chord}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chord Diagram Modal */}
                    {selectedChord && (
                      <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-lg relative">
                        <button
                          onClick={() => setSelectedChord(null)}
                          className="absolute top-2 right-3 text-slate-400 hover:text-slate-600 text-lg"
                        >
                          ✕
                        </button>
                        {getChordData(selectedChord) ? (
                          <GuitarDiagram
                            chordName={selectedChord}
                            frets={CHORD_DB[selectedChord]?.frets || getChordData(selectedChord)!.frets}
                            size="lg"
                          />
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-lg font-bold text-slate-700">
                              {selectedChord}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              ダイアグラムデータがありません
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sections with Lyrics & Chords */}
                    {result.sections.map((section, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden"
                      >
                        <div
                          className={`px-3 py-1.5 border-b ${getSectionColor(
                            section.title
                          )}`}
                        >
                          <h3 className="text-xs font-black uppercase tracking-wider">
                            {section.title}
                          </h3>
                        </div>
                        <div className="px-3 py-2">
                          {section.lines.map((line, lIdx) => (
                            <LyricLine
                              key={lIdx}
                              lyric={line.lyric}
                              chords={line.chords}
                              onChordTap={handleChordTap}
                            />
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Chord Diagrams Reference */}
                    <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                      <div className="px-3 py-2 border-b bg-slate-50">
                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          🎸 コードダイアグラム一覧
                        </h3>
                      </div>
                      <div className="grid grid-cols-3 gap-2 p-3">
                        {allChords.map((chord) => {
                          const data = getChordData(chord);
                          return (
                            <div
                              key={chord}
                              className="bg-slate-50 rounded-lg p-2 flex flex-col items-center border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer"
                              onClick={() => handleChordTap(chord)}
                            >
                              {data ? (
                                <GuitarDiagram
                                  chordName={chord}
                                  frets={data.frets}
                                  size="sm"
                                />
                              ) : (
                                <div className="text-center py-3">
                                  <p className="text-sm font-bold text-slate-500">{chord}</p>
                                  <p className="text-[9px] text-slate-400">データなし</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* History Tab Content */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    🕒 検索履歴
                  </h2>
                  <button
                    onClick={fetchHistory}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    更新 ↻
                  </button>
                </div>

                {isLoadingHistory ? (
                  <div className="py-20 text-center">
                    <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="text-4xl">📄</div>
                    <p className="text-slate-400 text-xs font-medium">
                      まだ履歴がありません
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleHistoryItemClick(item)}
                        className="w-full text-left bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98] group cursor-pointer relative"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {item.songTitle}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.artist}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-[9px] text-slate-300">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                            <button
                              onClick={(e) => handleHideHistory(e, item.transcriptionId)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10"
                              title="削除"
                            >
                              <span className="text-sm">✕</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </main>
  );
}
