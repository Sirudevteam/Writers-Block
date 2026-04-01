import PDFDocument from "pdfkit"
import { parseScreenplay } from "@/lib/screenplay-parse"
import { getScreenplayPdfFontPaths } from "@/lib/screenplay-pdf-fonts"

const DEFAULT_SITE_URL = "https://writersblock.app"

const LEFT = 72 * 1.5
const RIGHT = 72
const PAGE_W = 612
const PAGE_H = 792
const WIDTH = PAGE_W - LEFT - RIGHT
const MARGIN_TOP = 72
const MARGIN_BOTTOM = 72

function siteDisplayUrl(siteUrl: string): string {
  return siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

/**
 * Branded screenplay PDF (letter size) aligned with print template:
 * Writers Block header, title, Courier-style body with screenplay margins.
 */
export async function buildScreenplayPdfBuffer(
  title: string,
  content: string,
  siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
): Promise<Buffer> {
  const fonts = await getScreenplayPdfFontPaths()
  let fontRegular = "Courier"
  let fontBold = "Courier-Bold"
  if (fonts.regular) {
    fontRegular = "WB-Body"
    fontBold = fonts.bold ? "WB-Body-Bold" : "WB-Body"
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 0,
      autoFirstPage: true,
      bufferPages: true,
    })

    if (fonts.regular) {
      doc.registerFont("WB-Body", fonts.regular)
    }
    if (fonts.bold) {
      doc.registerFont("WB-Body-Bold", fonts.bold)
    }

    doc.on("data", (c: Buffer) => chunks.push(c))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    let y = MARGIN_TOP
    const bottom = PAGE_H - MARGIN_BOTTOM

    const newPage = () => {
      doc.addPage()
      y = MARGIN_TOP
    }

    const ensureSpace = (needed: number) => {
      if (y + needed > bottom) {
        newPage()
      }
    }

    const display = siteDisplayUrl(siteUrl)

    // ── Header (sans look via Helvetica; brand is English-only) ──
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#1a1a1a").text("Writers Block", LEFT, y)
    y += 20
    doc.font("Helvetica").fontSize(9).fillColor("#333333").text(`AI screenplay writing — ${display}`, LEFT, y, {
      width: WIDTH,
    })
    y = doc.y + 10
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000000").text(title, LEFT, y, { width: WIDTH })
    y = doc.y + 14
    doc.moveTo(LEFT, y).lineTo(PAGE_W - RIGHT, y).strokeColor("#222222").lineWidth(0.5).stroke()
    y += 18

    doc.fillColor("#000000")

    const lines = parseScreenplay(content)

    for (const line of lines) {
      switch (line.type) {
        case "empty":
          y += 10
          break

        case "scene-heading": {
          ensureSpace(36)
          doc.font(fontBold).fontSize(12)
          doc.text(line.text.toUpperCase(), LEFT, y, { width: WIDTH, lineGap: 2 })
          y = doc.y + 14
          break
        }

        case "transition": {
          ensureSpace(32)
          doc.font(fontBold).fontSize(12)
          doc.text(line.text.toUpperCase(), LEFT, y, { width: WIDTH, align: "right", lineGap: 2 })
          y = doc.y + 14
          break
        }

        case "character": {
          ensureSpace(28)
          doc.font(fontBold).fontSize(12)
          const cx = LEFT + 72 * 2.2
          doc.text(line.text.toUpperCase(), cx, y, { width: Math.max(80, PAGE_W - RIGHT - cx), lineGap: 2 })
          y = doc.y + 8
          break
        }

        case "parenthetical": {
          ensureSpace(26)
          doc.font(fontRegular).fontSize(12)
          const px = LEFT + 72 * 1.6
          doc.text(line.text, px, y, { width: Math.max(80, PAGE_W - RIGHT - px), lineGap: 2 })
          y = doc.y + 6
          break
        }

        case "dialogue": {
          ensureSpace(40)
          doc.font(fontRegular).fontSize(12)
          const dx = LEFT + 72 * 1.0
          const dWidth = WIDTH - (dx - LEFT) - 72
          doc.text(line.text, dx, y, { width: Math.max(80, dWidth), lineGap: 3 })
          y = doc.y + 12
          break
        }

        case "title": {
          ensureSpace(36)
          doc.font(fontBold).fontSize(14)
          doc.text(line.text, LEFT, y, { width: WIDTH, align: "center", lineGap: 2 })
          y = doc.y + 16
          break
        }

        default: {
          ensureSpace(40)
          doc.font(fontRegular).fontSize(12)
          doc.text(line.text, LEFT, y, { width: WIDTH, lineGap: 3 })
          y = doc.y + 12
        }
      }
    }

    // Footer on each page
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      doc.font("Helvetica").fontSize(8).fillColor("#444444")
      doc.text(`Created with Writers Block · ${display}`, LEFT, PAGE_H - 48, {
        width: WIDTH,
        align: "center",
      })
    }

    doc.end()
  })
}
