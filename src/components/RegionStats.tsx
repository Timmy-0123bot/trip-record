import { useState } from 'react'
import { PREFECTURES, REGIONS } from '../prefectures'

type Props = {
  visitedIds: Set<number>
}

// 一覧を開いているかどうか（次に開いたときも同じ状態にするため、このブラウザに保存する）
const OPEN_KEY = 'trip-record:ui:regionsOpen'

function loadOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === '1'
  } catch {
    return false
  }
}

function saveOpen(open: boolean) {
  try {
    localStorage.setItem(OPEN_KEY, open ? '1' : '0')
  } catch {
    // 保存できなくても表示には影響しないので無視する
  }
}

// 地方ごとの訪問数。普段は折りたたみ、各地方を開くとまだ行っていない都道府県を表示する
export function RegionStats({ visitedIds }: Props) {
  const [open, setOpen] = useState(loadOpen)

  const rows = REGIONS.map((region) => {
    const prefs = PREFECTURES.filter((p) => p.region === region)
    const unvisited = prefs.filter((p) => !visitedIds.has(p.id))
    return { region, total: prefs.length, unvisited }
  })
  const completedCount = rows.filter((r) => r.unvisited.length === 0).length

  return (
    <details
      className="region-section"
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open
        setOpen(next)
        saveOpen(next)
      }}
    >
      <summary>
        地方ごとの訪問数
        <span className="region-summary-note">
          （制覇 {completedCount} / {REGIONS.length} 地方）
        </span>
      </summary>
      <ul className="region-stats">
        {rows.map(({ region, total, unvisited }) => {
          const visitedCount = total - unvisited.length
          const complete = unvisited.length === 0
          return (
            <li key={region}>
              <details className={complete ? 'region complete' : 'region'}>
                <summary>
                  <span className="region-name">{region}</span>
                  <span className="region-bar" aria-hidden="true">
                    <span
                      className="region-bar-fill"
                      style={{ width: `${(visitedCount / total) * 100}%` }}
                    />
                  </span>
                  <span className="region-count">
                    {visitedCount}/{total}
                    {complete && <span className="region-badge">制覇</span>}
                  </span>
                </summary>
                <p className="region-detail">
                  {complete
                    ? `${region}はすべて訪問済みです`
                    : `未訪問：${unvisited.map((p) => p.name).join('・')}`}
                </p>
              </details>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
