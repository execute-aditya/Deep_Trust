"use client"

import { useCallback, useState } from "react"
import { Upload, FileVideo, FileAudio, Image } from "lucide-react"

interface UploadZoneProps {
  onFileSelect: (file: File) => void
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/40"
      }`}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Upload className="h-7 w-7 text-primary" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        Drop your media file here
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        or click to browse from your device
      </p>

      <div className="mt-6 flex items-center gap-4">
        {[
          { icon: FileVideo, label: "MP4" },
          { icon: FileAudio, label: "MP3/WAV" },
          { icon: Image, label: "PNG/JPEG" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </div>
        ))}
      </div>

      <input
        type="file"
        accept="video/*,audio/*,image/*"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelect(file)
        }}
        aria-label="Upload media file"
      />
    </div>
  )
}
