const DEFAULT_SIZE = 1024
const DEFAULT_HASH_COUNT = 4

const hashString = (value, seed, size) => {
  let hash = 2166136261 ^ seed

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return Math.abs(hash) % size
}

export class BloomFilter {
  constructor(size = DEFAULT_SIZE, hashCount = DEFAULT_HASH_COUNT) {
    this.size = size
    this.hashCount = hashCount
    this.bits = new Uint8Array(size)
  }

  add(value) {
    const item = String(value || '').toLowerCase()
    if (!item) return

    for (let seed = 0; seed < this.hashCount; seed += 1) {
      this.bits[hashString(item, seed, this.size)] = 1
    }
  }

  mightContain(value) {
    const item = String(value || '').toLowerCase()
    if (!item) return false

    for (let seed = 0; seed < this.hashCount; seed += 1) {
      if (!this.bits[hashString(item, seed, this.size)]) {
        return false
      }
    }

    return true
  }
}

export const tokenizeForSearch = (value) => (
  String(value || '')
    .toLowerCase()
    .match(/[a-z0-9]+/g) || []
)
