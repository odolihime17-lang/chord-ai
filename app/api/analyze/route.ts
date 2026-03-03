import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
    try {
        const { songTitle, artist } = await request.json();

        if (!songTitle || typeof songTitle !== "string") {
            return NextResponse.json(
                { error: "曲名が指定されていません" },
                { status: 400 }
            );
        }

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
                break; // Success - exit the loop
            } catch (err) {
                console.warn(`Model ${modelName} failed, trying next...`);
                lastError = err;
            }
        }

        if (!response) {
            throw lastError || new Error("すべてのモデルで失敗しました");
        }

        const text = response.text || "";

        // Try to parse JSON from the response
        let analysisResult;
        try {
            // Strip potential markdown code fences
            const cleaned = text
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();
            analysisResult = JSON.parse(cleaned);
        } catch {
            console.error("Failed to parse Gemini response:", text);
            return NextResponse.json(
                { error: "AIの応答を解析できませんでした。もう一度お試しください。" },
                { status: 500 }
            );
        }

        return NextResponse.json(analysisResult);
    } catch (error: unknown) {
        console.error("API Error:", error);

        // Check for rate limit errors
        if (error instanceof Error && (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("quota"))) {
            return NextResponse.json(
                {
                    error: "AIサーバーが混み合っています。少し時間をおいてからもう一度お試しください。",
                    errorType: "rate_limit",
                },
                { status: 429 }
            );
        }

        // Check for network errors
        if (error instanceof Error && (error.message.includes("fetch") || error.message.includes("network"))) {
            return NextResponse.json(
                {
                    error: "ネットワークに接続できませんでした。接続を確認してもう一度お試しください。",
                    errorType: "network",
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                error: "解析中にエラーが発生しました。もう一度お試しください。",
                errorType: "unknown",
            },
            { status: 500 }
        );
    }
}
