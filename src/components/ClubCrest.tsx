export function ClubCrest({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      role="img"
      aria-label="Blason du Football Club Plouha"
    >
      <path
        d="M50 2 L96 16 V56 C96 90 76 108 50 118 C24 108 4 90 4 56 V16 Z"
        fill="#0c2a4d"
        stroke="#f5c518"
        strokeWidth="3"
      />
      <path
        d="M50 10 L88 21 V56 C88 84 71 100 50 109 C29 100 12 84 12 56 V21 Z"
        fill="#1d4f91"
      />
      <path d="M12 56 L50 40 L88 56 L50 109 Z" fill="#c8202f" opacity="0.85" />
      <path
        d="M50 34 L62 46 L50 82 L38 46 Z"
        fill="#f5c518"
      />
      <text
        x="50"
        y="30"
        textAnchor="middle"
        fontFamily="Anton, sans-serif"
        fontSize="13"
        fill="#f5c518"
      >
        FCP
      </text>
    </svg>
  )
}
