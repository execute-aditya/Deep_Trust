import {
  Eye,
  AudioLines,
  Link2,
  Brain,
  Zap,
  MessageSquareText,
} from "lucide-react"

const features = [
  {
    icon: Eye,
    title: "Visual Artifact Detection",
    description:
      "EfficientNet-B4 fine-tuned model analyzes frame-level artifacts and facial mesh inconsistencies with pixel-level precision.",
  },
  {
    icon: AudioLines,
    title: "Audio Forensics",
    description:
      "Multi-level discrete wavelet transform with SE-ResNet identifies synthetic speech patterns and spectral anomalies.",
  },
  {
    icon: Link2,
    title: "Cross-Modal Fusion",
    description:
      "OSCA + Graph Attention Networks detect lip-sync misalignments by fusing audio-visual streams in real time.",
  },
  {
    icon: MessageSquareText,
    title: "Explainable Results",
    description:
      "Heatmaps, correlation plots, and natural-language summaries show exactly where and why manipulation is detected.",
  },
  {
    icon: Brain,
    title: "Continuous Adaptation",
    description:
      "Human feedback drives incremental fine-tuning via replay buffers and elastic weight consolidation.",
  },
  {
    icon: Zap,
    title: "Real-Time Performance",
    description:
      "Optimized inference pipeline delivers sub-second latency on short clips, even on CPU-only deployments.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Core Capabilities
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Multi-modal detection pipeline
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Six interconnected modules working together to verify media
            authenticity across every dimension.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-secondary/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
