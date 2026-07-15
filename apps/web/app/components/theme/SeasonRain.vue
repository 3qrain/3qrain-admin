<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Drop {
  x: number
  y: number
  length: number
  speed: number
  width: number
  alpha: number
}

const canvas = ref<HTMLCanvasElement | null>(null)

let context: CanvasRenderingContext2D | null = null
let drops: Drop[] = []
let frame = 0
let lastTime = 0
let width = 0
let height = 0
let color = 'rgb(105 116 124)'
let opacity = 0.2
let density = 0.75
let observer: MutationObserver | null = null
let mediaQuery: MediaQueryList | null = null

function randomDrop(fromTop = false): Drop {
  return {
    x: Math.random() * width,
    y: fromTop ? Math.random() * height : -20 - Math.random() * height * 0.3,
    length: 8 + Math.random() * 14,
    speed: 230 + Math.random() * 260,
    width: Math.random() > 0.86 ? 1.15 : 0.65,
    alpha: 0.35 + Math.random() * 0.55
  }
}

function readTheme() {
  const styles = getComputedStyle(document.documentElement)
  color = styles.getPropertyValue('--rain-color').trim() || color
  opacity = Number(styles.getPropertyValue('--rain-opacity').trim()) || 0.2
  density = Number(styles.getPropertyValue('--rain-density').trim()) || 0.75
  createDrops()
}

function createDrops() {
  const area = width * height
  const count = Math.max(18, Math.min(130, Math.round((area / 12_000) * density)))
  drops = Array.from({ length: count }, () => randomDrop(true))
}

function resize() {
  if (!canvas.value) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight
  canvas.value.width = Math.round(width * ratio)
  canvas.value.height = Math.round(height * ratio)
  canvas.value.style.width = `${width}px`
  canvas.value.style.height = `${height}px`
  context = canvas.value.getContext('2d')
  context?.setTransform(ratio, 0, 0, ratio, 0, 0)
  createDrops()
}

function draw(time: number) {
  if (!context || document.hidden || mediaQuery?.matches) {
    lastTime = time
    frame = requestAnimationFrame(draw)
    return
  }

  const elapsed = Math.min((time - lastTime) / 1000 || 0, 0.05)
  lastTime = time
  context.clearRect(0, 0, width, height)
  context.strokeStyle = color
  context.lineCap = 'round'

  for (const drop of drops) {
    context.globalAlpha = drop.alpha * opacity
    context.lineWidth = drop.width
    context.beginPath()
    context.moveTo(drop.x, drop.y)
    context.lineTo(drop.x - drop.length * 0.14, drop.y + drop.length)
    context.stroke()

    drop.y += drop.speed * elapsed
    drop.x -= drop.speed * 0.018 * elapsed
    if (drop.y > height + drop.length) Object.assign(drop, randomDrop())
  }

  context.globalAlpha = 1
  frame = requestAnimationFrame(draw)
}

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  resize()
  readTheme()
  window.addEventListener('resize', resize, { passive: true })
  observer = new MutationObserver(readTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-season'] })
  frame = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('resize', resize)
  observer?.disconnect()
})
</script>

<template>
  <canvas ref="canvas" class="season-rain" aria-hidden="true" />
</template>

<style scoped>
.season-rain {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>
