import type { MediaRef, MediaUploadJob, VideoUploadCheckpoint } from '../launchPipeline/mediaUpload'

type ProgressListener = (percent: number) => void

export interface MediaUploadRequest {
  readonly key: string
  readonly upload: (job: MediaUploadJob) => Promise<MediaRef>
  readonly onProgress: ProgressListener
  readonly signal: AbortSignal
}

interface InFlightUpload {
  readonly promise: Promise<MediaRef>
  readonly listeners: Set<ProgressListener>
}

// One upload per media per ad account, however many ads use it (pages × duplicate
// slots, and later batches in the same session): every job asking for the same key
// waits on the same upload and reuses its video id / image hashes. Each upload call
// costs Meta rate-limit budget, so this is the biggest lever on calls per batch.
export class SharedMediaUploads {
  private readonly uploaded = new Map<string, MediaRef>()

  private readonly inFlight = new Map<string, InFlightUpload>()

  private readonly checkpoints = new Map<string, VideoUploadCheckpoint>()

  acquire({ key, upload, onProgress, signal }: MediaUploadRequest): Promise<MediaRef> {
    const ready = this.uploaded.get(key)
    if (ready) {
      return Promise.resolve(ready)
    }
    const running = this.inFlight.get(key) ?? this.start(key, upload, onProgress)
    running.listeners.add(onProgress)
    return untilAborted(running.promise, signal).finally(() => {
      running.listeners.delete(onProgress)
    })
  }

  // After a real failure (not a throttle or a stop) the half-done upload session may be
  // the cause, so the next attempt starts fresh.
  forgetCheckpoint(key: string): void {
    this.checkpoints.delete(key)
  }

  // The first listener is registered before the upload starts: an upload may report
  // progress synchronously, before acquire() gets to add it.
  private start(key: string, upload: MediaUploadRequest['upload'], firstListener: ProgressListener): InFlightUpload {
    const listeners = new Set<ProgressListener>([firstListener])
    const promise = upload({
      checkpoint: this.checkpoints.get(key) ?? null,
      onCheckpoint: (checkpoint) => {
        this.checkpoints.set(key, checkpoint)
      },
      onProgress: (percent) => listeners.forEach((listener) => listener(percent)),
    })
      .then((ref) => {
        this.uploaded.set(key, ref)
        this.checkpoints.delete(key)
        return ref
      })
      .finally(() => {
        this.inFlight.delete(key)
      })
    const entry: InFlightUpload = { promise, listeners }
    this.inFlight.set(key, entry)
    return entry
  }
}

// Lets one waiting job be stopped without cancelling the upload other jobs share.
function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const handleAbort = (): void => reject(new DOMException('Aborted', 'AbortError'))
    if (signal.aborted) {
      handleAbort()
      return
    }
    signal.addEventListener('abort', handleAbort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', handleAbort))
  })
}
