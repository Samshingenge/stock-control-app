import { ReactNode } from 'react'

export default function SideNav({ children }: { children: ReactNode }) {
  return (
    <aside className="w-60 border-r bg-white dark:bg-zinc-800 dark:border-zinc-700 p-4 text-black dark:text-white">
      <div className="text-xl font-bold mb-4">Stock Control</div>
      {children}
    </aside>
  )
}
