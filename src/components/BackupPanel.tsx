import { useRef, useState, type ChangeEvent } from 'react'
import { downloadBackup, loadLastBackupAt, parseBackup } from '../backup'
import type { Trip } from '../useTrips'

type Props = {
  trips: Trip[]
  markedIds: number[]
  onImport: (data: { trips: Trip[]; markedIds: number[] }) => {
    added: number
    updated: number
    addedMarks: number
  }
}

type Message = { kind: 'success' | 'error'; text: string }

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function BackupPanel({ trips, markedIds, onImport }: Props) {
  const [lastBackupAt, setLastBackupAt] = useState(loadLastBackupAt)
  const [message, setMessage] = useState<Message | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const handleDownload = () => {
    setLastBackupAt(downloadBackup(trips, markedIds))
    setMessage({
      kind: 'success',
      text: `記録${trips.length}件・印${markedIds.length}件をファイルに保存しました`,
    })
  }

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // 同じファイルをもう一度選んでも change が発生するようにリセットする
    e.target.value = ''
    if (!file) return

    const result = parseBackup(await file.text())
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.message })
      return
    }
    if (result.trips.length === 0 && result.markedIds.length === 0) {
      setMessage({ kind: 'error', text: 'ファイルに読み込める記録がありませんでした' })
      return
    }
    if (
      !window.confirm(
        `記録${result.trips.length}件・印${result.markedIds.length}件を読み込みます。\n今ある記録は消えず、同じ記録はファイルの内容で上書きされます。よろしいですか？`,
      )
    ) {
      return
    }

    const { added, updated, addedMarks } = onImport(result)
    const skipped = result.skipped > 0 ? `（読み込めなかった記録：${result.skipped}件）` : ''
    setMessage({
      kind: 'success',
      text: `復元しました：記録 新規${added}件・上書き${updated}件、印 新規${addedMarks}件${skipped}`,
    })
  }

  return (
    <section className="backup-panel" aria-labelledby="backup-heading">
      <h2 id="backup-heading">バックアップ</h2>
      <p className="backup-note">
        記録はこのブラウザの中だけに保存されています。ブラウザのデータを消すと記録も消えるため、
        ときどきファイルに保存しておきましょう。別の端末に記録を移すときにも使えます。
      </p>
      <p className="backup-last">
        前回のバックアップ：
        {lastBackupAt ? formatDateTime(lastBackupAt) : 'まだありません'}
      </p>
      <div className="backup-actions">
        <button
          onClick={handleDownload}
          disabled={trips.length === 0 && markedIds.length === 0}
        >
          ファイルに保存
        </button>
        <button className="secondary" onClick={() => fileInput.current?.click()}>
          ファイルから復元
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleFile}
        />
      </div>
      {message && (
        <p
          className={`backup-message ${message.kind}`}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
    </section>
  )
}
