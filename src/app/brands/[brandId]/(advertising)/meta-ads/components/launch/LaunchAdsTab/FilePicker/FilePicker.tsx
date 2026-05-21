'use client'

import { useCallback, useEffect, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
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
      // eslint-disable-next-line no-param-reassign -- param is a mutable state container
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
    <Box className={styles.root}>
      <Box
        className={styles.dropZone}
        data-disabled={disabled ? 'true' : 'false'}
        data-dragging={dragging ? 'true' : 'false'}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <ButtonBase
          component="label"
          className={styles.dropLabel}
          disabled={disabled}
          focusRipple
        >
          <Box
            component="input"
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className={styles.input}
            onChange={handleSelect}
            disabled={disabled}
          />
          <Typography component="span" variant="inherit" className={styles.dropLabelMain}>Drop files here or click to browse</Typography>
          <Typography component="span" variant="inherit" className={styles.dropHint}>Images and videos. Videos up to 2 GB, images compressed to 3.5 MB if larger.</Typography>
        </ButtonBase>
      </Box>

      {previews.length > 0 && (
        <List disablePadding className={styles.grid}>
          {previews.map(({ file, url, isVideo }, index) => (
            <ListItem key={`${file.name}-${index}`} disablePadding disableGutters className={styles.tile}>
              {isVideo ? (
                <Box component="video" src={url} className={styles.preview} muted playsInline />
              ) : (
                <Box component="img" src={url} alt={file.name} className={styles.preview} />
              )}
              <Typography component="span" variant="inherit" className={styles.badge}>{isVideo ? '▶' : '▣'}</Typography>
              <IconButton
                size="small"
                className={styles.remove}
                onClick={() => handleRemove(index)}
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
              <Typography component="span" variant="inherit" className={styles.name}>{file.name}</Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}
