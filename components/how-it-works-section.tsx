import { Upload, Cpu, FileCheck, MessageCircle } from "lucide-react"

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Media",
    description:
      "Drag and drop an image, video, or audio file. Supported formats include MP4, MP3, WAV, PNG, and JPEG.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Analysis",
    description:
      "Our multi-modal pipeline checks blockchain provenance, runs visual and audio detectors, and performs cross-modal fusion.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Review Results",
    description:
      "Receive a detailed verdict with confidence scores, heatmaps, waveform analysis, and natural-language explanations.",
  },
  {
    icon: MessageCircle,
    step: "04",
    title: "Provide Feedback",
    description:
      "Flag uncertain results as real or fake to help the system learn and continuously improve detection accuracy.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Workflow
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
            How it works
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="relative text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-mono font-bold text-primary">
                {s.step}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
