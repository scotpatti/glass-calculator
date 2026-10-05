// Fails if the built JavaScript exceeds the size budget (E9-S5).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_KB = 100
const assets = join(import.meta.dirname, '..', 'dist', 'assets')

const bytes = readdirSync(assets)
  .filter((file) => file.endsWith('.js'))
  .reduce((total, file) => total + gzipSync(readFileSync(join(assets, file))).length, 0)

const kb = bytes / 1024
console.log(`JavaScript: ${kb.toFixed(1)} kB gzipped (budget ${BUDGET_KB} kB)`)
if (kb > BUDGET_KB) process.exit(1)
