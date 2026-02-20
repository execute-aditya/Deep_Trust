"use client"

import { useState, useEffect, useCallback } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import type { AnalysisResult } from "@/lib/mock-analysis"
import { ResultsDashboard } from "@/components/results-dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ShieldCheck,
    ShieldAlert,
    ShieldQuestion,
    Trash2,
    Eye,
    ArrowLeft,
    RefreshCw,
    Clock,
    FileText,
    Loader2,
} from "lucide-react"

interface HistoryItem {
    id: string
    filename: string
    file_type: string
    file_size: number
    verdict: string
    confidence: number
    feedback: string | null
    created_at: string
    result: AnalysisResult
}

export default function HistoryPage() {
    const [items, setItems] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchHistory = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const response = await fetch("/api/history")
            if (!response.ok) throw new Error("Failed to fetch history")
            const data = await response.json()
            setItems(data.items)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load history")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const response = await fetch(`/api/history?id=${id}`, { method: "DELETE" })
            if (!response.ok) throw new Error("Failed to delete")
            setItems((prev) => prev.filter((item) => item.id !== id))
            if (selectedItem?.id === id) setSelectedItem(null)
        } catch (err) {
            console.error("Delete error:", err)
        } finally {
            setDeletingId(null)
        }
    }

    const verdictConfig: Record<
        string,
        { icon: typeof ShieldCheck; label: string; className: string }
    > = {
        authentic: {
            icon: ShieldCheck,
            label: "Authentic",
            className: "bg-success/10 text-success",
        },
        manipulated: {
            icon: ShieldAlert,
            label: "Manipulated",
            className: "bg-destructive/10 text-destructive",
        },
        suspicious: {
            icon: ShieldQuestion,
            label: "Suspicious",
            className: "bg-warning/10 text-warning",
        },
    }

    if (selectedItem) {
        return (
            <div className="min-h-screen bg-background">
                <SiteHeader />
                <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="mb-6 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to History
                    </button>
                    <ResultsDashboard
                        result={selectedItem.result}
                        fileName={selectedItem.filename}
                        analysisId={selectedItem.id}
                        onReset={() => setSelectedItem(null)}
                    />
                </main>
                <SiteFooter />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <SiteHeader />
            <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Analysis History
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Browse and review past deepfake analyses.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchHistory}
                        disabled={loading}
                        className="cursor-pointer gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {loading && items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading history...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <p className="text-sm text-destructive">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchHistory}
                            className="mt-4 cursor-pointer"
                        >
                            Retry
                        </Button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                            No analyses yet
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Upload a file on the{" "}
                            <a href="/detect" className="text-primary hover:underline">
                                detection page
                            </a>{" "}
                            to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => {
                            const vc = verdictConfig[item.verdict] || verdictConfig.suspicious
                            const VerdictIcon = vc.icon

                            return (
                                <div
                                    key={item.id}
                                    className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${vc.className}`}
                                    >
                                        <VerdictIcon className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm font-semibold text-card-foreground">
                                                {item.filename}
                                            </span>
                                            <Badge variant="outline" className="shrink-0 text-xs">
                                                {vc.label}
                                            </Badge>
                                            {item.feedback && (
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 text-xs border-primary/30 text-primary"
                                                >
                                                    Feedback: {item.feedback}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(item.created_at).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                            <span>
                                                {(item.confidence * 100).toFixed(1)}% confidence
                                            </span>
                                            <span>
                                                {(item.file_size / 1024 / 1024).toFixed(1)} MB
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer gap-1.5"
                                            onClick={() => setSelectedItem(item)}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="cursor-pointer text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deletingId === item.id}
                                        >
                                            {deletingId === item.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
            <SiteFooter />
        </div>
    )
}
