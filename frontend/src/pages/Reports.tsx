// frontend/src/pages/Reports.tsx
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DataTable, { type Column } from '../components/DataTable'
import Loading from '../components/Loading'
import { getProducts, getPurchases, getCreditSummary } from '../lib/api'
import type { Product, Purchase, CreditSummary as CreditRow } from '../lib/types'

const fmtNumber = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function exportCSV<T>(
  filename: string,
  rows: T[],
  headers: { label: string; key?: keyof T; map?: (row: T) => unknown }[],
) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  const head = headers.map((h) => esc(h.label)).join(',')
  const body = rows
    .map((r) =>
      headers
        .map((h) => esc(h.map ? h.map(r) : (r[h.key as keyof T] as unknown)))
        .join(','),
    )
    .join('\n')
  const blob = new Blob([head + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const { data: products = [], isLoading: loadingProducts, error: errProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })
  const { data: purchases = [], isLoading: loadingPurchases, error: errPurchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: getPurchases,
  })
  const { data: credits = [], isLoading: loadingCredits, error: errCredits } = useQuery({
    queryKey: ['credits-summary'],
    queryFn: getCreditSummary,
  })

  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  const lowStock = useMemo(
    () => products.filter((p) => p.stock_qty <= p.reorder_level),
    [products],
  )

  const filteredPurchases = useMemo(() => {
    if (!from && !to) return purchases
    const fromD = from ? new Date(from + 'T00:00:00') : null
    const toD = to ? new Date(to + 'T23:59:59') : null
    return purchases.filter((p) => {
      const d = new Date(p.created_at)
      if (fromD && d < fromD) return false
      if (toD && d > toD) return false
      return true
    })
  }, [purchases, from, to])

  const totals = useMemo(() => {
    const totalProducts = products.length
    const lowStockCount = lowStock.length
    const totalStockValue = products.reduce(
      (acc, p) => acc + (Number(p.cost_price) || 0) * (Number(p.stock_qty) || 0),
      0,
    )
    const outstandingCredit = credits.reduce((acc, c) => acc + (Number(c.balance) || 0), 0)
    return { totalProducts, lowStockCount, totalStockValue, outstandingCredit }
  }, [products, lowStock, credits])

  const purchaseCols: Column<Purchase>[] = [
    {
      header: 'Date',
      render: (r) => new Date(r.created_at).toLocaleDateString(),
    },
    { header: 'Supplier', key: 'supplier_name' },
    { header: 'Items', key: 'item_count', className: 'text-right' },
    {
      header: 'Total',
      render: (r) => fmtNumber(r.total),
      className: 'text-right',
    },
  ]

  const lowStockCols: Column<Product>[] = [
    { header: 'Product', key: 'name' },
    { header: 'SKU', key: 'sku' },
    { header: 'Stock', key: 'stock_qty', className: 'text-right' },
    { header: 'Reorder ≤', key: 'reorder_level', className: 'text-right' },
    {
      header: 'Needed',
      render: (r) => Math.max(0, r.reorder_level - r.stock_qty),
      className: 'text-right',
    },
  ]

  const creditCols: Column<CreditRow>[] = [
    { header: 'Employee', key: 'employee_name' },
    {
      header: 'Balance',
      render: (r) => fmtNumber(r.balance),
      className: 'text-right',
    },
  ]

  if (loadingProducts || loadingPurchases || loadingCredits) return <Loading />
  if (errProducts || errPurchases || errCredits)
    return (
      <div className="p-4 text-red-600">
        Failed to load reports data.
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-gray-500 text-sm">Total Products</div>
          <div className="text-2xl font-semibold">{totals.totalProducts}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-gray-500 text-sm">Low Stock Items</div>
          <div className="text-2xl font-semibold">{totals.lowStockCount}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-gray-500 text-sm">Stock Value</div>
          <div className="text-2xl font-semibold">{fmtNumber(totals.totalStockValue)}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="text-gray-500 text-sm">Outstanding Credit</div>
          <div className="text-2xl font-semibold">{fmtNumber(totals.outstandingCredit)}</div>
        </div>
      </div>

      {/* Purchases Report */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Purchases</h2>
            <p className="text-sm text-gray-500">Filter by date range and export to CSV.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="block mt-1 rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-sm text-gray-600">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="block mt-1 rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <button
              onClick={() =>
                exportCSV(
                  'purchases.csv',
                  filteredPurchases,
                  [
                    { label: 'Date', map: (r) => new Date(r.created_at).toISOString().slice(0, 10) },
                    { label: 'Supplier', key: 'supplier_name' },
                    { label: 'Items', key: 'item_count' },
                    { label: 'Total', map: (r) => fmtNumber(r.total) },
                  ],
                )
              }
              className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm shadow hover:bg-black"
            >
              Export CSV
            </button>
          </div>
        </div>
        <DataTable rows={filteredPurchases} columns={purchaseCols} />
      </section>

      {/* Low Stock Report */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Low Stock</h2>
          <button
            onClick={() =>
              exportCSV(
                'low_stock.csv',
                lowStock,
                [
                  { label: 'Product', key: 'name' },
                  { label: 'SKU', key: 'sku' },
                  { label: 'Stock', key: 'stock_qty' },
                  { label: 'Reorder_Level', key: 'reorder_level' },
                  { label: 'Needed', map: (r) => Math.max(0, r.reorder_level - r.stock_qty) },
                ],
              )
            }
            className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm shadow hover:bg-black"
          >
            Export CSV
          </button>
        </div>
        <DataTable rows={lowStock} columns={lowStockCols} />
      </section>

      {/* Credit Balances Report */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Employee Credit Balances</h2>
          <button
            onClick={() =>
              exportCSV(
                'credit_balances.csv',
                credits,
                [
                  { label: 'Employee', key: 'employee_name' },
                  { label: 'Balance', map: (r) => fmtNumber(r.balance) },
                ],
              )
            }
            className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm shadow hover:bg-black"
          >
            Export CSV
          </button>
        </div>
        <DataTable rows={credits} columns={creditCols} />
      </section>
    </div>
  )
}
