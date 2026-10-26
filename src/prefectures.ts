import { toHiragana, type Place, type PlaceCatalog } from './places'

// 都道府県マスタ（id は JIS X 0401 の都道府県コード。地図データの id と一致）
export type Prefecture = {
  id: number
  name: string
  kana: string // 検索用の読みがな（都・府・県は含めない）
  region: string
}

export const REGIONS = [
  '北海道',
  '東北',
  '関東',
  '中部',
  '近畿',
  '中国',
  '四国',
  '九州・沖縄',
] as const

export const PREFECTURES: Prefecture[] = [
  { id: 1, name: '北海道', kana: 'ほっかいどう', region: '北海道' },
  { id: 2, name: '青森県', kana: 'あおもり', region: '東北' },
  { id: 3, name: '岩手県', kana: 'いわて', region: '東北' },
  { id: 4, name: '宮城県', kana: 'みやぎ', region: '東北' },
  { id: 5, name: '秋田県', kana: 'あきた', region: '東北' },
  { id: 6, name: '山形県', kana: 'やまがた', region: '東北' },
  { id: 7, name: '福島県', kana: 'ふくしま', region: '東北' },
  { id: 8, name: '茨城県', kana: 'いばらき', region: '関東' },
  { id: 9, name: '栃木県', kana: 'とちぎ', region: '関東' },
  { id: 10, name: '群馬県', kana: 'ぐんま', region: '関東' },
  { id: 11, name: '埼玉県', kana: 'さいたま', region: '関東' },
  { id: 12, name: '千葉県', kana: 'ちば', region: '関東' },
  { id: 13, name: '東京都', kana: 'とうきょう', region: '関東' },
  { id: 14, name: '神奈川県', kana: 'かながわ', region: '関東' },
  { id: 15, name: '新潟県', kana: 'にいがた', region: '中部' },
  { id: 16, name: '富山県', kana: 'とやま', region: '中部' },
  { id: 17, name: '石川県', kana: 'いしかわ', region: '中部' },
  { id: 18, name: '福井県', kana: 'ふくい', region: '中部' },
  { id: 19, name: '山梨県', kana: 'やまなし', region: '中部' },
  { id: 20, name: '長野県', kana: 'ながの', region: '中部' },
  { id: 21, name: '岐阜県', kana: 'ぎふ', region: '中部' },
  { id: 22, name: '静岡県', kana: 'しずおか', region: '中部' },
  { id: 23, name: '愛知県', kana: 'あいち', region: '中部' },
  { id: 24, name: '三重県', kana: 'みえ', region: '近畿' },
  { id: 25, name: '滋賀県', kana: 'しが', region: '近畿' },
  { id: 26, name: '京都府', kana: 'きょうと', region: '近畿' },
  { id: 27, name: '大阪府', kana: 'おおさか', region: '近畿' },
  { id: 28, name: '兵庫県', kana: 'ひょうご', region: '近畿' },
  { id: 29, name: '奈良県', kana: 'なら', region: '近畿' },
  { id: 30, name: '和歌山県', kana: 'わかやま', region: '近畿' },
  { id: 31, name: '鳥取県', kana: 'とっとり', region: '中国' },
  { id: 32, name: '島根県', kana: 'しまね', region: '中国' },
  { id: 33, name: '岡山県', kana: 'おかやま', region: '中国' },
  { id: 34, name: '広島県', kana: 'ひろしま', region: '中国' },
  { id: 35, name: '山口県', kana: 'やまぐち', region: '中国' },
  { id: 36, name: '徳島県', kana: 'とくしま', region: '四国' },
  { id: 37, name: '香川県', kana: 'かがわ', region: '四国' },
  { id: 38, name: '愛媛県', kana: 'えひめ', region: '四国' },
  { id: 39, name: '高知県', kana: 'こうち', region: '四国' },
  { id: 40, name: '福岡県', kana: 'ふくおか', region: '九州・沖縄' },
  { id: 41, name: '佐賀県', kana: 'さが', region: '九州・沖縄' },
  { id: 42, name: '長崎県', kana: 'ながさき', region: '九州・沖縄' },
  { id: 43, name: '熊本県', kana: 'くまもと', region: '九州・沖縄' },
  { id: 44, name: '大分県', kana: 'おおいた', region: '九州・沖縄' },
  { id: 45, name: '宮崎県', kana: 'みやざき', region: '九州・沖縄' },
  { id: 46, name: '鹿児島県', kana: 'かごしま', region: '九州・沖縄' },
  { id: 47, name: '沖縄県', kana: 'おきなわ', region: '九州・沖縄' },
]

export const PREFECTURE_COUNT = PREFECTURES.length

const byId = new Map(PREFECTURES.map((p) => [p.id, p]))

export function prefectureName(id: number): string {
  return byId.get(id)?.name ?? '不明'
}

const SUFFIX_KANA: Record<string, string> = { 都: 'と', 府: 'ふ', 県: 'けん' }

// 「きょうとふ」のように都・府・県まで入力されても一致するよう、末尾の読みを付けたもの
const fullKana = new Map(
  PREFECTURES.map((p) => [p.id, p.kana + (SUFFIX_KANA[p.name.slice(-1)] ?? '')]),
)

// 漢字（部分一致）・ひらがな・カタカナ（前方一致）で都道府県を検索する
export function searchPrefectures(query: string): Prefecture[] {
  const q = toHiragana(query.trim())
  if (!q) return PREFECTURES
  return PREFECTURES.filter(
    (p) => p.name.includes(q) || fullKana.get(p.id)!.startsWith(q),
  )
}

const toPlace = (p: Prefecture): Place<number> => ({
  id: p.id,
  name: p.name,
  group: p.region,
})

export const domesticCatalog: PlaceCatalog<number> = {
  placeLabel: '都道府県',
  searchPlaceholder: '都道府県名を入力（例：きょうと、京都）',
  groups: REGIONS,
  places: PREFECTURES.map(toPlace),
  nameOf: prefectureName,
  search: (query) => searchPrefectures(query).map(toPlace),
}
