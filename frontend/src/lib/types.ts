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

export type ProductUpdate = Partial<Omit<Product, 'id'>>

export type DashboardSummary = {
   total_products: number
   low_stock_count: number
   total_stock_value: number
   outstanding_credit: number
   top_sold_products?: Array<{
     name: string
     total_sold: number
   }>
 }

export type CreditProduct = {
  id: number
  name: string
  qty: number
  unit_price: number
  subtotal: number
  purchase_date: string
}

export type CreditSummary = {
  employee_id: number
  employee_name: string
  balance: number
  products: CreditProduct[]
}

export type PaymentHistory = {
  employee_id: number
  employee_name: string
  total_paid: number
  products: CreditProduct[]
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

export type EmployeeUpdate = Partial<Omit<Employee, 'id'>>

export type PurchaseProduct = {
  name: string
  qty: number
  unit_cost: number
  subtotal: number
}

export type Purchase = {
  id: number
  supplier_id: number
  supplier_name: string
  total: number
  created_at: string
  item_count: number
  products: PurchaseProduct[]
}
