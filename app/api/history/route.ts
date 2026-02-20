import { NextRequest, NextResponse } from "next/server"
import { getHistory, getHistoryCount, deleteAnalysis } from "@/lib/db"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")))
        const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"))

        const records = getHistory(limit, offset)
        const total = getHistoryCount()

        // Return records without the full result_json to keep response light
        const items = records.map((r) => ({
            id: r.id,
            filename: r.filename,
            file_type: r.file_type,
            file_size: r.file_size,
            verdict: r.verdict,
            confidence: r.confidence,
            feedback: r.feedback,
            created_at: r.created_at,
            result: JSON.parse(r.result_json),
        }))

        return NextResponse.json({ items, total, limit, offset })
    } catch (error) {
        console.error("History error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json(
                { error: "Missing analysis id" },
                { status: 400 }
            )
        }

        const deleted = deleteAnalysis(id)
        if (!deleted) {
            return NextResponse.json(
                { error: "Analysis not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
