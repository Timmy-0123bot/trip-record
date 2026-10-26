import { DOMESTIC_STORE, OVERSEAS_STORE, type RecordStore } from './records'

// お試しモードで表示するサンプルデータ（保存はされない）

const trip = (
  id: string,
  title: string,
  startDate: string,
  endDate: string,
  places: Record<string, unknown>,
  memo = '',
) => ({ id: `sample-${id}`, title, startDate, endDate, memo, ...places })

export const SAMPLE_DOMESTIC_STORE: RecordStore = {
  ...DOMESTIC_STORE,
  sample: {
    trips: [
      trip('d1', '北海道ドライブ', '2024-07-20', '2024-07-24', { prefectureIds: [1] }, '富良野のラベンダー畑'),
      trip('d2', '京都・奈良 秋の旅', '2023-11-02', '2023-11-04', { prefectureIds: [26, 29] }, '紅葉がきれいだった'),
      trip('d3', '金沢・白川郷', '2024-05-03', '2024-05-05', { prefectureIds: [17, 21] }),
      trip('d4', '沖縄', '2025-03-10', '2025-03-12', { prefectureIds: [47] }),
      trip('d5', '博多・長崎', '2022-12-28', '2022-12-30', { prefectureIds: [40, 42] }),
      trip('d6', '箱根日帰り', '2025-01-05', '', { prefectureIds: [14] }),
    ],
    markedIds: [4, 11, 12, 13, 22, 23, 27, 28, 34, 37, 38],
  },
}

export const SAMPLE_OVERSEAS_STORE: RecordStore = {
  ...OVERSEAS_STORE,
  sample: {
    trips: [
      trip('o1', 'ヨーロッパ周遊', '2023-08-01', '2023-08-10', { countryCodes: ['IT', 'FR', 'GB'] }, 'ローマ→パリ→ロンドン'),
      trip('o2', '台湾グルメ旅', '2024-02-10', '2024-02-13', { countryCodes: ['TW'] }),
      trip('o3', 'ハワイ', '2025-08-15', '2025-08-20', { countryCodes: ['US-HI'] }),
      trip('o4', 'ソウル', '2025-11-21', '2025-11-23', { countryCodes: ['KR'] }),
    ],
    markedIds: ['AU', 'SG', 'TH', 'US', 'VN'],
  },
}
