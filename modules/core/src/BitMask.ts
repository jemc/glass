import { roundUpToPowerOfTwo } from "./Maths"

export class BitMask {
  private data: Uint16Array

  constructor(bitCount: number = 16) {
    const wordCount = Math.ceil(bitCount / 16)
    this.data = new Uint16Array(wordCount)
  }

  clear() {
    this.data.fill(0)
  }

  // Set the bit at the given index to have the given boolean value.
  set(bitIndex: number, value: boolean): boolean {
    const wordIndex = bitIndex >> 4 // floored division by 16
    const bit = 1 << bitIndex % 16

    // Ensure the data has enough words to reach this word index.
    if (this.data.length <= wordIndex) {
      const newWordCount = roundUpToPowerOfTwo(wordIndex + 1)
      const newData = new Uint16Array(newWordCount).fill(0)
      newData.set(this.data)
      this.data = newData
    }

    // Set the bit in the data according to the requested boolean value.
    if (value) this.data[wordIndex] |= bit
    else this.data[wordIndex] &= ~bit

    return true
  }

  // Return true if the active bits in this mask include all the bits
  // that are active in the other mask.
  isSuperSetOf(other: BitMask) {
    for (var i = 0; i < this.data.length; i++) {
      const thisWord = this.data[i] ?? 0
      const otherWord = other.data[i] ?? 0
      if ((otherWord & thisWord) !== otherWord) return false
    }
    return true
  }
}
