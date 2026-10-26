import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { geoEqualEarth, geoPath } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import worldTopo from '../data/world-110m.json'
import { COUNTRIES, type Country } from '../countries'
import type { MapProps } from './TravelView'

type CountryProps = { name: string }
type CountryFeature = Feature<Geometry, CountryProps> & { id?: string }

const WIDTH = 960
const HEIGHT = 470
const JAPAN_ID = '392'
const ANTARCTICA_ID = '010'
const DOT_RADIUS = 4

const topology = worldTopo as unknown as Topology<{
  countries: GeometryCollection<CountryProps>
}>
// 南極は訪問対象外で場所も取るため描かない
const features = (
  feature(topology, topology.objects.countries) as FeatureCollection<Geometry, CountryProps>
).features.filter((f) => f.id !== ANTARCTICA_ID) as CountryFeature[]

const countryByNumeric = new Map(COUNTRIES.filter((c) => c.numeric).map((c) => [c.numeric, c]))
const kosovo = COUNTRIES.find((c) => c.code === 'XK')!

// 地図の形と一覧の国を対応付ける（コソボは数字コードがないため名前で対応付ける）
function countryOf(f: CountryFeature): Country | undefined {
  if (f.id) return countryByNumeric.get(f.id)
  return f.properties.name === 'Kosovo' ? kosovo : undefined
}

const shapedCodes = new Set(
  features.map(countryOf).filter((c): c is Country => !!c).map((c) => c.code),
)
// 地図データに形がない小さな国・地域は、首都の位置に点で表示する
const dotCountries = COUNTRIES.filter((c) => !shapedCodes.has(c.code))

const ZOOM_STEP = 1.6

export function WorldMap({ tripIds, markedIds, selectedId, mode, onClick }: MapProps<string>) {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity)

  // 日本が中心寄りに来る太平洋中心の地図（日本の一般的な世界地図に近い向き）
  const { shapes, dots } = useMemo(() => {
    const projection = geoEqualEarth()
      .rotate([-150, 0])
      .fitExtent(
        [
          [4, 4],
          [WIDTH - 4, HEIGHT - 4],
        ],
        { type: 'FeatureCollection', features },
      )
    const path = geoPath(projection)
    return {
      shapes: features.map((f, i) => ({
        key: f.id ?? `noid-${i}`,
        d: path(f) ?? '',
        country: countryOf(f),
        isJapan: f.id === JAPAN_ID,
      })),
      dots: dotCountries.map((c) => {
        const [x, y] = projection([c.lon, c.lat]) ?? [0, 0]
        return { country: c, x, y }
      }),
    }
  }, [])

  // 拡大・移動（スマホは2本指、パソコンはホイールとドラッグ）
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 24])
      .translateExtent([
        [0, 0],
        [WIDTH, HEIGHT],
      ])
      // 指が少し動いただけでタップが無効にならないようにする
      .clickDistance(6)
      // 1本指の操作はページのスクロールに使うため、タッチは2本指以上のときだけ地図を動かす
      .filter((event: Event) => {
        if (event.type.startsWith('touch')) return (event as TouchEvent).touches.length >= 2
        return !(event as MouseEvent).button
      })
      .on('zoom', (event: { transform: ZoomTransform }) => setTransform(event.transform))
    const selection = select(svg)
    selection.call(behavior)
    // ダブルタップで国の印を付け外ししたときに地図が拡大しないよう、ダブルクリック拡大は無効にする
    selection.on('dblclick.zoom', null)
    // d3-zoom が設定する touch-action: none を上書きし、1本指のスクロールを有効にする
    svg.style.touchAction = 'pan-x pan-y'
    zoomRef.current = behavior
    return () => {
      selection.on('.zoom', null)
    }
  }, [])

  const zoomBy = (factor: number) => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).call(zoomRef.current.scaleBy, factor)
    }
  }

  const resetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).call(zoomRef.current.transform, zoomIdentity)
    }
  }

  const statusOf = (code: string) => {
    if (tripIds.has(code)) return { className: 'visited', label: '旅行記録あり' }
    if (markedIds.has(code)) return { className: 'marked', label: '行ったことがある' }
    return { className: '', label: '未訪問' }
  }

  const interactiveProps = (country: Country) => {
    const status = statusOf(country.code)
    const pressed = mode === 'mark' ? markedIds.has(country.code) : selectedId === country.code
    return {
      className: [
        'pref',
        status.className,
        mode === 'select' && selectedId === country.code && 'selected',
      ]
        .filter(Boolean)
        .join(' '),
      tabIndex: 0,
      role: 'button',
      'aria-label': `${country.name}（${status.label}）`,
      'aria-pressed': pressed,
      onClick: () => onClick(country.code),
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(country.code)
        }
      },
    }
  }

  return (
    <div className="world-map-wrap">
      <svg
        ref={svgRef}
        className={`world-map ${mode === 'mark' ? 'mark-mode' : ''}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="group"
        aria-label={
          mode === 'mark'
            ? '世界地図（国をクリックで「行ったことがある」を付け外し）'
            : '世界地図（国をクリックで選択）'
        }
      >
        <rect className="ocean" width={WIDTH} height={HEIGHT} />
        <g transform={transform.toString()}>
          {shapes.map(({ key, d, country, isJapan }) =>
            country ? (
              <path key={key} d={d} {...interactiveProps(country)}>
                <title>{country.name}</title>
              </path>
            ) : (
              // 日本（出発地）と、一覧にない地域（フォークランド諸島など）は操作できない形で描く
              <path key={key} d={d} className={isJapan ? 'country-home' : 'country-inert'}>
                {isJapan && <title>日本</title>}
              </path>
            ),
          )}
          {dots.map(({ country, x, y }) => {
            const props = interactiveProps(country)
            return (
              <circle
                key={country.code}
                cx={x}
                cy={y}
                // 拡大しても点が大きくなりすぎないよう、倍率に合わせて半径を調整する
                r={DOT_RADIUS / Math.sqrt(transform.k)}
                {...props}
                className={`${props.className} dot`}
              >
                <title>{country.name}</title>
              </circle>
            )
          })}
        </g>
      </svg>
      <div className="zoom-controls">
        <button type="button" aria-label="拡大" onClick={() => zoomBy(ZOOM_STEP)}>
          ＋
        </button>
        <button type="button" aria-label="縮小" onClick={() => zoomBy(1 / ZOOM_STEP)}>
          −
        </button>
        <button type="button" aria-label="元の表示に戻す" onClick={resetZoom}>
          ⟲
        </button>
      </div>
      <p className="map-help">2本指またはボタンで拡大・移動できます。小さな国は点で表示しています</p>
    </div>
  )
}
