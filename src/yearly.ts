import { tripDistanceKm } from './distance'
import type { TripRecord } from './records'

// 旅行記録を年ごとにまとめる（「行ったことがある」の印は日付がないため対象外）
// - 旅行の年は出発日の年（出発日がなければ帰着日の年）。年をまたぐ旅行は出発した年に数える
// - 「初訪問」は、日付のある旅行記録を古い順にたどって初めて出てきた場所

export type YearTrip =
  | { kind: 'domestic'; date: string; trip: TripRecord<number> }
  | { kind: 'overseas'; date: string; trip: TripRecord<string> }

export type YearSummary = {
  year: number
  trips: YearTrip[] // 日付の古い順
  domesticIds: number[] // その年に訪れた都道府県（重複なし、訪れた順）
  overseasIds: string[] // その年に訪れた国・地域（重複なし、訪れた順）
  firstDomesticIds: Set<number> // その年に初めて訪れた都道府県
  firstOverseasIds: Set<string> // その年に初めて訪れた国・地域
  overseasKm: number // その年の海外の移動距離
}

const dateOf = (trip: { startDate: string; endDate: string }) => trip.startDate || trip.endDate

export function summarizeByYear(
  domesticTrips: TripRecord<number>[],
  overseasTrips: TripRecord<string>[],
): { years: YearSummary[]; undatedCount: number } {
  const dated: YearTrip[] = [
    ...domesticTrips.map((trip) => ({ kind: 'domestic' as const, date: dateOf(trip), trip })),
    ...overseasTrips.map((trip) => ({ kind: 'overseas' as const, date: dateOf(trip), trip })),
  ]
    .filter((t) => t.date)
    .sort((a, b) => a.date.localeCompare(b.date))

  const undatedCount = domesticTrips.length + overseasTrips.length - dated.length
  const byYear = new Map<number, YearSummary>()
  const seenDomestic = new Set<number>()
  const seenOverseas = new Set<string>()

  for (const item of dated) {
    const year = Number(item.date.slice(0, 4))
    let summary = byYear.get(year)
    if (!summary) {
      summary = {
        year,
        trips: [],
        domesticIds: [],
        overseasIds: [],
        firstDomesticIds: new Set(),
        firstOverseasIds: new Set(),
        overseasKm: 0,
      }
      byYear.set(year, summary)
    }
    summary.trips.push(item)

    if (item.kind === 'domestic') {
      for (const id of item.trip.placeIds) {
        if (!summary.domesticIds.includes(id)) summary.domesticIds.push(id)
        if (!seenDomestic.has(id)) {
          seenDomestic.add(id)
          summary.firstDomesticIds.add(id)
        }
      }
    } else {
      for (const code of item.trip.placeIds) {
        if (!summary.overseasIds.includes(code)) summary.overseasIds.push(code)
        if (!seenOverseas.has(code)) {
          seenOverseas.add(code)
          summary.firstOverseasIds.add(code)
        }
      }
      summary.overseasKm += tripDistanceKm(item.trip)
    }
  }

  // 新しい年が上に来るように並べる
  const years = [...byYear.values()].sort((a, b) => b.year - a.year)
  return { years, undatedCount }
}
