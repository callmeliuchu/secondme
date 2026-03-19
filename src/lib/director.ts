type DirectorNote = {
  text: string
  mood?: string
  createdAt: number
}

type DirectorStore = Map<string, DirectorNote[]>

const globalStore = globalThis as unknown as {
  directorStore?: DirectorStore
}

const store: DirectorStore = globalStore.directorStore ?? new Map<string, DirectorNote[]>()

if (!globalStore.directorStore) {
  globalStore.directorStore = store
}

function pruneExpiredNotes(sessionId: string, now: number) {
  const notes = store.get(sessionId)
  if (!notes) return

  const valid = notes.filter((note) => now - note.createdAt < 30 * 60 * 1000)
  if (valid.length === 0) {
    store.delete(sessionId)
    return
  }

  store.set(sessionId, valid)
}

export function enqueueDirectorNote(sessionId: string, text: string, mood?: string) {
  const now = Date.now()
  pruneExpiredNotes(sessionId, now)

  const note: DirectorNote = {
    text,
    mood,
    createdAt: now,
  }

  const notes = store.get(sessionId) ?? []
  notes.push(note)
  store.set(sessionId, notes)
}

export function consumeDirectorNote(sessionId: string): DirectorNote | null {
  const now = Date.now()
  pruneExpiredNotes(sessionId, now)

  const notes = store.get(sessionId)
  if (!notes || notes.length === 0) return null

  const note = notes.shift() ?? null

  if (!notes.length) {
    store.delete(sessionId)
  } else {
    store.set(sessionId, notes)
  }

  return note
}

export function getDirectorQueueLength(sessionId: string): number {
  pruneExpiredNotes(sessionId, Date.now())
  return store.get(sessionId)?.length ?? 0
}
