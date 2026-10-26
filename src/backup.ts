import { isCountryCode } from './countries'
import { PREFECTURE_COUNT } from './prefectures'
import type { PlaceId } from './places'
import {
  DOMESTIC_STORE,
  OVERSEAS_STORE,
  toStored,
  type RecordStore,
  type TripRecord,
} from './records'

// バックアップファイルの形式（将来の形式変更に備えて version を持たせる）
type BackupFile = {
  app: 'trip-record'
  version: 1
  exportedAt: string
  trips: Record<string, unknown>[] // 国内の旅行記録（場所は prefectureIds）
  // 「行ったことがある」の印（この項目がない古いバックアップは印なしとして扱う）
  markedIds?: number[]
  // 海外の旅行記録（場所は countryCodes）と印（これらがない古いバックアップは海外なしとして扱う）
  overseasTrips?: Record<string, unknown>[]
  overseasMarkedIds?: string[]
}

// 画面側とやり取りするバックアップの中身
export type PlaceData<Id extends PlaceId> = { trips: TripRecord<Id>[]; markedIds: Id[] }
export type BackupData = { domestic: PlaceData<number>; overseas: PlaceData<string> }

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

// 記録と印を JSON ファイルとしてダウンロードし、保存日時を返す
export function downloadBackup(data: BackupData): string {
  const now = new Date()
  const file: BackupFile = {
    app: 'trip-record',
    version: 1,
    exportedAt: now.toISOString(),
    trips: data.domestic.trips.map((t) => toStored(t, DOMESTIC_STORE.placeField)),
    markedIds: data.domestic.markedIds,
    overseasTrips: data.overseas.trips.map((t) => toStored(t, OVERSEAS_STORE.placeField)),
    overseasMarkedIds: data.overseas.markedIds,
  }
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trip-record-backup-${dateString(now)}.json`
  a.click()
  URL.revokeObjectURL(url)

  saveLastBackupAt(file.exportedAt)
  return file.exportedAt
}

const isDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

const isPrefectureId = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 1 && (v as number) <= PREFECTURE_COUNT

// 1件分のデータを検証して正しい形に整える（使えないデータなら null）
function toTrip<Id extends PlaceId>(
  v: unknown,
  field: RecordStore['placeField'],
  isValidId: (id: unknown) => id is Id,
): TripRecord<Id> | null {
  if (typeof v !== 'object' || v === null) return null
  const r = v as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id) return null
  const rawIds = r[field]
  if (!Array.isArray(rawIds)) return null
  const placeIds = [...new Set(rawIds.filter(isValidId))]
  if (placeIds.length === 0) return null
  return {
    id: r.id,
    title: typeof r.title === 'string' ? r.title : '',
    startDate: isDate(r.startDate) ? r.startDate : '',
    endDate: isDate(r.endDate) ? r.endDate : '',
    // 並び順は訪れた順として移動距離の計算に使うため、ファイルの順のまま残す
    placeIds,
    memo: typeof r.memo === 'string' ? r.memo : '',
  }
}

// 記録の配列と印の配列を検証する。読み込めなかった記録の件数も返す
function parsePlaceData<Id extends PlaceId>(
  trips: unknown,
  marks: unknown,
  field: RecordStore['placeField'],
  isValidId: (id: unknown) => id is Id,
) {
  const rawTrips = Array.isArray(trips) ? trips : []
  const parsed = rawTrips
    .map((t) => toTrip(t, field, isValidId))
    .filter((t): t is TripRecord<Id> => t !== null)
  const markedIds = Array.isArray(marks) ? [...new Set(marks.filter(isValidId))] : []
  return { data: { trips: parsed, markedIds }, skipped: rawTrips.length - parsed.length }
}

export type ParseResult =
  | { ok: true; data: BackupData; skipped: number }
  | { ok: false; message: string }

// バックアップファイルの中身を読み取る。壊れた記録は読み飛ばし、その件数を返す
export function parseBackup(text: string): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, message: 'ファイルを読み取れませんでした（JSON 形式ではありません）' }
  }
  const file = json as Partial<BackupFile> | null
  if (file?.app !== 'trip-record' || !Array.isArray(file.trips)) {
    return { ok: false, message: 'trip-record のバックアップファイルではありません' }
  }
  if (file.version !== 1) {
    return { ok: false, message: 'このバージョンのバックアップファイルには対応していません' }
  }
  const domestic = parsePlaceData(file.trips, file.markedIds, DOMESTIC_STORE.placeField, isPrefectureId)
  const overseas = parsePlaceData(
    file.overseasTrips,
    file.overseasMarkedIds,
    OVERSEAS_STORE.placeField,
    isCountryCode,
  )
  return {
    ok: true,
    data: { domestic: domestic.data, overseas: overseas.data },
    skipped: domestic.skipped + overseas.skipped,
  }
}
