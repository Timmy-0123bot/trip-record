import { useState, type ReactNode } from 'react'
import type { PlaceCatalog, PlaceId } from '../places'
import { tripTitle, type PlaceRecords, type TripRecord, type TripValues } from '../records'
import { GroupStats } from './GroupStats'
import { TripForm } from './TripForm'
import { TripList } from './TripList'

export type MapMode = 'select' | 'mark'

// 地図の部品に渡す値（国内は日本地図、海外は世界地図）
export type MapProps<Id extends PlaceId> = {
  tripIds: Set<Id>
  markedIds: Set<Id>
  selectedId: Id | null
  mode: MapMode
  onClick: (id: Id) => void
}

type Props<Id extends PlaceId> = {
  catalog: PlaceCatalog<Id>
  records: PlaceRecords<Id>
  remainingUnit: string // 「都道府県」「か国」
  completeMessage: string
  groupTitle: string
  groupUnit: string
  groupStorageKey: string
  titlePlaceholder: string
  showUnvisitedList: boolean
  statsExtra?: ReactNode // 訪問状況の欄に追加で表示するもの
  renderMap: (props: MapProps<Id>) => ReactNode
}

// フォームの状態：閉じている / 新規作成 / 既存の旅行を編集
type FormState<Id extends PlaceId> =
  | { mode: 'closed' }
  | { mode: 'create'; initial: TripValues<Id> }
  | { mode: 'edit'; trip: TripRecord<Id> }

const emptyValues = <Id extends PlaceId>(placeIds: Id[]): TripValues<Id> => ({
  title: '',
  startDate: '',
  endDate: '',
  placeIds,
  memo: '',
})

// 国内・海外の各タブの中身（訪問数・地図・旅行記録）
export function TravelView<Id extends PlaceId>({
  catalog,
  records,
  remainingUnit,
  completeMessage,
  groupTitle,
  groupUnit,
  groupStorageKey,
  titlePlaceholder,
  showUnvisitedList,
  statsExtra,
  renderMap,
}: Props<Id>) {
  const { trips, markedIds, tripPlaceIds, visitedIds, addTrip, updateTrip, deleteTrip, toggleMark } =
    records
  const [selectedId, setSelectedId] = useState<Id | null>(null)
  const [form, setForm] = useState<FormState<Id>>({ mode: 'closed' })
  // 地図クリック時の動作：場所の選択 / 「行ったことがある」の印の付け外し
  const [mapMode, setMapMode] = useState<MapMode>('select')
  const [mapNotice, setMapNotice] = useState('')

  // 分母に含める場所（台湾などの「地域」は除く）
  const countedPlaces = catalog.places.filter((p) => p.counted)
  const total = countedPlaces.length
  const visitedCount = countedPlaces.filter((p) => visitedIds.has(p.id)).length
  const remainingCount = total - visitedCount
  const unvisited = countedPlaces.filter((p) => !visitedIds.has(p.id))

  const shownTrips =
    selectedId === null ? trips : trips.filter((t) => t.placeIds.includes(selectedId))

  const handleMapClick = (id: Id) => {
    if (mapMode === 'select') {
      setSelectedId((cur) => (cur === id ? null : id))
      return
    }
    const name = catalog.nameOf(id)
    if (tripPlaceIds.has(id)) {
      setMapNotice(`${name}は旅行記録があるため、すでに訪問済みです`)
      return
    }
    toggleMark(id)
    setMapNotice(
      markedIds.includes(id)
        ? `${name}の印を外しました`
        : `${name}を「行ったことがある」にしました`,
    )
  }

  const toggleMapMode = () => {
    setMapMode((m) => (m === 'select' ? 'mark' : 'select'))
    setSelectedId(null)
    setMapNotice('')
  }

  const handleSubmit = (values: TripValues<Id>) => {
    if (form.mode === 'edit') updateTrip(form.trip.id, values)
    else addTrip(values)
    setForm({ mode: 'closed' })
  }

  const handleDelete = (trip: TripRecord<Id>) => {
    if (window.confirm(`「${tripTitle(trip)}」を削除しますか？`)) deleteTrip(trip.id)
  }

  return (
    <>
      <section className="stats" aria-label="訪問状況">
        <div className="stat">
          <span className="stat-label">訪問済み</span>
          <span className="stat-value">
            {visitedCount}
            <small> / {total}</small>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">残り</span>
          <span className="stat-value">
            {remainingCount}
            <small> {remainingUnit}</small>
          </span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={visitedCount}
          aria-label="制覇率"
        >
          <div className="progress-bar" style={{ width: `${(visitedCount / total) * 100}%` }} />
        </div>
        {statsExtra}
        <GroupStats
          title={groupTitle}
          groupUnit={groupUnit}
          groups={catalog.groups}
          places={countedPlaces}
          visitedIds={visitedIds}
          storageKey={groupStorageKey}
        />
        {remainingCount === 0 ? (
          <p className="complete">{completeMessage}</p>
        ) : (
          showUnvisitedList && (
            <details className="unvisited">
              <summary>まだ行っていない{catalog.placeLabel}を見る</summary>
              <p>{unvisited.map((p) => p.name).join('・')}</p>
            </details>
          )
        )}
      </section>

      <main className="layout">
        <section className="map-panel">
          <div className="map-toolbar">
            <button
              className={mapMode === 'mark' ? 'mark-toggle on' : 'mark-toggle secondary'}
              aria-pressed={mapMode === 'mark'}
              onClick={toggleMapMode}
            >
              {mapMode === 'mark' ? '✓ 印を付け終わる' : 'タップで訪問済みにする'}
            </button>
          </div>
          {mapMode === 'mark' && (
            <p className="map-hint">
              {catalog.placeLabel}をタップすると「行ったことがある」の印を付け外しできます
            </p>
          )}
          {renderMap({
            tripIds: tripPlaceIds,
            markedIds: new Set(markedIds),
            selectedId,
            mode: mapMode,
            onClick: handleMapClick,
          })}
          <p className="map-notice" role="status">
            {mapNotice}
          </p>
          <ul className="legend">
            <li>
              <span className="swatch visited" />
              旅行記録あり
            </li>
            <li>
              <span className="swatch marked" />
              行ったことがある
            </li>
            <li>
              <span className="swatch" />
              未訪問
            </li>
          </ul>
        </section>

        <section className="trips-panel">
          {form.mode === 'closed' ? (
            <>
              <div className="trips-toolbar">
                <h2>
                  {selectedId === null ? '旅行の記録' : `${catalog.nameOf(selectedId)}の記録`}
                </h2>
                <button
                  onClick={() =>
                    setForm({
                      mode: 'create',
                      initial: emptyValues(selectedId === null ? [] : [selectedId]),
                    })
                  }
                >
                  ＋ 旅行を追加
                </button>
              </div>
              {selectedId !== null && (
                <button className="link" onClick={() => setSelectedId(null)}>
                  ← すべての記録を表示
                </button>
              )}
              <TripList
                catalog={catalog}
                trips={shownTrips}
                emptyMessage={
                  selectedId === null
                    ? 'まだ記録がありません。「旅行を追加」から最初の旅を記録しましょう。'
                    : `${catalog.nameOf(selectedId)}の記録はまだありません。`
                }
                onEdit={(trip) => setForm({ mode: 'edit', trip })}
                onDelete={handleDelete}
              />
            </>
          ) : (
            <>
              <h2>{form.mode === 'edit' ? '旅行を編集' : '旅行を追加'}</h2>
              <TripForm
                key={form.mode === 'edit' ? form.trip.id : 'new'}
                catalog={catalog}
                initial={form.mode === 'edit' ? form.trip : form.initial}
                titlePlaceholder={titlePlaceholder}
                submitLabel={form.mode === 'edit' ? '更新する' : '記録する'}
                onSubmit={handleSubmit}
                onCancel={() => setForm({ mode: 'closed' })}
              />
            </>
          )}
        </section>
      </main>
    </>
  )
}
