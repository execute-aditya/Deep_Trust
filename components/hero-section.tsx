import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 lg:px-8 lg:py-36">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>AI-Powered Media Verification</span>
        </div>

        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Detect deepfakes{" "}
          <span className="text-primary">before they spread</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          Multi-modal deep learning meets blockchain provenance. Verify the
          authenticity of images, videos, and audio with explainable AI and
          forensic-grade evidence trails.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/detect">
            <Button size="lg" className="cursor-pointer gap-2 text-base">
              Start Analyzing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button
              variant="outline"
              size="lg"
              className="cursor-pointer text-base"
            >
              Learn More
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-8">
          {[
            { value: "<1s", label: "Detection Latency" },
            { value: "97.3%", label: "Accuracy Rate" },
            { value: "3", label: "Modal Channels" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-primary md:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
