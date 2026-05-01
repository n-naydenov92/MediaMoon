import type { SVGProps } from 'react'

const ICON_SIZE_BUTTON = 20
const ICON_SIZE_TOGGLE = 18

export function GoogleIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE_BUTTON}
      height={ICON_SIZE_BUTTON}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.61l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.51-1.13 2.79-2.41 3.66l3.86 3c2.26-2.09 3.57-5.17 3.57-8.9z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.13 7.13 0 0 1-.39-2.29c0-.8.14-1.57.39-2.29L1.28 6.61A11.94 11.94 0 0 0 0 12c0 1.94.46 3.78 1.28 5.39l3.99-3.1z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.86-3c-1.07.72-2.45 1.16-4.09 1.16-3.13 0-5.78-2.11-6.73-4.96l-3.99 3.1C3.26 21.31 7.31 24 12 24z"
      />
    </svg>
  )
}

export function SunIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE_TOGGLE}
      height={ICON_SIZE_TOGGLE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

export function MoonIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE_TOGGLE}
      height={ICON_SIZE_TOGGLE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
