import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const DB_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DB_DIR, "deeptrust.db")

let _db: Database.Database | null = null

function getDb(): Database.Database {
    if (_db) return _db

    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true })
    }

    _db = new Database(DB_PATH)
    _db.pragma("journal_mode = WAL")
    _db.pragma("foreign_keys = ON")

    _db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      verdict TEXT NOT NULL,
      confidence REAL NOT NULL,
      result_json TEXT NOT NULL,
      feedback TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

    return _db
}

export interface AnalysisRecord {
    id: string
    filename: string
    file_hash: string
    file_type: string
    file_size: number
    verdict: string
    confidence: number
    result_json: string
    feedback: string | null
    created_at: string
}

export function insertAnalysis(record: Omit<AnalysisRecord, "created_at">): void {
    const db = getDb()
    const stmt = db.prepare(`
    INSERT INTO analyses (id, filename, file_hash, file_type, file_size, verdict, confidence, result_json, feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    stmt.run(
        record.id,
        record.filename,
        record.file_hash,
        record.file_type,
        record.file_size,
        record.verdict,
        record.confidence,
        record.result_json,
        record.feedback ?? null
    )
}

export function getAnalysis(id: string): AnalysisRecord | undefined {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM analyses WHERE id = ?")
    return stmt.get(id) as AnalysisRecord | undefined
}

export function updateFeedback(id: string, feedback: string): boolean {
    const db = getDb()
    const stmt = db.prepare("UPDATE analyses SET feedback = ? WHERE id = ?")
    const result = stmt.run(feedback, id)
    return result.changes > 0
}

export function getHistory(limit = 50, offset = 0): AnalysisRecord[] {
    const db = getDb()
    const stmt = db.prepare(
        "SELECT * FROM analyses ORDER BY created_at DESC LIMIT ? OFFSET ?"
    )
    return stmt.all(limit, offset) as AnalysisRecord[]
}

export function getHistoryCount(): number {
    const db = getDb()
    const stmt = db.prepare("SELECT COUNT(*) as count FROM analyses")
    const row = stmt.get() as { count: number }
    return row.count
}

export function deleteAnalysis(id: string): boolean {
    const db = getDb()
    const stmt = db.prepare("DELETE FROM analyses WHERE id = ?")
    const result = stmt.run(id)
    return result.changes > 0
}
