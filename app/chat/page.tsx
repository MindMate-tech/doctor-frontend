"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import usePatientStore from '@/store/patientStore'
import MRIAttacher from '@/components/chat/MRIAttacher'
import PatientSearch from '@/components/dashboard/PatientSearch'
import { createClient } from '@supabase/supabase-js'

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  toolsUsed?: string[]
}

type Patient = {
  id: string
  name: string
  dob?: string
  gender?: string
  createdAt: string
}

export default function ChatPage() {
  const patient = usePatientStore((state) => state.patient)
  const setPatient = usePatientStore((state) => state.setPatient)
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', role: 'system', text: 'Clinical assistant ready. Ask me anything about patient data, cognitive metrics, or brain health analysis.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  // Fetch patients from Supabase
  useEffect(() => {
    async function fetchPatients() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

        if (!supabaseUrl || !supabaseKey) {
          console.error('Missing Supabase credentials')
          setLoadingPatients(false)
          return
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data, error } = await supabase
          .from('patients')
          .select('patient_id, name, dob, gender, created_at')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Failed to fetch patients:', error)
          return
        }

        const formattedPatients: Patient[] = (data || []).map((p) => ({
          id: p.patient_id,
          name: p.name,
          dob: p.dob,
          gender: p.gender,
          createdAt: p.created_at,
        }))

        setPatients(formattedPatients)
      } catch (err) {
        console.error('Error fetching patients:', err)
      } finally {
        setLoadingPatients(false)
      }
    }

    fetchPatients()
  }, [])

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId)
    const selected = patients.find((p) => p.id === patientId)
    if (selected) {
      // Update Zustand store with selected patient
      setPatient({
        patientId: selected.id,
        patientName: selected.name,
        lastUpdated: new Date().toISOString(),
        brainRegions: {
          hippocampus: 0,
          prefrontalCortex: 0,
          brainStem: 0,
          parietalLobe: 0,
          amygdala: 0,
          cerebellum: 0,
        },
        memoryMetrics: {
          shortTermRecall: [],
          longTermRecall: [],
          semanticMemory: [],
          episodicMemory: [],
          workingMemory: [],
        },
        recentSessions: [],
        overallCognitiveScore: 0,
        memoryRetentionRate: 0,
      })
    }
  }

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const userMsg: Message = { id: String(Date.now()), role: 'user', text: input }
    setMessages((m) => [...m, userMsg])
    const queryText = input
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(
        'https://mindmate-cognitive-api.onrender.com/doctor/query',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: queryText,
            context: {
              doctor_id: 'demo-doctor-001', // TODO: Replace with actual doctor ID from auth
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      const reply: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: data.response || 'No response received from the assistant.',
        toolsUsed: data.tools_used,
      }

      setMessages((m) => [...m, reply])
    } catch (error: any) {
      console.error('Error querying doctor API:', error)
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: `Error: ${error.message || 'Failed to connect to the assistant. Please try again.'}`,
      }
      setMessages((m) => [...m, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const launchQuery = async () => {
    // Launch a predefined query to show at-risk patients
    const queryText = 'Show me all at-risk patients with cognitive decline'
    const userMsg: Message = { id: String(Date.now()), role: 'user', text: queryText }
    setMessages((m) => [...m, userMsg])
    setLoading(true)

    try {
      const response = await fetch(
        'https://mindmate-cognitive-api.onrender.com/doctor/query',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: queryText,
            context: {
              doctor_id: 'demo-doctor-001',
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      const reply: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: data.response || 'No response received from the assistant.',
        toolsUsed: data.tools_used,
      }

      setMessages((m) => [...m, reply])
    } catch (error: any) {
      console.error('Error querying doctor API:', error)
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: `Error: ${error.message || 'Failed to connect to the assistant. Please try again.'}`,
      }
      setMessages((m) => [...m, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Clinical Assistant</h1>
        </div>

        {/* Patient Selection */}
        <div className="mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Select Patient</CardTitle>
              <CardDescription className="text-slate-400">
                Choose a patient to start uploading MRIs and analyzing data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatientSearch
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={handleSelectPatient}
                isLoading={loadingPatients}
              />
            </CardContent>
          </Card>
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
                      {m.role === 'assistant' ? (
                        <div className="text-sm leading-relaxed">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="text-slate-200">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-slate-900/50 px-1.5 py-0.5 rounded text-blue-300 text-xs font-mono">{children}</code>,
                              pre: ({ children }) => <pre className="bg-slate-900/50 p-3 rounded-lg mb-2 overflow-x-auto">{children}</pre>,
                              h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-white">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-white">{children}</h3>,
                            }}
                          >
                            {m.text}
                          </ReactMarkdown>
                          {m.toolsUsed && m.toolsUsed.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-600/50">
                              <div className="text-xs text-slate-400">
                                Tools used: {m.toolsUsed.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed">{m.text}</div>
                      )}
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

            <CardFooter className="flex flex-col gap-3 border-t border-slate-800 bg-slate-900/30">
              <MRIAttacher
                patientId={selectedPatientId}
                disabledReason={!selectedPatientId ? "Select a patient above to upload MRI files" : undefined}
              />
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                  className="flex-1 rounded-lg px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ask about this patient's data..."
                  aria-label="Chat input"
                  disabled={loading}
                />
                <div className="flex gap-2">
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
                </div>
              </div>
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
                  <div className="text-slate-200">
                    {patient?.patientName ?? 'No patient selected'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Patient ID</div>
                  <div className="text-slate-200 text-xs font-mono">
                    {patient?.patientId ?? '—'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Last Update</div>
                  <div className="text-slate-200">
                    {patient ? new Date(patient.lastUpdated).toLocaleString() : '—'}
                  </div>
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
                    {patient
                      ? 'MRI uploads and agent responses will stay scoped to this patient.'
                      : 'Select a patient from the dropdown above to start uploading MRI files and analyzing data.'}
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
