import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
    try {
        const { songTitle } = await request.json();

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

        const prompt = `あなたは音楽に非常に詳しい専門家です。
以下の曲名（またはキーワード）に該当する可能性のある楽曲の候補を最大5つ提示してください。
異なるアーティストによる同名の曲や、似た名前の有名曲を含めてください。

検索: 「${songTitle}」

以下のJSON形式で返してください。JSONのみを返し、マークダウンのコードブロックや他の文章は一切付けないでください。

{
  "candidates": [
    {
      "songTitle": "正式な曲名",
      "artist": "アーティスト名",
      "year": 発表年（数値）,
      "genre": "ジャンル"
    }
  ]
}

ルール:
1. 有名な曲を優先してください
2. 同名の曲が複数のアーティストにある場合は、それぞれ別の候補として含めてください
3. 候補が1曲しか見つからない場合でも、配列で返してください
4. 必ず有効なJSONのみを返してください`;

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

        let searchResult;
        try {
            const cleaned = text
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();
            searchResult = JSON.parse(cleaned);
        } catch {
            console.error("Failed to parse Gemini search response:", text);
            return NextResponse.json(
                { error: "検索結果を解析できませんでした。もう一度お試しください。" },
                { status: 500 }
            );
        }

        return NextResponse.json(searchResult);
    } catch (error: unknown) {
        console.error("Search API Error:", error);

        if (error instanceof Error && (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("quota"))) {
            return NextResponse.json(
                { error: "AIサーバーが混み合っています。少し時間をおいてからもう一度お試しください。", errorType: "rate_limit" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "検索中にエラーが発生しました。もう一度お試しください。", errorType: "unknown" },
            { status: 500 }
        );
    }
}
