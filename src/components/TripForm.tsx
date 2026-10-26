import { useId, useState, type FormEvent } from 'react'
import { labelOf, type PlaceCatalog, type PlaceId } from '../places'
import type { TripValues } from '../records'
import { PlaceSearch } from './PlaceSearch'

type Props<Id extends PlaceId> = {
  catalog: PlaceCatalog<Id>
  initial: TripValues<Id>
  titlePlaceholder: string
  submitLabel: string
  onSubmit: (values: TripValues<Id>) => void
  onCancel: () => void
}

export function TripForm<Id extends PlaceId>({
  catalog,
  initial,
  titlePlaceholder,
  submitLabel,
  onSubmit,
  onCancel,
}: Props<Id>) {
  const [title, setTitle] = useState(initial.title)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)
  const [placeIds, setPlaceIds] = useState(initial.placeIds)
  const [memo, setMemo] = useState(initial.memo)
  const [error, setError] = useState('')
  const searchId = useId()

  // 訪れた順を残すため、追加した順に並べる（海外の移動距離の計算に使う）
  const addPlace = (id: Id) => {
    if (!placeIds.includes(id)) setPlaceIds([...placeIds, id])
  }

  const removePlace = (id: Id) => setPlaceIds(placeIds.filter((p) => p !== id))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (startDate && endDate && endDate < startDate)
      return setError('帰着日は出発日以降にしてください')
    if (placeIds.length === 0)
      return setError(`訪れた${catalog.placeLabel}を1つ以上選んでください`)
    onSubmit({ title: title.trim(), startDate, endDate, placeIds, memo })
  }

  return (
    <form className="trip-form" onSubmit={handleSubmit} noValidate>
      <label>
        タイトル（任意）
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={titlePlaceholder}
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
        <label htmlFor={searchId}>訪れた{catalog.placeLabel}</label>
        <PlaceSearch
          inputId={searchId}
          catalog={catalog}
          selectedIds={placeIds}
          onAdd={addPlace}
        />
      </div>
      {placeIds.length > 0 && (
        <ul className="chips">
          {placeIds.map((id) => (
            <li key={id}>
              {labelOf(catalog, id)}
              <button
                type="button"
                aria-label={`${catalog.nameOf(id)}を外す`}
                onClick={() => removePlace(id)}
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
