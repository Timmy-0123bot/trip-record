import { useEffect, useMemo, useState } from 'react'
import { mergeTrips } from './backup'

export type Trip = {
  id: string
  title: string // 任意（空文字の場合あり）
  startDate: string // YYYY-MM-DD（任意）
  endDate: string // YYYY-MM-DD（任意。日帰りなら空でもよい）
  prefectureIds: number[]
  memo: string
}

export type TripInput = Omit<Trip, 'id'>

export function tripTitle(trip: Trip): string {
  return trip.title || 'タイトルなし'
}

const TRIPS_KEY = 'trip-record:trips:v1'
// 旅行記録はないが「行ったことがある」と印を付けた都道府県
const MARKS_KEY = 'trip-record:marks:v1'

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

// 旅行記録・訪問の印と、訪問済み都道府県の集計を扱うフック（データは localStorage に保存）
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>(() => loadArray(TRIPS_KEY))
  const [markedIds, setMarkedIds] = useState<number[]>(() => loadArray(MARKS_KEY))

  useEffect(() => {
    saveArray(TRIPS_KEY, trips)
  }, [trips])

  useEffect(() => {
    saveArray(MARKS_KEY, markedIds)
  }, [markedIds])

  // 旅行記録に含まれる都道府県
  const tripPrefectureIds = useMemo(
    () => new Set(trips.flatMap((t) => t.prefectureIds)),
    [trips],
  )

  // 訪問済み = 旅行記録のある都道府県 + 印を付けた都道府県
  const visitedIds = useMemo(
    () => new Set([...tripPrefectureIds, ...markedIds]),
    [tripPrefectureIds, markedIds],
  )

  const addTrip = (input: TripInput) =>
    setTrips((prev) => [...prev, { ...input, id: crypto.randomUUID() }])

  const updateTrip = (id: string, input: TripInput) =>
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...input, id } : t)))

  const deleteTrip = (id: string) =>
    setTrips((prev) => prev.filter((t) => t.id !== id))

  const toggleMark = (id: number) =>
    setMarkedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id].sort((a, b) => a - b),
    )

  // バックアップから読み込んだ記録と印を統合し、追加・上書きした件数を返す
  const importData = (incoming: { trips: Trip[]; markedIds: number[] }) => {
    const { merged, added, updated } = mergeTrips(trips, incoming.trips)
    const newMarks = incoming.markedIds.filter((id) => !markedIds.includes(id))
    setTrips(merged)
    setMarkedIds([...markedIds, ...newMarks].sort((a, b) => a - b))
    return { added, updated, addedMarks: newMarks.length }
  }

  return {
    trips,
    markedIds,
    tripPrefectureIds,
    visitedIds,
    addTrip,
    updateTrip,
    deleteTrip,
    toggleMark,
    importData,
  }
}
