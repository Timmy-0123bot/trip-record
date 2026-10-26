// 国内（都道府県）と海外（国・地域）で共通に扱う「場所」の型

// 都道府県は JIS コード（数値）、国・地域は ISO 3166-1 alpha-2 コード（文字列）
export type PlaceId = number | string

export type Place<Id extends PlaceId> = {
  id: Id
  name: string
  group: string // 地方・大陸
  counted: boolean // 訪問数の分母に含めるか（台湾などの「地域」は false）
  flag?: string // 国旗の絵文字
}

export type PlaceCatalog<Id extends PlaceId> = {
  placeLabel: string // 「都道府県」「国・地域」
  searchPlaceholder: string
  groups: readonly string[]
  places: Place<Id>[]
  nameOf: (id: Id) => string
  search: (query: string) => Place<Id>[]
}

// カタカナをひらがなに揃える（検索用）
export function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

// 表示用の名前（国旗があれば先頭に付ける）
export function labelOf<Id extends PlaceId>(catalog: PlaceCatalog<Id>, id: Id): string {
  const place = catalog.places.find((p) => p.id === id)
  if (!place) return catalog.nameOf(id)
  return place.flag ? `${place.flag} ${place.name}` : place.name
}
