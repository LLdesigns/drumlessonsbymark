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
const headersContent = `/assets/*.js
  Content-Type: text/javascript; charset=utf-8

/assets/*.css
  Content-Type: text/css; charset=utf-8

/assets/*.woff2
  Content-Type: font/woff2

/assets/*.woff
  Content-Type: font/woff

/*.png
  Content-Type: image/png

/*.svg
  Content-Type: image/svg+xml

/*.webmanifest
  Content-Type: application/manifest+json
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
