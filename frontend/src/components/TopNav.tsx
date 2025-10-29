import AccountDropdown from './AccountDropdown'

export default function TopNav() {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-lg font-semibold text-white shadow-md">
          S
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-white">Stock Control</span>
      </div>
      <AccountDropdown />
    </header>
  )
}
