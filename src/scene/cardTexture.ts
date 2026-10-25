import * as THREE from 'three'
import type { KeyEvent } from '../../shared/schemas'

export const CARD_W = 600
export const CARD_H = 840
export const CARD_ASPECT = CARD_W / CARD_H

const PAD = 44

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Greedy word wrap, with an ellipsis on the last line if the text overflows. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i]
    if (ctx.measureText(next).width <= maxWidth) {
      line = next
      continue
    }
    if (line) lines.push(line)
    line = words[i]
    if (lines.length === maxLines) {
      line = ''
      break
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  const used = lines.join(' ').split(/\s+/).length
  if (used < words.length && lines.length) {
    let last = lines[lines.length - 1]
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    lines[lines.length - 1] = `${last.trimEnd()}…`
  }
  return lines
}

function frame(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CARD_W, CARD_H)
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H)
  bg.addColorStop(0, 'rgba(16, 34, 60, 0.86)')
  bg.addColorStop(1, 'rgba(5, 10, 22, 0.9)')
  roundRect(ctx, 3, 3, CARD_W - 6, CARD_H - 6, 22)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(127, 208, 255, 0.5)'
  ctx.stroke()
  // brighter corner brackets
  ctx.strokeStyle = 'rgba(170, 225, 255, 0.95)'
  ctx.lineWidth = 3
  const c = 34
  for (const [x, y, dx, dy] of [
    [14, 14, 1, 1],
    [CARD_W - 14, 14, -1, 1],
    [14, CARD_H - 14, 1, -1],
    [CARD_W - 14, CARD_H - 14, -1, -1],
  ]) {
    ctx.beginPath()
    ctx.moveTo(x, y + dy * c)
    ctx.lineTo(x, y)
    ctx.lineTo(x + dx * c, y)
    ctx.stroke()
  }
}

export function drawEventCard(canvas: HTMLCanvasElement, event: KeyEvent, index: number) {
  const ctx = canvas.getContext('2d')!
  frame(ctx)
  const inner = CARD_W - PAD * 2

  ctx.textBaseline = 'alphabetic'
  ctx.font = '500 24px "IBM Plex Mono", monospace'
  ctx.fillStyle = 'rgba(127, 208, 255, 0.95)'
  ctx.fillText(String(index + 1).padStart(2, '0'), PAD, PAD + 30)
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(236, 230, 214, 0.72)'
  ctx.font = '400 21px "IBM Plex Mono", monospace'
  ctx.fillText(event.date.toUpperCase(), CARD_W - PAD, PAD + 30)
  ctx.textAlign = 'left'

  ctx.font = '600 52px "Cormorant Garamond", Georgia, serif'
  ctx.fillStyle = 'rgba(244, 238, 222, 1)'
  let y = PAD + 110
  for (const line of wrap(ctx, event.title, inner, 3)) {
    ctx.fillText(line, PAD, y)
    y += 56
  }

  y += 6
  const rule = ctx.createLinearGradient(PAD, 0, CARD_W - PAD, 0)
  rule.addColorStop(0, 'rgba(232, 182, 90, 0.8)')
  rule.addColorStop(1, 'rgba(232, 182, 90, 0)')
  ctx.fillStyle = rule
  ctx.fillRect(PAD, y, inner, 2)
  y += 46

  ctx.font = '400 25px Manrope, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(236, 230, 214, 0.8)'
  const room = Math.max(3, Math.floor((CARD_H - 150 - y) / 36))
  for (const line of wrap(ctx, event.summary, inner, room)) {
    ctx.fillText(line, PAD, y)
    y += 36
  }

  // impact score as ten segments
  const base = CARD_H - PAD - 10
  ctx.font = '500 19px "IBM Plex Mono", monospace'
  ctx.fillStyle = 'rgba(143, 138, 126, 1)'
  ctx.fillText('IMPACT HISTORIQUE', PAD, base - 34)
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(232, 182, 90, 1)'
  ctx.fillText(`${event.impactScore}/10`, CARD_W - PAD, base - 34)
  ctx.textAlign = 'left'
  const gap = 6
  const seg = (inner - gap * 9) / 10
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i < event.impactScore ? 'rgba(232, 182, 90, 0.95)' : 'rgba(236, 230, 214, 0.12)'
    ctx.fillRect(PAD + i * (seg + gap), base - 14, seg, 10)
  }
}

export function drawPlaceholderCard(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  frame(ctx)
  ctx.fillStyle = 'rgba(127, 208, 255, 0.1)'
  const inner = CARD_W - PAD * 2
  for (const [y, w] of [
    [PAD + 90, 0.8],
    [PAD + 146, 0.55],
    [PAD + 260, 1],
    [PAD + 300, 0.92],
    [PAD + 340, 0.96],
    [PAD + 380, 0.7],
  ]) {
    ctx.fillRect(PAD, y, inner * w, 22)
  }
}

export function makeCardTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return { canvas, texture }
}
