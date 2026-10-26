import { findCountry } from './countries'
import type { TripRecord } from './records'

// 移動距離の計算（目安）
// - 出発地・帰着地は東京（東京駅付近）
// - 1回の旅行は「東京 → 訪れた国の代表地点（入力順）→ 東京」の大圏距離（地球表面に沿った最短距離）の合計
// - 「行ったことがある」の印だけの国は、東京からの1往復として数える

type LatLon = { lat: number; lon: number }

const TOKYO: LatLon = { lat: 35.68, lon: 139.77 }
const EARTH_RADIUS_KM = 6371
export const EARTH_CIRCUMFERENCE_KM = 40075

const rad = (deg: number) => (deg * Math.PI) / 180

// 2地点間の大圏距離（ハバーサインの公式）
function greatCircleKm(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

function routeKm(points: LatLon[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) total += greatCircleKm(points[i - 1], points[i])
  return total
}

function locationsOf(codes: string[]): LatLon[] {
  return codes.map(findCountry).filter((c): c is NonNullable<typeof c> => !!c)
}

// 1回の旅行の移動距離
export function tripDistanceKm(trip: TripRecord<string>): number {
  const stops = locationsOf(trip.placeIds)
  if (stops.length === 0) return 0
  return routeKm([TOKYO, ...stops, TOKYO])
}

// 海外の総移動距離（旅行記録 + 旅行記録のない「行ったことがある」の国の往復）
export function totalDistanceKm(trips: TripRecord<string>[], markedIds: string[]): number {
  const tripTotal = trips.reduce((sum, t) => sum + tripDistanceKm(t), 0)
  const inTrips = new Set(trips.flatMap((t) => t.placeIds))
  const markOnly = locationsOf(markedIds.filter((code) => !inTrips.has(code)))
  const markTotal = markOnly.reduce((sum, p) => sum + 2 * greatCircleKm(TOKYO, p), 0)
  return tripTotal + markTotal
}

export function formatKm(km: number): string {
  return `${Math.round(km).toLocaleString('ja-JP')} km`
}
