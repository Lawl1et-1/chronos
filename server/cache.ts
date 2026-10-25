/** Small in-memory LRU with in-flight de-duplication, so the same request is never paid twice. */
export class ResultCache<T> {
  private entries = new Map<string, T>()
  private pending = new Map<string, Promise<T>>()

  constructor(private limit = 200) {}

  async get(key: string, compute: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key)
    if (hit !== undefined) {
      // refresh recency
      this.entries.delete(key)
      this.entries.set(key, hit)
      return hit
    }
    const inFlight = this.pending.get(key)
    if (inFlight) return inFlight

    const promise = compute()
      .then((value) => {
        this.entries.set(key, value)
        if (this.entries.size > this.limit) this.entries.delete(this.entries.keys().next().value!)
        return value
      })
      .finally(() => this.pending.delete(key))
    this.pending.set(key, promise)
    return promise
  }
}
