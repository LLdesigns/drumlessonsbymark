import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, '../dist')

// Ensure .nojekyll file exists (disable Jekyll on GitHub Pages)
const nojekyllPath = path.join(distDir, '.nojekyll')
if (!fs.existsSync(nojekyllPath)) {
  fs.writeFileSync(nojekyllPath, '')
  console.log('Created .nojekyll file')
}

// Netlify/Cloudflare-style headers (ignored on GitHub Pages but harmless)
const headersContent = `/index.html
  Cache-Control: no-cache, must-revalidate

/pwa-sw.js
  Cache-Control: no-cache, must-revalidate

/sw.js
  Cache-Control: no-cache, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*.js
  Content-Type: text/javascript; charset=utf-8

/assets/*.css
  Content-Type: text/css; charset=utf-8

/assets/*.woff2
  Content-Type: font/woff2

/assets/*.woff
  Content-Type: font/woff

/help/*
  Cache-Control: public, max-age=86400

/*.png
  Content-Type: image/png
  Cache-Control: public, max-age=604800

/*.svg
  Content-Type: image/svg+xml
  Cache-Control: public, max-age=604800

/*.webmanifest
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=86400
`

fs.writeFileSync(path.join(distDir, '_headers'), headersContent)
console.log('Updated _headers file')

const htaccessContent = `# Disable Jekyll processing on GitHub Pages
# Correct MIME types when served via Apache-compatible hosts

AddType text/javascript .js
AddType text/css .css
AddType font/woff2 .woff2
AddType font/woff .woff
AddType image/png .png
AddType image/svg+xml .svg
AddType application/manifest+json .webmanifest
`

fs.writeFileSync(path.join(distDir, '.htaccess'), htaccessContent)
console.log('Updated .htaccess file')
console.log('MIME type fixes applied successfully')

// Ensure icon fonts exist at /assets/ (legacy cached CSS + direct requests)
const publicAssets = path.join(__dirname, '../public/assets')
const assetsDir = path.join(distDir, 'assets')
for (const file of ['bootstrap-icons.woff2', 'bootstrap-icons.woff']) {
  const fromPublic = path.join(publicAssets, file)
  const toDist = path.join(assetsDir, file)
  if (fs.existsSync(fromPublic)) {
    fs.mkdirSync(assetsDir, { recursive: true })
    fs.copyFileSync(fromPublic, toDist)
  }
}
