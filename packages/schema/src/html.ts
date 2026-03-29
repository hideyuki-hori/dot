export interface WorkMeta {
  id: string
  title: string
  description: string
  ogImage: string
  studies?: string[]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapEntryAsGlobal(entryScript: string): string {
  return entryScript.replace(
    /export\s*\{\s*(\w+)\s+as\s+work\s*\}\s*;?\s*$/,
    'globalThis.__DOT_WORK__ = $1;'
  )
}

export function renderPage(meta: WorkMeta, entryScript: string, shellScript: string): string {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const wrappedEntry = wrapEntryAsGlobal(entryScript)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — dot</title>
  <meta property="og:title" content="${title} — dot">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${meta.ogImage}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; color: #fff; font-family: monospace; }
    canvas { width: 100%; height: 100vh; display: block; }
    #main { display: none; padding: 2rem; }
    body.page canvas { display: none; }
    body.page #main { display: block; }
    #studies { display: flex; gap: 8px; padding: 8px; flex-wrap: wrap; }
    #studies canvas { width: 300px; height: 300px; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="studies">
  ${(meta.studies ?? []).map(name => `<canvas data-study="${escapeHtml(name)}"></canvas>`).join('\n  ')}
  </div>
  <div id="main"></div>
  <script type="module">${wrappedEntry}</script>
  <script type="module">${shellScript}</script>
</body>
</html>`
}

export function renderFragment(meta: WorkMeta, entryScript: string): string {
  return `<canvas id="canvas"></canvas>
<div id="studies">
${(meta.studies ?? []).map(name => `<canvas data-study="${escapeHtml(name)}"></canvas>`).join('\n')}
</div>
<script type="module">${entryScript}</script>`
}
