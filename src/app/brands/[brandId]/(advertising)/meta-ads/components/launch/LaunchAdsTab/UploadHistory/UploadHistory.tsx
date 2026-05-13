'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
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
      <List disablePadding className={styles.grid}>
        {SKELETON_KEYS.map((key) => (
          <ListItem key={key} disablePadding disableGutters className={styles.skeleton} />
        ))}
      </List>
    )
  }
  if (uploads.length === 0) {
    return <Typography variant="body2" className={styles.empty}>No completed uploads yet.</Typography>
  }

  return (
    <List disablePadding className={styles.grid}>
      {uploads.map((file) => (
        <ListItem key={file.id} disablePadding disableGutters className={styles.tile}>
          {/* eslint-disable-next-line no-nested-ternary -- nested ternary clearer than refactor here */}
          {file.blobUrl && file.mimeType.startsWith('image/') ? (
            <Box component="img" src={file.blobUrl} alt={file.originalName} className={styles.preview} />
          ) : file.blobUrl && file.mimeType.startsWith('video/') ? (
            <Box component="video" src={file.blobUrl} className={styles.preview} muted playsInline />
          ) : (
            <Box className={styles.placeholder}>{file.mimeType.startsWith('video/') ? '▶' : '▣'}</Box>
          )}
          <Typography component="span" variant="inherit" className={styles.name}>{file.originalName}</Typography>
        </ListItem>
      ))}
    </List>
  )
}
