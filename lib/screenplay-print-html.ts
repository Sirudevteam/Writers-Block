import { parseScreenplay } from "@/lib/screenplay-parse"

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const DEFAULT_SITE_URL = "https://writersblock.app"

/** HTML document for browser print / Save as PDF (matches branded template). */
export function generatePrintHTML(
  content: string,
  title: string = "Screenplay",
  siteUrl: string = DEFAULT_SITE_URL
): string {
  const html: string[] = []
  for (const line of parseScreenplay(content)) {
    switch (line.type) {
      case "empty":
        html.push('<div style="height: 12px;"></div>')
        break
      case "scene-heading":
        html.push(`<p class="sh">${escapeHtml(line.text)}</p>`)
        break
      case "transition":
        html.push(`<p class="tr">${escapeHtml(line.text)}</p>`)
        break
      case "parenthetical":
        html.push(`<p class="pa">${escapeHtml(line.text)}</p>`)
        break
      case "dialogue":
        html.push(`<p class="dl">${escapeHtml(line.text)}</p>`)
        break
      case "character":
        html.push(`<p class="ch">${escapeHtml(line.text)}</p>`)
        break
      case "title":
        html.push(`<p class="tl">${escapeHtml(line.text)}</p>`)
        break
      default:
        html.push(`<p class="ac">${escapeHtml(line.text)}</p>`)
    }
  }

  const displayUrl = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — Writers Block</title>
  <style>
    @page {
      size: letter;
      margin: 1in 1in 1in 1.5in;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Courier New", Courier, "Courier Prime", monospace;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding-bottom: 0.55in;
    }

    .print-brand-header {
      font-family: system-ui, "Segoe UI", sans-serif;
      border-bottom: 1pt solid #222;
      padding-bottom: 10pt;
      margin-bottom: 18pt;
      page-break-after: avoid;
    }
    .print-brand-header .brand-name {
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #000 !important;
    }
    .print-brand-header .brand-sub {
      font-size: 9pt;
      color: #333 !important;
      margin-top: 4pt;
    }
    .print-brand-header .doc-title {
      font-size: 10pt;
      margin-top: 8pt;
      font-weight: 600;
      color: #000 !important;
    }
    .print-footer {
      position: fixed;
      bottom: 0.35in;
      left: 0;
      right: 0;
      text-align: center;
      font-family: system-ui, "Segoe UI", sans-serif;
      font-size: 8pt;
      color: #444 !important;
    }

    p {
      margin-bottom: 0;
      color: #000000 !important;
    }

    .sh {
      margin-top: 24pt;
      margin-bottom: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      page-break-after: avoid;
    }

    .ac {
      margin-bottom: 12pt;
      page-break-inside: avoid;
    }

    .ch {
      margin-top: 12pt;
      margin-bottom: 0;
      margin-left: 2.2in;
      font-weight: bold;
      text-transform: uppercase;
      page-break-after: avoid;
    }

    .pa {
      margin-left: 1.6in;
      margin-bottom: 0;
      font-style: italic;
      page-break-after: avoid;
    }

    .dl {
      margin-left: 1.0in;
      margin-right: 1.0in;
      margin-bottom: 12pt;
      page-break-inside: avoid;
    }

    .tr {
      margin-top: 12pt;
      margin-bottom: 12pt;
      text-align: right;
      text-transform: uppercase;
      page-break-after: avoid;
    }

    .tl {
      text-align: center;
      font-weight: bold;
      font-size: 14pt;
      margin: 16pt 0;
    }

    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      p {
        color: #000000 !important;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .print-footer {
        color: #444 !important;
      }
    }
  </style>
</head>
<body>
  <header class="print-brand-header">
    <div class="brand-name">Writers Block</div>
    <div class="brand-sub">AI screenplay writing — ${escapeHtml(displayUrl)}</div>
    <div class="doc-title">${escapeHtml(title)}</div>
  </header>
  <div class="screenplay-print-body">
${html.join("\n")}
  </div>
  <footer class="print-footer">Created with Writers Block · ${escapeHtml(displayUrl)}</footer>
</body>
</html>`
}
