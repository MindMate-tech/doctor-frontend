"use client"

import { Button } from '@/components/ui/button'
import { ArrowRight, Activity } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Playfair_Display } from 'next/font/google'
import TopLightRays from '@/components/effects/TopLightRays'
import TwinklingStars from '@/components/effects/TwinklingStars'
import { useState, useEffect } from 'react'

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['700'],
  display: 'swap',
})

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden animate-fade-in"
      style={{
        backgroundImage: 'url(/hero-mindmate.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
        {/* Light rays from top - only render on client */}
        {mounted && (
          <TopLightRays
            enabled={true}
            intensity={0.9}
            rayCount={15}
            rayColor="rgba(255, 255, 255, 0.08)"
            pulse={true}
          />
        )}

        {/* Twinkling stars - only render on client */}
        {mounted && (
          <TwinklingStars
            enabled={true}
            starCount={80}
            starColor="rgba(255, 255, 255, 0.9)"
            starSize={2}
            twinkle={true}
          />
        )}

        {/* Overlay for better text readability - Figma-style frosted glass */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/3 to-slate-900/30 backdrop-blur-md" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full min-h-screen">
          {/* Navigation */}
          <nav className="flex items-center justify-between px-6 sm:px-10 lg:px-12 py-6 animate-slide-down">
            <div className="flex items-center gap-3">

            </div>


            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                className="bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg"
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </nav>

          {/* Hero Content - Centered */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 text-center py-16">
            <div className="max-w-4xl space-y-8 animate-fade-in-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                <Activity className="w-4 h-4" />
                <span>AI-Powered Cognitive Health Monitoring</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-2xl" style={{ textShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 2px 10px rgba(0, 0, 0, 0.3)' }}>
                Illuminate the Path to
                <br />
                <span className={`${playfair.className} text-white`}>
                  Cognitive Wellness
                </span>
              </h1>

              {/* CTA Buttons */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-white/90 font-semibold text-lg px-8 py-6 shadow-2xl hover:shadow-white/20 transition-all hover:scale-105"
                  asChild
                >
                  <Link href="/dashboard" className="flex items-center gap-2">
                    View Doctor Demo
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-white/90 font-semibold text-lg px-8 py-6 shadow-2xl hover:shadow-white/20 transition-all hover:scale-105"
                  asChild
                >
                  <Link href="https://mindmate-patient.vercel.app/" className="flex items-center gap-2">
                    View Patient Demo
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

        </div>
    </div>
  )
}
