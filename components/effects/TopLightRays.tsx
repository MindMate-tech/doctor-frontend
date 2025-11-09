"use client"

import { useEffect, useState } from 'react'

interface TopLightRaysProps {
  /** Enable/disable the animation */
  enabled?: boolean
  /** Intensity of the light rays (0-1) */
  intensity?: number
  /** Number of light rays to display */
  rayCount?: number
  /** Primary color of the rays */
  rayColor?: string
  /** Enable pulsing animation */
  pulse?: boolean
}

export default function TopLightRays({
  enabled = true,
  intensity = 1,
  rayCount = 12,
  rayColor = 'rgba(255, 255, 255, 0.1)',
  pulse = true
}: TopLightRaysProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true)

  useEffect(() => {
    // Respect user's motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldAnimate(!mediaQuery.matches && enabled)

    const handleChange = (e: MediaQueryListEvent) => {
      setShouldAnimate(!e.matches && enabled)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enabled])

  if (!enabled) return null

  // Calculate angle spread for rays
  const angleSpread = 100 // degrees to spread rays across
  const angleStep = angleSpread / (rayCount - 1)
  const startAngle = -50 // start 50 degrees to the left

  // Generate ray configurations with varied properties
  const rayConfigs = Array.from({ length: rayCount }, (_, i) => ({
    angle: startAngle + (i * angleStep),
    width: 2 + Math.random() * 4, // Narrower beams (2-6px)
    length: 80 + Math.random() * 40, // Varied length (80-120vh)
    opacity: 0.4 + Math.random() * 0.6, // Varied opacity
    delay: i * 0.15,
    blurAmount: 0.5 + Math.random() * 1, // Subtle variation in blur
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Bright light source at top */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 ${shouldAnimate && pulse ? 'animate-light-source-pulse' : ''}`}
        style={{
          top: '-5%',
          width: '40%',
          height: '20%',
          background: `radial-gradient(ellipse at center, ${rayColor.replace(/[0-9.]+\)$/, `${intensity * 0.5})`)} 0%, ${rayColor.replace(/[0-9.]+\)$/, `${intensity * 0.2})`)} 40%, transparent 70%)`,
          filter: 'blur(15px)',
        }}
      />

      {/* Light rays - layered for depth */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '-2%' }}>
        {rayConfigs.map((config, i) => (
          <div key={i}>
            {/* Outer glow layer - softer, wider */}
            <div
              className={`absolute origin-top ${shouldAnimate ? 'animate-ray-shimmer' : ''}`}
              style={{
                width: `${config.width * 2.5}px`,
                height: `${config.length}vh`,
                transform: `rotate(${config.angle}deg)`,
                background: `linear-gradient(to bottom,
                  ${rayColor.replace(/[0-9.]+\)$/, `${intensity * config.opacity * 0.3})`)} 0%,
                  ${rayColor.replace(/[0-9.]+\)$/, `${intensity * config.opacity * 0.2})`)} 30%,
                  transparent 70%)`,
                filter: `blur(${config.blurAmount * 2}px)`,
                animationDelay: shouldAnimate ? `${config.delay}s` : '0s',
                left: '0',
                top: '0',
              }}
            />

            {/* Core beam - brighter, sharper */}
            <div
              className={`absolute origin-top ${shouldAnimate ? 'animate-ray-flicker' : ''}`}
              style={{
                width: `${config.width}px`,
                height: `${config.length}vh`,
                transform: `rotate(${config.angle}deg)`,
                background: `linear-gradient(to bottom,
                  ${rayColor.replace(/[0-9.]+\)$/, `${intensity * config.opacity * 0.9})`)} 0%,
                  ${rayColor.replace(/[0-9.]+\)$/, `${intensity * config.opacity * 0.6})`)} 20%,
                  ${rayColor.replace(/[0-9.]+\)$/, `${intensity * config.opacity * 0.3})`)} 50%,
                  transparent 75%)`,
                filter: `blur(${config.blurAmount * 0.3}px)`,
                animationDelay: shouldAnimate ? `${config.delay + 0.5}s` : '0s',
                left: '0',
                top: '0',
                boxShadow: `0 0 ${config.width * 2}px ${rayColor.replace(/[0-9.]+\)$/, `${intensity * config.opacity * 0.4})`)}`,
              }}
            />

            {/* Inner highlight - very bright, thin */}
            <div
              className={`absolute origin-top ${shouldAnimate ? 'animate-ray-pulse' : ''}`}
              style={{
                width: `${config.width * 0.4}px`,
                height: `${config.length * 0.6}vh`,
                transform: `rotate(${config.angle}deg)`,
                background: `linear-gradient(to bottom,
                  ${rayColor.replace(/[0-9.]+\)$/, `${intensity * 1})`)} 0%,
                  ${rayColor.replace(/[0-9.]+\)$/, `${intensity * 0.7})`)} 30%,
                  transparent 60%)`,
                filter: 'blur(0.2px)',
                animationDelay: shouldAnimate ? `${config.delay + 1}s` : '0s',
                left: '0',
                top: '0',
              }}
            />
          </div>
        ))}
      </div>

      {/* Volumetric fog/atmosphere */}
      <div
        className={shouldAnimate ? 'animate-atmosphere-drift' : ''}
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '50%',
          background: `linear-gradient(to bottom, ${rayColor.replace(/[0-9.]+\)$/, `${intensity * 0.08})`)} 0%, transparent 100%)`,
          filter: 'blur(40px)',
        }}
      />
    </div>
  )
}
