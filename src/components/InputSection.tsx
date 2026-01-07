import React, { useState } from 'react'

import { RocketLaunchIcon, ArrowPathIcon } from '@heroicons/react/24/solid'

interface InputSectionProps {
  onStart: (domains: string[]) => void
  isRunning: boolean
}

const PRESETS = [
  { name: 'Public DNS', domains: ['1.1.1.1', '8.8.8.8', '9.9.9.9', '208.67.222.222', '8.26.56.26'] },
  { name: 'FAANG', domains: ['facebook.com', 'apple.com', 'amazon.com', 'netflix.com', 'google.com'] },
  { name: 'Global News', domains: ['bbc.com', 'cnn.com', 'aljazeera.com', 'reuters.com', 'nytimes.com'] },
]

export const InputSection: React.FC<InputSectionProps> = ({ onStart, isRunning }) => {
  const [inputText, setInputText] = useState('')

  const handleStart = () => {
    const domains = inputText
      .split(/[\n,]+/) // Split by newline or comma
      .map((d) => d.trim())
      .filter((d) => d.length > 0)

    if (domains.length > 0) {
      onStart(domains)
    }
  }

  const handlePreset = (domains: string[]) => {
    setInputText(domains.join('\n'))
  }

  return (
    <div className="bg-white transition-all duration-300">
      <div className="space-y-4">
        <textarea
          className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none font-mono text-sm bg-slate-50 text-slate-700 placeholder:text-slate-400"
          placeholder="Enter domains here (one per line)"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isRunning}
        />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible pb-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold shrink-0">Presets:</span>

            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePreset(preset.domains)}
                disabled={isRunning}
                className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {preset.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleStart}
            disabled={isRunning || !inputText.trim()}
            className={`mx-auto md:mx-0 flex items-center gap-2 px-8 py-3 rounded-xl font-bold min-w-44 justify-center text-white transition-all active:scale-95 ${
              isRunning
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl shadow-slate-900/20'
            }`}
          >
            {isRunning ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <RocketLaunchIcon className="w-5 h-5" />
                <span>Run</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
