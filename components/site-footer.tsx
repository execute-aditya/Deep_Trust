import { Shield } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-4 py-10 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            DeepTrust
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Prototype demo. Simulated analysis results for demonstration purposes.
        </p>
      </div>
    </footer>
  )
}
