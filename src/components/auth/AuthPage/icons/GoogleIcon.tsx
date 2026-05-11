import type { SVGProps } from 'react'

const ICON_SIZE = 20

export default function GoogleIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE}
      height={ICON_SIZE}
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
