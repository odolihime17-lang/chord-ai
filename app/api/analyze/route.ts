import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/app/lib/supabase";

export async function POST(request: NextRequest) {
    try {
        const { songTitle, artist, deviceId } = await request.json();

        if (!songTitle || typeof songTitle !== "string") {
            return NextResponse.json(
                { error: "曲名が指定されていません" },
                { status: 400 }
            );
        }

        console.log(`[Analyze] Request for "${songTitle}" by "${artist}". Device: ${deviceId}`);

        // --- 1. Check Supabase Cache ---
        let analysisResult = null;
        let transcriptionId = null;

        try {
            const { data: cached, error: cacheError } = await supabase
                .from("transcriptions")
                .select("id, result")
                .eq("song_title", songTitle)
                .eq("artist", artist || "")
                .single();

            if (cached && !cacheError) {
                analysisResult = cached.result;
                transcriptionId = cached.id;
                console.log(`[Analyze] Cache hit. transcriptionId: ${transcriptionId}`);
            } else if (cacheError && cacheError.code !== "PGRST116") {
                // PGRST116 is "No rows found", which is expected for new songs
                console.warn("[Analyze] Cache lookup error:", cacheError.message);
            }
        } catch (e) {
            console.error("[Analyze] Cache lookup exception:", e);
        }

        // --- 2. If not in cache, call Gemini ---
        if (!analysisResult) {
            console.log("[Analyze] Cache miss. Calling Gemini API...");
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                return NextResponse.json(
                    { error: "GEMINI_API_KEYが設定されていません" },
                    { status: 500 }
                );
            }

            const ai = new GoogleGenAI({ apiKey });
            const songInfo = artist ? `「${songTitle}」(${artist})` : `「${songTitle}」`;

            const prompt = `あなたはプロのギタリスト兼音楽理論の専門家です。
以下の曲から、ギターで弾くための「コード進行」と「歌詞」を推定してください。

曲: ${songInfo}

以下のJSON形式で返してください。JSONのみを返し、マークダウンのコードブロックや他の文章は一切付けないでください。

{
  "songTitle": "曲名",
  "artist": "アーティスト名",
  "key": "キー（例: C, Am, G等）",
  "bpm": 数値,
  "sections": [
    {
      "title": "セクション名（例: Intro, Verse, Chorus, Bridge, Outro等）",
      "lines": [
        {
          "lyric": "歌詞の1行（イントロなどの場合は空文字列）",
          "chords": ["C", "G"]
        }
      ]
    }
  ]
}

ルール:
1. コード名は英語表記（C, Dm, F#m, Bb, G7, Cadd9, Dsus4, Edim, Faug 等）を使用
2. セクションは最低でも Intro, Verse, Chorus を含めてください
3. 各lineのchordsには、その歌詞行で使われるコードを順番に配列で入れてください
4. 歌詞がない部分（イントロ、アウトロ等）は lyric を空文字列にしてください
5. 実在の曲の場合はできるだけ正確なコード進行と歌詞を推定してください
6. 知らない曲の場合は、曲名の雰囲気に合ったコード進行と歌詞を創作してください
7. 必ず有効なJSONのみを返してください`;

            const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
            let response = null;
            let lastError: unknown = null;

            for (const modelName of models) {
                try {
                    response = await ai.models.generateContent({
                        model: modelName,
                        contents: prompt,
                    });
                    break;
                } catch (err) {
                    console.warn(`Model ${modelName} failed, trying next...`);
                    lastError = err;
                }
            }

            if (!response) {
                throw lastError || new Error("すべてのモデルで失敗しました");
            }

            const text = response.text || "";

            try {
                const cleaned = text
                    .replace(/```json\s*/g, "")
                    .replace(/```\s*/g, "")
                    .trim();
                analysisResult = JSON.parse(cleaned);

                // --- 3. Save to Supabase Cache ---
                console.log("[Analyze] Saving result to cache...");
                const { data: saved, error: saveError } = await supabase
                    .from("transcriptions")
                    .upsert({
                        song_title: songTitle,
                        artist: artist || "",
                        result: analysisResult,
                    }, { onConflict: "song_title, artist" })
                    .select("id")
                    .single();

                if (saveError) {
                    console.error("[Analyze] Failed to save to transcriptions:", saveError.message);
                } else if (saved) {
                    transcriptionId = saved.id;
                    console.log("[Analyze] Successfully saved to cache. ID:", transcriptionId);
                }
            } catch (e) {
                console.error("[Analyze] Failed to parse Gemini response or save to cache:", e);
                return NextResponse.json(
                    { error: "AIの応答を解析できませんでした。もう一度お試しください。" },
                    { status: 500 }
                );
            }
        }

        // --- 4. Update Device History ---
        if (deviceId && transcriptionId) {
            console.log(`[Analyze] Updating device history for device: ${deviceId}`);
            try {
                const { error: historyError } = await supabase
                    .from("device_history")
                    .upsert({
                        device_id: deviceId,
                        transcription_id: transcriptionId,
                        is_hidden: false,
                        created_at: new Date().toISOString()
                    }, { onConflict: "device_id, transcription_id" });

                if (historyError) {
                    console.error("[Analyze] Failed to update device history:", historyError.message);
                } else {
                    console.log("[Analyze] Device history updated successfully.");
                }
            } catch (e) {
                console.error("[Analyze] Device history exception:", e);
            }
        } else {
            console.log("[Analyze] Skipping device history update (Missing deviceId or transcriptionId)");
        }

        return NextResponse.json(analysisResult);
    } catch (error: unknown) {
        console.error("[Analyze] API Error:", error);

        if (error instanceof Error && (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("quota"))) {
            return NextResponse.json(
                { error: "AIサーバーが混み合っています。少し時間をおいてからもう一度お試しください。", errorType: "rate_limit" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "解析中にエラーが発生しました。もう一度お試しください。", errorType: "unknown" },
            { status: 500 }
        );
    }
}
