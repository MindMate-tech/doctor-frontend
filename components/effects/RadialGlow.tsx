"use client"

import { useEffect, useState } from 'react'

interface RadialGlowProps {
  /** Enable/disable the animation */
  enabled?: boolean
  /** Intensity of the glow (0-1) */
  intensity?: number
  /** Primary glow color */
  primaryColor?: string
  /** Secondary glow color */
  secondaryColor?: string
}

export default function RadialGlow({
  enabled = true,
  intensity = 1,
  primaryColor = 'rgba(255, 255, 255, 0.15)',
  secondaryColor = 'rgba(100, 200, 255, 0.1)'
}: RadialGlowProps) {
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

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large slow pulse - Base atmosphere */}
      <div
        className={`absolute inset-0 ${shouldAnimate ? 'animate-radial-pulse-slow' : ''}`}
        style={{
          background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 50%)`,
          opacity: intensity * 0.6,
        }}
      />

      {/* Medium pulse - Mid layer */}
      <div
        className={`absolute inset-0 ${shouldAnimate ? 'animate-radial-pulse-medium' : ''}`}
        style={{
          background: `radial-gradient(circle at center, ${secondaryColor} 0%, transparent 40%)`,
          opacity: intensity * 0.8,
        }}
      />

      {/* Fast pulse - Core glow */}
      <div
        className={`absolute inset-0 ${shouldAnimate ? 'animate-radial-pulse-fast' : ''}`}
        style={{
          background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 30%)`,
          opacity: intensity,
        }}
      />

      {/* Rotating rays */}
      <div
        className={`absolute inset-0 ${shouldAnimate ? 'animate-rotate-slow' : ''}`}
        style={{
          opacity: intensity * 0.3,
        }}
      >
        {/* Create 8 light rays emanating from center */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              width: '50%',
              height: '2px',
              transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
              background: `linear-gradient(to right, ${primaryColor}, transparent)`,
              filter: 'blur(2px)',
            }}
          />
        ))}
      </div>

      {/* Expanding rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {shouldAnimate && (
          <>
            <div
              className="animate-expand-ring"
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: `1px solid ${primaryColor}`,
                filter: 'blur(1px)',
              }}
            />
            <div
              className="animate-expand-ring"
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: `1px solid ${secondaryColor}`,
                filter: 'blur(1px)',
                animationDelay: '1s',
              }}
            />
            <div
              className="animate-expand-ring"
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: `1px solid ${primaryColor}`,
                filter: 'blur(1px)',
                animationDelay: '2s',
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
