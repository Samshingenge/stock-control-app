import {
  BarChart2,
  CreditCard,
  Home,
  Package,
  Settings as Cog,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Link, useLocation } from 'react-router-dom'

type NavItemProps = {
  to: string
  icon: ComponentType<{ size?: number }>
  label: string
}

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
  const loc = useLocation()
  const active = loc.pathname === to
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 ${
        active ? 'bg-gray-100 font-semibold' : ''
      }`}
    >
      <Icon size={18} /> {label}
    </Link>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="p-4 border-r bg-white">
        <div className="text-xl font-bold mb-4">Stock Control</div>
        <nav className="flex flex-col gap-1">
          <NavItem to="/" icon={Home} label="Dashboard" />
          <NavItem to="/inventory" icon={Package} label="Inventory" />
          <NavItem to="/purchases" icon={Truck} label="Purchases" />
          <NavItem to="/sales" icon={ShoppingCart} label="Sales" />
          <NavItem to="/credit" icon={CreditCard} label="Credit" />
          <NavItem to="/employees" icon={Users} label="Employees" />
          <NavItem to="/suppliers" icon={Truck} label="Suppliers" />
          <NavItem to="/reports" icon={BarChart2} label="Reports" />
          <NavItem to="/settings" icon={Cog} label="Settings" />
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  )
}
