import React, { useState, useCallback, useRef, useEffect } from 'react'

import { v4 as uuidv4 } from 'uuid'
import { BoltIcon } from '@heroicons/react/24/solid'

import { ResultsList } from './components/ResultsList'
import { InputSection } from './components/InputSection'
import { measureLatency } from './services/latencyService'
import { type DomainStats, type PingResult, MAX_PINGS_PER_DOMAIN, AppState } from './types'

const App: React.FC = () => {
  const [stats, setStats] = useState<DomainStats[]>([])
  const [appState, setAppState] = useState<AppState>(AppState.IDLE)
  const abortControllerRef = useRef<AbortController | null>(null)

  const updateDomainStat = (id: string, updater: (prev: DomainStats) => DomainStats) => {
    setStats((prev) => prev.map((s) => (s.id === id ? updater(s) : s)))
  }

  const processDomain = async (domainStat: DomainStats) => {
    for (let i = 0; i < MAX_PINGS_PER_DOMAIN; i++) {
      if (abortControllerRef.current?.signal.aborted) break

      try {
        const duration = await measureLatency(domainStat.url)

        updateDomainStat(domainStat.id, (prev) => {
          const newPings: PingResult[] = [...prev.pings, { duration, timestamp: Date.now(), status: 'success' }]
          const validDurations = newPings.filter((p) => p.status === 'success').map((p) => p.duration)
          const avg = validDurations.reduce((a, b) => a + b, 0) / validDurations.length
          const min = Math.min(...validDurations)
          const max = Math.max(...validDurations)

          return {
            ...prev,
            pings: newPings,
            averageLatency: avg,
            minLatency: min,
            maxLatency: max,
            progress: ((i + 1) / MAX_PINGS_PER_DOMAIN) * 100,
            status: i === MAX_PINGS_PER_DOMAIN - 1 ? 'completed' : 'pinging',
          }
        })

        // Small delay between pings to avoid choking
        await new Promise((r) => setTimeout(r, 200))
      } catch {
        updateDomainStat(domainStat.id, (prev) => ({
          ...prev,
          status: 'error',
          progress: 100,
        }))
        break // Stop pinging this domain on error
      }
    }
  }

  const startTest = useCallback(async (domains: string[]) => {
    // Reset state
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setAppState(AppState.RUNNING)

    const initialStats: DomainStats[] = domains.map((url) => ({
      id: uuidv4(),
      url,
      pings: [],
      averageLatency: null,
      minLatency: null,
      maxLatency: null,
      status: 'idle',
      progress: 0,
    }))

    setStats(initialStats)

    // Process domains in batches of 3 to avoid browser connection limits
    const BATCH_SIZE = 3
    const workingStats = [...initialStats]

    for (let i = 0; i < workingStats.length; i += BATCH_SIZE) {
      if (abortControllerRef.current.signal.aborted) break
      const batch = workingStats.slice(i, i + BATCH_SIZE)

      // Mark batch as pinging
      batch.forEach((d) => updateDomainStat(d.id, (s) => ({ ...s, status: 'pinging' })))

      // Run parallel pings for the batch
      await Promise.all(batch.map((d) => processDomain(d)))
    }

    setAppState(AppState.COMPLETED)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-12 text-center max-w-2xl">
        <div className="inline-flex items-center justify-center p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/10 mb-3">
          <BoltIcon className="w-8 h-8 text-yellow-400" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">LatencyRank</h1>
        <p className="text-lg text-slate-600">Identify the fastest endpoints for your location</p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <InputSection onStart={startTest} isRunning={appState === AppState.RUNNING} />
        <ResultsList stats={stats} />
      </main>

      <footer className="mt-16 text-slate-400 text-sm font-medium flex flex-col items-center">
        <a href="https://github.com/jalvarezz13/latency-rank" target="_blank" className="mb-2 inline-block">
          <img
            src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white"
            alt="GitHub Badge"
            className="inline-block mb-1 rounded-2xl"
          />
        </a>
        <span>
          Made with ❤️ by&nbsp;
          <a className="underline" target="_blank" href="https://www.linkedin.com/in/jalvarezz13/">
            jalvarezz13
          </a>
        </span>
      </footer>
    </div>
  )
}

export default App
