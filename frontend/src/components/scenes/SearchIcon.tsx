export function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx={8.5} cy={8.5} r={5.5} />
      <path d="m12.7 12.7 4.3 4.3" />
    </svg>
  );
}
