import { useMemo } from 'react'
import { geoMercator, geoPath, type GeoProjection } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import japanTopo from '../data/japan.topo.json'
import { prefectureName } from '../prefectures'

type PrefProps = { id: number; nam_ja: string }
type PrefFeature = Feature<Geometry, PrefProps>

const WIDTH = 600
const HEIGHT = 640
const OKINAWA_ID = 47

// 沖縄は本土から離れているため、左上の枠内に別の投影で描く
const INSET = { x: 12, y: 12, w: 210, h: 120 }

const topology = japanTopo as unknown as Topology<{
  japan: GeometryCollection<PrefProps>
}>
const prefectures = (
  feature(topology, topology.objects.japan) as FeatureCollection<
    Geometry,
    PrefProps
  >
).features as PrefFeature[]

// 表示範囲を緯度経度の矩形で指定する（小笠原諸島などの離島で縮尺が小さくならないように）
function bboxOf(lonMin: number, latMin: number, lonMax: number, latMax: number) {
  return {
    type: 'MultiPoint' as const,
    coordinates: [
      [lonMin, latMin],
      [lonMax, latMax],
    ],
  }
}

function buildProjections(): { main: GeoProjection; okinawa: GeoProjection } {
  const main = geoMercator().fitExtent(
    [
      [8, 8],
      [WIDTH - 8, HEIGHT - 8],
    ],
    bboxOf(128.6, 27.6, 146.0, 45.6),
  )
  const okinawa = geoMercator().fitExtent(
    [
      [INSET.x + 8, INSET.y + 8],
      [INSET.x + INSET.w - 8, INSET.y + INSET.h - 8],
    ],
    bboxOf(122.9, 24.0, 128.4, 26.95),
  )
  // 枠からはみ出す離島（大東諸島など）は枠で切り取る
  okinawa.clipExtent([
    [INSET.x, INSET.y],
    [INSET.x + INSET.w, INSET.y + INSET.h],
  ])
  return { main, okinawa }
}

type Props = {
  tripIds: Set<number> // 旅行記録のある都道府県
  markedIds: Set<number> // 「行ったことがある」の印を付けた都道府県
  selectedId: number | null
  // select：クリックでその県を選択 / mark：クリックで印を付け外し
  mode: 'select' | 'mark'
  onClick: (id: number) => void
}

function statusOf(id: number, tripIds: Set<number>, markedIds: Set<number>) {
  if (tripIds.has(id)) return { className: 'visited', label: '旅行記録あり' }
  // 旅行記録の有無にかかわらず、訪問済みは同じ色で表す（読み上げでは区別する）
  if (markedIds.has(id)) return { className: 'visited', label: '行ったことがある' }
  return { className: '', label: '未訪問' }
}

export function JapanMap({ tripIds, markedIds, selectedId, mode, onClick }: Props) {
  const paths = useMemo(() => {
    const { main, okinawa } = buildProjections()
    const mainPath = geoPath(main)
    const okinawaPath = geoPath(okinawa)
    return prefectures.map((f) => ({
      id: f.properties.id,
      d:
        (f.properties.id === OKINAWA_ID ? okinawaPath(f) : mainPath(f)) ?? '',
    }))
  }, [])

  return (
    <svg
      className={`japan-map ${mode === 'mark' ? 'mark-mode' : ''}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="group"
      aria-label={
        mode === 'mark'
          ? '日本地図（都道府県をクリックで「行ったことがある」を付け外し）'
          : '日本地図（都道府県をクリックで選択）'
      }
    >
      <rect
        className="inset-frame"
        x={INSET.x}
        y={INSET.y}
        width={INSET.w}
        height={INSET.h}
        rx={6}
      />
      {paths.map(({ id, d }) => {
        const name = prefectureName(id)
        const status = statusOf(id, tripIds, markedIds)
        const pressed = mode === 'mark' ? markedIds.has(id) : selectedId === id
        const classes = [
          'pref',
          status.className,
          mode === 'select' && selectedId === id && 'selected',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <path
            key={id}
            d={d}
            className={classes}
            tabIndex={0}
            role="button"
            aria-label={`${name}（${status.label}）`}
            aria-pressed={pressed}
            onClick={() => onClick(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(id)
              }
            }}
          >
            <title>{name}</title>
          </path>
        )
      })}
    </svg>
  )
}
