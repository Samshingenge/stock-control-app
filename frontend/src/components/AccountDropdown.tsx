import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, ChevronDown, HelpCircle, LogOut, Settings as SettingsIcon, Shield, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { clearAuthenticated } from '../lib/auth'

const mockUser = {
  name: 'Admin User',
  email: 'admin@stockcontrol.com',
  role: 'Administrator',
  avatar: null as string | null,
  initials: 'AU',
}

type MenuItem = {
  icon: LucideIcon
  label: string
  onClick: () => void
  divider?: boolean
  badge?: string
  danger?: boolean
}

export default function AccountDropdown() {
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => setIsOpen(false), [])
  const toggleOpen = useCallback(() => setIsOpen((value) => !value), [])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        close()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [close])

  useEffect(() => {
    close()
  }, [close, location.pathname])

  const handleLogout = useCallback(() => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return
    }

    clearAuthenticated()
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token')
      window.localStorage.removeItem('user_data')
    }

    alert('Logged out successfully!')
    close()
    navigate('/login', { replace: true, state: { from: location.pathname } })
  }, [close, location.pathname, navigate])

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        icon: User,
        label: 'My Profile',
        onClick: () => alert('Navigate to Profile'),
      },
      {
        icon: SettingsIcon,
        label: 'Account Settings',
        onClick: () => alert('Navigate to Settings'),
      },
      {
        icon: Bell,
        label: 'Notifications',
        badge: '3',
        onClick: () => alert('Navigate to Notifications'),
      },
      {
        icon: Shield,
        label: 'Security',
        onClick: () => alert('Navigate to Security'),
        divider: true,
      },
      {
        icon: HelpCircle,
        label: 'Help & Support',
        onClick: () => alert('Navigate to Help'),
      },
      {
        icon: LogOut,
        label: 'Logout',
        onClick: handleLogout,
        danger: true,
      },
    ],
    [handleLogout],
  )

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={toggleOpen}
          className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold shadow-md">
            {mockUser.avatar ? (
              <img
                src={mockUser.avatar}
                alt={mockUser.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span>{mockUser.initials}</span>
            )}
          </div>
          <div className="hidden text-left md:block">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {mockUser.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{mockUser.role}</div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-600 transition-transform duration-200 dark:text-gray-400 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="animate-fadeIn absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-800">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 dark:from-zinc-900 dark:to-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold shadow-md">
                  {mockUser.avatar ? (
                    <img
                      src={mockUser.avatar}
                      alt={mockUser.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">{mockUser.initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {mockUser.name}
                  </div>
                  <div className="truncate text-xs text-gray-600 dark:text-gray-400">
                    {mockUser.email}
                  </div>
                  <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {mockUser.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="py-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() => {
                        item.onClick()
                        if (item.label !== 'Logout') {
                          close()
                        }
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-zinc-700 ${
                        item.danger
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                    {item.divider && (
                      <div className="my-2 border-t border-gray-200 dark:border-zinc-700" />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:bg-zinc-900 dark:text-gray-400">
              Signed in as{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {mockUser.email}
              </span>
            </div>
          </div>
        )}
      </div>
      <span className="sr-only">Account options for {mockUser.name}</span>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  )
}
