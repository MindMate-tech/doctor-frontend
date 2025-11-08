"use client"

import { Brain, LineChart, Zap, Shield, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Brain,
    title: '3D Brain Visualization',
    description: 'Interactive 8,000-point brain models with real-time region highlighting and cognitive health mapping.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: LineChart,
    title: 'Advanced Analytics',
    description: 'Track cognitive metrics over time with detailed charts, trends, and predictive insights.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'Real-Time Monitoring',
    description: 'Live updates every 10 seconds with instant alerts for significant cognitive changes.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Shield,
    title: 'HIPAA Compliant',
    description: 'Enterprise-grade security with end-to-end encryption and complete patient data privacy.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    title: 'Multi-Patient Dashboard',
    description: 'Manage multiple patients efficiently with customizable views and priority alerts.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: TrendingUp,
    title: 'Decline Detection',
    description: 'AI-powered early warning system identifies cognitive decline patterns before clinical symptoms.',
    color: 'from-yellow-500 to-orange-500',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Powerful Features for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {' '}Better Care
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need to monitor, analyze, and improve cognitive health outcomes
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 backdrop-blur-sm group"
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">Ready to transform cognitive care?</span>
          </div>
        </div>
      </div>
    </section>
  )
}
