import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface IndustrialButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger'
}

const variants = {
  primary:
    'bg-industrial-800 text-white border-industrial-700 hover:bg-industrial-700 shadow-md',
  secondary:
    'bg-slate-200 text-industrial-700 border-slate-300 hover:bg-slate-300 shadow-sm',
  accent:
    'bg-cyan-500 text-white border-cyan-400 hover:bg-cyan-400 shadow-md shadow-cyan-500/20',
  outline:
    'bg-transparent text-industrial-600 border-slate-300 hover:bg-slate-100 hover:border-slate-400',
  ghost:
    'bg-transparent text-industrial-500 border-transparent hover:bg-slate-100 hover:text-industrial-700',
  danger:
    'bg-rose-500 text-white border-rose-400 hover:bg-rose-400 shadow-md shadow-rose-500/20'
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-sm gap-2'
}

export function IndustrialButton({
  children,
  onClick,
  disabled = false,
  active = false,
  size = 'md',
  variant = 'primary'
}: IndustrialButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={`
        inline-flex items-center justify-center rounded-xl font-semibold
        border transition-all duration-150 select-none
        ${sizes[size]}
        ${variants[variant]}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-95'}
        ${active ? 'ring-2 ring-cyan-400/50 ring-offset-1 ring-offset-white' : ''}
      `}
    >
      {children}
    </motion.button>
  )
}
