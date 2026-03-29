export interface WorkMeta {
  id: string
  title: string
  description: string
  ogImage: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderPage(meta: WorkMeta, entryScript: string): string {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
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
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div id="main"></div>
  <script type="module" src="${entryScript}"></script>
</body>
</html>`
}

export function renderFragment(meta: WorkMeta, entryScript: string): string {
  return `<canvas id="canvas"></canvas>
<script type="module" src="${entryScript}"></script>`
}
