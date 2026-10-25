import { PREFECTURE_COUNT } from './prefectures'
import type { Trip } from './useTrips'

// バックアップファイルの形式（将来の形式変更に備えて version を持たせる）
type BackupFile = {
  app: 'trip-record'
  version: 1
  exportedAt: string
  trips: Trip[]
}

const LAST_BACKUP_KEY = 'trip-record:lastBackupAt'

export function loadLastBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

function saveLastBackupAt(iso: string) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, iso)
  } catch {
    // 保存できなくてもバックアップ自体は完了しているので無視する
  }
}

function dateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// 記録を JSON ファイルとしてダウンロードし、保存日時を返す
export function downloadBackup(trips: Trip[]): string {
  const now = new Date()
  const data: BackupFile = {
    app: 'trip-record',
    version: 1,
    exportedAt: now.toISOString(),
    trips,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trip-record-backup-${dateString(now)}.json`
  a.click()
  URL.revokeObjectURL(url)

  saveLastBackupAt(data.exportedAt)
  return data.exportedAt
}

const isDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

const isPrefectureId = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 1 && (v as number) <= PREFECTURE_COUNT

// 1件分のデータを検証して正しい形に整える（使えないデータなら null）
function toTrip(v: unknown): Trip | null {
  if (typeof v !== 'object' || v === null) return null
  const r = v as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id) return null
  if (!Array.isArray(r.prefectureIds)) return null
  const prefectureIds = [...new Set(r.prefectureIds.filter(isPrefectureId))]
  if (prefectureIds.length === 0) return null
  return {
    id: r.id,
    title: typeof r.title === 'string' ? r.title : '',
    startDate: isDate(r.startDate) ? r.startDate : '',
    endDate: isDate(r.endDate) ? r.endDate : '',
    prefectureIds: prefectureIds.sort((a, b) => a - b),
    memo: typeof r.memo === 'string' ? r.memo : '',
  }
}

export type ParseResult =
  | { ok: true; trips: Trip[]; skipped: number }
  | { ok: false; message: string }

// バックアップファイルの中身を読み取る。壊れた記録は読み飛ばし、その件数を返す
export function parseBackup(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, message: 'ファイルを読み取れませんでした（JSON 形式ではありません）' }
  }
  const file = data as Partial<BackupFile> | null
  if (file?.app !== 'trip-record' || !Array.isArray(file.trips)) {
    return { ok: false, message: 'trip-record のバックアップファイルではありません' }
  }
  if (file.version !== 1) {
    return { ok: false, message: 'このバージョンのバックアップファイルには対応していません' }
  }
  const trips = file.trips.map(toTrip).filter((t): t is Trip => t !== null)
  return { ok: true, trips, skipped: file.trips.length - trips.length }
}

// 現在の記録にバックアップを統合する（同じ id はバックアップで上書き、無いものは追加、既存は消さない）
export function mergeTrips(current: Trip[], incoming: Trip[]) {
  const incomingById = new Map(incoming.map((t) => [t.id, t]))
  const currentIds = new Set(current.map((t) => t.id))
  const added = [...incomingById.values()].filter((t) => !currentIds.has(t.id))
  const merged = [...current.map((t) => incomingById.get(t.id) ?? t), ...added]
  return { merged, added: added.length, updated: incomingById.size - added.length }
}
