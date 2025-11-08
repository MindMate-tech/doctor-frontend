"use client"

import { Button } from '@/components/ui/button'
import { ArrowRight, Activity } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['700'],
  display: 'swap',
})

export default function HeroSection() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Container with rounded corners */}
      <div
        className="relative w-full max-w-7xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-in"
        style={{
          backgroundImage: 'url(/hero-mindmate.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '85vh',
        }}
      >
        {/* Overlay for better text readability - Figma-style frosted glass */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/3 to-slate-900/30 backdrop-blur-md" />

        {/* Radial gradient overlay that blends edges to background color (slate-950: #020617) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at center, transparent 0%, transparent 30%, rgba(2, 6, 23, 0.3) 60%, rgba(2, 6, 23, 0.7) 80%, rgb(2, 6, 23) 100%)'
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full min-h-[85vh]">
          {/* Navigation */}
          <nav className="flex items-center justify-between px-6 sm:px-10 lg:px-12 py-6 animate-slide-down">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-mindmate.png"
                alt="MindMate Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
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

              {/* CTA Button */}
              <div className="flex items-center justify-center pt-4">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-white/90 font-semibold text-lg px-8 py-6 shadow-2xl hover:shadow-white/20 transition-all hover:scale-105"
                  asChild
                >
                  <Link href="/dashboard" className="flex items-center gap-2">
                    View Live Demo
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
