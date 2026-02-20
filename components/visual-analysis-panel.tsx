"use client"

import { Progress } from "@/components/ui/progress"

interface VisualAnalysisPanelProps {
  data: {
    score: number
    artifacts: { region: string; severity: number }[]
    heatmapData: number[][]
  }
}

function getHeatColor(value: number): string {
  if (value < 0.2) return "bg-primary/10"
  if (value < 0.4) return "bg-primary/25"
  if (value < 0.6) return "bg-warning/40"
  if (value < 0.8) return "bg-warning/70"
  return "bg-destructive/70"
}

export function VisualAnalysisPanel({ data }: VisualAnalysisPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Heatmap */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h4 className="mb-4 text-sm font-semibold text-card-foreground">
          Artifact Heatmap
        </h4>
        <div className="aspect-video overflow-hidden rounded-lg border border-border bg-secondary/30">
          <div className="grid h-full w-full grid-cols-12 grid-rows-8">
            {data.heatmapData.flatMap((row, ri) =>
              row.map((val, ci) => (
                <div
                  key={`${ri}-${ci}`}
                  className={`${getHeatColor(val)} transition-colors`}
                  title={`Intensity: ${(val * 100).toFixed(0)}%`}
                />
              ))
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Low anomaly</span>
          <div className="flex gap-1">
            <div className="h-3 w-6 rounded-sm bg-primary/10" />
            <div className="h-3 w-6 rounded-sm bg-primary/25" />
            <div className="h-3 w-6 rounded-sm bg-warning/40" />
            <div className="h-3 w-6 rounded-sm bg-warning/70" />
            <div className="h-3 w-6 rounded-sm bg-destructive/70" />
          </div>
          <span>High anomaly</span>
        </div>
      </div>

      {/* Artifact details */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h4 className="mb-4 text-sm font-semibold text-card-foreground">
          Detection Score & Artifacts
        </h4>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Visual Manipulation Score</span>
            <span className="font-mono">
              {(data.score * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={data.score * 100} className="h-2" />
        </div>

        {data.artifacts.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Detected Artifacts
            </p>
            {data.artifacts.map((a) => (
              <div
                key={a.region}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3"
              >
                <span className="text-sm text-card-foreground">
                  {a.region}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-destructive/70 transition-all"
                      style={{ width: `${a.severity * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {(a.severity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No significant visual artifacts detected.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
