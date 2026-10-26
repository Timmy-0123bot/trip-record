import { useEffect, useMemo, useState } from 'react'
import type { PlaceId } from './places'

// 画面内で扱う旅行記録（国内・海外共通。訪れた場所は placeIds）
export type TripRecord<Id extends PlaceId> = {
  id: string
  title: string // 任意（空文字の場合あり）
  startDate: string // YYYY-MM-DD（任意）
  endDate: string // YYYY-MM-DD（任意。日帰りなら空でもよい）
  placeIds: Id[]
  memo: string
}

export type TripValues<Id extends PlaceId> = Omit<TripRecord<Id>, 'id'>

export function tripTitle(trip: { title: string }): string {
  return trip.title || 'タイトルなし'
}

// 保存先の設定。保存時の場所の項目名は、既存データとの互換のため国内と海外で分ける
export type RecordStore = {
  tripsKey: string
  marksKey: string
  placeField: 'prefectureIds' | 'countryCodes'
  // お試しモード用：ここにデータがあれば localStorage を読まず、変更も保存しない
  sample?: { trips: Record<string, unknown>[]; markedIds: PlaceId[] }
}

export const DOMESTIC_STORE: RecordStore = {
  tripsKey: 'trip-record:trips:v1',
  marksKey: 'trip-record:marks:v1',
  placeField: 'prefectureIds',
}

export const OVERSEAS_STORE: RecordStore = {
  tripsKey: 'trip-record:overseas-trips:v1',
  marksKey: 'trip-record:overseas-marks:v1',
  placeField: 'countryCodes',
}

// 保存形式（placeField に場所が入る）と画面内の形式を相互に変換する
export function toStored<Id extends PlaceId>(trip: TripRecord<Id>, field: RecordStore['placeField']) {
  const { placeIds, ...rest } = trip
  return { ...rest, [field]: placeIds }
}

function fromStored<Id extends PlaceId>(
  raw: Record<string, unknown>,
  field: RecordStore['placeField'],
): TripRecord<Id> {
  const { [field]: placeIds, ...rest } = raw
  return { ...(rest as Omit<TripRecord<Id>, 'placeIds'>), placeIds: (placeIds as Id[]) ?? [] }
}

function loadArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function saveArray(key: string, value: unknown[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 保存できない環境（プライベートモード等）では画面上の状態だけ保持する
  }
}

const sortIds = <Id extends PlaceId>(ids: Id[]) =>
  [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

// 現在の記録にバックアップを統合する（同じ id はバックアップで上書き、無いものは追加、既存は消さない）
export function mergeTrips<T extends { id: string }>(current: T[], incoming: T[]) {
  const incomingById = new Map(incoming.map((t) => [t.id, t]))
  const currentIds = new Set(current.map((t) => t.id))
  const added = [...incomingById.values()].filter((t) => !currentIds.has(t.id))
  const merged = [...current.map((t) => incomingById.get(t.id) ?? t), ...added]
  return { merged, added: added.length, updated: incomingById.size - added.length }
}

export type ImportResult = { added: number; updated: number; addedMarks: number }

// 旅行記録・「行ったことがある」の印と、訪問済みの場所の集計を扱うフック（localStorage に保存）
export function usePlaceRecords<Id extends PlaceId>(store: RecordStore) {
  const [trips, setTrips] = useState<TripRecord<Id>[]>(() =>
    (store.sample?.trips ?? loadArray<Record<string, unknown>>(store.tripsKey)).map((raw) =>
      fromStored<Id>(raw, store.placeField),
    ),
  )
  const [markedIds, setMarkedIds] = useState<Id[]>(
    () => (store.sample?.markedIds as Id[] | undefined) ?? loadArray(store.marksKey),
  )

  useEffect(() => {
    if (store.sample) return
    saveArray(
      store.tripsKey,
      trips.map((t) => toStored(t, store.placeField)),
    )
  }, [trips, store])

  useEffect(() => {
    if (store.sample) return
    saveArray(store.marksKey, markedIds)
  }, [markedIds, store])

  // 旅行記録に含まれる場所
  const tripPlaceIds = useMemo(() => new Set(trips.flatMap((t) => t.placeIds)), [trips])

  // 訪問済み = 旅行記録のある場所 + 印を付けた場所
  const visitedIds = useMemo(
    () => new Set([...tripPlaceIds, ...markedIds]),
    [tripPlaceIds, markedIds],
  )

  const addTrip = (values: TripValues<Id>) =>
    setTrips((prev) => [...prev, { ...values, id: crypto.randomUUID() }])

  const updateTrip = (id: string, values: TripValues<Id>) =>
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...values, id } : t)))

  const deleteTrip = (id: string) => setTrips((prev) => prev.filter((t) => t.id !== id))

  const toggleMark = (id: Id) =>
    setMarkedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : sortIds([...prev, id]),
    )

  // バックアップから読み込んだ記録と印を統合し、追加・上書きした件数を返す
  const importData = (incoming: { trips: TripRecord<Id>[]; markedIds: Id[] }): ImportResult => {
    const { merged, added, updated } = mergeTrips(trips, incoming.trips)
    const newMarks = incoming.markedIds.filter((id) => !markedIds.includes(id))
    setTrips(merged)
    setMarkedIds(sortIds([...markedIds, ...newMarks]))
    return { added, updated, addedMarks: newMarks.length }
  }

  return {
    trips,
    markedIds,
    tripPlaceIds,
    visitedIds,
    addTrip,
    updateTrip,
    deleteTrip,
    toggleMark,
    importData,
  }
}

export type PlaceRecords<Id extends PlaceId> = ReturnType<typeof usePlaceRecords<Id>>
