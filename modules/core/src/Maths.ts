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
