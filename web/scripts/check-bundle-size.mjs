import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const budgetKb = Number(process.argv[2] ?? 400)
const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

const html = readFileSync(join(distDir, 'index.html'), 'utf8')
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
const uniqueAssets = [...new Set(assets)]

if (uniqueAssets.length === 0) {
  console.error('No built assets referenced by dist/index.html. Run `pnpm build` first.')
  process.exit(1)
}

let totalKb = 0
const rows = uniqueAssets.map((asset) => {
  const bytes = readFileSync(join(distDir, asset.slice(1)))
  const kb = gzipSync(bytes).length / 1024
  totalKb += kb
  return { asset, kb }
})

rows.sort((a, b) => b.kb - a.kb)
for (const row of rows) {
  console.log(`${row.kb.toFixed(2).padStart(8)} kB  ${row.asset}`)
}

console.log(`\nInitial payload: ${totalKb.toFixed(2)} kB gzipped (budget ${budgetKb} kB).`)

if (totalKb > budgetKb) {
  console.error(`Budget exceeded by ${(totalKb - budgetKb).toFixed(2)} kB.`)
  process.exit(1)
}
