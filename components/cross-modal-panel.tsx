"use client"

import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface CrossModalPanelProps {
  data: {
    syncScore: number
    correlationData: { time: number; visual: number; audio: number }[]
  }
}

export function CrossModalPanel({ data }: CrossModalPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Correlation chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h4 className="mb-4 text-sm font-semibold text-card-foreground">
          Audio-Visual Correlation
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.correlationData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis
                dataKey="time"
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                label={{
                  value: "Time (s)",
                  position: "insideBottom",
                  offset: -5,
                  style: {
                    fill: "var(--color-muted-foreground)",
                    fontSize: 10,
                  },
                }}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                tickLine={false}
                domain={[0, 1]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: 12,
                  color: "var(--color-foreground)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="visual"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
                name="Visual Signal"
              />
              <Line
                type="monotone"
                dataKey="audio"
                stroke="var(--color-chart-5)"
                strokeWidth={2}
                dot={false}
                name="Audio Signal"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sync score */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h4 className="mb-4 text-sm font-semibold text-card-foreground">
          Synchronization Analysis
        </h4>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Lip-Sync Score</span>
              <span className="font-mono">
                {(data.syncScore * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={data.syncScore * 100} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {data.syncScore > 0.7
                ? "Audio and visual streams are well-synchronized."
                : "Significant desynchronization detected between audio and visual streams."}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Fusion Method
            </p>
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">
              Offset-Shifted Cross-Attention (OSCA) aligns temporal features
              from both modalities. Graph Attention Networks model inter-modal
              relationships for robust sync detection.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <div className="text-lg font-bold text-primary font-mono">
                {data.syncScore > 0.7 ? "< 40ms" : "~120ms"}
              </div>
              <div className="text-xs text-muted-foreground">Avg. Offset</div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <div className="text-lg font-bold text-primary font-mono">
                {data.correlationData.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Frames Analyzed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
