import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import Credit from './pages/Credit'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import PaymentHistory from './pages/PaymentHistory'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import Sales from './pages/Sales'
import Settings from './pages/Settings'
import Suppliers from './pages/Suppliers'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="sales" element={<Sales />} />
        <Route path="credit" element={<Credit />} />
        <Route path="payment-history" element={<PaymentHistory />} />
        <Route path="employees" element={<Employees />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
