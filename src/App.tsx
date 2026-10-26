import { useState } from 'react'
import { BackupPanel } from './components/BackupPanel'
import { JapanMap } from './components/JapanMap'
import { TravelView } from './components/TravelView'
import { WorldMap } from './components/WorldMap'
import type { BackupData } from './backup'
import { COUNTRIES, overseasCatalog } from './countries'
import { labelOf } from './places'
import { domesticCatalog } from './prefectures'
import { DOMESTIC_STORE, OVERSEAS_STORE, usePlaceRecords } from './records'

type Tab = 'domestic' | 'overseas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'domestic', label: '国内' },
  { id: 'overseas', label: '海外' },
]

// 最後に開いていたタブを覚えておく（このブラウザだけの表示設定）
const TAB_KEY = 'trip-record:ui:tab'

function loadTab(): Tab {
  try {
    return localStorage.getItem(TAB_KEY) === 'overseas' ? 'overseas' : 'domestic'
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

function App() {
  const domestic = usePlaceRecords<number>(DOMESTIC_STORE)
  const overseas = usePlaceRecords<string>(OVERSEAS_STORE)
  const [tab, setTab] = useState<Tab>(loadTab)

  // 訪問した「地域」（台湾・香港など。訪問国数には含めない）
  const visitedRegions = COUNTRIES.filter((c) => c.isRegion && overseas.visitedIds.has(c.code))

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
    <div className="app">
      <header className="app-header">
        <h1>trip-record</h1>
        <p className="subtitle">国内・海外旅行の記録</p>
      </header>

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
            titlePlaceholder="例：京都・奈良 秋の旅"
            showUnvisitedList
            renderMap={(props) => <JapanMap {...props} />}
          />
        ) : (
          <TravelView
            key="overseas"
            catalog={overseasCatalog}
            records={overseas}
            remainingUnit="か国"
            completeMessage="🎉 日本が承認している195か国をすべて訪問しました！"
            groupTitle="大陸ごとの訪問数"
            groupUnit="大陸"
            groupStorageKey="trip-record:ui:continentsOpen"
            titlePlaceholder="例：パリ・ロンドン周遊"
            showUnvisitedList={false}
            stackedLayout
            statsExtra={
              visitedRegions.length > 0 && (
                <p className="regions-visited">
                  訪問した地域（か国数には含めない）：
                  {visitedRegions.map((c) => labelOf(overseasCatalog, c.code)).join('・')}
                </p>
              )
            }
            renderMap={(props) => <WorldMap {...props} />}
          />
        )}
      </div>

      <BackupPanel data={backupData} onImport={handleImport} />

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
