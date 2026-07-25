export function SectionHeading({
  eyebrow,
  title,
  align = 'left',
  dark = false,
}: {
  eyebrow: string
  title: string
  align?: 'left' | 'center'
  dark?: boolean
}) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      <span
        className={`inline-block font-condensed font-bold text-xs tracking-[0.3em] px-3 py-1 rounded-full ${
          dark
            ? 'bg-[var(--club-yellow)] text-[var(--club-navy-deep)]'
            : 'bg-[var(--club-navy)]/10 text-[var(--club-navy)]'
        }`}
      >
        {eyebrow}
      </span>
      <h2
        className={`mt-3 text-3xl sm:text-4xl ${
          dark ? 'text-white' : 'text-[var(--club-navy-deep)]'
        }`}
      >
        {title}
      </h2>
    </div>
  )
}
