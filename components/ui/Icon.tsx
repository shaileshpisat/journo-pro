interface IconProps {
  name: string
  size?: number
  color?: string
}

const PATHS: Record<string, React.ReactNode> = {
  home: (
    <path
      d="M3 9.5L8 4.5L13 9.5V14.5H10V11H6V14.5H3V9.5Z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  inbox: (
    <>
      <rect x="2" y="7" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M2 7L4.5 3H11.5L14 7" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    </>
  ),
  folder: (
    <path
      d="M2 5.5C2 4.67 2.67 4 3.5 4H6.5L8 6H12.5C13.33 6 14 6.67 14 7.5V11.5C14 12.33 13.33 13 12.5 13H3.5C2.67 13 2 12.33 2 11.5V5.5Z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
  ),
  calendar: (
    <>
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M2 7H14" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 2V4M11 2V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  chevronLeft: (
    <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevronRight: (
    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevronDown: (
    <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  x: <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
  plus: <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
  tag: (
    <>
      <path d="M2 2H8L13.5 7.5L8.5 12.5L3 7V2Z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <circle cx="5" cy="5" r="1" fill="currentColor" />
    </>
  ),
  entity: (
    <>
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M3 13C3 10.24 5.24 8 8 8C10.76 8 13 10.24 13 13" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  amount: (
    <>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M8 5V11M6.5 6.5H9C9.55 6.5 10 6.95 10 7.5C10 8.05 9.55 8.5 9 8.5H7C6.45 8.5 6 8.95 6 9.5C6 10.05 6.45 10.5 7 10.5H9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  transactions: (
    <>
      <path d="M3 5h10M3 8h10M3 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 3v4M6 5L4 3M6 5l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v4M10 13l-2 2M10 13l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M8 5V8.5L10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  alert: (
    <>
      <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <path d="M8 7V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.6" fill="currentColor" />
    </>
  ),
  edit: (
    <path d="M10 3L13 6L6 13H3V10L10 3Z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
  ),
  arrowLeft: (
    <path d="M12 8H4M4 8L7 5M4 8L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  settings: (
    <>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  trash: (
    <path
      d="M3 5h10M5 5V4a1 1 0 011-1h4a1 1 0 011 1v1M6 8v5M10 8v5M4 5l1 8h6l1-8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  archive: (
    <>
      <path d="M2 4L3 13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13L14 4H2Z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <path d="M2 4H14" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 8H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  check: (
    <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  ),
  stopwatch: (
    <>
      <circle cx="8" cy="9" r="5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M8 4V2M6.5 2h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 9V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
    </>
  ),
  pause: (
    <>
      <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor" />
      <rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor" />
    </>
  ),
  play: <path d="M5 3l9 5-9 5V3z" fill="currentColor" />,
  messageSquare: (
    <path d="M3 2H13C13.55 2 14 2.45 14 3V11C14 11.55 13.55 12 13 12H7L4 14V12H3C2.45 12 2 11.55 2 11V3C2 2.45 2.45 2 3 2Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
  ),
  barChart: (
    <>
      <rect x="2" y="10" width="3" height="4" rx="0.8" fill="currentColor" />
      <rect x="6.5" y="6" width="3" height="8" rx="0.8" fill="currentColor" />
      <rect x="11" y="2" width="3" height="12" rx="0.8" fill="currentColor" />
    </>
  ),
  pin: (
    <>
      <path d="M8 2L12 6L8 10L4 6Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      <circle cx="8" cy="2" r="1" fill="currentColor" />
    </>
  ),
  square: (
    <rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
  ),
  checkSquare: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" fill="currentColor" />
      <path d="M5 8.5L7.5 11L11 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
}

export default function Icon({ name, size = 16, color }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={color ? { color } : undefined}
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
