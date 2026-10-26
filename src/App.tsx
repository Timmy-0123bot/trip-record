import { useState } from 'react'
import { BackupPanel } from './components/BackupPanel'
import { JapanMap } from './components/JapanMap'
import { TravelView } from './components/TravelView'
import type { BackupData } from './backup'
import { domesticCatalog } from './prefectures'
import { DOMESTIC_STORE, usePlaceRecords } from './records'

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
  const [tab, setTab] = useState<Tab>(loadTab)

  const selectTab = (next: Tab) => {
    setTab(next)
    saveTab(next)
  }

  const backupData: BackupData = {
    domestic: { trips: domestic.trips, markedIds: domestic.markedIds },
  }

  const handleImport = (data: BackupData) => domestic.importData(data.domestic)

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
        {tab === 'domestic' ? (
          <TravelView
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
          <section className="coming-soon">
            <h2>海外の記録</h2>
            <p>準備中です。もうしばらくお待ちください。</p>
          </section>
        )}
      </div>

      <BackupPanel data={backupData} onImport={handleImport} />

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
