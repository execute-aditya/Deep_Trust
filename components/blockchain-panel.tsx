"use client"

import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  ShieldX,
  Hash,
  User,
  Calendar,
  Link2,
} from "lucide-react"

interface BlockchainPanelProps {
  data: {
    found: boolean
    hash: string
    originalUploader: string | null
    timestamp: string | null
    chainValid: boolean
  }
}

export function BlockchainPanel({ data }: BlockchainPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        {data.found ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success text-success-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-card-foreground">
                Provenance Verified
              </h4>
              <p className="text-xs text-muted-foreground">
                This content was found in the tamper-proof registry.
              </p>
            </div>
            <Badge className="ml-auto bg-success text-success-foreground">
              Verified
            </Badge>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning text-warning-foreground">
              <ShieldX className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-card-foreground">
                Not Found in Registry
              </h4>
              <p className="text-xs text-muted-foreground">
                No matching content hash exists in the provenance chain.
              </p>
            </div>
            <Badge variant="outline" className="ml-auto">
              Unverified
            </Badge>
          </>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Content Hash</p>
            <p className="truncate font-mono text-sm text-card-foreground">
              {data.hash}
            </p>
          </div>
        </div>

        {data.found && (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Original Uploader
                </p>
                <p className="text-sm text-card-foreground">
                  {data.originalUploader}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Registration Date
                </p>
                <p className="text-sm text-card-foreground">
                  {data.timestamp
                    ? new Date(data.timestamp).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Chain Integrity</p>
                <p className="text-sm text-card-foreground">
                  {data.chainValid
                    ? "All blocks validated - no tampering detected"
                    : "Chain integrity could not be verified"}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
