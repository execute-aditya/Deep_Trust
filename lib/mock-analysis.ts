export interface AnalysisResult {
  verdict: "authentic" | "manipulated" | "suspicious"
  confidence: number
  visual: {
    score: number
    artifacts: { region: string; severity: number }[]
    heatmapData: number[][]
  }
  audio: {
    score: number
    spectralAnomaly: number
    waveformData: number[]
  }
  crossModal: {
    syncScore: number
    correlationData: { time: number; visual: number; audio: number }[]
  }
  blockchain: {
    found: boolean
    hash: string
    originalUploader: string | null
    timestamp: string | null
    chainValid: boolean
  }
  explanation: string
  processingTime: number
}

function generateHeatmap(): number[][] {
  const rows = 8
  const cols = 12
  const data: number[][] = []
  for (let i = 0; i < rows; i++) {
    const row: number[] = []
    for (let j = 0; j < cols; j++) {
      // Create some hot spots
      const cx = 6
      const cy = 3
      const dist = Math.sqrt((j - cx) ** 2 + (i - cy) ** 2)
      const base = Math.max(0, 1 - dist / 5) * 0.7
      row.push(Math.min(1, base + Math.random() * 0.3))
    }
    data.push(row)
  }
  return data
}

function generateWaveform(): number[] {
  const points = 60
  const data: number[] = []
  for (let i = 0; i < points; i++) {
    const base = Math.sin(i * 0.3) * 0.4
    const noise = (Math.random() - 0.5) * 0.3
    // Add a spike for anomaly
    const spike = i > 35 && i < 42 ? 0.3 : 0
    data.push(Math.abs(base + noise + spike))
  }
  return data
}

function generateCorrelation(): { time: number; visual: number; audio: number }[] {
  const data: { time: number; visual: number; audio: number }[] = []
  for (let t = 0; t < 30; t++) {
    const visual = 0.5 + Math.sin(t * 0.2) * 0.3 + (Math.random() - 0.5) * 0.1
    const audioOffset = t > 15 ? 0.15 : 0
    const audio =
      0.5 +
      Math.sin(t * 0.2 + audioOffset) * 0.3 +
      (Math.random() - 0.5) * 0.1
    data.push({
      time: t,
      visual: Math.max(0, Math.min(1, visual)),
      audio: Math.max(0, Math.min(1, audio)),
    })
  }
  return data
}

export function runMockAnalysis(file: File): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    const delay = 1500 + Math.random() * 2000

    const isVideo = file.type.startsWith("video/")
    const isAudio = file.type.startsWith("audio/")
    const isImage = file.type.startsWith("image/")

    // Simulate different verdicts based on file name or random
    const seed = file.name.length % 3
    const verdict: AnalysisResult["verdict"] =
      seed === 0 ? "authentic" : seed === 1 ? "manipulated" : "suspicious"

    const confidence =
      verdict === "authentic"
        ? 0.85 + Math.random() * 0.12
        : verdict === "manipulated"
          ? 0.75 + Math.random() * 0.2
          : 0.45 + Math.random() * 0.2

    const visualScore =
      verdict === "authentic"
        ? 0.1 + Math.random() * 0.15
        : 0.6 + Math.random() * 0.35

    const audioScore =
      verdict === "authentic"
        ? 0.08 + Math.random() * 0.12
        : 0.5 + Math.random() * 0.4

    const syncScore =
      verdict === "authentic"
        ? 0.88 + Math.random() * 0.1
        : 0.3 + Math.random() * 0.35

    const explanations = {
      authentic:
        "No significant manipulation artifacts detected. Visual analysis shows consistent facial geometry and lighting. Audio spectrogram exhibits natural harmonic patterns. Cross-modal synchronization is within expected parameters.",
      manipulated:
        "Multiple manipulation indicators detected. The facial region around the jawline shows inconsistent texture patterns (GAN artifacts). Audio spectral analysis reveals synthetic voice markers at 2.4-3.1 kHz. Lip-sync offset of 120ms detected between frames 450-720.",
      suspicious:
        "Some anomalies detected but below definitive threshold. Minor texture inconsistencies near facial boundaries may indicate re-encoding or light editing. Audio quality is degraded in segments 8-12s. Further human review recommended.",
    }

    resolve({
      verdict,
      confidence,
      visual: {
        score: visualScore,
        artifacts:
          verdict !== "authentic"
            ? [
                { region: "Jawline / Lower face", severity: 0.78 },
                { region: "Eye reflection", severity: 0.45 },
                { region: "Hair boundary", severity: 0.32 },
              ]
            : [],
        heatmapData: generateHeatmap(),
      },
      audio: {
        score: audioScore,
        spectralAnomaly:
          verdict !== "authentic"
            ? 0.6 + Math.random() * 0.3
            : 0.05 + Math.random() * 0.1,
        waveformData: generateWaveform(),
      },
      crossModal: {
        syncScore,
        correlationData: generateCorrelation(),
      },
      blockchain: {
        found: verdict === "authentic",
        hash: `sha256:${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        originalUploader: verdict === "authentic" ? "AP News Agency" : null,
        timestamp:
          verdict === "authentic" ? "2025-11-15T14:32:00Z" : null,
        chainValid: verdict === "authentic",
      },
      explanation: explanations[verdict],
      processingTime: delay,
    })
  })
}
