'use client'

import { useCallback, useEffect, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import styles from './FilePicker.module.css'

interface Props {
  readonly files: readonly File[]
  readonly onChange: (next: readonly File[]) => void
  readonly disabled?: boolean
}

interface FilePreview {
  readonly file: File
  readonly url: string
  readonly isVideo: boolean
}

const ACCEPT = 'image/*,video/*'

export default function FilePicker({ files, onChange, disabled = false }: Props): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<readonly FilePreview[]>([])
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const next: FilePreview[] = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
    }))
    setPreviews(next)
    return () => {
      for (const p of next) {
        URL.revokeObjectURL(p.url)
      }
    }
  }, [files])

  const handleSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files ? Array.from(event.target.files) : []
      onChange([...files, ...selected])
      event.target.value = ''
    },
    [files, onChange],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragging(false)
      if (disabled) {
        return
      }
      const dropped = Array.from(event.dataTransfer.files).filter(
        (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
      )
      if (dropped.length === 0) {
        return
      }
      onChange([...files, ...dropped])
    },
    [disabled, files, onChange],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!disabled) {
      setDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
  }, [])

  const handleRemove = useCallback(
    (index: number) => {
      onChange(files.filter((_, i) => i !== index))
    },
    [files, onChange],
  )

  return (
    <div className={styles.root}>
      <div
        className={styles.dropZone}
        data-disabled={disabled ? 'true' : 'false'}
        data-dragging={dragging ? 'true' : 'false'}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <label className={styles.dropLabel}>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className={styles.input}
            onChange={handleSelect}
            disabled={disabled}
          />
          <span className={styles.dropLabelMain}>Drop files here or click to browse</span>
          <span className={styles.dropHint}>Images and videos. Up to 200 MB each.</span>
        </label>
      </div>

      {previews.length > 0 && (
        <ul className={styles.grid}>
          {previews.map(({ file, url, isVideo }, index) => (
            <li key={`${file.name}-${index}`} className={styles.tile}>
              {isVideo ? (
                <video src={url} className={styles.preview} muted playsInline />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt={file.name} className={styles.preview} />
              )}
              <span className={styles.badge}>{isVideo ? '▶' : '▣'}</span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => handleRemove(index)}
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
              >
                ×
              </button>
              <span className={styles.name}>{file.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
