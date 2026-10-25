import { PREFECTURES, REGIONS } from '../prefectures'

type Props = {
  visitedIds: Set<number>
}

// 地方ごとの訪問数。各行を開くと、その地方でまだ行っていない都道府県を表示する
export function RegionStats({ visitedIds }: Props) {
  return (
    <ul className="region-stats" aria-label="地方ごとの訪問数">
      {REGIONS.map((region) => {
        const prefs = PREFECTURES.filter((p) => p.region === region)
        const unvisited = prefs.filter((p) => !visitedIds.has(p.id))
        const visitedCount = prefs.length - unvisited.length
        const complete = unvisited.length === 0
        return (
          <li key={region}>
            <details className={complete ? 'region complete' : 'region'}>
              <summary>
                <span className="region-name">{region}</span>
                <span className="region-bar" aria-hidden="true">
                  <span
                    className="region-bar-fill"
                    style={{ width: `${(visitedCount / prefs.length) * 100}%` }}
                  />
                </span>
                <span className="region-count">
                  {visitedCount}/{prefs.length}
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
  )
}
