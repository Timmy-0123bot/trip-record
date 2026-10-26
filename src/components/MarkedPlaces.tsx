import { labelOf, type PlaceCatalog, type PlaceId } from '../places'

type Props<Id extends PlaceId> = {
  catalog: PlaceCatalog<Id>
  ids: Set<Id> // 旅行記録がなく「行ったことがある」の印だけを付けた場所
  onRemove: (id: Id) => void
}

// 「行ったことがある」の印だけの場所を、地方・大陸ごとにまとめて一覧表示する
export function MarkedPlaces<Id extends PlaceId>({ catalog, ids, onRemove }: Props<Id>) {
  if (ids.size === 0) return null

  // マスタの並び順（都道府県番号順・大陸内の並び）で表示する
  const groups = catalog.groups
    .map((group) => ({
      group,
      places: catalog.places.filter((p) => p.group === group && ids.has(p.id)),
    }))
    .filter((g) => g.places.length > 0)

  return (
    <section className="marked-places" aria-labelledby="marked-places-heading">
      <h3 id="marked-places-heading">
        行ったことがある（旅行記録なし）<span className="marked-count">{ids.size}件</span>
      </h3>
      {groups.map(({ group, places }) => (
        <div key={group} className="marked-group">
          <span className="marked-group-name">{group}</span>
          <ul className="chips marked-chips">
            {places.map((p) => (
              <li key={p.id}>
                {labelOf(catalog, p.id)}
                <button
                  type="button"
                  aria-label={`${p.name}の「行ったことがある」の印を外す`}
                  onClick={() => onRemove(p.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
