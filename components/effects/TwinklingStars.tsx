"use client"

import { useEffect, useState, useMemo } from 'react'

interface TwinklingStarsProps {
  /** Enable/disable the animation */
  enabled?: boolean
  /** Number of stars to display */
  starCount?: number
  /** Star color */
  starColor?: string
  /** Base star size in pixels */
  starSize?: number
  /** Enable twinkle animation */
  twinkle?: boolean
}

export default function TwinklingStars({
  enabled = true,
  starCount = 50,
  starColor = 'rgba(255, 255, 255, 0.8)',
  starSize = 2,
  twinkle = true
}: TwinklingStarsProps) {
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

  // Generate star configurations - memoized so they don't change on re-render
  const starConfigs = useMemo(() => {
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      // Random position across the viewport
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      // Varied size (0.5x to 2x base size)
      size: starSize * (0.5 + Math.random() * 1.5),
      // Random animation duration (2-5 seconds)
      duration: 2 + Math.random() * 3,
      // Random animation delay (0-4 seconds)
      delay: Math.random() * 4,
      // Random opacity variation
      minOpacity: 0.2 + Math.random() * 0.3,
      maxOpacity: 0.7 + Math.random() * 0.3,
      // Random glow intensity
      glowSize: 2 + Math.random() * 4,
    }))
  }, [starCount, starSize])

  if (!enabled) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {starConfigs.map((star) => (
        <div
          key={star.id}
          className={shouldAnimate && twinkle ? 'animate-star-twinkle' : ''}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            backgroundColor: starColor,
            boxShadow: `
              0 0 ${star.glowSize}px ${starColor},
              0 0 ${star.glowSize * 2}px ${starColor.replace(/[0-9.]+\)$/, '0.3)')},
              0 0 ${star.glowSize * 3}px ${starColor.replace(/[0-9.]+\)$/, '0.1)')}
            `,
            animation: shouldAnimate && twinkle
              ? `star-twinkle-${star.id % 3} ${star.duration}s ease-in-out ${star.delay}s infinite`
              : 'none',
            '--min-opacity': star.minOpacity,
            '--max-opacity': star.maxOpacity,
          } as React.CSSProperties}
        />
      ))}

      {/* Add some larger, more prominent stars */}
      {Array.from({ length: Math.floor(starCount / 10) }, (_, i) => {
        const prominentStar = {
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: starSize * (2 + Math.random() * 2),
          duration: 3 + Math.random() * 2,
          delay: Math.random() * 3,
        }

        return (
          <div
            key={`prominent-${i}`}
            className={shouldAnimate && twinkle ? 'animate-star-pulse' : ''}
            style={{
              position: 'absolute',
              left: `${prominentStar.x}%`,
              top: `${prominentStar.y}%`,
              width: `${prominentStar.size}px`,
              height: `${prominentStar.size}px`,
              animation: shouldAnimate && twinkle
                ? `star-pulse ${prominentStar.duration}s ease-in-out ${prominentStar.delay}s infinite`
                : 'none',
            }}
          >
            {/* Star shape using overlapping divs */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: starColor,
                boxShadow: `
                  0 0 ${prominentStar.size}px ${starColor},
                  0 0 ${prominentStar.size * 2}px ${starColor.replace(/[0-9.]+\)$/, '0.4)')},
                  0 0 ${prominentStar.size * 3}px ${starColor.replace(/[0-9.]+\)$/, '0.2)')}
                `,
              }}
            />
            {/* Four-point star effect */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '20%',
                top: '40%',
                left: '0',
                backgroundColor: starColor,
                filter: 'blur(0.5px)',
                boxShadow: `0 0 ${prominentStar.size * 0.5}px ${starColor}`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '20%',
                height: '100%',
                left: '40%',
                top: '0',
                backgroundColor: starColor,
                filter: 'blur(0.5px)',
                boxShadow: `0 0 ${prominentStar.size * 0.5}px ${starColor}`,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
