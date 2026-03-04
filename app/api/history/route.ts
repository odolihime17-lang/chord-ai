import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get("deviceId");

        if (!deviceId) {
            return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
        }

        console.log(`[History] Fetching history for device: ${deviceId}`);

        const { data, error } = await supabase
            .from("device_history")
            .select(`
                id,
                transcription_id,
                created_at,
                transcriptions (
                    song_title,
                    artist
                )
            `)
            .eq("device_id", deviceId)
            .eq("is_hidden", false)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[History] Database error:", error.message);
            throw error;
        }

        console.log(`[History] Found ${data?.length || 0} items.`);

        // Flatten the result
        const history = data.map((item: any) => ({
            id: item.id,
            transcriptionId: item.transcription_id,
            songTitle: item.transcriptions.song_title,
            artist: item.transcriptions.artist,
            createdAt: item.created_at,
        }));

        return NextResponse.json({ history });
    } catch (error) {
        console.error("History API Error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
