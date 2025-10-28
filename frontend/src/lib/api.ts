import axios from 'axios'
import type {
  Product,
  DashboardSummary,
  CreditSummary,
  PaymentHistory,
  Supplier,
  Purchase,
  EmployeeUpdate,
} from './types'

// -------------------------------
// Axios instance
// -------------------------------
const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
export const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// -------------------------------
// Local payload types
// -------------------------------
export type ProductCreate = {
  name: string
  sku: string
  unit: string
  price: number
  cost_price: number
  stock_qty?: number
  reorder_level?: number
}

export type ProductUpdate = Partial<Omit<Product, 'id'>>

export type SupplierCreate = { name: string; phone?: string }

export type PurchaseCreate = {
  supplier_id: number
  items: { product_id: number; qty: number; unit_cost: number }[]
}

export type SaleItemIn = { product_id: number; qty: number; unit_price: number }

export type SaleCreate = {
  employee_id?: number
  payment_method: 'cash' | 'card' | 'credit'
  items: SaleItemIn[]
  due_date?: string // YYYY-MM-DD
}

// Employees (simple local typing to avoid coupling)
export type Employee = { id: number; name: string; phone?: string | null }
export type EmployeeCreate = { name: string; phone?: string }

// -------------------------------
// Products (Inventory)
// -------------------------------
export const getProducts = () =>
  api.get<Product[]>('/products/').then((r) => r.data)

export const createProduct = (payload: ProductCreate) =>
  api.post<Product>('/products/', payload).then((r) => r.data)

export const updateProduct = (id: number, payload: ProductUpdate) =>
  api.patch<Product>(`/products/${id}`, payload).then((r) => r.data)

export const deleteProduct = (id: number) =>
  api.delete<void>(`/products/${id}`).then((r) => r.data)

// Convenience: client-side low stock filter using the same list
export const getLowStock = () =>
  getProducts().then((list) =>
    list.filter((p) => p.stock_qty <= p.reorder_level),
  )

// -------------------------------
// Dashboard
// -------------------------------
export const getDashboard = () =>
  api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data)

// -------------------------------
// Credits / Sales on credit
// -------------------------------
export const getCreditSummary = () =>
  api.get<CreditSummary[]>('/credits/summary').then((r) => r.data)

export const createSaleCredit = (payload: SaleCreate) =>
  api.post<{ id: number; total: number }>('/sales/', payload).then((r) => r.data)

export const addCreditPayment = (employeeId: number, amount: number) =>
  api.post(`/credits/${employeeId}/payments`, { amount }).then((r) => r.data)

export const getPaymentHistory = () =>
  api.get<PaymentHistory[]>('/credits/payment-history').then((r) => r.data)

// -------------------------------
// Suppliers
// -------------------------------
export const getSuppliers = () =>
  api.get<Supplier[]>('/suppliers/').then((r) => r.data)

export const createSupplier = (payload: SupplierCreate) =>
  api.post<Supplier>('/suppliers/', payload).then((r) => r.data)

// -------------------------------
// Purchases
// -------------------------------

// Detail type (local) to avoid touching shared types
export type PurchaseDetail = {
  id: number
  supplier_id: number
  supplier_name: string
  total: number
  created_at: string
  items: { product_id: number; product_name: string; qty: number; unit_cost: number; subtotal: number }[]
}

export const getPurchaseDetail = (id: number) =>
  api.get<PurchaseDetail>(`/purchases/${id}`).then((r) => r.data)

export const updatePurchase = (id: number, payload: { supplier_id?: number; items?: { product_id: number; qty: number; unit_cost: number }[] }) =>
  api.patch<{ id: number; total: number }>(`/purchases/${id}`, payload).then((r) => r.data)

export const cancelPurchase = (id: number) =>
  api.delete<void>(`/purchases/${id}`).then((r) => r.data)

export const getPurchases = () =>
  api.get<Purchase[]>('/purchases/').then((r) => r.data)

export const createPurchase = (payload: PurchaseCreate) =>
  api.post<{ id: number; total: number }>('/purchases/', payload).then((r) => r.data)

// -------------------------------
// Employees
// -------------------------------
export const getEmployees = () =>
  api.get<Employee[]>('/employees/').then((r) => r.data)

export const createEmployee = (payload: EmployeeCreate) =>
  api.post<Employee>('/employees/', payload).then((r) => r.data)

export const updateEmployee = (id: number, payload: EmployeeUpdate) =>
  api.patch<Employee>(`/employees/${id}`, payload).then((r) => r.data)

export const deleteEmployee = (id: number) =>
  api.delete<void>(`/employees/${id}`).then((r) => r.data)
