import { useState } from 'react'
import type { Place, PlaceId } from '../places'

type Props<Id extends PlaceId> = {
  title: string // 「地方ごとの訪問数」など
  groupUnit: string // 「地方」「大陸」
  groups: readonly string[]
  places: Place<Id>[] // 集計の対象（分母に含める場所のみ）
  visitedIds: Set<Id>
  storageKey: string // 開閉状態の保存先
}

// 一覧を開いているかどうか（次に開いたときも同じ状態にするため、このブラウザに保存する）
function loadOpen(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function saveOpen(key: string, open: boolean) {
  try {
    localStorage.setItem(key, open ? '1' : '0')
  } catch {
    // 保存できなくても表示には影響しないので無視する
  }
}

// 地方・大陸ごとの訪問数。普段は折りたたみ、各グループを開くとまだ行っていない場所を表示する
export function GroupStats<Id extends PlaceId>({
  title,
  groupUnit,
  groups,
  places,
  visitedIds,
  storageKey,
}: Props<Id>) {
  const [open, setOpen] = useState(() => loadOpen(storageKey))

  const rows = groups.map((group) => {
    const members = places.filter((p) => p.group === group)
    const unvisited = members.filter((p) => !visitedIds.has(p.id))
    return { group, total: members.length, unvisited }
  })
  const completedCount = rows.filter((r) => r.unvisited.length === 0).length

  return (
    <details
      className="region-section"
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open
        setOpen(next)
        saveOpen(storageKey, next)
      }}
    >
      <summary>
        {title}
        <span className="region-summary-note">
          （制覇 {completedCount} / {groups.length} {groupUnit}）
        </span>
      </summary>
      <ul className="region-stats">
        {rows.map(({ group, total, unvisited }) => {
          const visitedCount = total - unvisited.length
          const complete = unvisited.length === 0
          return (
            <li key={group}>
              <details className={complete ? 'region complete' : 'region'}>
                <summary>
                  <span className="region-name">{group}</span>
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
                    ? `${group}はすべて訪問済みです`
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
