/**
 * Applies the upstream next-themes React 19 fix (pacocoursey/next-themes#386):
 * ThemeScript must not render <script> during client render — only during SSR.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'node_modules', 'next-themes', 'dist')

const MARKER = 'if(typeof window!=="undefined")return null;'
const TARGET =
  'scriptProps:w})=>{let p=JSON.stringify'
const REPLACEMENT = `scriptProps:w})=>{${MARKER}let p=JSON.stringify`

function patchFile(filename) {
  const filePath = path.join(distDir, filename)
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-next-themes] Skipping missing file: ${filename}`)
    return false
  }

  const original = fs.readFileSync(filePath, 'utf8')
  if (original.includes(MARKER)) {
    return true
  }

  if (!original.includes(TARGET)) {
    console.warn(`[patch-next-themes] Pattern not found in ${filename} — next-themes version may have changed`)
    return false
  }

  fs.writeFileSync(filePath, original.replace(TARGET, REPLACEMENT), 'utf8')
  console.log(`[patch-next-themes] Patched ${filename} for React 19`)
  return true
}

const ok = patchFile('index.mjs') & patchFile('index.js')
if (!ok) {
  process.exitCode = 1
}
