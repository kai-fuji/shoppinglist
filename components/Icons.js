// components/Icons.js - ショッピングリストアプリ用アイコン

const base = (size, className) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className,
})

export function BellIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

export function SlidersIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="7" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function MicIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

export function PencilIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  )
}

export function AppleIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 7c-4 0-6.5 3-6 7 .4 3.2 2.4 6 4.5 6 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.1 0 4.1-2.8 4.5-6 .5-4-2-7-6-7 0 0-1 0-2 0z" />
      <path d="M12 7c0-2 1-4 3-5" />
    </svg>
  )
}

export function UserIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function SwapIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 7h13" />
      <path d="M14 3l4 4-4 4" />
      <path d="M20 17H7" />
      <path d="M10 13l-4 4 4 4" />
    </svg>
  )
}

export function CartIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <circle cx="9" cy="21" r="1.5" />
      <circle cx="19" cy="21" r="1.5" />
      <path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 7H6" />
    </svg>
  )
}

export function CheckIcon({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} strokeWidth={3}>
      <path d="M5 12l5 5L19 7" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 20, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function ChevronUpIcon({ size = 20, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M18 15l-6-6-6 6" />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 20, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function SearchIcon({ size = 20, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  )
}

export function LinkIcon({ size = 18, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  )
}

export function PlusIcon({ size = 18, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function CloseIcon({ size = 20, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function TrashIcon({ size = 18, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

export function MemoIcon({ size = 18, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  )
}

export function StoreIcon({ size = 18, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
    </svg>
  )
}

export function TagIcon({ size = 18, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <path d="M20.6 13.4L12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  )
}

export function GearIcon({ size = 18, className = '' }) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
