'use client'

import { useEffect, useState } from 'react'
import type { JobFile } from '@prisma/client'
import type { BrandId } from '@/config/brands'
import styles from './UploadHistory.module.css'

interface Props {
  readonly brandId: BrandId
}

const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const

export default function UploadHistory({ brandId }: Props): JSX.Element {
  const [uploads, setUploads] = useState<readonly JobFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching / external sync effect
    setLoading(true)
    void (async () => {
      try {
        const response = await fetch(`/api/meta-ads/uploads?brandId=${brandId}`, { signal: ctrl.signal })
        if (!response.ok) {
          return
        }
        const { uploads: data } = (await response.json()) as { uploads: readonly JobFile[] }
        if (!ctrl.signal.aborted) {
          setUploads(data)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        throw err
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false)
        }
      }
    })()
    return () => ctrl.abort()
  }, [brandId])

  if (loading) {
    return (
      <ul className={styles.grid}>
        {SKELETON_KEYS.map((key) => (
          <li key={key} className={styles.skeleton} />
        ))}
      </ul>
    )
  }
  if (uploads.length === 0) {
    return <p className={styles.empty}>No completed uploads yet.</p>
  }

  return (
    <ul className={styles.grid}>
      {uploads.map((file) => (
        <li key={file.id} className={styles.tile}>
          {/* eslint-disable-next-line no-nested-ternary -- nested ternary clearer than refactor here */}
          {file.blobUrl && file.mimeType.startsWith('image/') ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={file.blobUrl} alt={file.originalName} className={styles.preview} />
          ) : file.blobUrl && file.mimeType.startsWith('video/') ? (
            <video src={file.blobUrl} className={styles.preview} muted playsInline />
          ) : (
            <div className={styles.placeholder}>{file.mimeType.startsWith('video/') ? '▶' : '▣'}</div>
          )}
          <span className={styles.name}>{file.originalName}</span>
        </li>
      ))}
    </ul>
  )
}
