"use client"

import React, { useEffect, useRef, useState } from 'react'
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
    { id: 'm1', role: 'system', text: 'You are a clinical assistant. Use patient context to answer.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight })
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const userMsg: Message = { id: String(Date.now()), role: 'user', text: input }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    // Simulate a response — this would be replaced by server/AI call
    await new Promise((r) => setTimeout(r, 700))
    const reply: Message = { id: String(Date.now() + 1), role: 'assistant', text: 'Stub response: query received. (Replace with real backend)' }
    setMessages((m) => [...m, reply])
    setLoading(false)
  }

  const launchQuery = () => {
    // placeholder for 'launching' a structured query into patient data
    const sys: Message = { id: String(Date.now()), role: 'assistant', text: 'Launched patient-data query (stub). Results will appear here.' }
    setMessages((m) => [...m, sys])
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-sm text-slate-300 hover:underline">Back</Link>
          <h1 className="text-2xl font-semibold">Doctor Chat</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 h-[60vh] flex flex-col bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Clinical Assistant</CardTitle>
              <CardDescription>Ask questions about the current patient or launch structured queries.</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 p-0">
              <div ref={scrollerRef} className="h-full overflow-auto p-4 flex flex-col gap-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] p-3 rounded-md ${
                      m.role === 'user'
                        ? 'bg-slate-800 text-white self-end ml-auto'
                        : m.role === 'assistant'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-600 text-slate-200'
                    }`}
                  >
                    <div className="text-sm">{m.text}</div>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                className="flex-1 rounded-lg px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none"
                placeholder="Ask about this patient's data..."
                aria-label="Chat input"
              />
              <Button variant="secondary" size="sm" onClick={launchQuery}>Launch Query</Button>
              <Button onClick={send} disabled={loading} size="sm">{loading ? 'Sending...' : 'Send'}</Button>
            </CardFooter>
          </Card>

          <Card className="h-[60vh] overflow-auto bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Patient Context</CardTitle>
              <CardDescription className="text-xs">Quick view of the current patient (stub)</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="text-sm">
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="mb-3">John Doe</dd>

                <dt className="text-xs text-muted-foreground">DOB</dt>
                <dd className="mb-3">1975-04-12</dd>

                <dt className="text-xs text-muted-foreground">Last Scan</dt>
                <dd className="mb-3">2025-10-29 — MRI</dd>

                <dt className="text-xs text-muted-foreground">Notes</dt>
                <dd className="text-xs text-muted-foreground">This panel will include vitals, recent metrics and quick-links to snapshots and 3D viewer.</dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
                                  <dd>1975-04-12</dd>
