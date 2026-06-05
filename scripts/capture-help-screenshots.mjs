/**
 * Capture lesson builder help screenshots from /help-capture showcase page.
 *
 * Usage:
 *   npm run build && npm run capture:help-screenshots
 *   npm run capture:help-screenshots -- --url http://localhost:5173
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'help', 'lesson-builder')

const CAPTURES = [
  { id: 'capture-workspace-layout', file: 'workspace-layout.png' },
  { id: 'capture-canvas-chrome-stack', file: 'canvas-chrome-stack.png' },
  { id: 'capture-canvas-chrome-bento', file: 'canvas-chrome-bento.png' },
  { id: 'capture-floating-toolbar', file: 'floating-toolbar.png' },
  { id: 'capture-stack-canvas', file: 'stack-canvas.png' },
  { id: 'capture-bento-canvas', file: 'bento-canvas.png' },
  { id: 'capture-block-selected', file: 'block-selected.png' },
  { id: 'capture-sidebar-outline', file: 'sidebar-outline.png' },
  { id: 'capture-inspector-panel', file: 'inspector-panel.png' },
  { id: 'capture-empty-canvas', file: 'empty-canvas.png' },
  { id: 'capture-rich-text-toolbar', file: 'rich-text-toolbar.png' },
  { id: 'capture-student-preview', file: 'student-preview.png' },
  { id: 'capture-student-bento', file: 'student-bento.png' },
  { id: 'capture-help-copy-button', file: 'help-copy-button.png' },
]

function parseUrlArg() {
  const idx = process.argv.indexOf('--url')
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  return null
}

function startPreview() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
      cwd: ROOT,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let ready = false
    const onData = (chunk) => {
      const text = chunk.toString()
      if (!ready && text.includes('Local:')) {
        ready = true
        resolve({ child, url: 'http://127.0.0.1:4173' })
      }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('error', reject)
    setTimeout(() => {
      if (!ready) reject(new Error('Timed out waiting for vite preview'))
    }, 60000)
  })
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  let baseUrl = parseUrlArg()
  let previewProcess = null

  if (!baseUrl) {
    console.log('Starting vite preview on port 4173…')
    const started = await startPreview()
    previewProcess = started.child
    baseUrl = started.url
    await new Promise((r) => setTimeout(r, 800))
  }

  const target = `${baseUrl.replace(/\/$/, '')}/help-capture`
  console.log(`Capturing from ${target}`)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(target, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  for (const { id, file } of CAPTURES) {
    const locator = page.locator(`#${id}`)
    await locator.waitFor({ state: 'visible', timeout: 15000 })
    const outPath = path.join(OUT_DIR, file)
    await locator.screenshot({ path: outPath, animations: 'disabled' })
    console.log(`  ✓ ${file}`)
  }

  await browser.close()
  if (previewProcess) previewProcess.kill()

  console.log(`\nSaved ${CAPTURES.length} screenshots to public/help/lesson-builder/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
