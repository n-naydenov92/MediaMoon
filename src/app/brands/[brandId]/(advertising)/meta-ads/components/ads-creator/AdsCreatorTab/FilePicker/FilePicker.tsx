'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import PhotoOutlinedIcon from '@mui/icons-material/PhotoOutlined'
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import styles from './FilePicker.module.css'

type TypeFilter = 'all' | 'image' | 'video'

interface Props {
  readonly files: readonly File[]
  readonly onChange: (next: readonly File[]) => void
  readonly disabled?: boolean
}

interface FilePreview {
  readonly file: File
  readonly url: string
  readonly isVideo: boolean
  readonly index: number
}

const ACCEPT = 'image/*,video/*'

const TYPE_PILLS: ReadonlyArray<{ key: TypeFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
]

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export default function FilePicker({ files, onChange, disabled = false }: Props): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<readonly FilePreview[]>([])
  const [dragging, setDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  useEffect(() => {
    const next: FilePreview[] = files.map((file, index) => ({
      file,
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
      index,
    }))
    setPreviews(next)
    return () => {
      for (const p of next) URL.revokeObjectURL(p.url)
    }
  }, [files])

  const filteredPreviews = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return previews.filter((p) => {
      if (typeFilter === 'image' && p.isVideo) return false
      if (typeFilter === 'video' && !p.isVideo) return false
      if (q && !p.file.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [previews, searchQuery, typeFilter])

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
      if (disabled) return
      const dropped = Array.from(event.dataTransfer.files).filter(
        (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
      )
      if (dropped.length === 0) return
      onChange([...files, ...dropped])
    },
    [disabled, files, onChange],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!disabled) setDragging(true)
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

  const handleClearFilter = useCallback(() => {
    setSearchQuery('')
    setTypeFilter('all')
  }, [])

  const hasFiles = previews.length > 0
  const isFiltering = hasFiles && (searchQuery.trim() !== '' || typeFilter !== 'all')

  return (
    <Box className={styles.root}>
      <Box
        className={styles.dropZone}
        data-disabled={disabled ? 'true' : 'false'}
        data-dragging={dragging ? 'true' : 'false'}
        data-compact={hasFiles ? 'true' : 'false'}
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
          <Typography component="span" variant="inherit" className={styles.dropLabelMain}>
            {hasFiles ? '+ Add more files' : 'Drop files here or click to browse'}
          </Typography>
          <Typography component="span" variant="inherit" className={styles.dropHint}>
            Images and videos. Videos up to 2 GB, images compressed to 3.5 MB if larger.
          </Typography>
        </ButtonBase>
      </Box>

      {hasFiles && (
        <>
          <Box className={styles.toolbar}>
            <Box className={styles.searchWrap}>
              <SearchIcon className={styles.searchIcon} fontSize="small" />
              <Box
                component="input"
                type="text"
                placeholder="Search by name…"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                disabled={disabled}
              />
            </Box>
            <Box className={styles.pills} role="group" aria-label="File type filter">
              {TYPE_PILLS.map((p) => (
                <Box
                  key={p.key}
                  component="button"
                  type="button"
                  className={styles.pill}
                  aria-pressed={typeFilter === p.key}
                  onClick={() => setTypeFilter(p.key)}
                  disabled={disabled}
                >
                  {p.label}
                </Box>
              ))}
            </Box>
          </Box>

          <Typography component="span" variant="inherit" className={styles.counter}>
            {isFiltering
              ? `${filteredPreviews.length} of ${previews.length} shown`
              : `${previews.length} ${previews.length === 1 ? 'file' : 'files'}`}
          </Typography>

          {filteredPreviews.length > 0 ? (
            <Box component="ul" className={styles.list}>
              {filteredPreviews.map(({ file, url, isVideo, index }) => (
                <Box component="li" key={`${file.name}-${index}`} className={styles.row}>
                  <Box className={styles.thumbWrap}>
                    {isVideo ? (
                      <>
                        <Box component="video" src={url} className={styles.thumb} muted playsInline />
                        <Box component="span" className={styles.videoBadge} aria-hidden>
                          <PlayArrowRoundedIcon fontSize="inherit" />
                        </Box>
                      </>
                    ) : (
                      <Box component="img" src={url} alt={file.name} className={styles.thumb} />
                    )}
                  </Box>
                  <Box className={styles.info}>
                    <Box className={styles.nameRow}>
                      {isVideo ? (
                        <MovieOutlinedIcon className={styles.typeIcon} fontSize="small" />
                      ) : (
                        <PhotoOutlinedIcon className={styles.typeIcon} fontSize="small" />
                      )}
                      <Typography component="span" variant="inherit" className={styles.name}>
                        {file.name}
                      </Typography>
                    </Box>
                    <Typography component="span" variant="inherit" className={styles.size}>
                      {formatBytes(file.size)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    className={styles.remove}
                    onClick={() => handleRemove(index)}
                    aria-label={`Remove ${file.name}`}
                    disabled={disabled}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ) : (
            <Box className={styles.empty}>
              <Typography component="span" variant="inherit">
                No files match the current filter.
              </Typography>
              <Box
                component="button"
                type="button"
                className={styles.clearFilter}
                onClick={handleClearFilter}
              >
                Clear filter
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
