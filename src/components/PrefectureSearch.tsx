import { useId, useState, type KeyboardEvent } from 'react'
import { searchPrefectures } from '../prefectures'

type Props = {
  inputId: string
  selectedIds: number[]
  onAdd: (id: number) => void
}

// 文字入力で絞り込んで都道府県を追加する入力欄（↑↓で選択、Enterで追加）
export function PrefectureSearch({ inputId, selectedIds, onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listId = useId()

  const candidates = searchPrefectures(query).filter(
    (p) => !selectedIds.includes(p.id),
  )
  const active = candidates[Math.min(activeIndex, candidates.length - 1)]

  const choose = (id: number) => {
    onAdd(id)
    setQuery('')
    setActiveIndex(0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 日本語入力の変換確定中の Enter などは無視する
    if (e.nativeEvent.isComposing) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, candidates.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      // フォーム送信を防ぎ、候補があれば追加する
      e.preventDefault()
      if (open && active) choose(active.id)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="pref-search">
      <input
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active ? `${listId}-${active.id}` : undefined}
        value={query}
        placeholder="都道府県名を入力（例：きょうと、京都）"
        onChange={(e) => {
          setQuery(e.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul id={listId} role="listbox" className="pref-options">
          {candidates.length === 0 ? (
            <li className="pref-option-empty">該当する都道府県がありません</li>
          ) : (
            candidates.map((p) => (
              <li
                key={p.id}
                id={`${listId}-${p.id}`}
                role="option"
                aria-selected={p.id === active?.id}
                className={p.id === active?.id ? 'active' : undefined}
                // 入力欄のフォーカスが外れて一覧が閉じる前に選択を確定させる
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(p.id)}
              >
                {p.name}
                <span className="pref-option-region">{p.region}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
