"use client"

import { useState } from "react"
import type { AnalysisResult } from "@/lib/mock-analysis"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Eye,
  AudioLines,
  Link2,
  Hash,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Loader2,
} from "lucide-react"
import { VisualAnalysisPanel } from "@/components/visual-analysis-panel"
import { AudioAnalysisPanel } from "@/components/audio-analysis-panel"
import { CrossModalPanel } from "@/components/cross-modal-panel"
import { BlockchainPanel } from "@/components/blockchain-panel"

interface ResultsDashboardProps {
  result: AnalysisResult
  fileName: string
  analysisId: string
  onReset: () => void
}

export function ResultsDashboard({
  result,
  fileName,
  analysisId,
  onReset,
}: ResultsDashboardProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<
    "real" | "fake" | null
  >(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState("")

  const handleFeedback = async (feedback: "real" | "fake") => {
    setFeedbackLoading(true)
    setFeedbackError("")

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, feedback }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit feedback")
      }

      setFeedbackGiven(feedback)
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Failed to submit feedback"
      )
    } finally {
      setFeedbackLoading(false)
    }
  }

  const verdictConfig = {
    authentic: {
      icon: ShieldCheck,
      label: "Authentic",
      color: "bg-success text-success-foreground",
      border: "border-success/30",
    },
    manipulated: {
      icon: ShieldAlert,
      label: "Manipulated",
      color: "bg-destructive text-foreground",
      border: "border-destructive/30",
    },
    suspicious: {
      icon: ShieldQuestion,
      label: "Suspicious",
      color: "bg-warning text-warning-foreground",
      border: "border-warning/30",
    },
  }

  const v = verdictConfig[result.verdict]
  const VerdictIcon = v.icon

  return (
    <div className="space-y-8">
      {/* Verdict header */}
      <div
        className={`rounded-xl border ${v.border} bg-card p-6`}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl ${v.color}`}
            >
              <VerdictIcon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-card-foreground">
                  {v.label}
                </h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {(result.confidence * 100).toFixed(1)}% confidence
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {fileName} &middot; Processed in{" "}
                {(result.processingTime / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onReset}
            className="cursor-pointer gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Analyze Another
          </Button>
        </div>

        {/* Confidence bar */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Confidence</span>
            <span className="font-mono">
              {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={result.confidence * 100} className="h-3" />
        </div>
      </div>

      {/* Explanation */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
          Explanation
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {result.explanation}
        </p>
      </div>

      {/* Analysis tabs */}
      <Tabs defaultValue="visual" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="visual" className="gap-1.5 cursor-pointer">
            <Eye className="h-3.5 w-3.5" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-1.5 cursor-pointer">
            <AudioLines className="h-3.5 w-3.5" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-1.5 cursor-pointer">
            <Link2 className="h-3.5 w-3.5" />
            Cross-Modal
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="gap-1.5 cursor-pointer">
            <Hash className="h-3.5 w-3.5" />
            Provenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual">
          <VisualAnalysisPanel data={result.visual} />
        </TabsContent>
        <TabsContent value="audio">
          <AudioAnalysisPanel data={result.audio} />
        </TabsContent>
        <TabsContent value="sync">
          <CrossModalPanel data={result.crossModal} />
        </TabsContent>
        <TabsContent value="blockchain">
          <BlockchainPanel data={result.blockchain} />
        </TabsContent>
      </Tabs>

      {/* Feedback */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
          Feedback
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Help us improve. Is this media genuinely authentic or manipulated?
        </p>
        {feedbackGiven ? (
          <div className="flex items-center gap-2 text-sm text-success">
            <ShieldCheck className="h-4 w-4" />
            Thank you! Your feedback ({feedbackGiven}) has been recorded for
            model adaptation.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="cursor-pointer gap-2"
                onClick={() => handleFeedback("real")}
                disabled={feedbackLoading}
              >
                {feedbackLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
                Real / Authentic
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer gap-2"
                onClick={() => handleFeedback("fake")}
                disabled={feedbackLoading}
              >
                {feedbackLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsDown className="h-4 w-4" />
                )}
                Fake / Manipulated
              </Button>
            </div>
            {feedbackError && (
              <p className="text-xs text-destructive">{feedbackError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
