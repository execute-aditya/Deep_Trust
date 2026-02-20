"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Shield, Eye, AudioLines, Link2, Brain } from "lucide-react"

const stages = [
  { icon: Shield, label: "Checking blockchain provenance...", duration: 800 },
  { icon: Eye, label: "Running visual detector...", duration: 1200 },
  { icon: AudioLines, label: "Analyzing audio stream...", duration: 1000 },
  { icon: Link2, label: "Cross-modal fusion...", duration: 900 },
  { icon: Brain, label: "Generating explanations...", duration: 600 },
]

export function AnalysisProgress() {
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalDuration = stages.reduce((sum, s) => sum + s.duration, 0)
    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += 50
      const pct = Math.min(100, (elapsed / totalDuration) * 100)
      setProgress(pct)

      let accum = 0
      for (let i = 0; i < stages.length; i++) {
        accum += stages[i].duration
        if (elapsed < accum) {
          setCurrentStage(i)
          break
        }
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const CurrentIcon = stages[currentStage]?.icon ?? Shield

  return (
    <div className="mx-auto max-w-md space-y-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <CurrentIcon className="h-7 w-7 animate-pulse text-primary" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Analyzing media...
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {stages[currentStage]?.label}
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex justify-center gap-3">
        {stages.map((stage, i) => (
          <div
            key={stage.label}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              i < currentStage
                ? "bg-primary text-primary-foreground"
                : i === currentStage
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            <stage.icon className="h-3.5 w-3.5" />
          </div>
        ))}
      </div>
    </div>
  )
}
