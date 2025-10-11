import { ReactNode } from 'react'

export default function SideNav({ children }: { children: ReactNode }) {
  return (
    <aside className="w-60 border-r bg-white p-4">
      <div className="text-xl font-bold mb-4">Stock Control</div>
      {children}
    </aside>
  )
}
