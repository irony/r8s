import React from 'react'
import './index.css'

export function App({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="border-b px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            r8s
          </a>
          <div className="space-x-4 text-sm">
            <a href="/" className="hover:text-blue-600">
              Docs
            </a>
            <a
              href="https://github.com/r8s-io/r8s"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
