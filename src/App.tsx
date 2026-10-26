import { useState } from 'react'
import { BackupPanel } from './components/BackupPanel'
import { JapanMap } from './components/JapanMap'
import { TravelView } from './components/TravelView'
import { WorldMap } from './components/WorldMap'
import { YearView } from './components/YearView'
import type { BackupData } from './backup'
import { COUNTRIES, overseasCatalog } from './countries'
import { EARTH_CIRCUMFERENCE_KM, formatKm, totalDistanceKm, tripDistanceKm } from './distance'
import { labelOf } from './places'
import { domesticCatalog } from './prefectures'
import { DOMESTIC_STORE, OVERSEAS_STORE, usePlaceRecords } from './records'
import { SAMPLE_DOMESTIC_STORE, SAMPLE_OVERSEAS_STORE } from './sample'

type Tab = 'domestic' | 'overseas' | 'yearly'

const TABS: { id: Tab; label: string }[] = [
  { id: 'domestic', label: '国内' },
  { id: 'overseas', label: '海外' },
  { id: 'yearly', label: '年ごと' },
]

// 最後に開いていたタブを覚えておく（このブラウザだけの表示設定）
const TAB_KEY = 'trip-record:ui:tab'

function loadTab(): Tab {
  try {
    const saved = localStorage.getItem(TAB_KEY)
    return TABS.some((t) => t.id === saved) ? (saved as Tab) : 'domestic'
  } catch {
    return 'domestic'
  }
}

function saveTab(tab: Tab) {
  try {
    localStorage.setItem(TAB_KEY, tab)
  } catch {
    // 保存できなくても表示には影響しないので無視する
  }
}

type WorkspaceProps = {
  sampleMode: boolean
  onTrySample: () => void
}

// タブ・各タブの中身・バックアップ。お試しモードではサンプルデータを使い、変更は保存しない
function Workspace({ sampleMode, onTrySample }: WorkspaceProps) {
  const domestic = usePlaceRecords<number>(sampleMode ? SAMPLE_DOMESTIC_STORE : DOMESTIC_STORE)
  const overseas = usePlaceRecords<string>(sampleMode ? SAMPLE_OVERSEAS_STORE : OVERSEAS_STORE)
  const [tab, setTab] = useState<Tab>(loadTab)

  const isEmpty =
    domestic.trips.length + domestic.markedIds.length + overseas.trips.length + overseas.markedIds.length ===
    0

  // 訪問数の内訳（国と地域）
  const countries = COUNTRIES.filter((c) => !c.isRegion)
  const regions = COUNTRIES.filter((c) => c.isRegion)
  const visitedCountryCount = countries.filter((c) => overseas.visitedIds.has(c.code)).length
  const visitedRegions = regions.filter((c) => overseas.visitedIds.has(c.code))

  // 海外の総移動距離と、地球何周分か
  const totalKm = totalDistanceKm(overseas.trips, overseas.markedIds)
  const earthLaps = totalKm / EARTH_CIRCUMFERENCE_KM

  const selectTab = (next: Tab) => {
    setTab(next)
    saveTab(next)
  }

  const backupData: BackupData = {
    domestic: { trips: domestic.trips, markedIds: domestic.markedIds },
    overseas: { trips: overseas.trips, markedIds: overseas.markedIds },
  }

  // 国内・海外それぞれに統合し、件数を合算して返す
  const handleImport = (data: BackupData) => {
    const d = domestic.importData(data.domestic)
    const o = overseas.importData(data.overseas)
    return {
      added: d.added + o.added,
      updated: d.updated + o.updated,
      addedMarks: d.addedMarks + o.addedMarks,
    }
  }

  return (
    <>
      {isEmpty && !sampleMode && (
        <section className="welcome">
          <p>
            まだ記録がありません。サンプルデータで、地図の塗り分けや訪問数・移動距離の表示を試せます。
          </p>
          <button onClick={onTrySample}>サンプルデータで試す</button>
        </section>
      )}

      <div className="tabs" role="tablist" aria-label="記録の種類">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            className={tab === id ? 'tab active' : 'tab'}
            onClick={() => selectTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {/* 国内と海外は同じ部品なので key で別物として扱い、選択状態などが混ざらないようにする */}
        {tab === 'domestic' ? (
          <TravelView
            key="domestic"
            catalog={domesticCatalog}
            records={domestic}
            remainingUnit="都道府県"
            completeMessage="🎉 全47都道府県を制覇しました！"
            groupTitle="地方ごとの訪問数"
            groupUnit="地方"
            groupStorageKey="trip-record:ui:regionsOpen"
            rouletteStorageKey="trip-record:ui:rouletteDomesticOpen"
            titlePlaceholder="例：京都・奈良 秋の旅"
            showUnvisitedList
            renderMap={(props) => <JapanMap {...props} />}
          />
        ) : tab === 'overseas' ? (
          <TravelView
            key="overseas"
            catalog={overseasCatalog}
            records={overseas}
            remainingUnit="か国・地域"
            completeMessage={`🎉 全${COUNTRIES.length}の国・地域をすべて訪問しました！`}
            groupTitle="大陸ごとの訪問数"
            groupUnit="大陸"
            groupStorageKey="trip-record:ui:continentsOpen"
            rouletteStorageKey="trip-record:ui:rouletteOverseasOpen"
            titlePlaceholder="例：パリ・ロンドン周遊"
            showUnvisitedList={false}
            stackedLayout
            statsExtra={
              <>
                <p className="regions-visited">
                  内訳：国 {visitedCountryCount} / {countries.length}・地域 {visitedRegions.length} /{' '}
                  {regions.length}
                  {visitedRegions.length > 0 &&
                    `（${visitedRegions.map((c) => labelOf(overseasCatalog, c.code)).join('・')}）`}
                </p>
                <div className="distance">
                  <div className="stat">
                    <span className="stat-label">総移動距離（目安）</span>
                    <span className="stat-value">
                      {Math.round(totalKm).toLocaleString('ja-JP')}
                      <small> km</small>
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">地球</span>
                    <span className="stat-value">
                      {earthLaps.toFixed(2)}
                      <small> 周分 🌏</small>
                    </span>
                  </div>
                  <p className="distance-note">
                    東京から訪れた国の首都（地域は中心都市）までの直線距離で計算しています（地球1周＝40,075 km）
                  </p>
                </div>
              </>
            }
            tripNoteOf={(trip) => `移動距離 約${formatKm(tripDistanceKm(trip))}`}
            renderMap={(props) => <WorldMap {...props} />}
          />
        ) : (
          <YearView domesticTrips={domestic.trips} overseasTrips={overseas.trips} />
        )}
      </div>

      {!sampleMode && <BackupPanel data={backupData} onImport={handleImport} />}
    </>
  )
}

function App() {
  // お試しモード（サンプルデータを表示中か）。再読み込みすると通常に戻る
  const [sampleMode, setSampleMode] = useState(false)

  return (
    <div className="app">
      <header className="app-header">
        <h1>trip-record</h1>
        <p className="subtitle">国内・海外旅行の記録</p>
      </header>

      {sampleMode && (
        <div className="sample-banner" role="status">
          <p>サンプルデータを表示中です。ここでの変更は保存されず、あなたの記録には影響しません。</p>
          <button className="secondary" onClick={() => setSampleMode(false)}>
            サンプルを終了
          </button>
        </div>
      )}

      {/* 切り替え時に作り直し、サンプルと自分の記録が混ざらないようにする */}
      <Workspace
        key={sampleMode ? 'sample' : 'mine'}
        sampleMode={sampleMode}
        onTrySample={() => setSampleMode(true)}
      />

      <footer className="app-footer">
        地図データ出典：地球地図日本（国土地理院）／
        <a href="https://github.com/dataofjapan/land" target="_blank" rel="noreferrer">
          dataofjapan/land
        </a>
        、世界地図：
        <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">
          Natural Earth
        </a>
        、国旗：
        <a href="https://github.com/twitter/twemoji" target="_blank" rel="noreferrer">
          Twemoji
        </a>
        （CC-BY 4.0）
      </footer>
    </div>
  )
}

export default App
