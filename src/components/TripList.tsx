import { labelOf, type PlaceCatalog, type PlaceId } from '../places'
import { tripTitle, type TripRecord } from '../records'

type Props<Id extends PlaceId> = {
  catalog: PlaceCatalog<Id>
  trips: TripRecord<Id>[]
  emptyMessage: string
  // 記録ごとの補足（海外の移動距離など）。省略時は表示しない
  noteOf?: (trip: TripRecord<Id>) => string
  onEdit: (trip: TripRecord<Id>) => void
  onDelete: (trip: TripRecord<Id>) => void
}

// 日付は任意入力のため、出発日・帰着日のどちらか（または両方）が空の場合がある
function formatPeriod(trip: { startDate: string; endDate: string }) {
  const fmt = (d: string) => d.replaceAll('-', '/')
  const { startDate, endDate } = trip
  if (!startDate && !endDate) return '日付未設定'
  if (!startDate) return `〜 ${fmt(endDate)}`
  return endDate && endDate !== startDate
    ? `${fmt(startDate)} 〜 ${fmt(endDate)}`
    : fmt(startDate)
}

export function TripList<Id extends PlaceId>({
  catalog,
  trips,
  emptyMessage,
  noteOf,
  onEdit,
  onDelete,
}: Props<Id>) {
  if (trips.length === 0) {
    return <p className="empty">{emptyMessage}</p>
  }

  // 新しい旅行が上に来るように並べる（日付のない記録は最後）
  const dateOf = (t: TripRecord<Id>) => t.startDate || t.endDate
  const sorted = [...trips].sort((a, b) => dateOf(b).localeCompare(dateOf(a)))

  return (
    <ul className="trip-list">
      {sorted.map((trip) => (
        <li key={trip.id} className="trip-card">
          <div className="trip-head">
            <h3 className={trip.title ? undefined : 'untitled'}>{tripTitle(trip)}</h3>
            <span className="trip-date">{formatPeriod(trip)}</span>
          </div>
          <p className="trip-prefs">
            {trip.placeIds.map((id) => labelOf(catalog, id)).join('・')}
          </p>
          {noteOf && <p className="trip-note">{noteOf(trip)}</p>}
          {trip.memo && <p className="trip-memo">{trip.memo}</p>}
          <div className="trip-actions">
            <button className="secondary" onClick={() => onEdit(trip)}>
              編集
            </button>
            <button className="danger" onClick={() => onDelete(trip)}>
              削除
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
