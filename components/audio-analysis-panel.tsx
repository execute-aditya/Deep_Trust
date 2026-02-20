"use client"

import { Progress } from "@/components/ui/progress"

interface AudioAnalysisPanelProps {
  data: {
    score: number
    spectralAnomaly: number
    waveformData: number[]
  }
}

export function AudioAnalysisPanel({ data }: AudioAnalysisPanelProps) {
  const maxVal = Math.max(...data.waveformData, 0.01)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Waveform */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h4 className="mb-4 text-sm font-semibold text-card-foreground">
          Audio Waveform
        </h4>
        <div className="flex h-40 items-end gap-[2px] rounded-lg border border-border bg-secondary/30 p-3">
          {data.waveformData.map((val, i) => {
            const height = (val / maxVal) * 100
            const isAnomaly = i > 35 && i < 42
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-colors ${
                  isAnomaly ? "bg-destructive/70" : "bg-primary/60"
                }`}
                style={{ height: `${Math.max(4, height)}%` }}
                title={`Sample ${i}: ${val.toFixed(3)}${isAnomaly ? " (anomaly)" : ""}`}
              />
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>0s</span>
          <span className="text-destructive">Anomaly region highlighted</span>
          <span>30s</span>
        </div>
      </div>

      {/* Scores */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h4 className="mb-4 text-sm font-semibold text-card-foreground">
          Audio Forensics Scores
        </h4>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Synthetic Voice Score</span>
              <span className="font-mono">
                {(data.score * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={data.score * 100} className="h-2" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Spectral Anomaly Index</span>
              <span className="font-mono">
                {(data.spectralAnomaly * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={data.spectralAnomaly * 100} className="h-2" />
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Analysis Method
            </p>
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">
              9-level Multi-resolution Discrete Wavelet Transform (MDWT) with
              Squeeze-and-Excitation ResNet blocks. Spectral coefficients
              analyzed across sub-bands for synthetic speech markers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
