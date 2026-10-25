import { prefectureName } from '../prefectures'
import { tripTitle, type Trip } from '../useTrips'

type Props = {
  trips: Trip[]
  emptyMessage: string
  onEdit: (trip: Trip) => void
  onDelete: (trip: Trip) => void
}

// 日付は任意入力のため、出発日・帰着日のどちらか（または両方）が空の場合がある
function formatPeriod(trip: Trip) {
  const fmt = (d: string) => d.replaceAll('-', '/')
  const { startDate, endDate } = trip
  if (!startDate && !endDate) return '日付未設定'
  if (!startDate) return `〜 ${fmt(endDate)}`
  return endDate && endDate !== startDate
    ? `${fmt(startDate)} 〜 ${fmt(endDate)}`
    : fmt(startDate)
}

export function TripList({ trips, emptyMessage, onEdit, onDelete }: Props) {
  if (trips.length === 0) {
    return <p className="empty">{emptyMessage}</p>
  }

  // 新しい旅行が上に来るように並べる（日付のない記録は最後）
  const dateOf = (t: Trip) => t.startDate || t.endDate
  const sorted = [...trips].sort((a, b) => dateOf(b).localeCompare(dateOf(a)))

  return (
    <ul className="trip-list">
      {sorted.map((trip) => (
        <li key={trip.id} className="trip-card">
          <div className="trip-head">
            <h3 className={trip.title ? undefined : 'untitled'}>
              {tripTitle(trip)}
            </h3>
            <span className="trip-date">{formatPeriod(trip)}</span>
          </div>
          <p className="trip-prefs">
            {trip.prefectureIds.map(prefectureName).join('・')}
          </p>
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
