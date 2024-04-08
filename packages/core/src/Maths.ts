export function clampToRange(
  value: number,
  config: { readonly min: number; readonly max: number },
) {
  if (value < config.min) return config.min
  if (value > config.max) return config.max
  return value
}

const DEG_RAD = Math.PI / 180
export function toRadians(deg: number): number {
  return deg * DEG_RAD
}

const RAD_DEG = 180 / Math.PI
export function toDegrees(rad: number): number {
  return rad * RAD_DEG
}

export function roundUpToPowerOfTwo(x: number) {
  const sign = x < 0 ? -1 : 1
  x = x * sign

  x = x - 1
  x = x | (x >> 1)
  x = x | (x >> 2)
  x = x | (x >> 4)
  x = x | (x >> 8)
  x = x | (x >> 16)
  x = x | (x >> 32)
  x = x + 1

  return x * sign
}

export function isPowerOfTwo(x: number) {
  return (x & (x - 1)) === 0
}

export function countOneBits(v: number) {
  // See Bit Twiddling Hack "Counting bits set, in parallel", from
  // https://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel
  v = v - ((v >> 1) & 0x55555555)
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333)
  return (((v + (v >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24
}
