import crypto from "crypto"

/** Maximum upload size: 100 MB */
export const MAX_FILE_SIZE = 100 * 1024 * 1024

/** Allowed MIME type prefixes */
export const ALLOWED_TYPES = ["image/", "video/", "audio/"]

export function isAllowedType(mimeType: string): boolean {
    return ALLOWED_TYPES.some((prefix) => mimeType.startsWith(prefix))
}

export function computeHash(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex")
}

export function generateId(): string {
    return crypto.randomUUID()
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getMediaCategory(
    mimeType: string
): "image" | "video" | "audio" | "unknown" {
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType.startsWith("video/")) return "video"
    if (mimeType.startsWith("audio/")) return "audio"
    return "unknown"
}
