export function ClubCrest({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Blason du Football Club Plouha"
      width={512}
      height={512}
      decoding="async"
      className={`${className} object-contain shrink-0`}
    />
  )
}
