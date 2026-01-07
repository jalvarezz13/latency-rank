export interface PingResult {
  duration: number // in milliseconds
  timestamp: number
  status: 'success' | 'error'
}

export interface DomainStats {
  id: string
  url: string
  pings: PingResult[]
  averageLatency: number | null // null if no successful pings yet
  minLatency: number | null
  maxLatency: number | null
  status: 'idle' | 'pinging' | 'completed' | 'error'
  progress: number // 0 to 100
}

const AppState = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
} as const

type AppState = (typeof AppState)[keyof typeof AppState]

export { AppState }

export const MAX_PINGS_PER_DOMAIN = 5
