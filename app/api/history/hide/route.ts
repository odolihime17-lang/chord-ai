import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function POST(request: NextRequest) {
    try {
        const { deviceId, transcriptionId } = await request.json();

        if (!deviceId || !transcriptionId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { error } = await supabase
            .from("device_history")
            .update({ is_hidden: true })
            .eq("device_id", deviceId)
            .eq("transcription_id", transcriptionId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Hide History Error:", error);
        return NextResponse.json({ error: "Failed to hide history" }, { status: 500 });
    }
}
