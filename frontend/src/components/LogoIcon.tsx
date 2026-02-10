import type { SVGProps } from 'react'

interface LogoIconProps extends SVGProps<SVGSVGElement> {
  /** Use 'white' on dark backgrounds (e.g. footer) */
  variant?: 'default' | 'white'
}

export default function LogoIcon({ variant = 'default', className, ...props }: LogoIconProps) {
  const dropFill = variant === 'white' ? 'white' : '#0f5132'
  const checkStroke = variant === 'white' ? '#052e16' : 'white'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M16 4c0 0-8 10-8 16a8 8 0 0 0 16 0c0-6-8-16-8-16z"
        fill={dropFill}
      />
      <path
        d="M11 16l3 3 7-7"
        stroke={checkStroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
