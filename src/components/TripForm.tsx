import { useState, type FormEvent } from 'react'
import { prefectureName } from '../prefectures'
import type { TripInput } from '../useTrips'
import { PrefectureSearch } from './PrefectureSearch'

type Props = {
  initial: TripInput
  submitLabel: string
  onSubmit: (input: TripInput) => void
  onCancel: () => void
}

export function TripForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial.title)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [prefectureIds, setPrefectureIds] = useState(initial.prefectureIds)
  const [memo, setMemo] = useState(initial.memo)
  const [error, setError] = useState('')

  const addPrefecture = (id: number) => {
    if (!prefectureIds.includes(id)) {
      setPrefectureIds([...prefectureIds, id].sort((a, b) => a - b))
    }
  }

  const removePrefecture = (id: number) =>
    setPrefectureIds(prefectureIds.filter((p) => p !== id))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (startDate && endDate && endDate < startDate)
      return setError('帰着日は出発日以降にしてください')
    if (prefectureIds.length === 0)
      return setError('訪れた都道府県を1つ以上選んでください')
    onSubmit({ title: title.trim(), startDate, endDate, prefectureIds, memo })
  }

  return (
    <form className="trip-form" onSubmit={handleSubmit} noValidate>
      <label>
        タイトル（任意）
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：京都・奈良 秋の旅"
        />
      </label>

      <div className="date-row">
        <label>
          出発日（任意）
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          帰着日（日帰りなら空欄）
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      {/* 候補一覧のクリックが label 経由で入力欄に転送されないよう、label で囲まない */}
      <div className="field">
        <label htmlFor="pref-search">訪れた都道府県</label>
        <PrefectureSearch
          inputId="pref-search"
          selectedIds={prefectureIds}
          onAdd={addPrefecture}
        />
      </div>
      {prefectureIds.length > 0 && (
        <ul className="chips">
          {prefectureIds.map((id) => (
            <li key={id}>
              {prefectureName(id)}
              <button
                type="button"
                aria-label={`${prefectureName(id)}を外す`}
                onClick={() => removePrefecture(id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <label>
        メモ
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="行った場所、食べたもの、思い出など"
        />
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>
          キャンセル
        </button>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}
