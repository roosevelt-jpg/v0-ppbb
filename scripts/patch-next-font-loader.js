/**
 * Google Fonts file URLs no longer always end in .woff2. next/font then
 * crashes the production build with `Cannot read properties of null (reading '1')`.
 */
const fs = require('fs')
const path = require('path')

const needle = 'const ext = /\\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl)[1];'
const replacement =
  "const extMatch = /\\.(woff|woff2|eot|ttf|otf)(?:\\?|$)/.exec(googleFontFileUrl);\n            const ext = extMatch ? extMatch[1] : 'woff2';"

function candidates() {
  const files = [
    path.join(
      process.cwd(),
      'node_modules',
      'next',
      'dist',
      'compiled',
      '@next',
      'font',
      'dist',
      'google',
      'loader.js'
    ),
  ]
  const pnpmDir = path.join(process.cwd(), 'node_modules', '.pnpm')
  if (fs.existsSync(pnpmDir)) {
    for (const name of fs.readdirSync(pnpmDir)) {
      if (!name.startsWith('next@')) continue
      files.push(
        path.join(
          pnpmDir,
          name,
          'node_modules',
          'next',
          'dist',
          'compiled',
          '@next',
          'font',
          'dist',
          'google',
          'loader.js'
        )
      )
    }
  }
  return files
}

let patched = 0
for (const file of candidates()) {
  if (!fs.existsSync(file)) continue
  const source = fs.readFileSync(file, 'utf8')
  if (!source.includes(needle)) continue
  fs.writeFileSync(file, source.replace(needle, replacement))
  patched += 1
  console.log('[patch-next-font] updated', path.relative(process.cwd(), file))
}

if (patched === 0) {
  console.log('[patch-next-font] loader already patched or not found')
}
