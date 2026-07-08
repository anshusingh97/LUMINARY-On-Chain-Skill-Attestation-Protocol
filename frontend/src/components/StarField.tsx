import { useEffect, useRef } from 'react'

interface Star {
  x: number; y: number; r: number; opacity: number; twinkleSpeed: number; phase: number
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animFrame: number

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    // Generate stars
    const stars: Star[] = Array.from({ length: 200 }, () => ({
      x:            Math.random() * canvas.width,
      y:            Math.random() * canvas.height,
      r:            Math.random() * 1.5 + 0.3,
      opacity:      Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      phase:        Math.random() * Math.PI * 2,
    }))

    // Constellation connections
    const constellations = [
      [0, 5, 12, 25, 30],
      [8, 15, 22, 35, 42],
      [1, 9, 18, 28, 45],
    ]

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 1

      // Draw constellation lines
      constellations.forEach(group => {
        ctx.beginPath()
        group.forEach((si, i) => {
          const star = stars[si % stars.length]
          if (i === 0) ctx.moveTo(star.x, star.y)
          else ctx.lineTo(star.x, star.y)
        })
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.08)'
        ctx.lineWidth   = 0.5
        ctx.stroke()
      })

      // Draw stars
      stars.forEach(star => {
        const twinkle = Math.sin(t * star.twinkleSpeed + star.phase)
        const alpha   = star.opacity * (0.6 + 0.4 * twinkle)

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(232, 217, 160, ${alpha})`
        ctx.fill()

        // Glow for brighter stars
        if (star.r > 1.2) {
          const grd = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 4)
          grd.addColorStop(0, `rgba(167, 139, 250, ${alpha * 0.4})`)
          grd.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.r * 4, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
        }
      })

      animFrame = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  )
}
