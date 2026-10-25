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

const STORAGE_KEY = 'trip-record:trips:v1'

function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Trip[]) : []
  } catch {
    return []
  }
}

function saveTrips(trips: Trip[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  } catch {
    // 保存できない環境（プライベートモード等）では画面上の状態だけ保持する
  }
}

// 旅行記録の一覧と、訪問済み都道府県の集計を扱うフック（データは localStorage に保存）
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>(loadTrips)

  useEffect(() => {
    saveTrips(trips)
  }, [trips])

  const visitedIds = useMemo(
    () => new Set(trips.flatMap((t) => t.prefectureIds)),
    [trips],
  )

  const addTrip = (input: TripInput) =>
    setTrips((prev) => [...prev, { ...input, id: crypto.randomUUID() }])

  const updateTrip = (id: string, input: TripInput) =>
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...input, id } : t)))

  const deleteTrip = (id: string) =>
    setTrips((prev) => prev.filter((t) => t.id !== id))

  // バックアップから読み込んだ記録を統合し、追加・上書きした件数を返す
  const importTrips = (incoming: Trip[]) => {
    const { merged, added, updated } = mergeTrips(trips, incoming)
    setTrips(merged)
    return { added, updated }
  }

  return { trips, visitedIds, addTrip, updateTrip, deleteTrip, importTrips }
}
