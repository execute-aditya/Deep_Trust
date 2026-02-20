"use client"

import { useState, useCallback } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { UploadZone } from "@/components/upload-zone"
import { AnalysisProgress } from "@/components/analysis-progress"
import { ResultsDashboard } from "@/components/results-dashboard"
import type { AnalysisResult } from "@/lib/mock-analysis"
import { Shield, FileVideo, Clock, Cpu, AlertCircle, Upload } from "lucide-react"

type Phase = "upload" | "analyzing" | "results" | "error"

export default function DetectPage() {
  const [phase, setPhase] = useState<Phase>("upload")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [analysisId, setAnalysisId] = useState<string>("")
  const [fileName, setFileName] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name)
    setPhase("analyzing")
    setErrorMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setResult(data.result)
      setAnalysisId(data.analysisId)
      setPhase("results")
    } catch (err) {
      console.error("Analysis error:", err)
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      )
      setPhase("error")
    }
  }, [])

  const handleReset = useCallback(() => {
    setPhase("upload")
    setResult(null)
    setAnalysisId("")
    setFileName("")
    setErrorMessage("")
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        {phase === "upload" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
                Media Analysis Dashboard
              </h1>
              <p className="mt-3 text-muted-foreground">
                Upload an image, video, or audio file to begin deepfake
                detection analysis.
              </p>
            </div>

            <UploadZone onFileSelect={handleFileSelect} />

            {/* Info cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: FileVideo,
                  title: "Multi-Format Support",
                  desc: "MP4, MP3, WAV, PNG, JPEG, and more.",
                },
                {
                  icon: Clock,
                  title: "Real-Time Processing",
                  desc: "AI-powered forensic analysis in seconds.",
                },
                {
                  icon: Cpu,
                  title: "Multi-Modal Pipeline",
                  desc: "Noise, texture, ELA & frequency analysis.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <card.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {card.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload guidance */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-card-foreground">
                  How It Works
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload a face photo or image to analyze. The system runs{" "}
                <strong>5 real forensic detectors</strong>: noise uniformity analysis
                (detects GAN-generated images), color channel correlation, texture
                regularity, Error Level Analysis (ELA), and DCT frequency analysis.
                Face detection uses OpenCV to locate faces in the image.
              </p>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                <strong>Tip:</strong> For best results, upload a clear face photo
                (JPEG or PNG). Try photos from social media, news, or AI-generated
                face websites to see the detection in action.
              </p>
            </div>
          </div>
        )}

        {phase === "analyzing" && <AnalysisProgress />}

        {phase === "results" && result && (
          <ResultsDashboard
            result={result}
            fileName={fileName}
            analysisId={analysisId}
            onReset={handleReset}
          />
        )}

        {phase === "error" && (
          <div className="mx-auto max-w-md space-y-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Analysis Failed
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="cursor-pointer rounded-lg border border-border bg-secondary/50 px-6 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
