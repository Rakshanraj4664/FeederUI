import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function GlowingCard({
  children,
  className = '',
  active = false,
  pulse = false,
  glowColor = 'cyan'
}: {
  children: ReactNode
  className?: string
  active?: boolean
  pulse?: boolean
  glowColor?: 'cyan' | 'amber' | 'emerald'
}) {
  const glowClass =
    glowColor === 'cyan'
      ? 'neon-glow-cyan'
      : glowColor === 'amber'
        ? 'neon-glow-amber'
        : 'neon-glow-emerald'

  return (
    <motion.div
      className={`rounded-2xl glass-panel-strong ${glowClass} ${className} ${
        active ? 'ring-2 ring-cyan-400/40' : ''
      }`}
      animate={
        pulse
          ? {
              boxShadow: [
                '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
                '0 4px 32px rgba(6,182,212,0.15), 0 1px 8px rgba(6,182,212,0.08)',
                '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)'
              ]
            }
          : {}
      }
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}
