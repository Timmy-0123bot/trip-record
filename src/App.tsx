import { useState } from 'react'
import { BackupPanel } from './components/BackupPanel'
import { JapanMap } from './components/JapanMap'
import { RegionStats } from './components/RegionStats'
import { TripForm } from './components/TripForm'
import { TripList } from './components/TripList'
import { PREFECTURES, PREFECTURE_COUNT, prefectureName } from './prefectures'
import { tripTitle, useTrips, type Trip, type TripInput } from './useTrips'

// フォームの状態：閉じている / 新規作成 / 既存の旅行を編集
type FormState =
  | { mode: 'closed' }
  | { mode: 'create'; initial: TripInput }
  | { mode: 'edit'; trip: Trip }

const emptyInput = (prefectureIds: number[] = []): TripInput => ({
  title: '',
  startDate: '',
  endDate: '',
  prefectureIds,
  memo: '',
})

function App() {
  const {
    trips,
    markedIds,
    tripPrefectureIds,
    visitedIds,
    addTrip,
    updateTrip,
    deleteTrip,
    toggleMark,
    importData,
  } = useTrips()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  // 地図クリック時の動作：県の選択 / 「行ったことがある」の印の付け外し
  const [mapMode, setMapMode] = useState<'select' | 'mark'>('select')
  const [mapNotice, setMapNotice] = useState('')

  const visitedCount = visitedIds.size
  const remainingCount = PREFECTURE_COUNT - visitedCount
  const unvisited = PREFECTURES.filter((p) => !visitedIds.has(p.id))

  const shownTrips =
    selectedId === null
      ? trips
      : trips.filter((t) => t.prefectureIds.includes(selectedId))

  const handleMapClick = (id: number) => {
    if (mapMode === 'select') {
      setSelectedId((cur) => (cur === id ? null : id))
      return
    }
    const name = prefectureName(id)
    if (tripPrefectureIds.has(id)) {
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

  const handleSubmit = (input: TripInput) => {
    if (form.mode === 'edit') updateTrip(form.trip.id, input)
    else addTrip(input)
    setForm({ mode: 'closed' })
  }

  const handleDelete = (trip: Trip) => {
    if (window.confirm(`「${tripTitle(trip)}」を削除しますか？`)) deleteTrip(trip.id)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>trip-record</h1>
        <p className="subtitle">国内旅行の記録</p>
      </header>

      <section className="stats" aria-label="訪問状況">
        <div className="stat">
          <span className="stat-label">訪問済み</span>
          <span className="stat-value">
            {visitedCount}
            <small> / {PREFECTURE_COUNT}</small>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">残り</span>
          <span className="stat-value">
            {remainingCount}
            <small> 都道府県</small>
          </span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={PREFECTURE_COUNT}
          aria-valuenow={visitedCount}
          aria-label="制覇率"
        >
          <div
            className="progress-bar"
            style={{ width: `${(visitedCount / PREFECTURE_COUNT) * 100}%` }}
          />
        </div>
        <RegionStats visitedIds={visitedIds} />
        {remainingCount === 0 ? (
          <p className="complete">🎉 全47都道府県を制覇しました！</p>
        ) : (
          <details className="unvisited">
            <summary>まだ行っていない都道府県を見る</summary>
            <p>{unvisited.map((p) => p.name).join('・')}</p>
          </details>
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
              都道府県をタップすると「行ったことがある」の印を付け外しできます
            </p>
          )}
          <JapanMap
            tripIds={tripPrefectureIds}
            markedIds={new Set(markedIds)}
            selectedId={selectedId}
            mode={mapMode}
            onClick={handleMapClick}
          />
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
                  {selectedId === null
                    ? '旅行の記録'
                    : `${prefectureName(selectedId)}の記録`}
                </h2>
                <button
                  onClick={() =>
                    setForm({
                      mode: 'create',
                      initial: emptyInput(selectedId === null ? [] : [selectedId]),
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
                trips={shownTrips}
                emptyMessage={
                  selectedId === null
                    ? 'まだ記録がありません。「旅行を追加」から最初の旅を記録しましょう。'
                    : `${prefectureName(selectedId)}の記録はまだありません。`
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
                initial={form.mode === 'edit' ? form.trip : form.initial}
                submitLabel={form.mode === 'edit' ? '更新する' : '記録する'}
                onSubmit={handleSubmit}
                onCancel={() => setForm({ mode: 'closed' })}
              />
            </>
          )}
        </section>
      </main>

      <BackupPanel trips={trips} markedIds={markedIds} onImport={importData} />

      <footer className="app-footer">
        地図データ出典：地球地図日本（国土地理院）／
        <a href="https://github.com/dataofjapan/land" target="_blank" rel="noreferrer">
          dataofjapan/land
        </a>
      </footer>
    </div>
  )
}

export default App
