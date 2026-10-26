import { overseasCatalog } from '../countries'
import { formatKm } from '../distance'
import { labelOf, type PlaceCatalog, type PlaceId } from '../places'
import { domesticCatalog } from '../prefectures'
import { tripTitle, type TripRecord } from '../records'
import { summarizeByYear, type YearTrip } from '../yearly'

type Props = {
  domesticTrips: TripRecord<number>[]
  overseasTrips: TripRecord<string>[]
}

// MM/DD（期間があれば MM/DD〜MM/DD）
function formatDays(trip: { startDate: string; endDate: string }) {
  const md = (d: string) => d.slice(5).replace('-', '/')
  const { startDate, endDate } = trip
  if (!startDate) return `〜${md(endDate)}`
  return endDate && endDate !== startDate ? `${md(startDate)}〜${md(endDate)}` : md(startDate)
}

function placesOf(item: YearTrip) {
  return item.kind === 'domestic'
    ? item.trip.placeIds.map((id) => domesticCatalog.nameOf(id)).join('・')
    : item.trip.placeIds.map((code) => labelOf(overseasCatalog, code)).join('・')
}

type PlaceRowProps<Id extends PlaceId> = {
  label: string
  unit: string
  catalog: PlaceCatalog<Id>
  ids: Id[]
  firstIds: Set<Id>
}

// その年に訪れた場所の一覧（初めて訪れた場所は強調し「初」を付ける）
function PlaceRow<Id extends PlaceId>({ label, unit, catalog, ids, firstIds }: PlaceRowProps<Id>) {
  if (ids.length === 0) return null
  return (
    <div className="year-row">
      <span className="year-row-label">
        {label}
        <span className="year-row-count">
          {ids.length}
          {unit}
        </span>
      </span>
      <ul className="year-places">
        {ids.map((id) => (
          <li key={id} className={firstIds.has(id) ? 'first' : undefined}>
            {labelOf(catalog, id)}
            {firstIds.has(id) && (
              <span className="first-badge" aria-label="初訪問">
                初
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// 年ごとの旅行のまとめ（旅行記録のみが対象）
export function YearView({ domesticTrips, overseasTrips }: Props) {
  const { years, undatedCount } = summarizeByYear(domesticTrips, overseasTrips)

  const undatedNote = undatedCount > 0 && (
    <p className="year-note">日付のない旅行記録 {undatedCount}件は、年ごとのまとめに含まれていません。</p>
  )

  if (years.length === 0) {
    return (
      <section className="year-view">
        <p className="empty">
          日付のある旅行記録がまだありません。国内・海外タブの「旅行を追加」で出発日を入れると、ここに年ごとのまとめが表示されます。
        </p>
        {undatedNote}
      </section>
    )
  }

  return (
    <section className="year-view" aria-label="年ごとのまとめ">
      <p className="year-intro">
        旅行記録のある年：{years.length}年・旅行 {years.reduce((n, y) => n + y.trips.length, 0)}回
        （「行ったことがある」の印は含みません）
      </p>
      {years.map((y) => {
        const domesticCount = y.trips.filter((t) => t.kind === 'domestic').length
        const overseasCount = y.trips.length - domesticCount
        return (
          <article key={y.year} className="year-card">
            <header className="year-head">
              <h2>{y.year}年</h2>
              <span className="year-total">
                旅行 {y.trips.length}回（国内 {domesticCount}・海外 {overseasCount}）
              </span>
            </header>

            <PlaceRow
              label="国内"
              unit="都道府県"
              catalog={domesticCatalog}
              ids={y.domesticIds}
              firstIds={y.firstDomesticIds}
            />
            <PlaceRow
              label="海外"
              unit="か国・地域"
              catalog={overseasCatalog}
              ids={y.overseasIds}
              firstIds={y.firstOverseasIds}
            />
            {y.overseasKm > 0 && (
              <p className="year-distance">海外の移動距離 約{formatKm(y.overseasKm)}</p>
            )}

            <ul className="year-trips">
              {y.trips.map((item) => (
                <li key={item.trip.id}>
                  <span className="year-trip-date">{formatDays(item.trip)}</span>
                  <span className={`kind-badge ${item.kind}`}>
                    {item.kind === 'domestic' ? '国内' : '海外'}
                  </span>
                  <span className="year-trip-title">{tripTitle(item.trip)}</span>
                  <span className="year-trip-places">{placesOf(item)}</span>
                </li>
              ))}
            </ul>
          </article>
        )
      })}
      {undatedNote}
    </section>
  )
}
