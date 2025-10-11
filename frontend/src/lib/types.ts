export type Product = {
  id: number
  name: string
  sku: string
  unit: string
  price: number
  cost_price: number
  stock_qty: number
  reorder_level: number
}

export type ProductUpdate = Partial<Omit<Product, 'id'>> // includes sku

export type DashboardSummary = {
  total_products: number
  low_stock_count: number
  total_stock_value: number
  outstanding_credit: number
}

export type CreditSummary = {
  employee_id: number
  employee_name: string
  balance: number
}

export type Supplier = {
  id: number
  name: string
  phone?: string | null
}

export type Employee = {
  id: number
  name: string
  phone?: string | null
}

export type Purchase = {
  id: number
  supplier_id: number
  supplier_name: string
  total: number
  created_at: string
  item_count: number
}
