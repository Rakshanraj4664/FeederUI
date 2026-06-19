import { useState, useCallback, useEffect, useRef } from 'react'
import { RollerSpeedPanel } from './components/RollerSpeedPanel'
import {
  fetchStatus,
  setSpeed,
  setEnabled,
  setModifier,
  emergencyStop,
} from './api'

interface AxisData {
  speed: number
  enabled: boolean
  modifier: number
}

function CursorGlow() {
  const [pos, setPos] = useState({ x: -500, y: -500 })

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div
      className="cursor-glow"
      style={{ left: pos.x, top: pos.y }}
    />
  )
}

function PlcStatusDot({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full transition-colors duration-300 ${
            connected ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        />
        {connected && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-30" />
        )}
      </div>
      <div className="flex flex-col">
        <span
          className={`text-xs font-semibold transition-colors duration-300 ${
            connected ? 'text-emerald-700' : 'text-red-600'
          }`}
        >
          {connected ? 'PLC Connected' : 'PLC Offline'}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {connected ? 'Delta AH-Series @ 192.168.1.100' : 'No connection'}
        </span>
      </div>
    </div>
  )
}

export default function App() {
  const [axes, setAxes] = useState<Record<number, AxisData>>({
    1: { speed: 0, enabled: false, modifier: 1.0 },
    2: { speed: 0, enabled: false, modifier: 1.0 },
    3: { speed: 0, enabled: false, modifier: 1.0 },
    4: { speed: 0, enabled: false, modifier: 1.0 },
  })
  const [connected, setConnected] = useState(false)
  const [estopActive, setEstopActive] = useState(false)
  const syncTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const updateAxis = useCallback(
    (axis: number, partial: Partial<AxisData>) => {
      setAxes((prev) => ({
        ...prev,
        [axis]: { ...prev[axis], ...partial },
      }))
    },
    [],
  )

  const handleSpeedChange = useCallback(
    async (axis: number, speed: number) => {
      updateAxis(axis, { speed })
      await setSpeed(axis, speed)
    },
    [updateAxis],
  )

  const handleEnabledChange = useCallback(
    async (axis: number, enabled: boolean) => {
      updateAxis(axis, { enabled })
      await setEnabled(axis, enabled)
    },
    [updateAxis],
  )

  const handleModifierChange = useCallback(
    async (axis: number, value: number) => {
      updateAxis(axis, { modifier: value })
      await setModifier(axis, Math.round(value * 100))
    },
    [updateAxis],
  )

  const handleEStop = useCallback(async () => {
    setEstopActive(true)
    for (const axis of [1, 2, 3, 4]) {
      updateAxis(axis, { speed: 0, enabled: false })
    }
    await emergencyStop()
    setTimeout(() => setEstopActive(false), 3000)
  }, [updateAxis])

  useEffect(() => {
    const poll = async () => {
      const status = await fetchStatus()
      setConnected(status.connected)
      if (status.connected && status.axes) {
        for (const [k, v] of Object.entries(status.axes)) {
          const axis = Number(k)
          setAxes((prev) => ({
            ...prev,
            [axis]: {
              speed: v.speed,
              enabled: v.enabled,
              modifier: prev[axis]?.modifier ?? 1.0,
            },
          }))
        }
      }
    }
    poll()
    syncTimer.current = setInterval(poll, 5000)
    return () => { if (syncTimer.current) clearInterval(syncTimer.current) }
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden relative flex flex-col select-none">
      <CursorGlow />

      {/* Header */}
      <header className="relative z-10 glass-panel border-b border-slate-200/80 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-industrial-800 flex items-center justify-center">
                <span className="text-white font-black text-sm tracking-wider">F</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-industrial-800 tracking-tight">Feeder</h1>
                <p className="text-[10px] text-industrial-400 font-mono">4-Axis Motion Control</p>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-300/60" />
            <PlcStatusDot connected={connected} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              D28022 · D28024 · D28026 · D28028
            </span>
            <button
              onClick={handleEStop}
              disabled={estopActive}
              className={`
                px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all
                ${estopActive
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-red-500/10 text-red-600 border border-red-200 hover:bg-red-500/20 active:scale-95'
                }
                disabled:opacity-60
              `}
            >
              {estopActive ? 'STOPPED' : 'E-STOP'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <RollerSpeedPanel
            rollers={axes}
            onSpeedChange={handleSpeedChange}
            onEnabledChange={handleEnabledChange}
            onModifierChange={handleModifierChange}
            plcConnected={connected}
          />
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="relative z-10 glass-panel border-t border-slate-200/80 px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="font-mono">Delta AH-Series</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="font-mono">ISPSoft v1.0</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="font-mono">
              {connected ? 'Modbus TCP · Active' : 'Modbus TCP · Idle'}
            </span>
          </div>
          <span className="font-mono">Feeder v0.1</span>
        </div>
      </footer>
    </div>
  )
}
