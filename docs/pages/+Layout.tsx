import React from 'react'
import { App } from '~/App'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <App>{children}</App>
}
