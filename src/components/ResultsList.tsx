import React, { useMemo } from 'react'

import { GlobeAltIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

import { type DomainStats } from '../types'

interface ResultsListProps {
  stats: DomainStats[]
}

const LatencyBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const percentage = Math.min(100, Math.max(5, (value / max) * 100))

  // Color coding based on absolute latency
  let colorClass = 'bg-slate-400'
  if (value < 100) colorClass = 'bg-emerald-500'
  else if (value < 300) colorClass = 'bg-amber-400'
  else colorClass = 'bg-rose-500'

  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${colorClass} transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }} />
    </div>
  )
}

export const ResultsList: React.FC<ResultsListProps> = ({ stats }) => {
  const sortedStats = useMemo(() => {
    return [...stats].sort((a, b) => {
      // Sort by average latency (ascending). Place nulls/errors at the bottom.
      if (a.averageLatency === null && b.averageLatency === null) return 0
      if (a.averageLatency === null) return 1
      if (b.averageLatency === null) return -1
      return a.averageLatency - b.averageLatency
    })
  }, [stats])

  const maxLatency = useMemo(() => {
    return Math.max(...stats.map((s) => s.averageLatency || 0), 200) // Minimum scale of 200ms
  }, [stats])

  // Data for the mini chart
  const chartData = useMemo(() => {
    return sortedStats
      .filter((s) => s.averageLatency !== null)
      .slice(0, 10) // Top 10
      .map((s) => ({
        name: s.url,
        latency: Math.round(s.averageLatency!),
      }))
  }, [sortedStats])

  if (stats.length === 0) return null

  return (
    <div className="space-y-8 animate-fade-in-up">
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Leaderboard</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="name" hide />
                <YAxis tick={{ fontSize: 12 }} width={40} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="latency" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.latency < 100 ? '#10b981' : entry.latency < 300 ? '#fbbf24' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedStats.map((stat, idx) => (
          <div
            key={stat.id}
            className={`relative p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between
              ${stat.status === 'error' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                   ${idx === 0 && stat.averageLatency !== null ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}
                 `}
                >
                  {stat.status === 'completed' && stat.averageLatency !== null ? (
                    <span className="font-bold text-sm">#{idx + 1}</span>
                  ) : (
                    <GlobeAltIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate" title={stat.url}>
                    {stat.url}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {stat.status === 'pinging' ? 'Testing...' : stat.status === 'error' ? 'Failed' : `${stat.pings.length} checks`}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                {stat.averageLatency !== null ? (
                  <div>
                    <span
                      className={`text-2xl font-bold tracking-tight
                      ${stat.averageLatency < 100 ? 'text-emerald-600' : stat.averageLatency < 300 ? 'text-amber-500' : 'text-rose-600'}
                    `}
                    >
                      {Math.round(stat.averageLatency)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium ml-1">ms</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 font-mono">--</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {/* Progress or Latency Bar */}
              {stat.status === 'pinging' ? (
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 animate-pulse" style={{ width: `${stat.progress}%` }} />
                </div>
              ) : stat.averageLatency !== null ? (
                <LatencyBar value={stat.averageLatency} max={maxLatency} />
              ) : (
                <div className="h-1.5 w-full bg-slate-100 rounded-full" />
              )}

              {/* Detailed Stats Mini-row */}
              <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                <span>Min: {stat.minLatency ? Math.round(stat.minLatency) : '-'}</span>
                <span>Max: {stat.maxLatency ? Math.round(stat.maxLatency) : '-'}</span>
              </div>
            </div>

            {/* Status Indicator Icon */}
            <div className="absolute top-2 right-2 opacity-50">
              {stat.status === 'completed' && <CheckCircleIcon className="w-4 h-4 text-emerald-500" />}
              {stat.status === 'error' && <XCircleIcon className="w-4 h-4 text-red-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
