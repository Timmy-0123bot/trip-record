import { useEffect, useRef, useState } from 'react'
import type { Place, PlaceCatalog, PlaceId } from '../places'

type Props<Id extends PlaceId> = {
  catalog: PlaceCatalog<Id>
  visitedIds: Set<Id>
  storageKey: string // 開閉状態の保存先
  onAddTrip: (id: Id) => void
  onShowOnMap: (id: Id) => void
}

type Pool = 'unvisited' | 'all'

const ALL_GROUPS = ''

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

// だんだん遅くなる切り替え間隔（ミリ秒）。合計で約2.5秒
const STEP_DELAYS = Array.from({ length: 22 }, (_, i) => 40 + i * i * 0.5)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

// 次の行き先をランダムに決めるルーレット（候補は「行ったことない場所だけ」か「すべて」から選ぶ）
export function Roulette<Id extends PlaceId>({
  catalog,
  visitedIds,
  storageKey,
  onAddTrip,
  onShowOnMap,
}: Props<Id>) {
  const [open, setOpen] = useState(() => loadOpen(storageKey))
  const [pool, setPool] = useState<Pool>('unvisited')
  const [group, setGroup] = useState(ALL_GROUPS)
  const [shown, setShown] = useState<Place<Id> | null>(null) // 回転中に表示している候補
  const [result, setResult] = useState<Place<Id> | null>(null) // 止まったときの結果
  const [spinning, setSpinning] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const candidates = catalog.places.filter(
    (p) =>
      (group === ALL_GROUPS || p.group === group) &&
      (pool === 'all' || !visitedIds.has(p.id)),
  )

  const resetResult = () => {
    window.clearTimeout(timer.current)
    setSpinning(false)
    setShown(null)
    setResult(null)
  }

  const spin = () => {
    if (candidates.length === 0) return
    const winner = pick(candidates)
    setResult(null)
    if (prefersReducedMotion() || candidates.length === 1) {
      setShown(winner)
      setResult(winner)
      return
    }
    setSpinning(true)
    let step = 0
    const tick = () => {
      if (step < STEP_DELAYS.length) {
        setShown(pick(candidates))
        timer.current = window.setTimeout(tick, STEP_DELAYS[step++])
      } else {
        setShown(winner)
        setResult(winner)
        setSpinning(false)
      }
    }
    tick()
  }

  const unit = catalog.placeLabel

  return (
    <details
      className="roulette"
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open
        setOpen(next)
        saveOpen(storageKey, next)
      }}
    >
      <summary>🎲 次の行き先ルーレット</summary>

      <div className="roulette-body">
        <div className="roulette-options">
          <div className="segmented" role="radiogroup" aria-label="候補">
            {(
              [
                ['unvisited', '行ったことない場所だけ'],
                ['all', 'すべての場所'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={pool === value}
                className={pool === value ? 'active' : undefined}
                disabled={spinning}
                onClick={() => {
                  setPool(value)
                  resetResult()
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="roulette-group">
            範囲
            <select
              value={group}
              disabled={spinning}
              onChange={(e) => {
                setGroup(e.target.value)
                resetResult()
              }}
            >
              <option value={ALL_GROUPS}>すべて</option>
              {catalog.groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="roulette-count">
          候補：{candidates.length}件の{unit}
        </p>

        <div
          className={`roulette-display ${spinning ? 'spinning' : ''} ${result ? 'decided' : ''}`}
          aria-live="polite"
          aria-busy={spinning}
        >
          {shown ? (
            <>
              <span className="roulette-name">
                {shown.flag && <span className="flag">{shown.flag} </span>}
                {shown.name}
              </span>
              <span className="roulette-sub">
                {shown.group}
                {result && visitedIds.has(result.id) && '・訪問済み'}
              </span>
            </>
          ) : (
            <span className="roulette-placeholder">
              {candidates.length === 0
                ? pool === 'unvisited'
                  ? `この範囲の${unit}はすべて訪問済みです 🎉`
                  : `この範囲に${unit}がありません`
                : 'ボタンを押して次の行き先を決めよう'}
            </span>
          )}
        </div>

        <div className="roulette-actions">
          <button type="button" onClick={spin} disabled={spinning || candidates.length === 0}>
            {result ? 'もう一度回す' : 'ルーレットを回す'}
          </button>
          {result && (
            <>
              <button type="button" className="secondary" onClick={() => onAddTrip(result.id)}>
                この場所の旅行を追加
              </button>
              <button type="button" className="secondary" onClick={() => onShowOnMap(result.id)}>
                地図で見る
              </button>
            </>
          )}
        </div>
      </div>
    </details>
  )
}
