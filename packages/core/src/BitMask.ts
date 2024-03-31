import { countOneBits, roundUpToPowerOfTwo } from "./Maths"

export class BitMask {
  private data: Uint16Array

  constructor(bitCount: number = 16) {
    const wordCount = Math.ceil(bitCount / 16)
    this.data = new Uint16Array(wordCount)
  }

  clear() {
    this.data.fill(0)
  }

  // Return the boolean value of the bit at the given index.
  get(bitIndex: number): boolean {
    const wordIndex = bitIndex >> 4 // floored division by 16
    const word = this.data[wordIndex]
    if (!word) return false

    const bit = 1 << bitIndex % 16
    return (word & bit) !== 0
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

  // Return a generator that yields the value and index of each bit.
  *bits(
    startIndex = 0,
    endIndex?: number,
  ): Generator<[boolean, number], void, unknown> {
    endIndex = endIndex ?? this.data.length * 16

    for (
      let wordIndex = startIndex >> 4; // floored division by 16
      wordIndex < this.data.length;
      wordIndex++
    ) {
      const word = this.data[wordIndex] ?? 0

      for (let bitIndex = 0; bitIndex < 16; bitIndex++) {
        const index = wordIndex * 16 + bitIndex
        if (index < startIndex) continue
        if (index >= endIndex) return

        const value = (word & (1 << bitIndex)) !== 0
        yield [value, index]
      }
    }
  }

  // Return a generator that yields the index of each "true" bit.
  *oneBits(
    startIndex = 0,
    endIndex?: number,
  ): Generator<number, void, unknown> {
    endIndex = endIndex ?? this.data.length * 16

    for (
      let wordIndex = startIndex >> 4; // floored division by 16
      wordIndex < this.data.length;
      wordIndex++
    ) {
      const word = this.data[wordIndex]
      if (!word) continue

      for (let bitIndex = 0; bitIndex < 16; bitIndex++) {
        const value = (word & (1 << bitIndex)) !== 0
        if (!value) continue

        const index = wordIndex * 16 + bitIndex
        if (index < startIndex) continue
        if (index >= endIndex) return

        yield index
      }
    }
  }

  // Return the total number of bits that are active in this mask.
  countOneBits() {
    let count = 0
    for (const word of this.data.values()) {
      count += countOneBits(word)
    }
    return count
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

  // Rotate the given range of bits to the right by the given `shiftAmount`.
  rotatedRight(shiftAmount: number, startIndex = 0, endIndex?: number) {
    endIndex = endIndex ?? this.data.length * 16
    if (endIndex <= startIndex) return this

    const rangeCount = endIndex - startIndex

    const newBits = new BitMask(this.data.length * 16)
    for (const [value, index] of this.bits()) {
      if (value === false) continue
      if (index < startIndex || index >= endIndex) {
        newBits.set(index, value)
      } else {
        let newIndex = index - shiftAmount - startIndex
        while (newIndex < 0) newIndex += rangeCount
        newIndex += startIndex
        newBits.set(newIndex, value)
      }
    }
    return newBits
  }

  // Return a number representation (interpreting the bits as a binary number).
  toNumber() {
    let number = 0
    for (const word of this.data.reverse().values()) {
      number = 65536 * number + word
    }
    return number
  }
}
