import { Entity } from "./Entity"

export class EntityPool {
  private bitPool = new Uint8Array(1024).fill(0xff)
  private firstNonZeroByteIndex = 0

  constructor(other?: EntityPool) {
    // If a base pool was given, copy from it.
    if (other) {
      this.bitPool = new Uint8Array(other.bitPool.length).fill(0xff)
      this.bitPool.set(other.bitPool)
      this.firstNonZeroByteIndex = other.firstNonZeroByteIndex
    }
  }

  get capacity() {
    return this.bitPool.length * 8
  }

  alloc(): Entity {
    // Get the first byte that is not zero (the first byte with a bit to spare).
    const byteIndex = this.firstNonZeroByteIndex
    var byte = this.bitPool[byteIndex]!

    // Get the first bit that is set to 1 (the first available bit).
    const bit = Math.log2(byte & -byte)

    // Set that bit to 0.
    byte &= ~(1 << bit)
    this.bitPool[byteIndex] = byte

    // If we've exhausted the current byte, move on to the next one.
    if (byte == 0) {
      this.firstNonZeroByteIndex++

      // If the next index is beyond what our current pool can support,
      // allocate a new, larger UInt8Array and copy the old one into it.
      if (this.firstNonZeroByteIndex >= this.bitPool.length) {
        const newPool = new Uint8Array(this.bitPool.length * 2).fill(0xff)
        newPool.set(this.bitPool)
        this.bitPool = newPool
      }
    }

    // The entity number to return is the bit index of the allocated bit.
    const entity = (byteIndex << 3) + bit
    return entity
  }

  free(entity: Entity) {
    // Set the indicated bit to 1 in the pool.
    const byteIndex = entity >> 3
    const bitIndex = entity & 0b111
    this.bitPool[byteIndex] |= 1 << bitIndex

    // If we've freed a bit that is before the firstNonZeroByteIndex,
    // move the firstNonZeroByteIndex back to the now-partially-freed byte.
    if (byteIndex < this.firstNonZeroByteIndex)
      this.firstNonZeroByteIndex = byteIndex
  }
}
