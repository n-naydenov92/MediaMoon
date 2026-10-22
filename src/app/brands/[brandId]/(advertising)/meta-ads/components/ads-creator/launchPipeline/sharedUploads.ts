import type { MediaRef } from './mediaUpload'

export interface UploadListener {
  readonly onProgress: (percent: number) => void
  readonly onWaitingForMeta: () => void
}

export type UploadTask = (signal: AbortSignal, report: UploadListener) => Promise<MediaRef>

interface JoinRequest {
  readonly key: string
  readonly jobId: string
  readonly task: UploadTask
  readonly listener: UploadListener
  readonly signal: AbortSignal
}

export interface SharedUploads {
  readonly join: (request: JoinRequest) => Promise<MediaRef>
}

interface UploadState {
  progress: number
  waitingForMeta: boolean
  isDone: boolean
}

interface SharedUpload {
  readonly result: Promise<MediaRef>
  readonly controller: AbortController
  readonly listeners: Map<string, UploadListener>
  readonly state: UploadState
}

// Meta ids (video_id, image_hash) are reusable by any ad in the same ad account, so
// every ad that needs the same media there waits on one upload instead of sending the
// file again. A finished upload is remembered for the tab's lifetime; a failed one is
// forgotten so Retry uploads anew. One ad stopping leaves the upload running for the
// others — it is cancelled only once no ad is waiting on it.
export function createSharedUploads(): SharedUploads {
  const uploads = new Map<string, SharedUpload>()

  function join({ key, jobId, task, listener, signal }: JoinRequest): Promise<MediaRef> {
    if (signal.aborted) {
      return Promise.reject(abortError())
    }
    const upload = uploads.get(key) ?? start(key, task)
    if (upload.state.isDone) {
      return upload.result
    }
    upload.listeners.set(jobId, listener)
    listener.onProgress(upload.state.progress)
    if (upload.state.waitingForMeta) {
      listener.onWaitingForMeta()
    }
    return new Promise((resolve, reject) => {
      const handleAbort = (): void => {
        leave(key, upload, jobId)
        reject(abortError())
      }
      signal.addEventListener('abort', handleAbort, { once: true })
      upload.result.then(resolve, reject).finally(() => {
        signal.removeEventListener('abort', handleAbort)
        upload.listeners.delete(jobId)
      })
    })
  }

  function start(key: string, task: UploadTask): SharedUpload {
    const controller = new AbortController()
    const listeners = new Map<string, UploadListener>()
    const state: UploadState = { progress: 0, waitingForMeta: false, isDone: false }
    const result = task(controller.signal, {
      onProgress: (percent) => {
        state.progress = percent
        listeners.forEach((l) => l.onProgress(percent))
      },
      onWaitingForMeta: () => {
        state.waitingForMeta = true
        listeners.forEach((l) => l.onWaitingForMeta())
      },
    })
    const upload: SharedUpload = { result, controller, listeners, state }
    uploads.set(key, upload)
    result.then(
      () => {
        state.isDone = true
      },
      () => forget(key, upload),
    )
    return upload
  }

  function leave(key: string, upload: SharedUpload, jobId: string): void {
    upload.listeners.delete(jobId)
    if (upload.state.isDone || upload.listeners.size > 0) {
      return
    }
    upload.controller.abort()
    forget(key, upload)
  }

  function forget(key: string, upload: SharedUpload): void {
    if (uploads.get(key) === upload) {
      uploads.delete(key)
    }
  }

  return { join }
}

function abortError(): DOMException {
  return new DOMException('Aborted', 'AbortError')
}
