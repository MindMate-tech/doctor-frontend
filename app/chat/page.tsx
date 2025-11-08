"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', role: 'system', text: 'Clinical assistant ready. Ask me anything about patient data, cognitive metrics, or brain health analysis.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const userMsg: Message = { id: String(Date.now()), role: 'user', text: input }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    // Simulate a response — this would be replaced by server/AI call
    await new Promise((r) => setTimeout(r, 700))
    const reply: Message = { id: String(Date.now() + 1), role: 'assistant', text: 'This is a demo response. In production, this would connect to an AI backend to analyze patient data and provide clinical insights.' }
    setMessages((m) => [...m, reply])
    setLoading(false)
  }

  const launchQuery = () => {
    // placeholder for 'launching' a structured query into patient data
    const sys: Message = { id: String(Date.now()), role: 'assistant', text: 'Analyzing patient cognitive metrics across all brain regions... (Demo mode - connect to backend for real analysis)' }
    setMessages((m) => [...m, sys])
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Clinical Assistant</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 h-[70vh] flex flex-col bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-xl font-semibold text-white">Chat Interface</CardTitle>
              <CardDescription className="text-slate-400">
                Ask questions about patient data or launch structured queries
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
              <div ref={scrollerRef} className="h-full overflow-auto p-4 flex flex-col gap-3">
                {messages.filter(m => m.role !== 'system').length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 text-sm">Start a conversation or launch a query</p>
                  </div>
                )}
                {messages.map((m) => {
                  if (m.role === 'system') return null
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] p-3.5 rounded-lg shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        m.role === 'user'
                          ? 'bg-blue-600/90 text-white self-end ml-auto'
                          : 'bg-slate-800/80 text-slate-100 border border-slate-700/50'
                      }`}
                    >
                      <div className="text-sm leading-relaxed">{m.text}</div>
                    </div>
                  )
                })}
                {loading && (
                  <div className="max-w-[85%] p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:150ms]" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="gap-2 border-t border-slate-800 bg-slate-900/30">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                className="flex-1 rounded-lg px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ask about this patient's data..."
                aria-label="Chat input"
                disabled={loading}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={launchQuery}
                disabled={loading}
                className="hidden sm:flex"
              >
                Launch Query
              </Button>
              <Button onClick={send} disabled={loading || !input.trim()} size="sm">
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-[70vh] overflow-auto bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-lg font-semibold text-white">Patient Context</CardTitle>
              <CardDescription className="text-slate-400">Quick reference information</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Name</div>
                  <div className="text-slate-200">John Doe</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">DOB</div>
                  <div className="text-slate-200">1975-04-12</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Last Scan</div>
                  <div className="text-slate-200">2025-10-29 — MRI</div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Quick Actions</div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/patient"
                      className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      View 3D Brain Scan
                    </Link>
                    <Link
                      href="/patient/snapshots"
                      className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      View Snapshots
                    </Link>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Notes</div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    This panel displays current patient context. Connect to backend to show real-time vitals and metrics.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
