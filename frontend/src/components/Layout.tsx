import {
  BarChart2,
  CreditCard,
  History,
  Home,
  Package,
  Settings as Cog,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react'
import { useEffect } from 'react'
import type { ComponentType } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { isAuthenticated } from '../lib/auth'
import TopNav from './TopNav'

const NavItem = ({ to, icon: Icon, label }: {
  to: string;
  icon: ComponentType<{ size?: number }>;
  label: string;
}) => {
  const loc = useLocation()
  const active = loc.pathname === to
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 ${
        active ? 'bg-gray-100 dark:bg-zinc-700 font-semibold' : ''
      }`}
    >
      <Icon size={18} /> {label}
    </Link>
  )
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated() && location.pathname !== '/login') {
      navigate('/login', { replace: true, state: { from: location.pathname } })
    }
  }, [location.pathname, navigate])

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] bg-white text-black dark:bg-zinc-900 dark:text-white">
      <aside className="p-4 border-r bg-white dark:bg-zinc-800 dark:border-zinc-700">
        <div className="text-xl font-bold mb-4">Stock Control</div>
        <nav className="flex flex-col gap-1">
          <NavItem to="/" icon={Home} label="Dashboard" />
          <NavItem to="/inventory" icon={Package} label="Inventory" />
          <NavItem to="/purchases" icon={Truck} label="Purchases" />
          <NavItem to="/sales" icon={ShoppingCart} label="Sales" />
          <NavItem to="/credit" icon={CreditCard} label="Credit" />
          <NavItem to="/payment-history" icon={History} label="Payment History" />
          <NavItem to="/employees" icon={Users} label="Employees" />
          <NavItem to="/suppliers" icon={Truck} label="Suppliers" />
          <NavItem to="/reports" icon={BarChart2} label="Reports" />
          <NavItem to="/settings" icon={Cog} label="Settings" />
        </nav>
      </aside>
      <main className="flex flex-col gap-6 p-6">
        <TopNav />
        <div className="min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
