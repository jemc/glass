export class AutoMap<K, V> extends Map<K, V> {
  constructor(private vClass: { new (): V }) {
    super()
  }

  getOrCreate(key: K): V {
    const existing = this.get(key)
    if (existing) return existing

    const created = new this.vClass()
    this.set(key, created)

    return created
  }
}
