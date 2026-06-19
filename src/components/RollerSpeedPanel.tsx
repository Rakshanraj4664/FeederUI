import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlowingCard } from './GlowingCard'
import { IndustrialButton } from './IndustrialButton'
import { WidthControlSection } from './WidthControlSection'

interface RollerData {
  speed: number
  enabled: boolean
  modifier: number
}

interface RollerSpeedPanelProps {
  rollers: Record<number, RollerData>
  onSpeedChange: (axis: number, speed: number) => void
  onEnabledChange: (axis: number, enabled: boolean) => void
  onModifierChange: (axis: number, value: number) => void
  plcConnected: boolean
}

const ROLLER_LABELS = ['Roller 1', 'Roller 2', 'Roller 3', 'Roller 4']
const ROLLER_REGISTERS = ['D28022 / D20002', 'D28024 / D20008', 'D28026 / D20014', 'D28028 / D20020']

function SpeedGauge({ value, enabled }: { value: number; enabled: boolean }) {
  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle cx="50" cy="50" r="40" fill="none"
          stroke={enabled ? '#06b6d4' : '#94a3b8'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 251.2} 251.2`}
          className="transition-all duration-300"
          style={{ filter: enabled ? 'drop-shadow(0 0 6px rgba(6,182,212,0.4))' : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold font-mono tracking-tight ${enabled ? 'text-slate-800' : 'text-slate-400'}`}>
          {Math.round(value)}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold">%</span>
      </div>
    </div>
  )
}

export function RollerSpeedPanel({
  rollers,
  onSpeedChange,
  onEnabledChange,
  onModifierChange,
  plcConnected,
}: RollerSpeedPanelProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [holdTimeout, setHoldTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [holdInterval, setHoldInterval] = useState<ReturnType<typeof setInterval> | null>(null)

  const currentAxis = activeTab + 1
  const current = rollers[currentAxis] ?? { speed: 0, enabled: false, modifier: 0 }

  const startHold = useCallback((axis: number, delta: number) => {
    onSpeedChange(axis, Math.max(0, Math.min(100, (rollers[axis]?.speed ?? 0) + delta)))
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        onSpeedChange(axis, Math.max(0, Math.min(100, (rollers[axis]?.speed ?? 0) + delta)))
      }, 80)
      setHoldInterval(interval)
    }, 300)
    setHoldTimeout(timeout)
  }, [rollers, onSpeedChange])

  const stopHold = useCallback(() => {
    if (holdTimeout) clearTimeout(holdTimeout)
    if (holdInterval) clearInterval(holdInterval)
    setHoldTimeout(null)
    setHoldInterval(null)
  }, [holdTimeout, holdInterval])

  return (
    <div className="w-full">
      {/* Horizontal Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {ROLLER_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`
              relative px-5 py-3 text-sm font-semibold rounded-t-xl transition-all duration-200
              ${activeTab === i
                ? 'bg-white text-cyan-600 shadow-[0_-2px_12px_rgba(6,182,212,0.1)] border border-slate-200 border-b-white z-10'
                : 'bg-slate-100/60 text-industrial-400 hover:text-industrial-600 hover:bg-slate-100 border border-transparent'
              }
            `}
          >
            {label}
            <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full transition-opacity duration-200 ${
              activeTab === i ? 'bg-cyan-400 opacity-100' : 'opacity-0'
            }`} />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/60">
          <div className={`w-2 h-2 rounded-full ${plcConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-[10px] font-mono text-slate-500">{plcConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <GlowingCard className="p-6" glowColor={current.enabled ? 'cyan' : 'amber'}>
            <div className="flex flex-col gap-6">
              {/* Top: Gauge + Info */}
              <div className="flex items-start gap-6">
                <SpeedGauge value={current.speed} enabled={current.enabled} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{ROLLER_LABELS[activeTab]}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Register: {ROLLER_REGISTERS[activeTab]}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer gap-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {current.enabled ? 'ON' : 'OFF'}
                      </span>
                      <input
                        type="checkbox"
                        checked={current.enabled}
                        onChange={(e) => onEnabledChange(currentAxis, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-slate-200 rounded-full peer peer-checked:bg-cyan-500 peer-focus:ring-2 peer-focus:ring-cyan-300 transition-colors relative">
                        <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-5`} />
                      </div>
                    </label>
                  </div>

                  {/* Speed Slider */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="label-industrial">Speed</span>
                      <span className="text-xs font-mono text-slate-500">
                        {current.speed.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onMouseDown={() => startHold(currentAxis, -1)}
                        onMouseUp={stopHold}
                        onMouseLeave={stopHold}
                        disabled={!current.enabled || current.speed <= 0}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-600 transition-all"
                      >
                        <span className="text-lg font-bold">-</span>
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={current.speed}
                          onChange={(e) => onSpeedChange(currentAxis, Number(e.target.value))}
                          disabled={!current.enabled}
                          className="w-full"
                          style={{
                            background: current.enabled
                              ? `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${current.speed}%, #e2e8f0 ${current.speed}%, #e2e8f0 100%)`
                              : '#e2e8f0'
                          }}
                        />
                      </div>
                      <button
                        onMouseDown={() => startHold(currentAxis, 1)}
                        onMouseUp={stopHold}
                        onMouseLeave={stopHold}
                        disabled={!current.enabled || current.speed >= 100}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-600 transition-all"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Speed Modifier (mc_low register) */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="label-industrial">
                        Speed Modifier — D2000{activeTab === 0 ? '2' : [8, 14, 20][activeTab]}
                      </span>
                      <span className="text-xs font-mono text-slate-500">×{current.modifier.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.01}
                      value={current.modifier}
                      onChange={(e) => onModifierChange(currentAxis, Number(e.target.value))}
                      className="w-full"
                      style={{
                        background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(current.modifier / 2) * 100}%, #e2e8f0 ${(current.modifier / 2) * 100}%, #e2e8f0 100%)`
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>0</span>
                      <span>1.0</span>
                      <span>2.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Quick Presets */}
              <div className="pt-2 border-t border-slate-200/60">
                <span className="label-industrial block mb-2">Quick Speed Presets</span>
                <div className="flex gap-2 flex-wrap">
                  {[0, 25, 50, 75, 100].map((preset) => (
                    <IndustrialButton
                      key={preset}
                      size="sm"
                      variant={current.speed === preset ? 'accent' : 'outline'}
                      onClick={() => onSpeedChange(currentAxis, preset)}
                      disabled={!current.enabled}
                    >
                      {preset}%
                    </IndustrialButton>
                  ))}
                </div>
              </div>

              {/* Width Control - Only for Roller 1 */}
              {activeTab === 0 && (
                <div className="pt-4 border-t border-slate-200/60">
                  <WidthControlSection />
                </div>
              )}
            </div>
          </GlowingCard>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
