import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const OUT_DIR = new URL('../public/icons/', import.meta.url)
mkdirSync(OUT_DIR, { recursive: true })

function svgIcon(size) {
  const fontSize = Math.round(size * 0.5)
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#1c1917"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
    font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#7c9885">D</text>
</svg>`
}

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const { file, size } of targets) {
  await sharp(Buffer.from(svgIcon(size))).png().toFile(fileURLToPath(new URL(file, OUT_DIR)))
  console.log(`generated ${file}`)
}
