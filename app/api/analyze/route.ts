import { NextRequest, NextResponse } from "next/server"
import { insertAnalysis } from "@/lib/db"
import { generateId } from "@/lib/file-utils"

export const runtime = "nodejs"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json(
                { error: "No file provided. Please upload an image, video, or audio file." },
                { status: 400 }
            )
        }

        // Forward file to Python backend
        const pythonFormData = new FormData()
        pythonFormData.append("file", file)

        let result;
        try {
            const response = await fetch(`${PYTHON_BACKEND_URL}/analyze`, {
                method: "POST",
                body: pythonFormData,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }))
                throw new Error(errorData.detail || errorData.error || `Python backend returned ${response.status}`)
            }

            result = await response.json()
        } catch (fetchError) {
            // Check if Python backend is running
            const isConnectionError = fetchError instanceof TypeError ||
                (fetchError instanceof Error && fetchError.message.includes("fetch"))

            if (isConnectionError) {
                return NextResponse.json(
                    { error: "Detection backend is not running. Please start the Python server: cd backend && ../backend/venv/bin/python server.py" },
                    { status: 503 }
                )
            }
            throw fetchError
        }

        // Store in database
        const analysisId = generateId()
        try {
            insertAnalysis({
                id: analysisId,
                filename: file.name,
                file_hash: result.blockchain?.hash || "",
                file_type: file.type,
                file_size: file.size,
                verdict: result.verdict,
                confidence: result.confidence,
                result_json: JSON.stringify(result),
                feedback: null,
            })
        } catch (dbError) {
            console.error("Database error (non-fatal):", dbError)
            // Continue even if DB fails — the analysis result is still valid
        }

        return NextResponse.json({
            analysisId,
            result,
        })
    } catch (error) {
        console.error("Analysis error:", error)
        const message = error instanceof Error ? error.message : "Internal server error"
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
