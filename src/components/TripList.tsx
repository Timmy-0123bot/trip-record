import { prefectureName } from '../prefectures'
import type { Trip } from '../useTrips'

type Props = {
  trips: Trip[]
  emptyMessage: string
  onEdit: (trip: Trip) => void
  onDelete: (trip: Trip) => void
}

function formatPeriod(trip: Trip) {
  const fmt = (d: string) => d.replaceAll('-', '/')
  return trip.endDate && trip.endDate !== trip.startDate
    ? `${fmt(trip.startDate)} 〜 ${fmt(trip.endDate)}`
    : fmt(trip.startDate)
}

export function TripList({ trips, emptyMessage, onEdit, onDelete }: Props) {
  if (trips.length === 0) {
    return <p className="empty">{emptyMessage}</p>
  }

  // 新しい旅行が上に来るように並べる
  const sorted = [...trips].sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <ul className="trip-list">
      {sorted.map((trip) => (
        <li key={trip.id} className="trip-card">
          <div className="trip-head">
            <h3>{trip.title}</h3>
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
