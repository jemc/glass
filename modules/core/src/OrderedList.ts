export interface OrderedListAddOpts<T> {
  before?: T[]
  after?: T[]
}

export class OrderedList<T extends { name: string }> {
  readonly all: T[] = []

  forEach(fn: (item: T) => void) {
    this.all.forEach(fn)
  }

  indexOf(item: T) {
    const index = this.all.indexOf(item)
    return index === -1 ? undefined : index
  }

  add(item: T, opts: OrderedListAddOpts<T> = {}) {
    if (this.all.includes(item)) return undefined

    let maxIndex = this.all.length
    if (opts.before) {
      opts.before.forEach((before) => {
        const beforeIndex = this.all.indexOf(before)
        if (beforeIndex) maxIndex = Math.min(maxIndex, beforeIndex)
      })
    }

    let minIndex = 0
    if (opts.after) {
      opts.after.forEach((after) => {
        const afterIndex = this.all.indexOf(after)
        if (afterIndex) minIndex = Math.max(minIndex, afterIndex + 1)
      })
    }

    if (minIndex > maxIndex) {
      const after = opts.after?.map((x) => x.name).join(", ")
      const before = opts.before?.map((x) => x.name).join(", ")
      const list = this.all.map((x) => x.name).join(", ")
      throw new Error(
        `Impossible to insert ${item.name} between [${after}] and [${before}] in current list [${this.all}]`,
      )
    }

    this.all.splice(maxIndex, 0, item)

    return maxIndex
  }
}
