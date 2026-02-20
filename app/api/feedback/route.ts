import { NextRequest, NextResponse } from "next/server"
import { updateFeedback, getAnalysis } from "@/lib/db"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { analysisId, feedback } = body

        if (!analysisId || typeof analysisId !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid analysisId" },
                { status: 400 }
            )
        }

        if (!feedback || !["real", "fake"].includes(feedback)) {
            return NextResponse.json(
                { error: "Feedback must be 'real' or 'fake'" },
                { status: 400 }
            )
        }

        const analysis = getAnalysis(analysisId)
        if (!analysis) {
            return NextResponse.json(
                { error: "Analysis not found" },
                { status: 404 }
            )
        }

        const updated = updateFeedback(analysisId, feedback)
        if (!updated) {
            return NextResponse.json(
                { error: "Failed to save feedback" },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, analysisId, feedback })
    } catch (error) {
        console.error("Feedback error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
