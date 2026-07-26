export function ClubCrest({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Blason du Football Club Plouha"
      className={`${className} object-contain`}
    />
  )
}
