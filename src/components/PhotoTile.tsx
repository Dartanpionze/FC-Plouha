const hueStyles: Record<number, string> = {
  214: 'from-[#1d4f91] to-[#0c2a4d]',
  48: 'from-[#f5c518] to-[#d9a600]',
  0: 'from-[#c8202f] to-[#7a1119]',
}

export function PhotoTile({
  hue,
  caption,
  className = '',
}: {
  hue: number
  caption: string
  className?: string
}) {
  const gradient = hueStyles[hue] ?? hueStyles[214]
  const isYellow = hue === 48

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-25"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
      >
        <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="2" />
        <line x1="100" y1="0" x2="100" y2="200" stroke="white" strokeWidth="2" />
        <circle cx="100" cy="100" r="3" fill="white" />
      </svg>
      <span
        className={`absolute bottom-0 left-0 right-0 p-3 text-xs font-condensed font-semibold tracking-wide ${
          isYellow ? 'text-[var(--club-navy-deep)]' : 'text-white'
        } bg-gradient-to-t ${isYellow ? 'from-black/20' : 'from-black/50'} to-transparent`}
      >
        {caption}
      </span>
    </div>
  )
}
